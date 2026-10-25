"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AlertCircle } from "lucide-react";
import { boundsFor, getVisibleFeatures, loadEvidence } from "@/lib/evidence.js";
import { LIVE, LiveBoundary, PresenceBridge, WorkstreamsBridge, type Presence, type Workstreams } from "@/lib/live";
import type { Bounds, Evidence, Sample } from "@/lib/types";
import { Button } from "@/components/ui/button";
import type { Stage } from "@/components/globe/GlobeMap";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { MapSection, type AreaFilter } from "./MapSection";
import { Timeline } from "./Timeline";
import { HowItWorks } from "./HowItWorks";
import { SampleTable } from "./SampleTable";
import { SampleSearch } from "./SampleSearch";
import { Footer } from "./Footer";
import type { Live } from "./live-types";

const NO_LIVE: Live = Object.freeze({ land: null, swarm: null, decision: null });
const NOBODY: Presence = { count: 0, more: false, focus: new Map(), me: null };

/** Latest published run per workstream, or null for each when offline or unpublished. */
function latestByKey(streams: Workstreams | null): Live {
  if (!streams) return NO_LIVE;
  const find = (key: string) => streams.find((stream) => stream.key === key)?.latest ?? null;
  return { land: find("land"), swarm: find("swarm"), decision: find("decision") };
}

function Page({ evidence, live, presence, onFocus }: {
  evidence: Evidence;
  live: Live;
  presence: Presence;
  onFocus: (sampleKey: string | null) => void;
}) {
  const [area, setArea] = useState<AreaFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const [stage, setStage] = useState<Stage>("globe");
  const selectionOrigin = useRef<HTMLElement | null>(null);

  const features = useMemo(() => getVisibleFeatures(evidence.features, area) as Sample[], [evidence, area]);
  // `frame` re-creates the bounds so Reset view and area buttons re-fit the map.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- frame is the re-fit signal
  const bounds = useMemo(() => boundsFor(evidence.config, area) as Bounds, [evidence, area, frame]);
  const byId = useMemo(() => new Map(evidence.features.map((feature) => [feature.id, feature])), [evidence]);
  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  useEffect(() => onFocus(selectedId), [selectedId, onFocus]);

  function changeArea(next: AreaFilter) {
    setArea(next);
    setStage("tok");
    setFrame((value) => value + 1);
    if (selected && next !== "all" && selected.properties.area !== next) setSelectedId(null);
  }

  function selectSample(feature: Sample) {
    selectionOrigin.current = document.activeElement as HTMLElement | null;
    setSelectedId(feature.id);
  }

  function selectAndShow(feature: Sample) {
    if (area !== "all" && feature.properties.area !== area) setArea("all");
    selectSample(feature);
    setStage("tok");
    document.getElementById("map")?.scrollIntoView({ block: "start" });
  }

  function closeSample() {
    // Commit first so the drawer is gone, then hand focus straight back.
    flushSync(() => setSelectedId(null));
    if (selectionOrigin.current?.isConnected) selectionOrigin.current.focus({ preventScroll: true });
  }

  const sampleCount = evidence.config.overview.sample_count;
  return (
    <>
      <Hero live={live} sampleCount={sampleCount} onExplore={() => setStage("tok")} />
      <MapSection
        evidence={evidence}
        features={features}
        bounds={bounds}
        frame={frame}
        area={area}
        stage={stage}
        selected={selected}
        land={live.land}
        presence={presence}
        onStage={setStage}
        onArea={changeArea}
        onReset={() => { setStage("tok"); setFrame((value) => value + 1); }}
        onSelect={selectSample}
        onClose={closeSample}
      />
      <Timeline timeline={evidence.config.timeline} live={live} />
      <HowItWorks live={live} pending={evidence.config.pending} sampleCount={sampleCount} />
      <SampleTable features={features} total={sampleCount} selectedId={selectedId} onSelect={selectAndShow} />
      <Footer source={evidence.config.source} />
      <SampleSearch features={evidence.features} onSelect={selectAndShow} />
    </>
  );
}

export function TokApp() {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [streams, setStreams] = useState<Workstreams | null>(null);
  const [presence, setPresence] = useState<Presence>(NOBODY);
  const [connected, setConnected] = useState(true);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before each (re)load attempt
    setError(null);
    loadEvidence("/")
      .then((result) => { if (active) setEvidence(result as Evidence); })
      .catch((cause: Error) => { if (active) setError(cause.message || "The evidence files could not be loaded."); });
    return () => { active = false; };
  }, [attempt]);

  const live = useMemo(() => latestByKey(streams), [streams]);
  const dropLive = useCallback(() => setConnected(false), []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {LIVE ? (
        <LiveBoundary onError={dropLive}>
          <WorkstreamsBridge onChange={setStreams} />
          <PresenceBridge focus={focus} onChange={setPresence} />
        </LiveBoundary>
      ) : null}
      <Header live={LIVE && connected} presence={presence} />
      <main id="main-content">
        {!evidence && !error ? (
          <div className="load-state" role="status">
            <span className="size-2.5 animate-live-dot rounded-full bg-gold" aria-hidden="true" />
            <h1 className="font-display text-2xl">Loading the Tok River data</h1>
            <p className="text-muted-foreground">Preparing the sample map and results.</p>
          </div>
        ) : null}
        {error ? (
          <div className="load-state" role="alert">
            <AlertCircle className="size-7 text-destructive" aria-hidden="true" />
            <h1 className="font-display text-2xl">Evidence could not be loaded</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry loading evidence</Button>
          </div>
        ) : null}
        {evidence ? <Page evidence={evidence} live={live} presence={presence} onFocus={setFocus} /> : null}
      </main>
    </>
  );
}
