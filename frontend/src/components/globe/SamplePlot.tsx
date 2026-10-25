"use client";

import { useRef } from "react";
import { formatAssay } from "@/lib/evidence.js";
import type { Bounds, Sample } from "@/lib/types";

type Nearby = { features: Sample[]; anchorId: string };

const mercatorY = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));

/**
 * The no-WebGL fallback: every sample on a flat Mercator plot with a lon/lat
 * grid. Same markers, same 24 px "nearby" rule, same keyboard access as the map.
 */
export function SamplePlot({ features, bounds, selectedId, onSelect, onNearby }: {
  features: Sample[];
  bounds: Bounds;
  selectedId: string | null;
  onSelect: (feature: Sample) => void;
  onNearby: (nearby: Nearby) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [[west, south], [east, north]] = bounds;
  const left = (west * Math.PI) / 180;
  const right = (east * Math.PI) / 180;
  const bottom = mercatorY(south);
  const top = mercatorY(north);
  const scale = Math.min(880 / (right - left), 480 / (top - bottom));
  const offsetX = (1000 - (right - left) * scale) / 2;
  const offsetY = (600 - (top - bottom) * scale) / 2;
  const project = ([longitude, latitude]: [number, number]): [number, number] => [
    offsetX + ((longitude * Math.PI) / 180 - left) * scale,
    offsetY + (top - mercatorY(latitude)) * scale,
  ];

  function inspect(feature: Sample) {
    const position = project(feature.geometry.coordinates);
    const pixelScale = (svgRef.current?.getBoundingClientRect().width || 1000) / 1000;
    const neighbours = features.filter((candidate) => {
      const point = project(candidate.geometry.coordinates);
      return Math.hypot(point[0] - position[0], point[1] - position[1]) * pixelScale <= 24;
    });
    if (neighbours.length > 1) onNearby({ features: neighbours, anchorId: feature.id });
    else onSelect(feature);
  }

  return (
    <div className="sample-plot">
      <svg ref={svgRef} viewBox="0 0 1000 600" aria-label="Sample locations in a geographic plot">
        <title>Tok River sample locations. Basemap unavailable.</title>
        {[0, 1, 2, 3, 4].map((step) => {
          const longitude = west + ((east - west) * step) / 4;
          const x = project([longitude, north])[0];
          return (
            <g key={`longitude-${step}`} className="plot-grid">
              <line x1={x} x2={x} y1="40" y2="560" />
              <text x={x} y="588" textAnchor="middle">{longitude.toFixed(3)}°</text>
            </g>
          );
        })}
        {[0, 1, 2].map((step) => {
          const latitude = south + ((north - south) * step) / 2;
          const y = project([west, latitude])[1];
          return (
            <g key={`latitude-${step}`} className="plot-grid">
              <line x1="45" x2="955" y1={y} y2={y} />
              <text x="48" y={y - 8}>{latitude.toFixed(3)}° N</text>
            </g>
          );
        })}
        {features.map((feature) => {
          const [x, y] = project(feature.geometry.coordinates);
          const { sample_id: sampleId, area } = feature.properties;
          const selected = selectedId === feature.id;
          return (
            <g
              key={feature.id}
              role="button"
              tabIndex={0}
              className={`plot-point plot-point--${area.toLowerCase()}${selected ? " is-selected" : ""}`}
              transform={`translate(${x} ${y})`}
              aria-label={`Sample ${sampleId}, area ${area}, gold ${formatAssay(feature.properties, "gold_primary")}`}
              aria-pressed={selected}
              data-sample-id={sampleId}
              onClick={() => inspect(feature)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inspect(feature);
                }
              }}
            >
              <title>{sampleId}</title>
              <circle className="point-target" r="13" />
              {area === "A" ? <circle className="point-dot" r="5" /> : <rect className="point-dot" x="-5" y="-5" width="10" height="10" rx="1.5" />}
              {selected ? <circle className="point-ring" r="10" /> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
