import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowUpRight, CalendarDays, ChevronRight, Clock3,
  Database, ExternalLink, FileText, FlaskConical, Layers, MapPin,
  RotateCcw, Search, X,
} from 'lucide-react';
import MapView from './MapView.jsx';
import {
  boundsFor, formatAssay, formatNumber, getVisibleFeatures, loadEvidence,
} from './evidence.js';

const BASE_URL = import.meta.env.BASE_URL;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_LABELS = {
  quantified: 'Quantified', above_detection: 'Above detection',
  below_detection: 'Below detection', not_analyzed: 'Not analyzed',
};

function ContourMark() {
  return <svg className="contour-mark" viewBox="0 0 48 36" fill="none" aria-hidden="true">
    <path d="M2 13c9 0 10-11 20-11S34 13 46 13M2 23c9 0 10-11 20-11S34 23 46 23M2 33c9 0 10-11 20-11S34 33 46 33" />
  </svg>;
}

function Header() {
  return <header className="site-header">
    <a className="identity" href="#main-content" aria-label="Project, Tok River evidence">
      <ContourMark /><span>PROJECT</span>
    </a>
    <nav className="header-nav" aria-label="Page sections">
      <a href="#evidence" aria-current="page">Evidence</a>
      <a href="#sample-records">Sample records</a>
      <a href="#workstreams">Workstreams</a>
    </nav>
    <span className="snapshot-badge"><Clock3 size={14} aria-hidden="true" />Historical snapshot <span className="snapshot-year">2016</span></span>
  </header>;
}

function SiteCard({ area, active, onFrame }) {
  const primary = area.measurements.gold_primary;
  const lithium = area.measurements.lithium_secondary;
  const retest = area.measurements.gold_retest;
  const lithiumMedian = lithium.quantified_only.median_ppm;
  const hasLithiumMedian = typeof lithiumMedian === 'number' && Number.isFinite(lithiumMedian);
  const above = primary.counts.above_detection;
  const below = primary.counts.below_detection;
  return <article className={`site-card site-${area.area.toLowerCase()}${active ? ' is-active' : ''}`}>
    <div className="site-card-heading">
      <div className="site-name"><span className="area-key">{area.area}</span><h3>{area.name}</h3></div>
      <button className="icon-button frame-button" type="button" onClick={onFrame} aria-label={`Frame ${area.name} on map`} title={`Frame ${area.name}`}><ArrowUpRight size={18} aria-hidden="true" /></button>
    </div>
    <div className="site-context">{area.sample_count} sample locations</div>
    <div className="site-measurements"><div className="primary-measure">
      <span className="measure-label">Primary gold median</span>
      <div><strong>{formatNumber(primary.quantified_only.median_ppm, 3)}</strong><span className="unit">ppm</span></div><span className="denominator">n={primary.quantified_only.denominator}</span>
    </div><div className="secondary-measure"><span className="measure-label">Secondary lithium median</span><div>{hasLithiumMedian ? <><strong>{lithiumMedian.toFixed(1)}</strong><span className="unit">ppm</span></> : <span className="unavailable-value">Unavailable</span>}</div>{hasLithiumMedian && <small className="denominator">n={lithium.quantified_only.denominator}</small>}</div></div>
    <p className="measurement-note">{above || below ? `${above} above detection${below ? ` · ${below} below detection` : ''}` : 'All primary results quantified'}</p>
    <div className="retest-summary">
      <div><FlaskConical size={13} aria-hidden="true" /><span>Separate gold retests</span><span className="method-tag">{retest.method}</span></div>
      <p>{retest.counts.quantified ? <><strong>{formatNumber(retest.quantified_only.median_ppm)} ppm</strong>, {retest.counts.quantified} quantified</> : 'None quantified'}<span> · {retest.counts.not_analyzed} not analyzed</span></p>
    </div>
    <div className="card-method">{primary.method} · Quantified-only statistics</div>
  </article>;
}

