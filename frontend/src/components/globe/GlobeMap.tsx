"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Eye, RotateCw, X } from "lucide-react";
import { formatAssay } from "@/lib/evidence.js";
import type { Bounds, Sample } from "@/lib/types";
import {
  TERRAIN_BEARING,
  TERRAIN_EXAGGERATION,
  TERRAIN_PITCH,
  TERRAIN_STYLE_URL,
  createTerrainStyle,
} from "./terrain-style";
import { SamplePlot } from "./SamplePlot";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globe.css";

export type Stage = "globe" | "tok";

/** Copied into public/ by scripts/copy-map-worker.mjs (MapLibre finds its worker by URL). */
const MAP_WORKER_URL = "/vendor/maplibre-gl-worker-6.15.0.mjs";
/** The globe turns once every ~90 s, westward, so Alaska swings into view early. */
const SPIN_DEG_PER_S = -4;
/** After someone drags the globe, wait this long before it turns again. */
const SPIN_RESUME_MS = 5_000;
/** Where the globe starts: over the Atlantic, ~20 s of turning before Tok faces you. */
const GLOBE_START: [number, number] = [-62, 38];

type Nearby = { features: Sample[]; anchorId: string };
type Hover = { feature: Sample; x: number; y: number };

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wide = () => window.matchMedia("(min-width: 1024px)").matches;

/** A globe about 62% of the shorter side of the frame. */
function globeZoom(el: HTMLElement) {
  const size = Math.max(280, Math.min(el.clientWidth, el.clientHeight));
  return Math.log2((0.62 * size * Math.PI) / 512);
}

/** Leave room for the floating toolbar and side panel on wide screens. */
function fitPadding() {
  return wide()
    ? { top: 150, bottom: 70, left: 60, right: 440 }
    : { top: 70, bottom: 50, left: 30, right: 30 };
}

function markerLabel(feature: Sample) {
  const p = feature.properties;
  return `Sample ${p.sample_id}, area ${p.area}, gold ${formatAssay(p, "gold_primary")}`;
}

/** How strongly a sample's gold glows: relative to its area's median, or above the lab's limit. */
function goldLevel(feature: Sample, medians: Record<string, number | null>) {
  const p = feature.properties;
  if (p.gold_primary_status === "above_detection") return "max";
  const median = medians[p.area];
  if (p.gold_primary_status !== "quantified" || typeof p.gold_primary_value_ppm !== "number" || median === null) return "low";
  if (p.gold_primary_value_ppm >= median * 2) return "high";
  return p.gold_primary_value_ppm >= median ? "mid" : "low";
}

export type GlobeMapProps = {
  stage: Stage;
  features: Sample[];
  bounds: Bounds;
  /** Changes to re-frame the current area (Reset view, area buttons). */
  frame: number;
  selectedId: string | null;
  medians: Record<string, number | null>;
  /** Other viewers looking at each sample key right now. */
  viewerFocus: Map<string, number>;
  /** Where the beacon sits on the globe: the middle of both areas. */
  beacon: [number, number];
  beaconLabel: string;
  onSelect: (feature: Sample) => void;
  onArrive: () => void;
};

