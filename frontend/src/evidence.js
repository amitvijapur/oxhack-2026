const ASSETS = Object.freeze({
  'research/gold-frontend-data.json': 'data/gold-frontend-data.json',
  'research/gold-source-catalog.json': 'data/gold-source-catalog.json',
  'data/generated/tok-gold/site-a/samples.geojson': 'data/tok-gold/site-a/samples.geojson',
  'data/generated/tok-gold/site-b/samples.geojson': 'data/tok-gold/site-b/samples.geojson',
  'data/generated/tok-gold/site-a/summary.json': 'data/tok-gold/site-a/summary.json',
  'data/generated/tok-gold/site-b/summary.json': 'data/tok-gold/site-b/summary.json',
});

const ASSAYS = ['gold_primary', 'gold_retest', 'lithium_secondary'];
const STATUSES = ['quantified', 'above_detection', 'below_detection', 'not_analyzed'];
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

function requireEvidence(condition, message) {
  if (!condition) throw new Error(`Invalid evidence: ${message}`);
}

/** Format numeric data without coercing null, blanks or non-finite values to zero. */
export function formatNumber(value, maxDigits = 3) {
  if (!isFiniteNumber(value)) return 'Not available';
  const digits = Number.isInteger(maxDigits) && maxDigits >= 0 && maxDigits <= 20 ? maxDigits : 3;
  const result = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(value);
  // A small positive measurement must never become a displayed zero through rounding.
  return value !== 0 && Number(result) === 0 ? value.toExponential(2) : result;
}

/** Render one assay only. A primary assay is never substituted with its retest. */
export function formatAssay(properties, prefix) {
  if (!ASSAYS.includes(prefix)) throw new Error(`Unknown assay field: ${prefix}`);
  const status = properties?.[`${prefix}_status`];
  if (status === 'not_analyzed') return 'Not analyzed';
  const unit = properties?.[`${prefix}_unit`];
  if (!nonempty(unit)) return 'Not available';
  if (status === 'quantified') {
    const value = properties?.[`${prefix}_value_ppm`];
    return isFiniteNumber(value) && value >= 0 ? `${formatNumber(value, 6)} ${unit}` : 'Not available';
  }
  if (status === 'above_detection' || status === 'below_detection') {
    const bound = properties?.[`${prefix}_bound_ppm`];
    if (!isFiniteNumber(bound) || bound < 0) return 'Not available';
    return `${status === 'above_detection' ? '>' : '<'}${formatNumber(bound, 6)} ${unit}`;
  }
  return 'Not available';
}

