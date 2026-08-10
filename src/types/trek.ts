// Shared Trek type definition based on database schema

/**
 * One elevation sample along the trail: [latitude, longitude, metres above sea
 * level]. A tuple rather than an object because these arrive 250-500 at a time
 * and repeating three keys per entry costs ~70% more bytes for nothing.
 */
export type ElevationSample = [number, number, number];

export interface Trek {
  id: string;
  name: string;
  location: string;
  distance: string;
  elevation: string;
  bounding_box: number[];
  coordinate_url: string;
  image_url?: string;
  /** URL of the POI bundle on R2. Null until process_treks.py has run for this trek. */
  poi_url?: string | null;
  /** When the bundle was last regenerated; the app re-downloads when this changes. */
  poi_updated_at?: string | null;
  /** External write-up opened by the "View details" link. Null hides the link. */
  details_url?: string | null;
  /**
   * Elevation every 100 m along the trail, for the detail screen's slider.
   * Only the detail endpoint returns this - list and search leave it out to
   * stay the size they are. Null until compute_elevation.py has run.
   */
  elevation_profile?: ElevationSample[] | null;
  created_at: string;
}
