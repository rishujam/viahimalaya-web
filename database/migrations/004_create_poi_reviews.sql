-- ViaHimalaya POI Reviews Migration
--
-- Reviews are keyed on the OSM element id carried in the R2 POI bundles
-- ('node/8237631996', 'way/...'), which is globally unique and carries no trek
-- scoping. A POI genuinely belongs to more than one trek - 38 of the 401 ids in
-- the current bundles already appear in two or three - so scoping reviews to a
-- trek would fragment them.

CREATE TABLE IF NOT EXISTS poi_reviews (
    -- OSM element id, exactly as it appears in the R2 bundle.
    poi_id       VARCHAR(64)  NOT NULL,
    -- Firebase UID, taken from the verified `sub` claim, never from the body.
    -- UID rather than email: email can change, and it is PII we would then have
    -- to keep out of every response.
    user_id      VARCHAR(128) NOT NULL,

    rating       SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    -- Ceiling in characters, not words: words are not cheaply enforceable in
    -- SQL. The 250-word product rule is applied in the API.
    comment      TEXT         CHECK (comment IS NULL OR char_length(comment) <= 1500),

    -- Re-anchoring snapshot. Never part of identity.
    --
    -- OSM ids are not permanent: a node deleted and re-added gets a new id, and
    -- a node promoted to an area changes both the prefix and the number. The
    -- pipeline can also swap which element survives its 60 m same-category
    -- dedup. When that happens the review still exists but nothing renders it,
    -- and the R2 bundle it referred to has already been overwritten in place.
    -- These three columns are what a re-anchoring pass matches on. Category is
    -- the tiebreaker: near Manali there are 75 springs, 66 fords and 62
    -- campsites in overlapping ground, so proximity alone would happily attach
    -- a spring review to a campsite.
    poi_lat      DECIMAL(10, 7),
    poi_lon      DECIMAL(10, 7),
    poi_category VARCHAR(32),

    -- Snapshot at write time, so attribution does not need a users table and
    -- does not change retroactively when someone renames their account.
    display_name VARCHAR(120),

    -- Soft hide rather than DELETE, because deletes are not durable against our
    -- own offline write queue: a removed row is still sitting in the author's
    -- pending uploads and the next sync writes it straight back. Neither the
    -- add nor the update path touches this column, so the flag survives.
    is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,

    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One review per user per POI, enforced here rather than in the API so two
    -- simultaneous requests cannot both win. Without it a single account could
    -- flood a POI and move its average at will. This pair is also the review's
    -- identity - there is no separate id column.
    PRIMARY KEY (poi_id, user_id)
);

-- Reads always filter hidden rows, so the partial index matches the query.
CREATE INDEX IF NOT EXISTS idx_poi_reviews_poi
    ON poi_reviews(poi_id) WHERE NOT is_hidden;
CREATE INDEX IF NOT EXISTS idx_poi_reviews_user
    ON poi_reviews(user_id);

CREATE OR REPLACE FUNCTION update_poi_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_poi_reviews_timestamp ON poi_reviews;
CREATE TRIGGER update_poi_reviews_timestamp
    BEFORE UPDATE ON poi_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_poi_reviews_updated_at();

COMMENT ON TABLE poi_reviews IS
    'User ratings and comments on POIs, keyed on the global OSM element id so a POI shared by several treks has one review set.';
COMMENT ON COLUMN poi_reviews.poi_id IS
    'OSM element id from the R2 POI bundle, e.g. node/8237631996. Not trek-scoped.';
COMMENT ON COLUMN poi_reviews.user_id IS
    'Firebase UID from the verified ID token. Never accepted from the request body.';
COMMENT ON COLUMN poi_reviews.poi_lat IS
    'POI position at review time, so orphaned reviews can be re-matched by proximity if the OSM id churns.';
COMMENT ON COLUMN poi_reviews.is_hidden IS
    'Moderation flag. Hidden rows are excluded from every read path.';

-- Aggregates are computed per query rather than denormalised onto treks. At 401
-- POIs across 11 treks, AVG/COUNT on the partial index is free; revisit only if
-- profiling says otherwise.
