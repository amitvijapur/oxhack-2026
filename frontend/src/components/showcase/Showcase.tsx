"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { loadEvidence } from "@/lib/evidence.js";
import { loadShowcase, type Showcase as Data } from "@/lib/showcase";
import type { Evidence } from "@/lib/types";
import type { Screen } from "@/components/earth/Earth";
import { Ticker } from "./Ticker";
import { Stepper } from "./Stepper";
import { Arrival } from "./Arrival";
import { Ground } from "./Ground";
import { Land } from "./Land";
import { Town } from "./Town";
import { Decision } from "./Decision";
import "./showcase.css";

const Earth = dynamic(() => import("@/components/earth/Earth").then((m) => m.Earth), { ssr: false });

/** Seconds each screen stays up in the tour; screens with an action run it themselves. */
const TOUR_SECONDS: Record<Screen, number> = { 0: 5, 1: 9, 2: 14, 3: 16, 4: 18 };
export const LAST: Screen = 4;

export function Showcase() {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>(0);
  const [tour, setTour] = useState(false);
  const [year, setYear] = useState(2026);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [earth, setEarth] = useState<"loading" | "ready" | "failed">("loading");
  const [deep, setDeep] = useState(false);
  const [element, setElement] = useState("Au");
  const closeDeep = useCallback(() => setDeep(false), []);
  const depth = { open: deep, onOpen: () => { setTour(false); setDeep(true); }, onClose: closeDeep };

  useEffect(() => {
    Promise.all([loadEvidence("/"), loadShowcase()])
      .then(([e, d]) => { setEvidence(e as Evidence); setData(d); })
      .catch((cause: Error) => setError(cause.message));
  }, []);

  const go = useCallback((next: number, fromTour = false) => {
    const clamped = Math.max(0, Math.min(LAST, next)) as Screen;
    if (!fromTour) setTour(false);
    setSelectedId(null);
    setDeep(false);
    setScreen(clamped);
  }, []);

  // Arrow keys move between screens, unless a slider or input has focus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, [role=slider], [role=switch], [role=radio]")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") go(screen + 1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") go(screen - 1);
      if (event.key === "Escape") setTour(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, go]);

  useEffect(() => {
    if (!tour) return;
    const timer = window.setTimeout(() => {
      if (screen === LAST) setTour(false);
      else go(screen + 1, true);
    }, TOUR_SECONDS[screen] * 1000);
    return () => window.clearTimeout(timer);
  }, [tour, screen, go]);

  const samples = useMemo(() => evidence?.features ?? [], [evidence]);
  const startTour = () => { setTour(true); setScreen(1); };

  return (
    <main className="showcase" data-deep={deep || undefined}>
      <Earth
        screen={screen}
        samples={samples}
        claims={data?.claims ?? null}
        year={year}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onReady={setEarth}
        geochem={data?.geochem ?? null}
        element={element}
        occurrences={data?.occurrences ?? null}
        deep={deep}
      />
      <div className="showcase-scrim" data-screen={screen} aria-hidden="true" />

      <header className="showcase-top">
        <button type="button" className="wordmark" onClick={() => go(0)}>
          <span className="wordmark-dot" aria-hidden="true" />
          {/* The project has no name yet (PRODUCT.md), so the place stands in for one. */}
          Tok River
          <span className="wordmark-sub">OXHack 2026 · Time</span>
        </button>
        <Ticker />
      </header>

      {screen > 0 && !deep ? <Stepper screen={screen} onGo={go} tour={tour} onStopTour={() => setTour(false)} /> : null}

      {error ? <p className="showcase-error" role="alert">The data could not be loaded: {error}</p> : null}
      {earth === "failed" ? (
        <p className="showcase-error" role="status">Your browser could not start the 3D map, so the screens show without it.</p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="screen-layer"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: screen === 0 ? 0 : 0.35 }}
        >
          {screen === 0 ? <Arrival ready={!!data && !!evidence} onGo={() => go(1)} onTour={startTour} /> : null}
          {screen === 1 && evidence && data ? (
            <Ground
              evidence={evidence}
              geochem={data.geochem}
              geology={data.geology}
              occurrences={data.occurrences}
              element={element}
              onElement={setElement}
              deep={depth}
              selectedId={selectedId}
              onPick={setSelectedId}
              onClear={() => setSelectedId(null)}
              onNext={() => go(2)}
            />
          ) : null}
          {screen === 2 && data ? (
            <Land claims={data.claims} history={data.history} market={data.market} deep={depth} year={year} onYear={setYear} tour={tour} onNext={() => go(3)} />
          ) : null}
          {screen === 3 && data ? <Town town={data.town} tour={tour} onNext={() => go(4)} /> : null}
          {screen === 4 && data ? <Decision decision={data.decision} market={data.market} deep={depth} tour={tour} onRestart={() => go(0)} /> : null}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