function AssayDetail({ properties, prefix, title }) {
  const status = properties[`${prefix}_status`];
  const raw = properties[`${prefix}_raw`];
  return <section className={`assay-detail${prefix === 'gold_primary' ? ' assay-primary' : ''}`} aria-label={title}>
    <div className="assay-heading"><h3>{title}</h3><strong>{formatAssay(properties, prefix)}</strong></div>
    <dl className="assay-metadata">
      <div><dt>Method</dt><dd>{properties[`${prefix}_method`]}</dd></div>
      <div><dt>Status</dt><dd>{STATUS_LABELS[status] || status}</dd></div>
      <div><dt>Raw value</dt><dd className="mono">{raw === '' ? 'Blank' : raw ?? 'Not provided'}</dd></div>
    </dl>
  </section>;
}

function SampleDrawer({ feature, source, onClose }) {
  const headingRef = useRef(null);
  const p = feature.properties;
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1120px)').matches) {
      headingRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [feature.id]);
  return <aside className="sample-drawer" aria-labelledby="sample-heading" onKeyDown={(event) => {
    if (event.key === 'Escape') onClose();
  }}>
    <div className="drawer-topline"><span><MapPin size={14} aria-hidden="true" />Sample details</span><button className="icon-button" type="button" onClick={onClose} aria-label="Close sample details"><X size={18} aria-hidden="true" /></button></div>
    <div className="drawer-identity"><span className={`area-key area-${p.area.toLowerCase()}`}>{p.area}</span><div><h2 id="sample-heading" ref={headingRef} tabIndex={-1}>{p.sample_id}</h2><p>{p.area === 'A' ? 'Tok west' : 'Tok east'} · Stream sediment</p></div></div>
    <AssayDetail properties={p} prefix="gold_primary" title="Primary gold" />
    <AssayDetail properties={p} prefix="gold_retest" title="Separate gold retest" />
    <AssayDetail properties={p} prefix="lithium_secondary" title="Secondary lithium" />
    <section className="record-detail" aria-label="Sample provenance">
      <h3>Sample record</h3>
      <dl>
        <div><dt>Longitude</dt><dd className="mono">{feature.geometry.coordinates[0].toFixed(6)}</dd></div>
        <div><dt>Latitude</dt><dd className="mono">{feature.geometry.coordinates[1].toFixed(6)}</dd></div>
        <div><dt>Laboratory ID</dt><dd>{p.laboratory_sample_id}</dd></div>
        <div><dt>Batch</dt><dd className="mono">{p.batch_number || 'Not provided'}</dd></div>
        <div><dt>Source record</dt><dd>{p.source_id}</dd></div>
        <div><dt>CSV record</dt><dd className="mono">{p.source_csv_record_number}</dd></div>
      </dl>
      <a className="text-link" href={source.publication_url} target="_blank" rel="noreferrer">Alaska DGGS source <ExternalLink size={13} aria-hidden="true" /></a>
    </section>
  </aside>;
}

function Timeline({ timeline }) {
  const collection = timeline.collection_months;
  const start = collection[0].split('-').map(Number);
  const end = collection.at(-1).split('-').map(Number);
  const publication = timeline.publication.value.split('-').map(Number);
  const collectionLabel = start[0] === end[0]
    ? `${MONTHS[start[1] - 1]}${start[1] !== end[1] ? `–${MONTHS[end[1] - 1]}` : ''} ${start[0]}`
    : `${MONTHS[start[1] - 1]} ${start[0]}–${MONTHS[end[1] - 1]} ${end[0]}`;
  const publicationLabel = `${MONTHS[publication[1] - 1]} ${publication[0]}`;
  const slots = [];
  let year = start[0], month = start[1];
  while (year < publication[0] || (year === publication[0] && month <= publication[1])) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    slots.push({ key, label: MONTHS[month - 1].slice(0, 3), collected: collection.includes(key), published: key === timeline.publication.value });
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return <section className="timeline-section" aria-labelledby="timeline-heading">
    <div className="timeline-copy"><div className="section-title"><CalendarDays size={17} aria-hidden="true" /><h2 id="timeline-heading">Evidence timeline</h2></div><p>Collected {collectionLabel}; published {publicationLabel}</p><span>Month precision. Per-sample collection dates are unavailable.</span></div>
    <ol className="timeline-track" aria-label="Collection and publication months">
      {slots.map((slot) => <li key={slot.key} className={`${slot.collected ? 'is-collected' : ''} ${slot.published ? 'is-published' : ''}`}><span className="timeline-event">{slot.collected ? 'Collection' : slot.published ? 'Publication' : ''}</span><span className="timeline-point" aria-hidden="true" /><span>{slot.label}</span></li>)}
    </ol>
  </section>;
}

