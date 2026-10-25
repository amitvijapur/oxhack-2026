"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { loadEvidence } from "@/lib/evidence.js";
import { SITE_NAME, SITE_PLACE } from "@/lib/copy.js";
import { loadShowcase, plotStatus, stakedRange, type ColorBy as ColorMode, type Showcase as Data, type Plot } from "@/lib/showcase";
import type { Evidence } from "@/lib/types";
import type { MapControl } from "@/components/earth/Earth";
import { PlotPopover } from "./PlotPopover";
import { MapControls } from "./MapControls";
import { PipelineStory } from "./PipelineStory";
import { SafeBoundary } from "@/components/SafeBoundary";
import { LivePill, useGold } from "./LivePill";
import { Timelapse, LAST, RECENT } from "./Timelapse";
import stills from "./stills.json";
import { Panel, type Tab } from "./Panel";
import { PlotSheet } from "./PlotSheet";
import { ColorBy } from "./ColorBy";
import { LandTab, orderPlots, type Sort, type Filter } from "./tabs/LandTab";
import { DecideTab, type Site } from "./tabs/DecideTab";
import { CrowdTab } from "./tabs/CrowdTab";
import { visiblePlot, nextVisiblePlot } from "@/land-overview.mjs";
import "./explorer.css";

// Three.js loads only when someone opens a plot's 3D terrain view.
const PlotBlock = dynamic(() => import("@/components/geo/PlotBlock").then((m) => m.PlotBlock), { ssr: false });
const Earth = dynamic(() => import("@/components/earth/Earth").then((m) => m.Earth), { ssr: false });
// The calculation snapshot behind the Swarm tab is large, so it loads only when the tab opens.
const WorkflowTab = dynamic(() => import("./tabs/WorkflowTab").then((m) => m.WorkflowTab), { ssr: false });
// The plot card no longer shows elevation, so the map's terrain reading has nowhere to go.
const ignoreElevation = () => {};

/** The opening time-lapse (history, today, then the projection) or the explorer panel. */
export type Mode = "timelapse" | "explore";

/** `?snapshot=timelapse|explore`: the bare map at that view, for scripts/capture-map-snapshots.mjs. */
const snapshotMode = (): Mode | null => {
  const view = new URLSearchParams(window.location.search).get("snapshot");
  return view === "timelapse" || view === "explore" ? view : null;
};

