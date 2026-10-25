import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, basename } from 'node:path';

const ISSUERS = ['NG', 'NAK'];
const TICKERS = [...ISSUERS, 'GLD', 'SPY'];
const HORIZONS = [5, 20];
const LOOKBACK = 60;
const COST = .005;
const PRIOR = 3;
const validDate = (date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
const finite = (number) => typeof number === 'number' && Number.isFinite(number);
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const sha256 = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value / values.length, 0) : null;
const emptyReturn = () => ({ stock: null, gld: null, spy: null, stockMinusGld: null, stockMinusSpy: null });
const emptyPredictions = () => ({ noChange: 0, goldBaseline: null, eventModel: null, eventAdjustment: null, scope: 'unavailable' });

function validate(ledger, prices) {
  const errors = [];
  if (!record(ledger) || ledger.schemaVersion !== 1 || !Array.isArray(ledger.events)) return ['Expected schemaVersion 1 and events array.'];
  if (typeof ledger.frozenAt !== 'string' || !Number.isFinite(Date.parse(ledger.frozenAt))) errors.push('A frozenAt timestamp is required before evaluating outcomes.');
  const ids = new Set();
  for (const event of ledger.events) {
    if (!record(event) || typeof event.id !== 'string' || !event.id.trim() || ids.has(event.id)) { errors.push('Events need unique nonempty IDs.'); continue; }
    ids.add(event.id);
    if (!ISSUERS.includes(event.ticker) || !validDate(event.publicationDate) || event.publicationDate < '2020-01-01' || event.publicationDate > '2025-12-31' || ![-1, 0, 1].includes(event.direction)) errors.push(`${event.id}: invalid fixed-universe date, ticker or pre-coded direction.`);
    if (typeof event.title !== 'string' || !event.title.trim() || typeof event.sourceUrl !== 'string' || !/^https:\/\//.test(event.sourceUrl)) errors.push(`${event.id}: primary source URL and title are required.`);
    if (event.publicationTimestamp != null && (typeof event.publicationTimestamp !== 'string' || !Number.isFinite(Date.parse(event.publicationTimestamp)))) errors.push(`${event.id}: invalid publicationTimestamp.`);
  }
  if (!record(prices) || prices.schemaVersion !== 1 || !record(prices.series) || !record(prices.source)) return [...errors, 'Expected attributed schemaVersion 1 price series.'];
  for (const ticker of TICKERS) {
    const rows = prices.series[ticker];
    if (!Array.isArray(rows) || !rows.length) { errors.push(`Missing price series ${ticker}.`); continue; }
    let previous = '';
    for (const row of rows) {
      if (!record(row) || !validDate(row.date) || row.date <= previous || !finite(row.close) || row.close <= 0) errors.push(`${ticker}: dates must be unique, ascending and valid; closes must be finite and positive.`);
      previous = row?.date ?? '';
    }
  }
  if (prices.corporateActions != null && (!Array.isArray(prices.corporateActions) || prices.corporateActions.some((action) => !record(action) || !TICKERS.includes(action.ticker) || !validDate(action.date)))) errors.push('Invalid corporateActions list.');
  return [...new Set(errors)];
}

function metric(rows, predictionKey) {
  const pairs = rows.map((row) => [row.predictions[predictionKey], row.observedReturns.stock]);
  if (pairs.some(([forecast, actual]) => !finite(forecast) || !finite(actual) || !finite(Math.abs(forecast - actual)))) return null;
  const hits = pairs.filter(([forecast, actual]) => Math.sign(forecast) === Math.sign(actual)).length;
  const maePercentagePoints = mean(pairs.map(([forecast, actual]) => Math.abs(forecast - actual))) * 100;
  return finite(maePercentagePoints) ? { maePercentagePoints, directionHits: { numerator: hits, denominator: pairs.length, rate: hits / pairs.length }, sampleSize: pairs.length } : null;
}

function horizonStudy(ledger, prices, days) {
  const maps = Object.fromEntries(TICKERS.map((ticker) => [ticker, new Map(prices.series[ticker].map((row) => [row.date, row.close]))]));
  // The union of supplied US-session dates preserves any date missing from one
  // ticker. Missing observations invalidate a window; dates are not compressed.
  const calendar = [...new Set(TICKERS.flatMap((ticker) => prices.series[ticker].map((row) => row.date)))].sort();
  const actions = prices.corporateActions ?? [];
  const adjusted = prices.source.adjustmentVerified === true || prices.source.adjustment?.verified === true;
  const rows = [...ledger.events].sort((a, b) => a.publicationDate.localeCompare(b.publicationDate) || a.id.localeCompare(b.id)).map((event) => {
    const row = { ...event, horizonSessions: days, partition: 'excluded', exclusionReasons: [], entryDate: null, endDate: null, observedReturns: emptyReturn(), predictions: emptyPredictions(), observedProvenance: 'calculated_from_attributed_market_closes', predictionProvenance: { goldBaseline: 'trailing_60_common_gld_log_returns', eventModel: 'matured_training_residuals_by_pre_coded_direction' }, economicDiagnostic: null };
    const firstLater = calendar.findIndex((date) => date > event.publicationDate);
    const entry = calendar.findIndex((date, index) => index >= firstLater && firstLater >= 0 && maps.GLD.has(date) && maps.SPY.has(date) && maps[event.ticker].has(date));
    if (entry < 0) { row.exclusionReasons.push('no_common_session_after_publication'); return row; }
    row.entryDate = calendar[entry];
    const end = entry + days;
    if (end >= calendar.length) { row.exclusionReasons.push('outcome_not_available'); return row; }
    row.endDate = calendar[end];
    const window = calendar.slice(entry, end + 1);
    if (window.some((date) => !maps.GLD.has(date) || !maps.SPY.has(date) || !maps[event.ticker].has(date))) row.exclusionReasons.push('missing_aligned_outcome_prices');
    if (!adjusted && actions.some((action) => [event.ticker, 'GLD', 'SPY'].includes(action.ticker) && action.date > row.entryDate && action.date <= row.endDate)) row.exclusionReasons.push('unadjusted_corporate_action_window');
    if (!row.exclusionReasons.length) {
      const ret = (ticker) => maps[ticker].get(row.endDate) / maps[ticker].get(row.entryDate) - 1;
      const stock = ret(event.ticker); const gld = ret('GLD'); const spy = ret('SPY');
      if (![stock, gld, spy].every(finite)) row.exclusionReasons.push('non_finite_return');
      else {
        row.observedReturns = { stock, gld, spy, stockMinusGld: stock - gld, stockMinusSpy: stock - spy };
        row.economicDiagnostic = { policy: 'long_favourable_else_cash', traded: event.direction === 1, grossReturn: event.direction === 1 ? stock : 0, illustrativeRoundTripCost: event.direction === 1 ? COST : 0, returnAfterIllustrativeCost: event.direction === 1 ? stock - COST : 0, costProvenance: 'fixed_hypothetical_50_basis_points', executionProvenance: 'hypothetical_entry_and_exit_at_adjusted_close', actualTradingPerformance: false };
      }
    }
    const history = calendar.slice(Math.max(0, entry - LOOKBACK - 1), entry);
    if (history.length !== LOOKBACK + 1 || history.some((date) => !maps.GLD.has(date) || !maps.SPY.has(date) || !maps[event.ticker].has(date))) row.exclusionReasons.push('insufficient_aligned_60_return_history');
    else if (!adjusted && actions.some((action) => action.ticker === 'GLD' && action.date > history[0] && action.date <= history.at(-1))) row.exclusionReasons.push('unadjusted_corporate_action_history');
    else {
      const logs = history.slice(1).map((date, i) => Math.log(maps.GLD.get(date) / maps.GLD.get(history[i])));
      const forecast = Math.expm1(mean(logs) * days);
      if (!finite(forecast)) row.exclusionReasons.push('non_finite_gold_forecast');
      else row.predictions.goldBaseline = forecast;
    }
    return row;
  });

  const lastEnd = new Map();
  for (const row of rows.filter((event) => !event.exclusionReasons.length).sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.id.localeCompare(b.id))) {
    const previous = lastEnd.get(row.ticker);
    if (previous && row.entryDate <= previous.endDate) row.exclusionReasons.push(`overlap_with_${previous.id}`);
    else lastEnd.set(row.ticker, row);
  }
  const eligible = rows.filter((row) => !row.exclusionReasons.length);
  const targetTrainingCount = Math.floor(eligible.length * .6);
  const boundaryDate = targetTrainingCount ? eligible[targetTrainingCount - 1].publicationDate : null;
  const trainingCandidates = boundaryDate ? eligible.filter((row) => row.publicationDate <= boundaryDate) : [];
  const testing = boundaryDate ? eligible.filter((row) => row.publicationDate > boundaryDate) : eligible;
  const firstTestEntry = testing.length ? testing.reduce((date, row) => row.entryDate < date ? row.entryDate : date, testing[0].entryDate) : null;
  const training = [];
  for (const row of trainingCandidates) {
    if (!firstTestEntry || row.endDate >= firstTestEntry) row.exclusionReasons.push('training_outcome_not_mature_before_first_test_entry');
    else { row.partition = 'train'; training.push(row); }
  }
  for (const row of testing) row.partition = 'test';
  const fit = Object.fromEntries([-1, 0, 1].map((direction) => {
    const residuals = training.filter((row) => row.direction === direction).map((row) => row.observedReturns.stock - row.predictions.goldBaseline);
    const n = residuals.length;
    const meanResidual = n ? mean(residuals) : null;
    const adjustment = n ? meanResidual * (n / (n + PRIOR)) : 0;
    return [direction, { count: n, meanResidual: finite(meanResidual) ? meanResidual : null, shrinkage: n / (n + PRIOR), adjustment: finite(adjustment) ? adjustment : null }];
  }));
  for (const row of [...training, ...testing]) {
    const adjustment = fit[row.direction].adjustment;
    if (adjustment === null) { row.exclusionReasons.push('non_finite_event_forecast'); continue; }
    const forecast = row.predictions.goldBaseline + adjustment;
    if (!finite(forecast)) { row.exclusionReasons.push('non_finite_event_forecast'); continue; }
    row.predictions = { ...row.predictions, eventModel: forecast, eventAdjustment: adjustment, scope: row.partition === 'test' ? 'held_out' : 'in_sample_training_fit' };
  }
  const reasons = [];
  if (training.length < 4) reasons.push('fewer_than_four_matured_training_events');
  if (testing.length < 3) reasons.push('fewer_than_three_test_events');
  if ([...training, ...testing].some((row) => row.exclusionReasons.length)) reasons.push('invalid_fitted_forecast');
  let metrics = reasons.length ? null : { goldBaseline: metric(testing, 'goldBaseline'), eventModel: metric(testing, 'eventModel'), noChange: metric(testing, 'noChange') };
  if (metrics && Object.values(metrics).some((value) => value === null)) { reasons.push('non_finite_score'); metrics = null; }
  return { days, primary: days === 5, status: metrics ? 'evaluated_selected_sample' : 'insufficient_sample', scoreReasons: reasons, targetTrainingCount, boundaryPublicationDate: boundaryDate, firstTestEntryDate: firstTestEntry, trainingCandidateIds: trainingCandidates.map((row) => row.id), trainEventIds: training.map((row) => row.id), testEventIds: testing.map((row) => row.id), eligibleEventIds: eligible.map((row) => row.id), fit, metrics, eventVersusGoldMaeReductionPercentagePoints: metrics ? metrics.goldBaseline.maePercentagePoints - metrics.eventModel.maePercentagePoints : null, exclusions: rows.filter((row) => row.exclusionReasons.length).map((row) => ({ id: row.id, ticker: row.ticker, publicationDate: row.publicationDate, entryDate: row.entryDate, endDate: row.endDate, reasons: row.exclusionReasons })), events: rows };
}