export default function GlobeMap(props: GlobeMapProps) {
  const { stage, features, bounds, frame, selectedId, viewerFocus } = props;
  const frameRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{ id: string; marker: Marker; button: HTMLButtonElement }[]>([]);
  const beaconRef = useRef<Marker | null>(null);
  const nearbyHeading = useRef<HTMLHeadingElement>(null);
  const latest = useRef(props);
  const terrainOn = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "limited">("loading");
  const [fallback, setFallback] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [nearby, setNearby] = useState<Nearby | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    latest.current = props;
  });

  // Create the map once per attempt.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let spinPausedUntil = 0;
    let visible = true;
    let observer: IntersectionObserver | undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- each attempt starts from a clean slate
    setStatus("loading");
    setFallback(false);
    setReady(false);

    async function initialise() {
      try {
        const maplibre = await import("maplibre-gl");
        const response = await fetch(TERRAIN_STYLE_URL);
        if (!response.ok) throw new Error("The geographic map style could not be loaded.");
        const style = createTerrainStyle(await response.json());
        if (cancelled || !containerRef.current) return;
        maplibre.setWorkerUrl(MAP_WORKER_URL);
        const el = containerRef.current;
        const start = latest.current.stage;
        map = new maplibre.Map({
          container: el,
          style,
          center: GLOBE_START,
          zoom: globeZoom(el),
          attributionControl: false,
          pitchWithRotate: false,
          dragRotate: false,
          maxPitch: 70,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        });
        mapRef.current = map;
        if (start === "tok") map.fitBounds(latest.current.bounds, { padding: fitPadding(), pitch: TERRAIN_PITCH, bearing: TERRAIN_BEARING, duration: 0 });
        map.addControl(new maplibre.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-left");
        map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");
        map.getCanvas().setAttribute("aria-label", "Globe and terrain map of the Tok River sediment samples. Use the sample markers or the sample table below.");

        const beaconEl = document.createElement("div");
        beaconEl.className = "tok-beacon";
        beaconEl.setAttribute("aria-hidden", "true");
        beaconEl.innerHTML = `<span class="tok-beacon-ring"></span><span class="tok-beacon-ring tok-beacon-ring--late"></span><span class="tok-beacon-core"></span><span class="tok-beacon-label"></span>`;
        beaconEl.querySelector(".tok-beacon-label")!.textContent = latest.current.beaconLabel;
        beaconRef.current = new maplibre.Marker({ element: beaconEl }).setLngLat(latest.current.beacon).addTo(map);

        map.on("load", () => {
          if (cancelled) return;
          setStatus("ready");
          clearTimeout(timeout);
          if (latest.current.stage === "tok") enableTerrain();
        });
        map.on("error", () => { if (!cancelled) setStatus((s) => (s === "loading" ? "limited" : s)); });
        map.on("webglcontextlost", () => {
          if (!cancelled) {
            setFallback(true);
            setStatus("limited");
          }
        });
        map.on("movestart", () => {
          if (cancelled) return;
          setNearby(null);
          setHover(null);
        });
        // A person moving the globe pauses the spin for a while.
        const pause = (event: { originalEvent?: unknown }) => {
          if (event.originalEvent) spinPausedUntil = performance.now() + SPIN_RESUME_MS;
        };
        map.on("dragstart", pause);
        map.on("zoomstart", pause);
        map.on("rotatestart", pause);
        map.on("resize", () => {
          if (cancelled || !map) return;
          if (latest.current.stage === "tok") map.fitBounds(latest.current.bounds, { padding: fitPadding(), duration: 0 });
        });
        timeout = setTimeout(() => {
          if (!cancelled && map && !map.isStyleLoaded()) setStatus("limited");
        }, 12_000);

        // Only turn while the globe is on screen and the tab is visible.
        observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        observer.observe(el);
        let last = performance.now();
        const spin = (now: number) => {
          raf = requestAnimationFrame(spin);
          const dt = Math.min(now - last, 100) / 1000;
          last = now;
          if (!map || latest.current.stage !== "globe" || !visible || document.hidden || prefersReducedMotion()) return;
          if (now < spinPausedUntil || map.isMoving()) return;
          const center = map.getCenter();
          map.jumpTo({ center: [center.lng + SPIN_DEG_PER_S * dt, center.lat] });
        };
        raf = requestAnimationFrame(spin);
        setReady(true);
      } catch {
        if (!cancelled) {
          setFallback(true);
          setStatus("limited");
        }
      }
    }

    function enableTerrain() {
      if (!map || map.getTerrain()) return;
      map.setTerrain({ source: "tok-terrain", exaggeration: TERRAIN_EXAGGERATION });
    }
    // The stage effect turns terrain on once the camera reaches Tok.
    terrainOn.current = enableTerrain;

    initialise();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
      observer?.disconnect();
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      beaconRef.current?.remove();
      beaconRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [attempt]);

  // Fly between the globe and Tok.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || fallback || !map) return;
    const reduced = prefersReducedMotion();
    if (stage === "tok") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a new flight has not arrived yet
      setArrived(false);
      map.stop();
      map.fitBounds(latest.current.bounds, {
        padding: fitPadding(),
        pitch: TERRAIN_PITCH,
        bearing: TERRAIN_BEARING,
        duration: reduced ? 0 : 5_200,
        curve: 1.7,
        essential: true,
      });
      const land = () => {
        terrainOn.current();
        setArrived(true);
        latest.current.onArrive();
      };
      if (reduced) land();
      else map.once("moveend", land);
      return () => { map.off("moveend", land); };
    }
    setArrived(false);
    map.setTerrain(null);
    map.flyTo({
      center: [latest.current.beacon[0] + 40, 38],
      zoom: globeZoom(containerRef.current!),
      pitch: 0,
      bearing: 0,
      duration: reduced ? 0 : 3_200,
      essential: true,
    });
  }, [stage, ready, fallback]);

  // Re-frame on area change or Reset view, once at Tok.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || fallback || !map || stage !== "tok" || !arrived) return;
    map.fitBounds(bounds, { padding: fitPadding(), pitch: TERRAIN_PITCH, bearing: TERRAIN_BEARING, duration: prefersReducedMotion() ? 0 : 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bounds identity changes with `frame`
  }, [frame, ready, fallback]);

  useEffect(() => {
    beaconRef.current?.getElement().classList.toggle("is-hidden", stage === "tok");
  }, [stage, ready]);

  const paintMarkers = useEffectEvent(() => {
    const { selectedId: selected, viewerFocus: focus } = latest.current;
    markersRef.current.forEach(({ id, button }) => {
      button.classList.toggle("is-selected", id === selected);
      button.setAttribute("aria-pressed", String(id === selected));
      const viewers = focus.get(id) ?? 0;
      if (viewers > 0) button.dataset.viewers = String(viewers);
      else delete button.dataset.viewers;
    });
  });

  // Sample markers: accessible buttons, only once the camera is at Tok.
  useEffect(() => {
    if (!ready || fallback) return;
    const map = mapRef.current;
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];
    if (!map || stage !== "tok" || !arrived) return;
    setNearby(null);
    let cancelled = false;
    (async () => {
      const { Marker } = await import("maplibre-gl");
      const target = mapRef.current;
      if (cancelled || !target) return;
      markersRef.current = features.map((feature, index) => {
        const p = feature.properties;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `sample-marker sample-marker--${p.area.toLowerCase()}`;
        button.style.setProperty("--enter-delay", `${Math.min(index * 18, 900)}ms`);
        button.dataset.sampleId = p.sample_id;
        button.dataset.gold = goldLevel(feature, latest.current.medians);
        button.setAttribute("aria-label", markerLabel(feature));
        button.setAttribute("aria-pressed", String(feature.id === latest.current.selectedId));
        button.classList.toggle("is-selected", feature.id === latest.current.selectedId);
        button.innerHTML = '<span class="sample-marker-glow"></span><span class="sample-marker-viewers"></span><span class="sample-marker-dot"></span>';
        button.addEventListener("mouseenter", () => {
          const frameBox = frameRef.current?.getBoundingClientRect();
          const box = button.getBoundingClientRect();
          if (frameBox) setHover({ feature, x: box.left - frameBox.left + box.width / 2, y: box.top - frameBox.top });
        });
        button.addEventListener("mouseleave", () => setHover(null));
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          setHover(null);
          const m = mapRef.current!;
          const position = m.project(feature.geometry.coordinates);
          const neighbours = latest.current.features.filter((candidate) => {
            const point = m.project(candidate.geometry.coordinates);
            return Math.hypot(point.x - position.x, point.y - position.y) <= 24;
          });
          if (neighbours.length > 1) setNearby({ features: neighbours, anchorId: feature.id });
          else latest.current.onSelect(feature);
        });
        const marker = new Marker({ element: button }).setLngLat(feature.geometry.coordinates).addTo(target);
        return { id: feature.id, marker, button };
      });
      paintMarkers();
    })();
    return () => { cancelled = true; };
  }, [features, ready, fallback, stage, arrived]);

  useEffect(() => { paintMarkers(); }, [selectedId, viewerFocus]);

  useEffect(() => {
    if (nearby) nearbyHeading.current?.focus({ preventScroll: true });
  }, [nearby]);

  function focusFeature(id: string | undefined) {
    const marker = markersRef.current.find((entry) => entry.id === id);
    if (marker) marker.button.focus({ preventScroll: true });
    else {
      const feature = features.find((entry) => entry.id === id);
      [...(frameRef.current?.querySelectorAll<HTMLElement>("[data-sample-id]") ?? [])]
        .find((element) => element.dataset.sampleId === feature?.properties.sample_id)?.focus({ preventScroll: true });
    }
  }

  function closeNearby() {
    focusFeature(nearby?.anchorId);
    setNearby(null);
  }

  return (
    <div
      ref={frameRef}
      className="globe-frame"
      data-map-status={status}
      data-stage={stage}
      data-arrived={arrived}
      onKeyDown={(event) => {
        if (event.key === "Escape" && nearby) closeNearby();
      }}
    >
      <div className="globe-stars" aria-hidden="true" />
      <div ref={containerRef} className="globe-canvas" hidden={fallback} />
      {fallback ? (
        <SamplePlot features={features} bounds={bounds} selectedId={selectedId} onSelect={props.onSelect} onNearby={setNearby} />
      ) : null}

      {hover ? (
        <div className="marker-tip glass" style={{ left: hover.x, top: hover.y }} role="presentation">
          <strong>{hover.feature.properties.sample_id}</strong>
          <span>Gold {formatAssay(hover.feature.properties, "gold_primary")}</span>
          {(viewerFocus.get(hover.feature.id) ?? 0) > 0 ? (
            <span className="marker-tip-live"><Eye className="size-3" aria-hidden="true" />{viewerFocus.get(hover.feature.id)} viewing now</span>
          ) : null}
        </div>
      ) : null}

      {nearby ? (
        <div className="nearby-samples glass" role="dialog" aria-labelledby="nearby-title">
          <div className="nearby-heading">
            <h3 id="nearby-title" ref={nearbyHeading} tabIndex={-1}>Nearby samples</h3>
            <button type="button" onClick={closeNearby} aria-label="Close nearby samples"><X className="size-4" aria-hidden="true" /></button>
          </div>
          <p>These points overlap at this zoom. Choose one.</p>
          <ul>
            {nearby.features.map((feature) => (
              <li key={feature.id}>
                <button
                  type="button"
                  aria-label={`Inspect nearby sample ${feature.properties.sample_id}`}
                  onClick={() => {
                    focusFeature(feature.id);
                    setNearby(null);
                    props.onSelect(feature);
                  }}
                >
                  <span>{feature.properties.sample_id}</span>
                  <span>{formatAssay(feature.properties, "gold_primary")}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status !== "ready" ? (
        <div className="map-status glass" role="status">
          <span>
            {status === "loading"
              ? "Loading the globe…"
              : fallback
                ? "3D map unavailable. Sample locations are shown on a flat plot."
                : "The basemap is limited. Sample locations are still available."}
          </span>
          {status === "limited" ? (
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              <RotateCw className="size-3.5" aria-hidden="true" />Retry map
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