const noSubscribe = () => () => {};
const onOrientation = (change: () => void) => {
  const query = matchMedia("(orientation: portrait)");
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

export function Explorer() {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [earth, setEarth] = useState<"loading" | "ready" | "failed">("loading");

  // Read after hydration (the server has no URL), so server and client render the same first.
  const snapshot = useSyncExternalStore(noSubscribe, snapshotMode, () => null);
  const [mode, setMode] = useState<Mode>("timelapse");
  const [year, setYear] = useState(RECENT);
  const [first, setFirst] = useState(RECENT);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<Tab>("decide");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomTo, setZoomTo] = useState<string | null>(null);
  const [story, setStory] = useState(false);
  const [below, setBelow] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const hoverChip = useRef<HTMLDivElement>(null);
  // Off by default: a still camera keeps every tile loaded, so the opening plays without re-blurring.
  const [followAction, setFollowAction] = useState(false);
  const controls = useRef<MapControl>(null);
  const [colorBy, setColorBy] = useState<ColorMode>("gold");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("gold");
  const [filter, setFilter] = useState<Filter>("all");
  const [site, setSite] = useState<Site>("A");
  const gold = useGold();
  const [snapshotGone, setSnapshotGone] = useState(false);
  // Capturing: the explore still as the panel opens; the time-lapse stills one per year, on request.
  useEffect(() => {
    if (!snapshot) return;
    const t = window.setTimeout(() => { if (snapshot === "explore") { setYear(LAST); setMode("explore"); } }, 0);
    const onYear = (event: Event) => setYear((event as CustomEvent<number>).detail);
    window.addEventListener("snapshot-year", onYear);
    return () => { window.clearTimeout(t); window.removeEventListener("snapshot-year", onYear); };
  }, [snapshot]);

  // Until the live map is ready, the opening plays over a still of 2016 with, for each later year,
  // a patch of the claims as of that year laid on top; a year shows once its patch has arrived.
  const portrait = useSyncExternalStore(onOrientation, () => matchMedia("(orientation: portrait)").matches, () => null);
  const [patches, setPatches] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    if (snapshot || portrait === null) return;
    const images = stills.years.slice(1).map((y) => {
      const image = new Image();
      image.onload = () => setPatches((have) => new Set(have).add(y));
      image.src = `/snapshots/timelapse-${y}${portrait ? "-mobile" : ""}.webp`;
      return image;
    });
    return () => images.forEach((image) => { image.onload = null; });
  }, [snapshot, portrait]);
  const patchYear = Math.max(0, ...[...patches].filter((y) => y <= Math.min(year, LAST)));
  // Once the live map has faded in over the still, drop the still.
  useEffect(() => {
    if (earth !== "ready") return;
    const t = window.setTimeout(() => setSnapshotGone(true), 1_000);
    return () => window.clearTimeout(t);
  }, [earth]);

  useEffect(() => {
    Promise.all([loadEvidence("/"), loadShowcase()])
      .then(([e, d]) => { setEvidence(e as Evidence); setData(d); })
      .catch((cause: Error) => setError(cause.message));
  }, []);

  // Start the time-lapse shortly after the live map fades in, or after a moment over the still if
  // the map is still loading: the page never sits frozen, and the map joins in, sharp, when ready.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !data || snapshot) return;
    const t = window.setTimeout(() => { started.current = true; setPlaying(true); }, earth === "loading" ? 2_500 : 900);
    return () => window.clearTimeout(t);
  }, [data, earth, snapshot]);

  const explore = useCallback((next: Tab = "decide", chosenId?: string) => {
    setPlaying(false);
    setYear(LAST);
    setTab(next);
    setMode("explore");
    if (next === "land" && data) {
      const available = orderPlots(data.plots.plots, data.geochem, sort, filter);
      const target = chosenId ?? `plot:${visiblePlot(available, selectedId)?.id ?? ""}`;
      if (target !== "plot:") setSelectedId(target);
    }
  }, [data, sort, filter, selectedId]);
  const close = useCallback(() => { setSelectedId(null); setZoomTo(null); }, []);
  const back = useCallback(() => { close(); setPlaying(false); setYear(LAST); setMode("timelapse"); }, [close]);

  // On the time-lapse a plot opens a popover on the map (and pauses); while exploring it opens the
  // plot card in the Land tab, the only tab that shows it, and flies into the parcel.
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (!id) { setZoomTo(null); return; }
    if (mode !== "explore") setPlaying(false);
    else if (id.startsWith("plot:")) {
      const picked = data?.plots.plots.find((p) => `plot:${p.id}` === id);
      if (filter === "held" && picked && plotStatus(picked) !== "held") setFilter("all");
      setZoomTo(id); setTab("land");
    }
  }, [mode, data, filter]);

  // The plots in list order, so the sheet's ‹ › and the arrow keys follow what the list shows.
  const ordered = useMemo(() => (data ? orderPlots(data.plots.plots, data.geochem, sort, filter) : []), [data, sort, filter]);
  const plot = data && selectedId?.startsWith("plot:") ? data.plots.plots.find((p) => `plot:${p.id}` === selectedId) ?? null : null;
  const landPlot = plot && ordered.includes(plot) ? plot : null;
  const index = landPlot ? ordered.indexOf(landPlot) : -1;
  const changeFilter = (next: Filter) => {
    setFilter(next);
    if (!data) return;
    const visible = orderPlots(data.plots.plots, data.geochem, sort, next);
    const retained = visiblePlot(visible, selectedId) as Plot | null;
    setSelectedId(retained ? `plot:${retained.id}` : null);
    setZoomTo(retained ? `plot:${retained.id}` : null);
  };
  // Any state claim on the map can be picked too ("claim:<index>"); some hold a sampled plot.
  const claim = data && selectedId?.startsWith("claim:") ? data.claims.features[Number(selectedId.slice(6))] ?? null : null;
  const claimPlot = claim && data ? data.plots.plots.find((p) => p.kind === "claim" && p.id === claim.properties.id) ?? null : null;
  const step = useCallback((by: number) => {
    const next = nextVisiblePlot(ordered, landPlot ? `plot:${landPlot.id}` : null, by);
    if (!next) return;
    setSelectedId(`plot:${next.id}`);
    setZoomTo(`plot:${next.id}`);
  }, [ordered, landPlot]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement).closest("input, textarea, select, [role=slider]");
      if (story || below || event.defaultPrevented) return; // the story and the block view handle their own keys
      if (event.key === "Escape") {
        if (selectedId || zoomTo) close();
        else if (mode === "explore") back();
      } else if (!typing && mode === "explore" && tab === "land" && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        step(event.key === "ArrowDown" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, tab, selectedId, zoomTo, back, close, step, story, below]);

  return (
    <main className="explorer" data-mode={mode} data-tab={tab} data-earth={earth} data-snapshot={snapshot ? "true" : undefined}>
      {/* A still of this view shows at once; the live map fades in over it when its tiles are in. */}
      {(earth !== "ready" || !snapshotGone) && portrait !== null ? (() => {
        const box = portrait ? stills.portrait : stills.landscape;
        const variant = portrait ? "-mobile" : "";
        const pct = (part: number, whole: number) => `${(part / whole) * 100}%`;
        return (
          <div className="map-snapshot">
            {/* eslint-disable @next/next/no-img-element -- pixel-exact stills: resizing would misalign the patches */}
            <div className="map-still" style={{ aspectRatio: `${box.width} / ${box.height}` }}>
              <img src={`/snapshots/${mode}${variant}.webp`} alt="" decoding="async" fetchPriority="high" />
              {mode === "timelapse" && patchYear ? (
                <img className="map-still-patch" src={`/snapshots/timelapse-${patchYear}${variant}.webp`} alt=""
                  style={{ left: pct(box.x, box.width), top: pct(box.y, box.height), width: pct(box.w, box.width) }} />
              ) : null}
            </div>
            {/* eslint-enable @next/next/no-img-element */}
          </div>
        );
      })() : null}
      <SafeBoundary fallback={<p className="toast" role="status">The 3D map stopped working; the data still works.</p>}>
        <Earth
          mode={mode === "explore" ? "explore" : "timelapse"}
          plots={data?.plots ?? null}
          claims={data?.claims ?? null}
          year={Math.min(year, LAST)}
          ahead={mode === "timelapse" ? Math.max(0, year - LAST) : 0}
          selectedId={selectedId}
          onSelect={select}
          onReady={setEarth}
          geochem={data?.geochem ?? null}
          element="Au"
          occurrences={data?.occurrences ?? null}
          bedrock={false}
          colorBy={colorBy}
          hoverId={hoverId}
          onHover={setHoverId}
          onElevation={ignoreElevation}
          zoomTo={zoomTo}
          anchor={anchor}
          controls={controls}
          hoverChip={hoverChip}
          follow={mode === "timelapse" && playing && followAction}
        />
      </SafeBoundary>
      <div className="scrim" aria-hidden="true" />

      <header className="bar">
        <button type="button" className="name" onClick={back}>
          {SITE_NAME} <span>{SITE_PLACE}</span>
        </button>
        <LivePill gold={gold} />
      </header>

      {error ? <p className="toast" role="alert">The data could not be loaded: {error}</p> : null}
      {earth === "failed" ? <p className="toast" role="status">Your browser could not start the 3D map, so the data shows without it.</p> : null}
      {!data && !error ? <p className="toast" role="status">Loading the land and the model…</p> : null}

      {data ? (
        <AnimatePresence mode="wait">
          {mode === "timelapse" ? (
            <motion.div key="timelapse" className="layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Timelapse claims={data.claims} history={data.history} year={year} onYear={setYear} playing={playing} onPlaying={setPlaying} onExplore={() => explore()} onStory={() => { setPlaying(false); setStory(true); }}
                first={first} onFirst={setFirst} onNow={back} live={gold?.usd_per_oz ?? null}
                follow={followAction} onFollow={setFollowAction} />
            </motion.div>
          ) : (
            <motion.div key="explore" className="layer" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <Panel
                tab={tab}
                onTab={(next) => {
                  setTab(next);
                  if (next === "land" && !landPlot) {
                    const target = visiblePlot(ordered, selectedId) as Plot | null;
                    if (target) setSelectedId(`plot:${target.id}`);
                  }
                }}
                onClose={back}

              >
                {tab === "decide" ? (
                  <DecideTab features={evidence?.features ?? []} gold={gold} plots={data.plots} geochem={data.geochem}
                    site={site} onSite={setSite} plot={plot} />
                ) : null}
                {tab === "land" ? (
                  <LandTab plots={data.plots} geochem={data.geochem} rows={ordered} selected={landPlot}
                    sort={sort} onSort={setSort} filter={filter} onFilter={changeFilter}
                    hoverId={hoverId} onHover={setHoverId} onPick={select}>
                    {landPlot ? <PlotSheet
                      plot={landPlot} index={index} total={ordered.length} geochem={data.geochem} market={data.market}
                      onPrev={() => step(-1)} onNext={() => step(1)}
                      onZoom={() => { setSelectedId(`plot:${landPlot.id}`); setZoomTo(`plot:${landPlot.id}`); setPlaying(false); setMode("timelapse"); }}
                      onBelow={() => { setSelectedId(`plot:${landPlot.id}`); setBelow(true); }}
                      onDecide={() => { setSelectedId(`plot:${landPlot.id}`); setSite(landPlot.site); setTab("decide"); }}
                    /> : <p className="land-empty-detail">Select a sampled area to inspect its evidence.</p>}
                  </LandTab>
                ) : null}
                {tab === "crowd" ? <CrowdTab crowd={data.crowd} /> : null}
                {tab === "swarm" ? <WorkflowTab /> : null}
              </Panel>
              <ColorBy value={colorBy} onChange={setColorBy} range={stakedRange(data.claims)} />
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}

      {data ? (
        <>
          <MapControls controls={controls} />
          <div ref={hoverChip} className="hover-chip" data-visible="false" aria-hidden="true" />
          {below && plot ? (
            <SafeBoundary fallback={null}>
              <PlotBlock plot={plot} geochem={data.geochem} geology={data.geology} onClose={() => setBelow(false)} />
            </SafeBoundary>
          ) : null}
          {story ? <PipelineStory data={data} features={evidence?.features ?? []} onClose={() => setStory(false)} onOpen={(next) => { setStory(false); explore(next); }} /> : null}
          {/* The popover lives outside the animated layers: the map moves it each frame. */}
          <PlotPopover
            ref={anchor}
            plot={mode !== "explore" ? plot : null}
            claim={claim}
            linkedPlot={claimPlot}
            geochem={data.geochem}
            onZoom={() => setZoomTo(selectedId)}
            onDetails={() => {
              // A claim with a sample inside opens that plot's sheet; a sampled plot opens its own.
              const target = claimPlot ?? plot;
              if (!target) return;
              setSelectedId(`plot:${target.id}`);
              if (filter === "held" && plotStatus(target) !== "held") setFilter("all");
              setZoomTo(`plot:${target.id}`);
              explore("land", `plot:${target.id}`);
            }}
            onClose={close}
          />
        </>
      ) : null}
    </main>
  );
}
