import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { WithWorkstreams } from './backend/LiveData.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import MapSection from './components/MapSection.jsx';
import SampleTable from './components/SampleTable.jsx';
import Timeline from './components/Timeline.jsx';
import { boundsFor, getVisibleFeatures, loadEvidence } from './evidence.js';

const BASE_URL = import.meta.env.BASE_URL;
const NO_LIVE = Object.freeze({ land: null, swarm: null, decision: null });

/** Latest published run per workstream, or null for each when offline or unpublished. */
function latestByKey(streams) {
  if (!streams) return NO_LIVE;
  return Object.fromEntries(Object.keys(NO_LIVE).map((key) => [key, streams.find((s) => s.key === key)?.latest ?? null]));
}

function Page({ evidence, live }) {
  const [area, setArea] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [frame, setFrame] = useState(0);
  const selectionOrigin = useRef(null);

  const features = useMemo(() => getVisibleFeatures(evidence.features, area), [evidence, area]);
  // `frame` re-creates the bounds so Reset view and area buttons re-fit the map.
  const bounds = useMemo(() => boundsFor(evidence.config, area), [evidence, area, frame]);
  const byId = useMemo(() => new Map(evidence.features.map((f) => [f.id, f])), [evidence]);
  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  function changeArea(nextArea) {
    setArea(nextArea);
    setFrame((value) => value + 1);
    if (selected && nextArea !== 'all' && selected.properties.area !== nextArea) setSelectedId(null);
  }

  function selectSample(feature) {
    selectionOrigin.current = document.activeElement;
    setSelectedId(feature.id);
  }

  function selectFromTable(feature) {
    selectSample(feature);
    document.getElementById('map')?.scrollIntoView({ block: 'start' });
  }

  function closeSample() {
    setSelectedId(null);
    requestAnimationFrame(() => {
      if (selectionOrigin.current?.isConnected) selectionOrigin.current.focus({ preventScroll: true });
    });
  }

  const sampleCount = evidence.config.overview.sample_count;
  return <>
    <Hero live={live} sampleCount={sampleCount} />
    <MapSection evidence={evidence} features={features} bounds={bounds} area={area} selected={selected} land={live.land}
      onArea={changeArea} onReset={() => setFrame((value) => value + 1)} onSelect={selectSample} onClose={closeSample} />
    <Timeline timeline={evidence.config.timeline} live={live} />
    <HowItWorks live={live} pending={evidence.config.pending} sampleCount={sampleCount} />
    <SampleTable features={features} total={sampleCount} selectedId={selectedId} onSelect={selectFromTable} />
    <Footer source={evidence.config.source} />
  </>;
}

export default function App() {
  const [evidence, setEvidence] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    loadEvidence(BASE_URL).then((result) => { if (active) setEvidence(result); }).catch((cause) => { if (active) setError(cause.message || 'The evidence files could not be loaded.'); });
    return () => { active = false; };
  }, [attempt]);

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Header />
    <main id="main-content" className="page">
      {!evidence && !error ? <div className="load-state" role="status"><span className="loading-dot" /><h1>Loading the Tok River data</h1><p>Preparing the sample map and results.</p></div> : null}
      {error ? <div className="load-state error-state" role="alert"><AlertCircle size={28} aria-hidden="true" /><h1>Evidence could not be loaded</h1><p>{error}</p><button className="button" type="button" onClick={() => setAttempt((value) => value + 1)}>Retry loading evidence</button></div> : null}
      {evidence ? <WithWorkstreams>{(streams) => <Page evidence={evidence} live={latestByKey(streams)} />}</WithWorkstreams> : null}
    </main>
  </>;
}
