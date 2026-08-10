-- ViaHimalaya elevation profile
--
-- One entry per 100 m of trail, sampled from Copernicus GLO-30 by
-- scripts/compute_elevation.py. Feeds the elevation slider on the trek detail
-- screen: dragging it walks a marker along the trail, so every entry carries
-- position as well as height.
--
-- Shape is [[lat, lon, metres], ...] rather than [{lat, lon, ele}, ...].
-- Repeating three keys per entry costs about 70% more bytes - 11.1 KB against
-- 6.6 KB on Hampta - and buys nothing, because nothing ever queries inside this
-- array. Positions are stored rather than derived on the phone from the
-- coordinate file: the client would have to reproduce the server's 100 m
-- resampling exactly, and two implementations of the same walk drift.
--
-- A column rather than a table because it is always read whole, never joined or
-- filtered - rows would mean 476 of them for one trek and no benefit. A column
-- rather than an R2 bundle because it is smaller than the coordinate file the
-- same screen already downloads, and because a third copy of the
-- poi_updated_at freshness dance is a third chance to get it wrong.
--
-- Deliberately NOT added to the list or search endpoints. Both select named
-- columns, so they stay the size they are today; only the detail route reads it.
--
-- Revisit if a trek runs past ~150 km, or if sampling ever drops to 30 m. At
-- that point the payload belongs on R2 with the POI bundles.

ALTER TABLE treks
    ADD COLUMN IF NOT EXISTS elevation_profile JSONB;

COMMENT ON COLUMN treks.elevation_profile IS
    'Elevation samples every 100 m along the trail as [[lat, lon, metres], ...], from Copernicus GLO-30. Null until compute_elevation.py has run for this trek.';
