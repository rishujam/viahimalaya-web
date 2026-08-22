-- ViaHimalaya app config
--
-- Remote configuration fetched once at app launch. Exists so things like the
-- "request a trek" banner can be changed or retired without shipping a release,
-- which matters while the catalogue is 5-15 curated treks and the copy is still
-- moving.
--
-- KEY/VALUE ROWS, NOT COLUMNS
--
-- A new config key is an INSERT rather than a migration, and the JSONB value
-- means a key can grow fields (targeting, an icon, a deep link) without one
-- either. The GET route assembles { key: value, ... } straight from these rows,
-- so the table shape and the wire shape are the same thing and cannot drift.
--
-- THIS TABLE IS WORLD-READABLE. PUT NOTHING SECRET IN IT.
--
-- /api/app-config is deliberately unauthenticated. The static INTERNAL_API_KEY
-- is recoverable from any shipped APK, so gating public banner copy behind it
-- would buy no secrecy - and it is scheduled to be rotated alongside per-user
-- auth, which would 401 every installed app. Config is the one channel that
-- should keep working across that rotation, because it is how those installs
-- would be told to update. The cost of that choice is this rule: no kill
-- switches naming unreleased features, no internal URLs, no thresholds worth
-- gaming, no experiment names. If a value would embarrass us in a paste of the
-- raw response, it does not belong here.
--
-- ACTIONS ARE STRINGS ON THE WIRE
--
-- banner.action carries a bare string ('REQUEST_TREK_DIALOG'), never a value
-- constrained to what today's clients understand. kotlinx.serialization throws
-- on an enum value it does not recognise, and ignoreUnknownKeys does not cover
-- that case - so a new action shipped to an old install would fail the parse of
-- the *whole* config response, not just the banner. The app resolves the string
-- to its own enum and renders nothing when it cannot.

CREATE TABLE IF NOT EXISTS app_config (
    -- Wire key. This is the exact field name the app sees, so renaming a row
    -- is a breaking change for every install that has not updated.
    key        VARCHAR(64)  PRIMARY KEY,

    value      JSONB        NOT NULL,

    -- Switch a key off without deleting content you would have to retype.
    -- Disabled rows are omitted from the response entirely rather than sent as
    -- null, because the app treats absent and null identically - a missing
    -- section means the feature is off.
    is_enabled BOOLEAN      NOT NULL DEFAULT TRUE,

    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app_config IS
    'Remote config served unauthenticated by /api/app-config. World-readable - never store secrets, internal URLs, or unreleased feature names here.';

COMMENT ON COLUMN app_config.key IS
    'Wire field name as the app sees it. Renaming breaks every install that has not updated.';

COMMENT ON COLUMN app_config.value IS
    'Arbitrary JSON for this key. Action-like fields must be plain strings so an unknown value cannot fail the client parse.';

-- Seed: the "request a trek" banner on the Explore screen.
--
-- description is spelled in full rather than abbreviated - it is a public
-- contract and awkward to change once installs are reading it.
INSERT INTO app_config (key, value) VALUES (
    'banner',
    '{
        "title": "Request a trek",
        "description": "This is an early release. Tell us which trek you want on the app next.",
        "action": "REQUEST_TREK_DIALOG"
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
