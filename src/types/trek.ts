// Shared Trek type definition based on database schema
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
  created_at: string;
}
