-- ViaHimalaya feedback
--
-- Free-text feedback from inside the app. First writer is the "request a trek"
-- banner on Explore, which is why the copy asks for a trek name - but the table
-- is deliberately named for the general case, because the banner is config
-- driven and its next action will not be about treks.
--
-- IDENTITY IS CLIENT-SUPPLIED
--
-- feedback_id arrives as "<email>/<epochMillis>", built on the phone. That is
-- the same shape as navigator_trek ids, which are already "<email>/<millis>",
-- so this follows an existing convention rather than adding a second one.
--
-- Two consequences to know rather than discover:
--
--   * The email in it is SELF-REPORTED. This endpoint authenticates the app
--     with the shared INTERNAL_API_KEY, not the user, so nothing here proves
--     who wrote a row. That is acceptable for feedback - it is private, never
--     rendered back to anyone, and a spoofed row is noise rather than harm -
--     but do not build anything on top of it that assumes the address is real.
--     When the app starts sending Firebase ID tokens, add a user_id column
--     populated from the verified `sub` claim and trust that instead.
--
--   * It contains PII. Anything that dumps or exports this table is exporting
--     addresses, so it cannot be handed around as freely as the trek tables.
--
-- WHY THE CLIENT ID IS STILL THE PRIMARY KEY
--
-- It makes a retry idempotent. The phone builds the id once when the dialog is
-- submitted and reuses it on every attempt, so ON CONFLICT DO NOTHING turns a
-- duplicate delivery into a no-op that still answers 200. poi_reviews took the
-- other route - separate add and update paths - and 004 records the cost: a
-- retried POST that already succeeded comes back 409 and the client has to
-- treat that as success. This side-steps that entirely.
--
-- Two submissions from the same account in the same millisecond would collide
-- and the second would be silently dropped. That needs a double-tap fast enough
-- to beat the dialog closing, and losing the duplicate is the desired outcome
-- anyway.

CREATE TABLE IF NOT EXISTS feedback (
    -- "<email>/<epochMillis>". 320 = 254 (max email) + separator + millis, with
    -- room to spare.
    feedback_id VARCHAR(320) PRIMARY KEY,

    -- Ceiling mirrors the check in the API route. Generous because this is the
    -- one place a user can say something in their own words, and truncating
    -- that is worse than storing a long row.
    feedback    TEXT NOT NULL CHECK (char_length(feedback) BETWEEN 1 AND 2000),

    -- Server clock, not the client's. The millis inside feedback_id come from a
    -- phone whose clock may be wrong or deliberately set; this is the column to
    -- sort and report on.
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reading feedback is "newest first", always.
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);

COMMENT ON TABLE feedback IS
    'Free-text in-app feedback. Contains user-supplied email addresses inside feedback_id - treat as PII. The address is self-reported and unverified until the app sends Firebase ID tokens.';

COMMENT ON COLUMN feedback.feedback_id IS
    'Client-built "<email>/<epochMillis>". Primary key so a retried submit is idempotent rather than a duplicate row.';

COMMENT ON COLUMN feedback.created_at IS
    'Server receipt time. Trust this over the millis embedded in feedback_id.';
