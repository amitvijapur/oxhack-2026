"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { loadEvidence } from "@/lib/evidence.js";
import { loadShowcase, plotReading, type ColorBy as ColorMode, type Showcase as Data } from "@/lib/showcase";
import type { Evidence } from "@/lib/types";
import { LivePill } from "./LivePill";
import { Timelapse, FIRST, LAST } from "./Timelapse";
import { Panel, type Tab } from "./Panel";
import { PlotSheet } from "./PlotSheet";
import { ColorBy } from "./ColorBy";
import { LandTab, orderPlots, type Sort } from "./tabs/LandTab";
import { GroundTab } from "./tabs/GroundTab";
import { MarketTab } from "./tabs/MarketTab";
import { DecisionTab } from "./tabs/DecisionTab";
import "./explorer.css";

const Earth = dynamic(() => import("@/components/earth/Earth").then((m) => m.Earth), { ssr: false });

export type Mode = "timelapse" | "explore";

export function Explorer() {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [earth, setEarth] = useState<"loading" | "ready" | "failed">("loading");

  const [mode, setMode] = useState<Mode>("timelapse");
  const [year, setYear] = useState(FIRST);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<Tab>("land");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [element, setElement] = useState("Au");
  const [qIndex, setQIndex] = useState(2);
  const [early, setEarly] = useState(true);
  const [bedrock, setBedrock] = useState(false);
  const [colorBy, setColorBy] = useState<ColorMode>("gold");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("gold");

  useEffect(() => {
    Promise.all([loadEvidence("/"), loadShowcase()])
      .then(([e, d]) => { setEvidence(e as Evidence); setData(d); setPlaying(true); })
      .catch((cause: Error) => setError(cause.message));
  }, []);

  const explore = useCallback((next: Tab = "land") => {
    setPlaying(false);
    setYear(LAST);
    setTab(next);
    setMode("explore");
  }, []);
  const back = useCallback(() => { setSelectedId(null); setMode("timelapse"); }, []);

  // Picking a plot on the map opens the explorer on it.
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id && mode === "timelapse") explore(id.startsWith("occ:") ? "ground" : "land");
  }, [mode, explore]);

  // The plots in list order, so the sheet's ‹ › and the arrow keys follow what the list shows.
  const ordered = useMemo(() => (data ? orderPlots(data.plots.plots, data.geochem, sort) : []), [data, sort]);
  const plot = data && selectedId?.startsWith("plot:") ? data.plots.plots.find((p) => `plot:${p.id}` === selectedId) ?? null : null;
  const index = plot ? ordered.indexOf(plot) : -1;
  const step = useCallback((by: number) => {
    if (!ordered.length) return;
    const next = ordered[((index < 0 ? -1 : index) + by + ordered.length) % ordered.length];
    setSelectedId(`plot:${next.id}`);
  }, [ordered, index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement).closest("input, textarea, select, [role=slider]");
      if (event.key === "Escape") {
        if (selectedId) setSelectedId(null);
        else if (mode === "explore") back();
      } else if (!typing && mode === "explore" && tab === "land" && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        step(event.key === "ArrowDown" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, tab, selectedId, back, step]);

  const siteOf = (sampleId: string) => evidence?.features.find((f) => f.properties.sample_id === sampleId)?.properties.area ?? null;

  return (
    <main className="explorer" data-mode={mode}>
      <Earth
        mode={mode}
        tab={tab}
        plots={data?.plots ?? null}
        claims={data?.claims ?? null}
        year={year}
        selectedId={selectedId}
        onSelect={select}
        onReady={setEarth}
        geochem={data?.geochem ?? null}
        element={element}
        occurrences={data?.occurrences ?? null}
        bedrock={bedrock}
        colorBy={colorBy}
        hoverId={hoverId}
        onHover={setHoverId}
        onElevation={setElevation}
      />
      <div className="scrim" aria-hidden="true" />

      <header className="bar">
        <button type="button" className="name" onClick={back}>
          Land Arbitrage: Gold <span>Tok River, Alaska</span>
        </button>
        <LivePill />
      </header>

      {error ? <p className="toast" role="alert">The data could not be loaded: {error}</p> : null}
      {earth === "failed" ? <p className="toast" role="status">Your browser could not start the 3D map, so the data shows without it.</p> : null}
      {!data && !error ? <p className="toast" role="status">Loading claims since 1975…</p> : null}

      {data ? (
        <AnimatePresence mode="wait">
          {mode === "timelapse" ? (
            <motion.div key="timelapse" className="layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Timelapse claims={data.claims} history={data.history} year={year} onYear={setYear} playing={playing} onPlaying={setPlaying} onExplore={() => explore()} />
            </motion.div>
          ) : (
            <motion.div key="explore" className="layer" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <Panel
                tab={tab}
                onTab={setTab}
                onClose={back}
                card={plot ? (
                  <PlotSheet
                    plot={plot}
                    index={index}
                    total={ordered.length}
                    geochem={data.geochem}
                    market={data.market}
                    decision={data.decision}
                    elevation={elevation}
                    onPrev={() => step(-1)}
                    onNext={() => step(1)}
                    onClose={() => setSelectedId(null)}
                    onElements={() => setTab("ground")}
                    onDecision={() => setTab("decision")}
                  />
                ) : null}
              >
                {tab === "land" && !plot ? (
                  <LandTab plots={data.plots} geochem={data.geochem} decision={data.decision} sort={sort} onSort={setSort}
                    hoverId={hoverId} onHover={setHoverId} onPick={setSelectedId} onDecision={() => setTab("decision")} />
                ) : null}
                {tab === "ground" ? (
                  <GroundTab
                    geochem={data.geochem}
                    geology={data.geology}
                    occurrences={data.occurrences}
                    element={element}
                    onElement={setElement}
                    sampleId={plot ? plotReading(plot, data.geochem, "Au")?.sample.id ?? null : null}
                    occurrenceId={selectedId?.startsWith("occ:") ? selectedId.slice(4) : null}
                    siteOf={siteOf}
                    bedrock={bedrock}
                    onBedrock={setBedrock}
                  />
                ) : null}
                {tab === "market" ? <MarketTab market={data.market} claims={data.claims} history={data.history} year={year} /> : null}
                {tab === "decision" ? (
                  <DecisionTab decision={data.decision} market={data.market} town={data.town}
                    qIndex={qIndex} onQIndex={setQIndex} early={early} onEarly={setEarly} />
                ) : null}
              </Panel>
              <ColorBy value={colorBy} onChange={setColorBy} />
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}
    </main>
  );
}