/** Pure, fixed-protocol evaluator. Importing this module never opens input files. */
export function evaluateEventStudy(ledger, prices) {
  const errors = validate(ledger, prices);
  const base = { schemaVersion: 1, studyId: 'alaska-project-event-pilot-v1', units: { returns: 'fraction', mae: 'percentage_points', horizons: 'trading_sessions' }, status: 'invalid_input', errors, method: { universe: ISSUERS, eventStartDate: '2020-01-01', eventEndDate: '2025-12-31', entry: 'first_common_session_strictly_after_publication_calendar_date', horizons: HORIZONS, goldLookbackReturns: LOOKBACK, goldPredictorCutoff: 'session_strictly_before_entry', trainingFraction: .6, sameDateRule: 'include_entire_boundary_publication_date_in_training', maturityRule: 'training_end_strictly_before_first_test_entry', overlapRule: 'same_issuer_keep_earlier_exclude_including_shared_endpoint', minimumTrainingEvents: 4, minimumTestEvents: 3, residualPriorStrength: PRIOR, illustrativeRoundTripCost: COST, initialAnnouncementReactionExcluded: true }, sources: { eventLedger: record(ledger) ? Object.fromEntries(Object.entries(ledger).filter(([key]) => key !== 'events')) : null, prices: prices?.source ?? null, seriesSources: prices?.seriesSources ?? null }, inputFingerprints: { ledgerSha256: sha256(ledger ?? null), pricesSha256: sha256(prices ?? null) }, horizons: [], swarmLift: { status: 'unavailable', value: null, reason: 'Zero historical outcomes are paired with the existing fictional swarm scenarios. Event polarity is not a swarm prediction.' }, limitations: ['This is a small source-selected liquid-equity event sample, with repeated issuers and correlated events. Numeric comparisons do not establish broad predictive accuracy.', 'Current-vintage adjusted prices lack historical as-of vintages. Adjusted closes are not literal executable fills; the delayed-close policy is hypothetical.', 'GLD is a traded gold ETF, not spot gold. Stock-minus-benchmark returns are observed diagnostics, not forecasts or a replicated hedge.', 'Favourable events alone enter the long-only diagnostic; adverse/mixed events hold cash. Costs are an assumed stress, not measured execution.', 'The pilot does not estimate Tok option returns, mineral resources, assignment liquidity or incremental swarm value.'] };
  if (errors.length) return base;
  const horizons = HORIZONS.map((days) => horizonStudy(ledger, prices, days));
  const adjusted = prices.source.adjustmentVerified === true || prices.source.adjustment?.verified === true;
  const sourceLimits = [
    ...(Array.isArray(ledger.coverageLimitations) ? ledger.coverageLimitations : []),
    ...(Array.isArray(prices.source.limitations) ? prices.source.limitations : []),
  ].filter((item) => typeof item === 'string');
  return { ...base, status: horizons[0].metrics ? 'evaluated_selected_sample' : 'insufficient_sample', priceAdjustmentVerified: adjusted, limitations: [...new Set([...base.limitations, ...sourceLimits, ...(!adjusted ? ['Price adjustment is unverified. Known listed corporate-action outcome/history windows are blocked; absence of a listed action does not establish an independent corporate-action audit.'] : [])])], horizons };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = fileURLToPath(new URL('.', import.meta.url));
  const eventsPath = process.argv[2] ?? resolve(directory, 'events.json');
  const pricesPath = process.argv[3] ?? resolve(directory, 'prices.json');
  const outputPath = process.argv[4] ?? resolve(directory, '../../frontend/public/data/event-study.json');
  const [ledgerText, priceText] = await Promise.all([readFile(eventsPath, 'utf8'), readFile(pricesPath, 'utf8')]);
  const result = evaluateEventStudy(JSON.parse(ledgerText), JSON.parse(priceText));
  await writeFile(outputPath, JSON.stringify({ ...result, generatedAt: new Date().toISOString(), inputFiles: { events: basename(eventsPath), prices: basename(pricesPath) }, inputFileSha256: { events: sha256(ledgerText), prices: sha256(priceText) } }, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ outputPath, status: result.status, errors: result.errors, horizons: result.horizons.map((row) => ({ days: row.days, train: row.trainEventIds.length, test: row.testEventIds.length, exclusions: row.exclusions.length, metrics: row.metrics })) }) + '\n');
  if (result.errors.length) process.exitCode = 1;
}
