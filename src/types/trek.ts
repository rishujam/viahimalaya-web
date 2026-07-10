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
  created_at: string;
}
