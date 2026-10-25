"use client";

import { useEffect, useState } from "react";
import styles from "./EventStudy.module.css";

type Metric = {
  maePercentagePoints: number;
  directionHits: { numerator: number; denominator: number };
  sampleSize: number;
};
type StudyEvent = {
  id: string;
  ticker: string;
  title: string;
  sourceUrl: string;
  publicationDate: string;
  publicationTimestamp?: string | null;
  entryDate: string | null;
  endDate: string | null;
  direction: number;
  partition: string;
  exclusionReasons: string[];
  observedReturns: { stock: number | null; stockMinusGld: number | null };
  predictions: { goldBaseline: number | null; eventModel: number | null; scope: string };
  economicDiagnostic: null | { traded: boolean; returnAfterIllustrativeCost: number | null };
};
type Horizon = {
  days: number;
  primary: boolean;
  status: string;
  trainEventIds: string[];
  testEventIds: string[];
  scoreReasons: string[];
  exclusions: unknown[];
  metrics: null | { goldBaseline: Metric; eventModel: Metric; noChange: Metric };
  eventVersusGoldMaeReductionPercentagePoints: number | null;
  events: StudyEvent[];
};
type PriceSource = { provider?: string; url?: string; historyUrl?: string; retrievedAt?: string };
export type EventStudyData = {
  schemaVersion: 1;
  status: string;
  errors: string[];
  horizons: Horizon[];
  sources: { prices?: PriceSource | null; seriesSources?: Record<string, PriceSource> | null };
  method: { illustrativeRoundTripCost?: number | null };
  limitations: string[];
  swarmLift: { status: string; value: number | null; reason: string };
};

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const nullableNumber = (value: unknown) => value === null || finite(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const count = (value: unknown) => finite(value) && Number.isInteger(value) && value >= 0;
const nullableDate = (value: unknown) => value === null || typeof value === "string";
const safeUrl = (value: unknown) => typeof value === "string" && /^https:\/\//.test(value) ? value : undefined;
const readable = (value: string) => value.replaceAll("_", " ");
const priceSource = (value: unknown) => record(value) && ["provider", "url", "historyUrl", "retrievedAt"].every((key) => value[key] == null || typeof value[key] === "string");

function isMetric(value: unknown): value is Metric {
  return record(value) && finite(value.maePercentagePoints) && value.maePercentagePoints >= 0 && count(value.sampleSize)
    && record(value.directionHits) && count(value.directionHits.numerator) && count(value.directionHits.denominator)
    && Number(value.directionHits.numerator) <= Number(value.directionHits.denominator)
    && value.directionHits.denominator === value.sampleSize;
}

/** Reject incompatible units and malformed saved results rather than displaying invented zeros. */
export function parseEventStudy(value: unknown): EventStudyData {
  const invalid = () => { throw new Error("The saved historical test has an unsupported or incomplete format."); };
  if (!record(value) || value.schemaVersion !== 1 || !["evaluated_selected_sample", "insufficient_sample", "invalid_input"].includes(String(value.status))
    || !record(value.units) || value.units.returns !== "fraction" || value.units.mae !== "percentage_points"
    || !Array.isArray(value.horizons) || !strings(value.errors) || !strings(value.limitations)
    || !record(value.sources) || !record(value.method) || !record(value.swarmLift)
    || typeof value.swarmLift.reason !== "string" || typeof value.swarmLift.status !== "string" || !nullableNumber(value.swarmLift.value)) return invalid();
  if ((value.sources.prices != null && !priceSource(value.sources.prices))
    || (value.sources.seriesSources != null && (!record(value.sources.seriesSources) || !Object.values(value.sources.seriesSources).every(priceSource)))
    || (value.method.illustrativeRoundTripCost != null && !finite(value.method.illustrativeRoundTripCost))) return invalid();
  const days = new Set<number>();
  for (const horizon of value.horizons) {
    if (!record(horizon) || !finite(horizon.days) || ![5, 20].includes(horizon.days) || days.has(horizon.days)
      || typeof horizon.primary !== "boolean" || typeof horizon.status !== "string"
      || !strings(horizon.trainEventIds) || !strings(horizon.testEventIds) || !strings(horizon.scoreReasons)
      || !Array.isArray(horizon.exclusions) || !Array.isArray(horizon.events)
      || !nullableNumber(horizon.eventVersusGoldMaeReductionPercentagePoints)) return invalid();
    days.add(horizon.days);
    if (horizon.metrics !== null && (!record(horizon.metrics) || !isMetric(horizon.metrics.goldBaseline)
      || !isMetric(horizon.metrics.eventModel) || !isMetric(horizon.metrics.noChange))) return invalid();
    for (const event of horizon.events) {
      if (!record(event) || !["id", "ticker", "title", "sourceUrl", "publicationDate", "partition"].every((key) => typeof event[key] === "string")
        || !nullableDate(event.entryDate) || !nullableDate(event.endDate) || !finite(event.direction) || ![-1, 0, 1].includes(event.direction)
        || (event.publicationTimestamp != null && typeof event.publicationTimestamp !== "string")
        || !strings(event.exclusionReasons) || !record(event.observedReturns) || !nullableNumber(event.observedReturns.stock)
        || !nullableNumber(event.observedReturns.stockMinusGld) || !record(event.predictions)
        || !nullableNumber(event.predictions.goldBaseline) || !nullableNumber(event.predictions.eventModel)
        || typeof event.predictions.scope !== "string") return invalid();
      if (event.economicDiagnostic !== null && (!record(event.economicDiagnostic) || typeof event.economicDiagnostic.traded !== "boolean"
        || !nullableNumber(event.economicDiagnostic.returnAfterIllustrativeCost))) return invalid();
    }
  }
  if (value.status !== "invalid_input" && !days.has(5)) return invalid();
  return value as unknown as EventStudyData;
}

const percent = (value: number | null | undefined) => finite(value) ? `${value > 0 ? "+" : ""}${(value * 100).toFixed(2)}%` : "Unavailable";
const points = (value: number | null | undefined, signed = false) => finite(value) ? `${signed && value > 0 ? "+" : ""}${value.toFixed(2)} pp` : "Unavailable";
const returnDifference = (value: number | null) => finite(value) ? points(value * 100, true) : "Unavailable";
const statusLabel = (status: string) => status === "evaluated_selected_sample" ? "Small-sample evidence" : status === "invalid_input" ? "Input validation failed" : "Insufficient sample";

function EventLedger({ horizon, cost }: { horizon: Horizon; cost: number | null | undefined }) {
  const hasCost = finite(cost) && horizon.events.some((event) => event.economicDiagnostic !== null);
  return (
    <details className={styles.details}>
      <summary>Event observations and primary sources ({horizon.events.length})</summary>
      <p className={styles.note}>Training rows are in-sample fits. Only test rows enter the reported error. Excluded rows are retained with their reasons. Dates are publication, hypothetical entry close and exit close.</p>
      <div className={styles.scroll} role="region" aria-label={`${horizon.days}-session event observations, scroll horizontally`} tabIndex={0}>
        <table className={styles.ledger}>
          <caption>All located pilot events, {horizon.days} trading sessions. Returns are percentages; share-minus-GLD differences are percentage points.</caption>
          <thead><tr><th scope="col">Event and timing</th><th scope="col">Actual share return</th><th scope="col">Gold-only forecast</th><th scope="col">Event forecast</th><th scope="col">Observed share minus GLD</th>{hasCost ? <th scope="col">Long-only after assumed cost</th> : null}</tr></thead>
          <tbody>{horizon.events.map((event) => (
            <tr key={event.id}>
              <th scope="row">
                <a href={safeUrl(event.sourceUrl)} target="_blank" rel="noreferrer">{event.ticker} · {event.title}</a>
                <span>{event.direction === 1 ? "Favourable" : event.direction === -1 ? "Adverse" : "Mixed / uncertain"} document label · {readable(event.partition)}</span>
                <span>Published <time>{event.publicationDate}</time>{event.publicationTimestamp ? ` (${event.publicationTimestamp})` : " (time unverified)"}</span>
                <span>Entry {event.entryDate ?? "unavailable"} · Exit {event.endDate ?? "unavailable"}</span>
                {event.exclusionReasons.length ? <span>Excluded: {event.exclusionReasons.map(readable).join("; ")}</span> : null}
              </th>
              <td>{percent(event.observedReturns.stock)}</td>
              <td>{percent(event.predictions.goldBaseline)}</td>
              <td>{percent(event.predictions.eventModel)}<small>{readable(event.predictions.scope)}</small></td>
              <td>{returnDifference(event.observedReturns.stockMinusGld)}</td>
              {hasCost ? <td>{event.economicDiagnostic ? <>{percent(event.economicDiagnostic.returnAfterIllustrativeCost)}<small>{event.economicDiagnostic.traded ? "Hypothetical long" : "Held cash"}</small></> : "Unavailable"}</td> : null}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {hasCost ? <p className={styles.note}>Cost stress: {(cost * 10000).toFixed(0)} bps ({(cost * 100).toFixed(2)}%) round trip, assumed for favourable-event longs; other events hold cash. Adjusted closes are comparison inputs, not observed execution fills. These are not option returns or actual trading performance.</p> : null}
    </details>
  );
}

/** Pure result view also exercised with held-out and insufficient-sample fixtures. */
export function EventStudyResults({ study, days, onDaysChange }: { study: EventStudyData; days: number; onDaysChange: (days: number) => void }) {
  const horizon = study.horizons.find((item) => item.days === days) ?? study.horizons.find((item) => item.primary) ?? study.horizons[0];
  const status = horizon?.status ?? study.status;
  const improvement = horizon?.eventVersusGoldMaeReductionPercentagePoints;
  const source = study.sources.prices;
  const series = study.sources.seriesSources;
  return (
    <>
      <div className={styles.heading}><h2>Historical event test</h2><span className={styles.status}>{statusLabel(status)}</span></div>
      <p className={styles.intro}>Real Alaska project announcements and public shares: NOVAGOLD (NG, Donlin) and Northern Dynasty (NAK, Pebble). GLD is the gold ETF reference.</p>
      <p className={styles.warning}>Tiny, retrospectively selected event sample. This does not establish a trading edge. Outcomes are share returns, not Tok option returns. There are no historical swarm labels; swarm lift is unavailable.</p>
      {study.errors.length ? <p role="alert" className={styles.warning}>{study.errors.join(" ")}</p> : null}
      {horizon ? <>
        <div className={styles.horizons} role="group" aria-label="Historical return horizon">
          {study.horizons.map((item) => <button key={item.days} type="button" aria-pressed={horizon.days === item.days} onClick={() => onDaysChange(item.days)}>{item.days} sessions{item.primary ? " · primary" : " · sensitivity"}</button>)}
        </div>
        <dl className={styles.counts}><div><dt>Matured training</dt><dd>{horizon.trainEventIds.length} events</dd></div><div><dt>Held-out test</dt><dd>{horizon.testEventIds.length} events</dd></div><div><dt>Excluded</dt><dd>{horizon.exclusions.length} events</dd></div></dl>
        {horizon.metrics ? <>
          <table className={styles.metrics}><caption>Held-out share-return forecast errors. Lower MAE is better; pp means percentage points. Direction matches compare up, down or flat, including exact zero returns.</caption><thead><tr><th scope="col">Forecast</th><th scope="col">MAE</th><th scope="col">Direction matches, including flat</th></tr></thead><tbody>
            {([ ["Gold-only drift", horizon.metrics.goldBaseline], ["Gold + event", horizon.metrics.eventModel], ["No change", horizon.metrics.noChange] ] as const).map(([label, metric]) => <tr key={label}><th scope="row">{label}</th><td>{points(metric.maePercentagePoints)}</td><td>{metric.directionHits.numerator}/{metric.directionHits.denominator}</td></tr>)}
          </tbody></table>
          <p className={styles.improvement}>Event-model MAE improvement: <strong>{points(improvement, true)}</strong>{finite(improvement) ? improvement > 0 ? " (lower error)" : improvement < 0 ? " (higher error)" : " (no improvement)" : ""}.</p>
        </> : <p className={styles.note}>Model-comparison score unavailable.{horizon.scoreReasons.length ? ` ${horizon.scoreReasons.map(readable).join("; ")}.` : ""} Individual observations remain inspectable below.</p>}
        <p className={styles.note}>Entry is the first common session strictly after publication, at its hypothetical closing price. The initial announcement reaction is excluded. The event adjustment is fitted only on earlier matured training outcomes.</p>
        <EventLedger horizon={horizon} cost={study.method.illustrativeRoundTripCost} />
      </> : null}
      <details className={styles.details}><summary>Method limits and price provenance</summary>
        <p className={styles.note}>Swarm incremental lift: unavailable. {study.swarmLift.reason}</p>
        <p className={styles.note}>Vendor-reported unchanged prices may reflect quote precision. Finer-precision returns have not been independently verified. Flat-price matches are included in the direction counts.</p>
        <ul className={styles.limits}>{study.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
        {source ? <p className={styles.note}><a href={safeUrl(source.url)} target="_blank" rel="noreferrer">{typeof source.provider === "string" ? source.provider : "Price vendor"}</a>{typeof source.retrievedAt === "string" ? ` · retrieved ${source.retrievedAt}` : " · retrieval time unavailable"}.</p> : <p className={styles.note}>Price provenance unavailable.</p>}
        {series ? <ul className={styles.sourceLinks}>{Object.entries(series).map(([ticker, item]) => <li key={ticker}><a href={safeUrl(item.historyUrl ?? item.url)} target="_blank" rel="noreferrer">{ticker} price history</a>{typeof item.retrievedAt === "string" ? ` · ${item.retrievedAt}` : ""}</li>)}</ul> : null}
      </details>
    </>
  );
}

export function EventStudy() {
  const [study, setStudy] = useState<EventStudyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(5);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/event-study.json", { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error("The saved historical test could not be loaded.");
      return response.json();
    }).then((value: unknown) => { if (!controller.signal.aborted) setStudy(parseEventStudy(value)); }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "The saved historical test is unavailable.");
    });
    return () => controller.abort();
  }, []);
  return <section className={styles.study} aria-label="Historical event test">
    {study ? <EventStudyResults study={study} days={days} onDaysChange={setDays} /> : <><h2>Historical event test</h2><p className={styles.note} role={error ? "alert" : "status"}>{error ?? "Loading the saved historical assessment…"}</p></>}
  </section>;
}
