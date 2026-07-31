-- ViaHimalaya Trek Details URL Migration
-- External write-up for a trek. Points at third-party guides (Indiahikes and
-- similar) until viahimalaya.com has its own trailhead pages to funnel into.

ALTER TABLE treks ADD COLUMN IF NOT EXISTS details_url VARCHAR(500);

COMMENT ON COLUMN treks.details_url IS
    'External page opened by the "View details" link on the trek detail screen. Null hides the link.';

-- Example:
-- UPDATE treks
--    SET details_url = 'https://indiahikes.com/treks/hampta-pass-trek'
--  WHERE id = 'hamptapass_0';