function Workstreams({ pending }) {
  const streams = [
    { key: 'land_contracts', title: 'Land & contracts', description: 'Land records and contract evidence.', icon: FileText },
    { key: 'simulation_prediction', title: 'MiroFish & prediction', description: 'Simulation results and predictive modelling.', icon: Layers },
    { key: 'decision', title: 'Algorithm & output', description: 'Decision logic and its resulting actions.', icon: Database },
  ];
  return <section className="workstreams" id="workstreams" aria-labelledby="workstream-heading">
    <div className="section-title"><h2 id="workstream-heading">Connected workstreams</h2><span>Evidence first, team handoffs next</span></div>
    <div className="workstream-grid">{streams.map(({ key, title, description, icon: Icon }) => {
      const stream = pending[key];
      return <article className="workstream" key={key}><Icon size={18} aria-hidden="true" /><div><div className="workstream-title"><h3>{title}</h3><span className="pending-status">{stream.status === 'planning' ? 'Planning' : 'Pending'}</span></div><p>{description}</p><span className="workstream-owner">{stream.owner}</span></div></article>;
    })}</div>
  </section>;
}

function SampleRecords({ features, selectedId, onSelect }) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return features.filter((f) => !q || [f.properties.sample_id, f.properties.laboratory_sample_id, f.properties.area].some((v) => String(v).toLowerCase().includes(q)));
  }, [features, query]);
  return <section className="sample-records" id="sample-records" aria-labelledby="record-heading">
    <div className="records-heading"><div className="section-title"><h2 id="record-heading">Sample records</h2><span>{visible.length} of {features.length}</span></div><label className="sample-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search sample records by sample ID, laboratory ID or area</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a sample" /></label></div>
    <div className="records-scroll"><table><caption className="sr-only">Select a record to inspect its assays and provenance. Gold retests are shown separately.</caption><thead><tr><th scope="col">Sample</th><th scope="col">Area</th><th scope="col">Primary gold</th><th scope="col">Gold retest</th><th scope="col">Lithium</th><th scope="col"><span className="sr-only">Inspect</span></th></tr></thead><tbody>{visible.map((f) => <tr key={f.id} className={selectedId === f.id ? 'is-selected' : ''}><th scope="row"><button type="button" className="sample-open" onClick={() => onSelect(f)} aria-pressed={selectedId === f.id}>{f.properties.sample_id}</button></th><td><span className={`table-area area-${f.properties.area.toLowerCase()}`}>{f.properties.area}</span></td><td>{formatAssay(f.properties, 'gold_primary')}</td><td>{formatAssay(f.properties, 'gold_retest')}</td><td>{formatAssay(f.properties, 'lithium_secondary')}</td><td><button type="button" className="icon-button" onClick={() => onSelect(f)} aria-label={`Inspect sample ${f.properties.sample_id}`}><ChevronRight size={15} aria-hidden="true" /></button></td></tr>)}</tbody></table>{visible.length === 0 && <div className="no-records">No samples match “{query}”. Try another sample ID.</div>}</div>
  </section>;
}

function EvidenceFooter({ source }) {
  return <footer className="evidence-footer"><div><a href={source.publication_url} target="_blank" rel="noreferrer">Alaska DGGS · {source.version}<ExternalLink size={13} aria-hidden="true" /></a><p>Modified by selecting −200 mesh, splitting by longitude, normalizing fields and calculating descriptive summaries.</p></div><p>Sediment measurements do not establish deposits, ownership, land availability or parcel valuations. Median differences are not an investment ranking.</p></footer>;
}

