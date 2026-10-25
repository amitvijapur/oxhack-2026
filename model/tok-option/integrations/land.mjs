/** Land observations inform context only. This adapter never constructs a tradeable option. */
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const positive = (value) => finite(value) && value > 0;
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const KINDS = new Set(['active_claim', 'closed_claim', 'state_land']);
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function normalizeSamples(rows) {
  const samples = new Map();
  const errors = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!text(row?.sampleKey) || !text(row.sampleId) || !['A', 'B'].includes(row.area)) {
      errors.push('invalid_sample_identity');
      continue;
    }
    const existing = samples.get(row.sampleKey);
    if (existing && (existing.sampleId !== row.sampleId || existing.area !== row.area)) {
      errors.push('conflicting_sample_identity');
      continue;
    }
    const sample = existing ?? { sampleKey: row.sampleKey, sampleId: row.sampleId, area: row.area, checked: row.checked === true, snapshotAt: row.snapshotAt ?? null, nearestActiveClaimMetres: finite(row.nearestActiveClaimMetres) && row.nearestActiveClaimMetres >= 0 ? row.nearestActiveClaimMetres : null, records: [] };
    if (!Array.isArray(row.records)) {
      sample.checked = false;
      errors.push('missing_sample_records');
    }
    for (const record of Array.isArray(row.records) ? row.records : []) {
      if (!KINDS.has(record?.kind) || !text(record.id)) {
        sample.checked = false;
        errors.push('invalid_sample_record');
        continue;
      }
      const duplicate = sample.records.find((r) => r.kind === record.kind && r.id === record.id);
      if (duplicate) {
        if ((duplicate.recordedHolder ?? null) !== (record.recordedHolder ?? null) || (duplicate.statusCode ?? null) !== (record.statusCode ?? null)) {
          sample.checked = false;
          errors.push('conflicting_sample_record');
        }
      } else sample.records.push({ ...record });
    }
    samples.set(row.sampleKey, sample);
  }
  // Two keys cannot make the same physical source sample count twice.
  const ids = new Set();
  for (const sample of samples.values()) {
    if (ids.has(sample.sampleId)) errors.push('duplicate_sample_id_with_different_key');
    ids.add(sample.sampleId);
  }
  return { samples: [...samples.values()], errors: [...new Set(errors)] };
}

/** Descriptive endpoint CAGR of complete annual means, not a price forecast or backtest. */
export function historicalGoldTrend(source) {
  const unavailable = (status, detail) => ({ status, annualGrowthRate: null, startYear: null, endYear: null, startPriceUsdPerOz: null, endPriceUsdPerOz: null, detail });
  const observations = source?.context?.gold?.observations;
  if (!Array.isArray(observations) || !observations.length) return unavailable('missing', 'No annual gold observations supplied.');
  const snapshotYear = Number(String(source?.sourceSnapshotAt ?? '').slice(0, 4));
  if (!Number.isInteger(snapshotYear) || snapshotYear < 1900) return unavailable('blocked', 'A dated source snapshot is required.');
  const complete = observations.filter((row) => Number.isInteger(row?.year) && row.year < snapshotYear && row.months === 12 && positive(row.annualMeanUsdPerTroyOz));
  const byYear = new Map(complete.map((row) => [row.year, row]));
  if (byYear.size !== complete.length) return unavailable('blocked', 'Duplicate complete-year gold observations must be resolved.');
  if (!complete.length) return unavailable('missing', 'No complete calendar-year gold means are supplied.');
  const endYear = Math.max(...byYear.keys());
  const startYear = endYear - 5;
  if (!Array.from({ length: 6 }, (_, i) => startYear + i).every((year) => byYear.has(year))) return unavailable('missing', 'The five-year window needs six consecutive complete annual observations.');
  const startPriceUsdPerOz = byYear.get(startYear).annualMeanUsdPerTroyOz;
  const endPriceUsdPerOz = byYear.get(endYear).annualMeanUsdPerTroyOz;
  return {
    status: 'ready', annualGrowthRate: (endPriceUsdPerOz / startPriceUsdPerOz) ** (1 / 5) - 1,
    startYear, endYear, startPriceUsdPerOz, endPriceUsdPerOz,
    detail: `Descriptive CAGR of nominal annual gold means from ${startYear} to ${endYear}. Partial years are excluded. Historical publication dates are unverified. Applying this growth to a hypothetical option is an assumption, not a forecast.`,
  };
}