/** Map only the supplied evidence paths into the app's public asset directory. */
export function assetPath(repoPath, baseUrl = '/') {
  if (!Object.hasOwn(ASSETS, repoPath)) throw new Error(`Unsupported evidence asset: ${repoPath}`);
  if (typeof baseUrl !== 'string' || !baseUrl.startsWith('/') || baseUrl.startsWith('//')
    || /[\\?#%]/.test(baseUrl) || baseUrl.split('/').some((part) => part === '.' || part === '..')) {
    throw new Error('Evidence asset base must be an absolute app path, such as / or /demo/.');
  }
  return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${ASSETS[repoPath]}`;
}

export function boundsFor(config, area = 'all') {
  const selected = area === 'all' ? config?.overview : config?.areas?.find((item) => item.area === area);
  if (!selected) throw new Error(`Unknown comparison area: ${area}`);
  const bounds = selected.point_bounds;
  requireEvidence(bounds && ['west', 'south', 'east', 'north'].every((key) => isFiniteNumber(bounds[key])), 'map bounds are missing or non-numeric');
  requireEvidence(bounds.west >= -180 && bounds.east <= 180 && bounds.south >= -90 && bounds.north <= 90
    && bounds.west <= bounds.east && bounds.south <= bounds.north, 'map bounds must use longitude/latitude order');
  return [[bounds.west, bounds.south], [bounds.east, bounds.north]];
}

export function getVisibleFeatures(features, area = 'all') {
  if (!['all', 'A', 'B'].includes(area)) throw new Error(`Unknown comparison area: ${area}`);
  return area === 'all' ? [...features] : features.filter((feature) => feature.properties.area === area);
}

function validateAssay(properties, prefix, sampleId) {
  const status = properties[`${prefix}_status`];
  requireEvidence(STATUSES.includes(status), `${sampleId} has an unknown ${prefix} status`);
  requireEvidence(nonempty(properties[`${prefix}_method`]) && properties[`${prefix}_unit`] === 'ppm'
    && typeof properties[`${prefix}_raw`] === 'string', `${sampleId} is missing ${prefix} method, ppm unit or raw value`);
  const value = properties[`${prefix}_value_ppm`];
  const bound = properties[`${prefix}_bound_ppm`];
  if (status === 'quantified') {
    requireEvidence(isFiniteNumber(value) && value >= 0 && bound === null, `${sampleId} has an invalid quantified ${prefix} value`);
  } else if (status === 'above_detection' || status === 'below_detection') {
    requireEvidence(value === null && isFiniteNumber(bound) && bound >= 0, `${sampleId} must retain its ${prefix} qualification bound separately`);
  } else {
    requireEvidence(value === null && bound === null, `${sampleId} has a value for a not-analyzed ${prefix} result`);
  }
}

/** Validate the small display contract, including all samples and assay status counts. */
export function validateEvidence(config, collections) {
  requireEvidence(config?.schema_version === '1.0' && nonempty(config?.source?.id), 'unsupported configuration or missing source');
  requireEvidence(config?.coordinates?.geojson_order?.join(',') === 'longitude,latitude', 'coordinate order is not longitude,latitude');
  requireEvidence(Array.isArray(config.areas) && config.areas.length === 2
    && new Set(config.areas.map((area) => area.area)).size === 2
    && config.areas.every((area) => ['A', 'B'].includes(area.area)), 'exactly areas A and B are required');
  const identifiers = new Set();
  let total = 0;

  for (const area of config.areas) {
    const collection = collections?.[area.area];
    requireEvidence(collection?.type === 'FeatureCollection' && Array.isArray(collection.features), `area ${area.area} is not a GeoJSON feature collection`);
    requireEvidence(Number.isInteger(area.sample_count) && area.sample_count >= 0
      && collection.features.length === area.sample_count, `area ${area.area} sample count does not match its configuration`);
    const [[west, south], [east, north]] = boundsFor(config, area.area);
    const counts = Object.fromEntries(ASSAYS.map((prefix) => [prefix, Object.fromEntries(STATUSES.map((status) => [status, 0]))]));

    for (const feature of collection.features) {
      const properties = feature?.properties;
      requireEvidence(feature?.type === 'Feature' && properties && nonempty(feature.id)
        && feature.id === properties.sample_key && !identifiers.has(feature.id), `area ${area.area} has a missing, duplicate or inconsistent sample identity`);
      identifiers.add(feature.id);
      requireEvidence(properties.area === area.area && nonempty(properties.sample_id), `${feature.id} has an invalid sample label or area`);
      requireEvidence(properties.source_id === config.source.id && Number.isInteger(properties.source_csv_record_number)
        && properties.source_csv_record_number > 0, `${feature.id} is missing source-record provenance`);
      requireEvidence(nonempty(properties.laboratory_sample_id) && nonempty(properties.batch_number), `${feature.id} is missing laboratory identity or batch`);

      const coordinates = feature.geometry?.coordinates;
      requireEvidence(feature.geometry?.type === 'Point' && Array.isArray(coordinates) && coordinates.length === 2
        && coordinates.every(isFiniteNumber), `${feature.id} does not contain a numeric longitude/latitude point`);
      const [longitude, latitude] = coordinates;
      requireEvidence(longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
        && longitude >= west - 1e-9 && longitude <= east + 1e-9
        && latitude >= south - 1e-9 && latitude <= north + 1e-9, `${feature.id} is outside the supplied longitude/latitude bounds`);
      requireEvidence(properties.longitude === longitude && properties.latitude === latitude, `${feature.id} geometry disagrees with its coordinate fields`);

      for (const prefix of ASSAYS) {
        validateAssay(properties, prefix, properties.sample_id);
        counts[prefix][properties[`${prefix}_status`]] += 1;
      }
    }

    for (const prefix of ASSAYS) {
      const summary = area.measurements?.[prefix];
      requireEvidence(summary && STATUSES.every((status) => summary.counts?.[status] === counts[prefix][status]), `area ${area.area} ${prefix} status counts disagree with the samples`);
      requireEvidence(summary.quantified_only?.denominator === counts[prefix].quantified
        && summary.censored_count === counts[prefix].above_detection + counts[prefix].below_detection,
      `area ${area.area} ${prefix} denominator or censor count is inconsistent`);
    }
    total += collection.features.length;
  }
  requireEvidence(config.overview?.sample_count === total, 'overview sample count does not match the samples');
  boundsFor(config);
  return true;
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load evidence (${response.status}): ${path}`);
  try {
    return await response.json();
  } catch {
    throw new Error(`Evidence file is not valid JSON: ${path}`);
  }
}

export async function loadEvidence(baseUrl = '/') {
  const config = await fetchJson(assetPath('research/gold-frontend-data.json', baseUrl));
  requireEvidence(Array.isArray(config?.areas), 'area configuration is missing');
  const entries = await Promise.all(config.areas.map(async (area) => [
    area.area,
    await fetchJson(assetPath(area.geojson_path, baseUrl)),
  ]));
  const collections = Object.fromEntries(entries);
  validateEvidence(config, collections);
  return { config, features: config.areas.flatMap((area) => collections[area.area].features), collections };
}
