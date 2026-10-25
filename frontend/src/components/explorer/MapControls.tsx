"use client";

import { Compass, Home, Minus, Plus, Rotate3d } from "lucide-react";
import type { MapControl } from "@/components/earth/Earth";

/** Zoom, back to the overview, tilt between 3D and straight down, and face north. */
export function MapControls({ controls }: { controls: React.RefObject<MapControl | null> }) {
  const call = (fn: (c: MapControl) => void) => () => { if (controls.current) fn(controls.current); };
  return (
    <div className="map-controls" role="toolbar" aria-label="Map">
      <button type="button" onClick={call((c) => c.zoom(2))} aria-label="Zoom in" title="Zoom in"><Plus className="size-4" /></button>
      <button type="button" onClick={call((c) => c.zoom(0.5))} aria-label="Zoom out" title="Zoom out"><Minus className="size-4" /></button>
      <span className="map-controls-sep" aria-hidden="true" />
      <button type="button" onClick={call((c) => c.tilt())} aria-label="Tilt between 3D and top-down" title="3D / top-down"><Rotate3d className="size-4" /></button>
      <button type="button" onClick={call((c) => c.north())} aria-label="Face north" title="Face north"><Compass className="size-4" /></button>
      <button type="button" onClick={call((c) => c.reset())} aria-label="Reset view" title="Reset view"><Home className="size-4" /></button>
    </div>
  );
}