export function inspectLandSource(source, { area = 'A' } = {}) {
  const sourceValid = source?.version === 1 && text(source?.sourceId) && text(source?.revision) && Array.isArray(source?.samples);
  const normalized = normalizeSamples(sourceValid ? source.samples : []);
  const errors = [...normalized.errors];
  if (!sourceValid) errors.push('land_source_missing_or_invalid');
  if (!['A', 'B'].includes(area)) errors.push('invalid_area');
  const sampleMatches = normalized.samples.filter((sample) => sample.area === area);
  const unknownSamples = sampleMatches.filter((sample) => !sample.checked).length;
  const checked = sampleMatches.filter((sample) => sample.checked);
  const hasKind = (sample, kind) => sample.records.some((record) => record.kind === kind);
  const owners = new Map();
  for (const sample of checked) {
    const sampleOwners = new Set(sample.records.filter((record) => record.kind === 'active_claim' && text(record.recordedHolder)).map((record) => record.recordedHolder));
    for (const owner of sampleOwners) owners.set(owner, (owners.get(owner) ?? 0) + 1);
  }
  const summary = {
    totalSamples: sampleMatches.length,
    activeClaimSamples: checked.filter((sample) => hasKind(sample, 'active_claim')).length,
    closedClaimSamples: checked.filter((sample) => hasKind(sample, 'closed_claim')).length,
    stateLandSamples: checked.filter((sample) => hasKind(sample, 'state_land')).length,
    noCheckedLayerSamples: checked.filter((sample) => sample.records.length === 0).length,
    unknownSamples,
    medianNearestActiveClaimMetres: median(sampleMatches.map((sample) => sample.nearestActiveClaimMetres).filter(finite)),
    activeClaimOwners: [...owners].map(([name, sampleCount]) => ({ name, sampleCount })).sort((a, b) => b.sampleCount - a.sampleCount || a.name.localeCompare(b.name)),
  };
  const expected = source?.expectedSampleCounts?.[area];
  const completeJoin = sourceValid && errors.length === 0 && Number.isInteger(expected) && summary.totalSamples === expected && unknownSamples === 0;
  const goldTrend = historicalGoldTrend(source);
  const context = sourceValid ? source.context ?? {} : {};
  const goldObservations = Array.isArray(context.gold?.observations) ? context.gold.observations : [];
  const surface = Array.isArray(context.surfaceSales?.observations) ? context.surfaceSales.observations : [];
  const latestSurface = surface.filter((row) => row?.scope === 'Statewide' && row.completeYear === true && positive(row.medianUsdPerAcre)).sort((a, b) => b.year - a.year)[0];
  const deals = Array.isArray(context.dealComparables) ? context.dealComparables : [];
  const costs = context.holdingCosts ?? null;
  const coverage = [
    { id: 'land_sample_join', label: 'Sample-to-land records', status: completeJoin ? 'supplied' : summary.totalSamples ? 'partial' : 'missing', detail: completeJoin ? `${summary.totalSamples} of ${expected} area ${area} samples matched to the checked-layer snapshot, including explicit no-match rows. Counts are unique samples, not record pairs.` : 'Missing, inconsistent or incomplete sample records remain unknown.' },
    { id: 'mineral_title', label: 'Mineral title and available interest', status: 'missing', detail: 'State records and recorded holders do not establish conveyable mineral rights, an available option, assignment consent or liability release. Federal and Native corporation status remain unchecked.' },
    { id: 'gold_history', label: 'Five-year gold baseline', status: goldTrend.status === 'ready' ? 'supplied' : goldObservations.length ? 'partial' : 'missing', detail: goldTrend.detail },
    { id: 'commodity_current_quote', label: 'Current commodity quote', status: 'missing', detail: 'Annual means and the partial 2026 mean are not an executable current gold quote.' },
    { id: 'land_prices', label: 'Tok mineral-land price baseline', status: surface.length || deals.length ? 'partial' : 'missing', detail: surface.length || deals.length ? `${deals.length} heterogeneous Alaska deals and statewide surface-sale summaries provide context. Surface medians are not a Tok mineral-price index or a guaranteed value floor.` : 'No compatible Tok mineral-interest transactions supplied.' },
    { id: 'holding_costs', label: 'Holding-cost context', status: costs ? 'partial' : 'missing', detail: costs ? 'A dated state-rent schedule is supplied. Current legal applicability, claim age, labour obligations and which party pays remain unverified; no costs are assigned to the option model.' : 'No holding-cost schedule supplied.' },
    { id: 'recoverable_resource', label: 'Recoverable resource and success probability', status: 'missing', detail: 'Sediment assays and land overlaps do not supply recoverable ounces, a geological success probability or a conversion factor.' },
    { id: 'available_option', label: 'Available option and executable terms', status: 'missing', detail: 'No verified available Tok assignment quote, premium, buyer exercise consideration, expiry or capped obligation schedule is supplied.' },
    { id: 'sale_probability', label: 'Assignment liquidity', status: 'missing', detail: 'Claim counts, surface auctions and mixed project deals do not calibrate a 30/90/180-day option-assignment sale probability.' },
    { id: 'historical_availability', label: 'Point-in-time evaluation data', status: 'missing', detail: 'Snapshot and retrieval dates are recorded separately. Historical publication times and realized assignment outcomes are not supplied.' },
  ];
  const facts = summary.totalSamples ? [
    { label: 'Samples joined', value: summary.totalSamples, detail: `Area ${area}; sample collection in 2016, land snapshot ${source.sourceSnapshotAt}.` },
    { label: 'Inside active claims', value: `${summary.activeClaimSamples} / ${summary.totalSamples}`, detail: 'Unique sample points. A spatial overlap does not establish ownership of the minerals or availability.' },
    { label: 'Inside state-land records', value: `${summary.stateLandSamples} / ${summary.totalSamples}`, detail: 'Land-status codes remain uninterpreted. Overlapping records do not add samples.' },
    { label: 'No checked-layer overlap', value: `${summary.noCheckedLayerSamples} / ${summary.totalSamples}`, detail: 'This means no match in the checked layers, not unowned or available land.' },
    { label: 'Recorded active-claim holders', value: summary.activeClaimOwners.map((owner) => `${owner.name} (${owner.sampleCount})`).join('; ') || 'None in checked records', detail: 'Counts show unique samples per holder, not claim inventory or verified counterparties.' },
  ] : [];
  if (goldTrend.status === 'ready') facts.push({ label: 'Five-year gold mean growth', value: `${(100 * goldTrend.annualGrowthRate).toFixed(2)}% per year`, detail: `${goldTrend.startYear} annual mean $${goldTrend.startPriceUsdPerOz.toFixed(2)} to ${goldTrend.endYear} $${goldTrend.endPriceUsdPerOz.toFixed(2)} per troy ounce. Descriptive CAGR; not a prediction.` });
  if (latestSurface) facts.push({ label: 'Statewide surface-sale median', value: `$${latestSurface.medianUsdPerAcre.toFixed(2)} / acre`, detail: `${latestSurface.year}, ${latestSurface.parcels} sold parcels of varying sizes and locations. This is not a Tok mineral-interest price.` });
  if (deals.length) facts.push({ label: 'Mineral-deal context', value: deals.length, detail: 'Mixed stages, districts, currencies and terms; includes related-party, unclosed, terminated and non-gold examples. None verifies an available Tok assignment.' });
  return {
    status: errors.length ? (sourceValid ? 'blocked' : 'missing') : 'partial', area,
    sampleMatches, summary, facts, coverage, goldTrend,
    holdingCosts: costs, dealComparables: deals,
    provenance: sourceValid ? { sourceId: source.sourceId, branch: source.branch ?? null, revision: source.revision, retrievedAt: source.retrievedAt ?? null, sourceSnapshotAt: source.sourceSnapshotAt ?? null, reportDates: source.reportDates ?? {}, sourceUrl: `https://github.com/amitvijapur/oxhack-2026/tree/${source.revision}/research/tok-land`, sources: source.sources ?? [], historicalAvailabilityVerified: source.historicalAvailabilityVerified === true } : null,
    reasons: errors.length ? [...new Set(errors)] : ['land_context_does_not_fill_contract_resource_or_liquidity_inputs'],
    limitations: sourceValid && Array.isArray(source.limitations) ? source.limitations : [],
  };
}
