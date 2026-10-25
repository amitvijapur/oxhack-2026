import { useEffect, useRef } from 'react';
import { ExternalLink, RotateCcw, X } from 'lucide-react';
import MapView from '../MapView.jsx';
import { WithLandMatches } from '../backend/LiveData.jsx';
import { AREA_LABELS } from '../copy.js';
import { formatAssay, formatNumber } from '../evidence.js';
import Details from './Details.jsx';

const STATUS_LABELS = {
  quantified: 'Quantified', above_detection: 'Above detection limit',
  below_detection: 'Below detection limit', not_analyzed: 'Not analysed',
};

const ppm = (value, digits = 3) => (typeof value === 'number' && Number.isFinite(value) ? `${formatNumber(value, digits)} ppm` : 'Not available');

function AreaSummary({ area, landSite, active, onFrame }) {
  const gold = area.measurements.gold_primary;
  const lithium = area.measurements.lithium_secondary;
  const retest = area.measurements.gold_retest;
  return <article className={`area-card area-${area.area.toLowerCase()}${active ? ' is-active' : ''}`}>
    <header>
      <h3><span className="area-dot" aria-hidden="true" />{AREA_LABELS[area.area] ?? area.name} <span className="muted">({area.area})</span></h3>
      <button type="button" className="link-button" onClick={onFrame} aria-label={`Frame ${area.name} on map`}>Show on map</button>
    </header>
    <dl className="stat-list">
      <div><dt>Typical gold</dt><dd>{ppm(gold.quantified_only.median_ppm)}</dd></div>
      <div><dt>Typical lithium</dt><dd>{ppm(lithium.quantified_only.median_ppm, 1)}</dd></div>
      <div><dt>Samples</dt><dd>{area.sample_count}</dd></div>
      {landSite ? <div><dt>Inside an active claim</dt><dd>{landSite.insideActiveClaim ?? '?'} of {landSite.samples ?? area.sample_count}</dd></div> : null}
    </dl>
    <Details summary="How these numbers are made">
      <ul className="plain-list">
        <li>“Typical” is the median of measured results only: gold n={gold.quantified_only.denominator}, lithium n={lithium.quantified_only.denominator}.</li>
        <li>Gold results beyond the lab’s limits: {gold.counts.above_detection} above, {gold.counts.below_detection} below. They stay out of the median.</li>
        <li>Separate gold retests ({retest.method}): {retest.counts.quantified ? `${retest.counts.quantified} measured, median ${ppm(retest.quantified_only.median_ppm)}` : 'none measured'}; {retest.counts.not_analyzed} not analysed. Retests never replace the first result.</li>
        <li>Lab method for gold: {gold.method}. ppm means parts per million.</li>
      </ul>
    </Details>
  </article>;
}

function AreaPanel({ areas, area, land, onFrame }) {
  return <div className="panel-body">
    <h2 className="panel-title">Compare the two areas</h2>
    <p className="panel-lede">Select any dot to see that sample.</p>
    {areas.map((item) => <AreaSummary key={item.area} area={item} active={area === item.area}
      landSite={land?.summary.sites[item.area] ?? null} onFrame={() => onFrame(item.area)} />)}
  </div>;
}

function Reading({ label, properties, prefix }) {
  return <div><dt>{label}</dt><dd>{formatAssay(properties, prefix)}</dd></div>;
}

function LabRow({ label, properties, prefix }) {
  const raw = properties[`${prefix}_raw`];
  return <tr>
    <th scope="row">{label}</th>
    <td>{properties[`${prefix}_method`]}</td>
    <td>{STATUS_LABELS[properties[`${prefix}_status`]] ?? properties[`${prefix}_status`]}</td>
    <td className="mono">{raw === '' ? 'Blank' : raw ?? 'Not provided'}</td>
  </tr>;
}

function LandRecords({ matches }) {
  return <div className="panel-block">
    <h3>Land today</h3>
    <ul className="record-list">{matches.map((m, index) => <li key={`${m.contractRecordId ?? m.matchStatus}-${index}`}>
      <strong>{m.contractRecordId ?? 'No record found'}</strong>
      <span>{m.contractInterestType ?? 'Checked layers had no record here'}</span>
    </li>)}</ul>
    <p className="fine-print">Records checked {matches[0].contractSnapshotAt ?? 'recently'}. They show today’s land, not 2016 ownership.</p>
  </div>;
}

