import { km, type Plot } from "@/lib/showcase";

/** The plot's real outline as a small drawing, north up, with the length of each side. */
export function ParcelShape({ plot, size = 120 }: { plot: Plot; size?: number }) {
  const ring = (plot.geometry.type === "Polygon" ? plot.geometry.coordinates[0] : plot.geometry.coordinates[0][0]).slice();
  if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop();
  // Local metres: longitude shrinks with latitude, so scale x by cos(latitude).
  const cos = Math.cos((plot.centre[1] * Math.PI) / 180);
  const pts = ring.map(([lon, lat]) => [lon * cos, lat] as const);
  const xs = pts.map(([x]) => x);
  const ys = pts.map(([, y]) => y);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const pad = 22;
  const s = (size - pad * 2) / span;
  const px = (x: number) => pad + (x - Math.min(...xs)) * s;
  const py = (y: number) => size - pad - (y - Math.min(...ys)) * s;
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("") + "Z";
  return (
    <svg className="parcel-shape" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Outline of plot ${plot.label}`}>
      <path d={path} className={plot.kind === "open" ? "parcel-path is-open" : "parcel-path"} />
      {ring.map(([lon, lat], i) => {
        const [nlon, nlat] = ring[(i + 1) % ring.length];
        const metres = km(lon, lat, nlon, nlat) * 1000;
        if (metres < 120) return null;
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        return (
          <text key={i} x={px((x1 + x2) / 2)} y={py((y1 + y2) / 2)} className="parcel-edge" textAnchor="middle" dominantBaseline="middle">
            {Math.round(metres)} m
          </text>
        );
      })}
      <text x={size - 8} y={12} className="parcel-north" textAnchor="end">N ↑</text>
    </svg>
  );
}