export default function App() {
  const [evidence, setEvidence] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [area, setArea] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [frame, setFrame] = useState(0);
  const selectionOrigin = useRef(null);

  useEffect(() => {
    let active = true;
    setError(null);
    loadEvidence(BASE_URL).then((result) => { if (active) setEvidence(result); }).catch((cause) => { if (active) setError(cause.message || 'The evidence files could not be loaded.'); });
    return () => { active = false; };
  }, [attempt]);

  const features = useMemo(() => evidence ? getVisibleFeatures(evidence.features, area) : [], [evidence, area]);
  const bounds = useMemo(() => evidence ? boundsFor(evidence.config, area) : undefined, [evidence, area, frame]);
  const selected = evidence?.features.find((f) => f.id === selectedId) || null;

  function changeArea(nextArea) {
    setArea(nextArea);
    setFrame((value) => value + 1);
    if (selected && nextArea !== 'all' && selected.properties.area !== nextArea) setSelectedId(null);
  }

  function selectSample(feature) {
    selectionOrigin.current = document.activeElement;
    setSelectedId(feature.id);
  }

  function closeSample() {
    setSelectedId(null);
    requestAnimationFrame(() => {
      if (selectionOrigin.current?.isConnected) selectionOrigin.current.focus({ preventScroll: true });
    });
  }

  return <>
    <a className="skip-link" href="#main-content">Skip to evidence</a>
    <Header />
    <main id="main-content" className="page-shell">
      {!evidence && !error && <div className="load-state" role="status"><span className="loading-dot" /><h1>Loading Tok River evidence</h1><p>Preparing the sample locations and source records.</p></div>}
      {error && <div className="load-state error-state" role="alert"><AlertCircle size={28} aria-hidden="true" /><h1>Evidence could not be loaded</h1><p>{error}</p><button className="action-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry loading evidence</button></div>}
      {evidence && <>
        <section className="page-intro" aria-labelledby="page-heading"><div><h1 id="page-heading">Tok River<span className="title-descriptor">Gold evidence</span></h1><p><MapPin size={16} aria-hidden="true" /><span>Alaska, United States</span><span className="intro-divider" aria-hidden="true" /><span>Stream sediment · −200 mesh</span></p></div><div className="intro-actions"><div className="overview-count"><strong>{evidence.config.overview.sample_count}</strong><span>sample locations<br />2 comparison areas</span></div><a className="primary-link" href="#sample-records">View sample records<ArrowUpRight size={17} aria-hidden="true" /></a></div></section>
        <section className="evidence-layout" id="evidence" aria-label="Map and sampling areas">
          <div className="map-section"><div className="map-toolbar"><div className="map-toolbar-title"><Layers size={17} aria-hidden="true" /><h2>Sample locations</h2></div><div className="area-filters" role="group" aria-label="Filter and frame sampling area">{[{ key: 'all', label: 'All', count: evidence.config.overview.sample_count }, ...evidence.config.areas.map((a) => ({ key: a.area, label: a.area, count: a.sample_count }))].map((option) => <button type="button" key={option.key} aria-pressed={area === option.key} className={area === option.key ? 'is-active' : ''} onClick={() => changeArea(option.key)}>{option.label}<span>{option.count}</span></button>)}</div><button type="button" className="map-reset" onClick={() => setFrame((value) => value + 1)}><RotateCcw size={14} aria-hidden="true" /><span>Reset view</span></button></div>
            <MapView features={features} selectedId={selectedId} bounds={bounds} onSelect={selectSample} />
            <div className="map-caption"><span><span className="legend-dot area-a" />A · Tok west</span><span><span className="legend-dot area-b" />B · Tok east</span><span className="map-caption-note">Sample points, not deposit locations</span></div>
          </div>
          <div className="evidence-rail">{selected ? <SampleDrawer feature={selected} source={evidence.config.source} onClose={closeSample} /> : <><div className="rail-heading"><h2>Comparison areas</h2><p>Medians below. Scroll for full details.</p></div>{evidence.config.areas.map((site) => <SiteCard key={site.area} area={site} active={area === site.area} onFrame={() => changeArea(site.area)} />)}<p className="rail-note">Medians include quantified results only. Censored results and retests stay separate.</p></>}</div>
        </section>
        <Timeline timeline={evidence.config.timeline} />
        <Workstreams pending={evidence.config.pending} />
        <SampleRecords features={features} selectedId={selectedId} onSelect={selectSample} />
        <EvidenceFooter source={evidence.config.source} />
      </>}
    </main>
  </>;
}