function SamplePanel({ feature, source, onClose }) {
  const headingRef = useRef(null);
  const p = feature.properties;
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1120px)').matches) headingRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [feature.id]);
  return <aside className="panel-body sample-drawer" aria-labelledby="sample-heading" onKeyDown={(event) => {
    if (event.key === 'Escape') onClose();
  }}>
    <div className="panel-head">
      <div>
        <p className="eyebrow">{AREA_LABELS[p.area] ?? p.area} ({p.area}) · stream sample</p>
        <h2 id="sample-heading" ref={headingRef} tabIndex={-1} className="panel-title">{p.sample_id}</h2>
      </div>
      <button className="icon-button" type="button" onClick={onClose} aria-label="Close sample details"><X size={18} aria-hidden="true" /></button>
    </div>
    <dl className="stat-list">
      <Reading label="Gold" properties={p} prefix="gold_primary" />
      <Reading label="Gold retest" properties={p} prefix="gold_retest" />
      <Reading label="Lithium" properties={p} prefix="lithium_secondary" />
    </dl>
    <WithLandMatches sampleKey={feature.id}>{(land) => (land && land.matches.length > 0 ? <LandRecords matches={land.matches} /> : null)}</WithLandMatches>
    <Details summary="Lab details">
      <table className="lab-table">
        <thead><tr><th scope="col">Result</th><th scope="col">Method</th><th scope="col">Status</th><th scope="col">Raw</th></tr></thead>
        <tbody>
          <LabRow label="Gold" properties={p} prefix="gold_primary" />
          <LabRow label="Gold retest" properties={p} prefix="gold_retest" />
          <LabRow label="Lithium" properties={p} prefix="lithium_secondary" />
        </tbody>
      </table>
      <dl className="meta-list">
        <div><dt>Longitude, latitude</dt><dd className="mono">{feature.geometry.coordinates[0].toFixed(6)}, {feature.geometry.coordinates[1].toFixed(6)}</dd></div>
        <div><dt>Laboratory ID</dt><dd>{p.laboratory_sample_id}</dd></div>
        <div><dt>Batch</dt><dd className="mono">{p.batch_number || 'Not provided'}</dd></div>
        <div><dt>Source record</dt><dd>{p.source_id} · row {p.source_csv_record_number}</dd></div>
      </dl>
      <a className="text-link" href={source.publication_url} target="_blank" rel="noreferrer">Alaska DGGS source <ExternalLink size={13} aria-hidden="true" /></a>
    </Details>
  </aside>;
}

export default function MapSection({ evidence, features, bounds, area, selected, land, onArea, onReset, onSelect, onClose }) {
  const options = [{ key: 'all', label: 'All' }, ...evidence.config.areas.map((a) => ({ key: a.area, label: `${AREA_LABELS[a.area] ?? a.name} (${a.area})` }))];
  return <section className="map-section" id="map" aria-labelledby="map-heading">
    <div className="section-head">
      <h2 id="map-heading">Where the samples were taken</h2>
      <p>{evidence.config.overview.sample_count} stream samples, Tok River, eastern Alaska.</p>
    </div>
    <div className="map-shell">
      <div className="map-toolbar">
        <div className="segmented" role="group" aria-label="Filter and frame sampling area">
          {options.map((option) => <button type="button" key={option.key} aria-pressed={area === option.key} onClick={() => onArea(option.key)}>{option.label}</button>)}
        </div>
        <button type="button" className="link-button" onClick={onReset}><RotateCcw size={14} aria-hidden="true" />Reset view</button>
      </div>
      <MapView features={features} selectedId={selected?.id ?? null} bounds={bounds} onSelect={onSelect} />
      <div className="map-legend">
        <span><span className="legend-dot area-a" />Tok west (A)</span>
        <span><span className="legend-dot area-b" />Tok east (B)</span>
        <span className="legend-note">Dots are sample points, not gold deposits.</span>
      </div>
      <div className="map-panel">
        {selected
          ? <SamplePanel feature={selected} source={evidence.config.source} onClose={onClose} />
          : <AreaPanel areas={evidence.config.areas} area={area} land={land} onFrame={onArea} />}
      </div>
    </div>
  </section>;
}
