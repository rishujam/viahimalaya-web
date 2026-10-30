-- ViaHimalaya custom POIs
--
-- A place a trekker added from inside the app: a photo, an optional note and a
-- position. This is the first slice of HANDOFF section 22, and it is collection
-- only - there is no read endpoint yet, and nothing in this table is shown to
-- anyone.
--
-- NOTHING IS PUBLIC UNTIL A HUMAN HAS LOOKED
--
-- A row starts as 'pending' and reaches other users only after the photo has
-- been checked and `status` set to 'approved' by hand. The photo sits in a
-- private R2 bucket with no public URL, so approving is the only way anything
-- becomes visible. Reviewing is manual on purpose, in the same spirit as the
-- trek pipeline:
--
--   SELECT id, trek_id, lat, lon, location_source, description, photo_key, created_at
--     FROM custom_pois WHERE status = 'pending' ORDER BY created_at;
--
--   -- Look at the photo: Cloudflare dashboard > R2 > viahimalaya-user-photos >
--   -- custom_pois/<id>.jpg. Then one of:
--   UPDATE custom_pois SET status = 'approved', reviewed_at = NOW() WHERE id = '<id>';
--   UPDATE custom_pois SET status = 'rejected', reviewed_at = NOW() WHERE id = '<id>';
--
-- THE ID COMES FROM THE PHONE
--
-- `id` is a UUID built when the user taps Save and reused on every retry, so a
-- delivery that arrives twice is the same row rather than two. The phone retries
-- from a local queue and cannot tell a lost request from a lost response - the
-- same reasoning as feedback_id in 007.
--
-- NO FOREIGN KEY TO treks
--
-- A submission has to outlive its trek being re-imported, and treks has already
-- had a row deleted once (Buran Ghati). The API checks that the trek exists and
-- that the point lies inside its area before it accepts anything, which is the
-- part of a foreign key that mattered here.
--
-- CATEGORY IS NULLABLE ON PURPOSE
--
-- The app has no category picker yet, so every row has NULL here for now. When
-- it does, it will send one of the PoiCategory values (water, camp_site, ...).
-- The API validates the value and this column only stores it, so adding a
-- category never needs a migration.

CREATE TABLE IF NOT EXISTS custom_pois (
    -- Client-built UUID, reused across retries. See above.
    id                  UUID           PRIMARY KEY,

    -- Firebase UID from the verified ID token. Never read from the request
    -- body, so a client cannot submit as someone else, and the column is what a
    -- "delete my photos" request is answered with.
    user_id             VARCHAR(128)   NOT NULL,

    -- The trek screen it was added from, matching treks.id (e.g. goechala_0).
    trek_id             VARCHAR(255)   NOT NULL,

    category            VARCHAR(32),

    -- The 300-character limit is the product rule. The API enforces it first;
    -- this is the backstop.
    description         TEXT           CHECK (description IS NULL OR char_length(description) <= 300),

    lat                 DECIMAL(10, 7) NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lon                 DECIMAL(10, 7) NOT NULL CHECK (lon BETWEEN -180 AND 180),

    -- How the position was chosen. 'gps' is the phone's own fix ("use my
    -- current location"); 'map' is a pin the user placed by hand. A pin dropped
    -- while standing at a camp is worth more than one dropped from a sofa, and
    -- this is what tells them apart when deciding what to approve.
    location_source     VARCHAR(8)     NOT NULL CHECK (location_source IN ('gps', 'map')),

    -- Horizontal accuracy of the GPS fix, in metres. NULL for a map pin, and
    -- for a fix that did not report one.
    location_accuracy_m REAL           CHECK (location_accuracy_m IS NULL OR location_accuracy_m >= 0),

    -- Object key in the private user-photos bucket, and the size that was
    -- stored. The key is derivable from id today; it is a column so a change of
    -- format or folder never has to guess how an old row was stored.
    photo_key           VARCHAR(255)   NOT NULL,
    photo_bytes         INTEGER        NOT NULL CHECK (photo_bytes > 0),

    -- Moderation. Only 'approved' is ever shown to anyone else.
    status              VARCHAR(16)    NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_at         TIMESTAMPTZ,

    -- Which version of the content terms the user ticked when they saved. This
    -- is the record that they granted ViaHimalaya the right to store and show
    -- the photo, so it is required and never defaulted.
    terms_version       VARCHAR(32)    NOT NULL,

    -- Server clock. The phone's clock may be wrong, and the daily limit counts
    -- on this column.
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- The daily limit: "how many has this user sent in the last 24 hours".
CREATE INDEX IF NOT EXISTS idx_custom_pois_user_created
    ON custom_pois (user_id, created_at DESC);

-- The review queue, oldest first. Partial, so it stays tiny however many rows
-- are eventually approved.
CREATE INDEX IF NOT EXISTS idx_custom_pois_pending
    ON custom_pois (created_at) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION update_custom_pois_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_custom_pois_timestamp ON custom_pois;
CREATE TRIGGER update_custom_pois_timestamp
    BEFORE UPDATE ON custom_pois
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_pois_updated_at();

COMMENT ON TABLE custom_pois IS
    'Places added by users from the app (photo, note, position). Private until status = approved. Contains Firebase UIDs - treat as personal data.';
COMMENT ON COLUMN custom_pois.id IS
    'UUID built on the phone and reused across retries, so a repeated delivery is one row.';
COMMENT ON COLUMN custom_pois.user_id IS
    'Firebase UID from the verified ID token. Never accepted from the request body.';
COMMENT ON COLUMN custom_pois.location_source IS
    'gps = the phone''s own fix; map = a pin placed by hand.';
COMMENT ON COLUMN custom_pois.status IS
    'pending until reviewed by hand. Only approved rows may ever be shown to other users.';
COMMENT ON COLUMN custom_pois.terms_version IS
    'Version of the content terms the user accepted when saving - the record of the licence they granted.';
