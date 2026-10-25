// Shapes of the static evidence in public/data, as validated by src/lib/evidence.js.

export type Bounds = [[number, number], [number, number]];
export type AreaKey = "A" | "B";
export type AssayPrefix = "gold_primary" | "gold_retest" | "lithium_secondary";
export type AssayStatus = "quantified" | "above_detection" | "below_detection" | "not_analyzed";

export type SampleProperties = {
  sample_key: string;
  sample_id: string;
  area: AreaKey;
  laboratory_sample_id: string;
  batch_number: string;
  source_id: string;
  source_csv_record_number: number;
  longitude: number;
  latitude: number;
} & {
  [K in `${AssayPrefix}_status`]: AssayStatus;
} & {
  [K in `${AssayPrefix}_value_ppm` | `${AssayPrefix}_bound_ppm`]: number | null;
} & {
  [K in `${AssayPrefix}_raw` | `${AssayPrefix}_method` | `${AssayPrefix}_unit`]: string;
};

export type Sample = {
  type: "Feature";
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: SampleProperties;
};

export type Measurement = {
  method: string;
  unit: string;
  counts: Record<AssayStatus, number>;
  censored_count: number;
  quantified_only: { denominator: number; median_ppm: number | null; minimum_ppm: number | null; maximum_ppm: number | null };
};

export type MapCenter = { longitude: number; latitude: number; meaning: string };

export type Area = {
  area: AreaKey;
  name: string;
  sample_count: number;
  map_view_center: MapCenter;
  point_bounds: { west: number; south: number; east: number; north: number };
  geojson_path: string;
  measurements: Record<AssayPrefix, Measurement>;
};

export type EvidenceConfig = {
  schema_version: string;
  source: { id: string; version: string; publication_url: string; doi_url?: string };
  timeline: { collection_months: string[]; publication: { value: string; precision: string } };
  areas: Area[];
  overview: { sample_count: number; map_view_center: MapCenter; point_bounds: Area["point_bounds"] };
  pending: Record<string, { owner?: string; status?: string }>;
};

export type Evidence = { config: EvidenceConfig; features: Sample[] };
