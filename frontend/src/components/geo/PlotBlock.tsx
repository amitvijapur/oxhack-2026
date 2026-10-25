"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { X } from "lucide-react";
import { anomalyClass, formatAssayValue, type Geochem, type Geology, type Plot } from "@/lib/showcase";

const TERRARIUM = (z: number, x: number, y: number) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const ESRI = (z: number, x: number, y: number) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
const GRID = 72;
const ELEMENTS: { key: string; color: string }[] = [
  { key: "Au", color: "#fde047" }, { key: "As", color: "#f472b6" }, { key: "W", color: "#60a5fa" },
  { key: "Te", color: "#a78bfa" }, { key: "Bi", color: "#34d399" }, { key: "Cu", color: "#c4b5a0" }, { key: "Ag", color: "#e5e5e5" },
];

/** Web Mercator tile coordinates (fractional) for a lon/lat at zoom z. */
function tileXY(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return [((lon + 180) / 360) * n, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n] as const;
}

/** Stitch the tiles covering a box into one canvas, and say where the box sits on it. */
async function mosaic(url: (z: number, x: number, y: number) => string, z: number, box: [number, number, number, number]) {
  const [w, s, e, n] = box;
  const [x0f, y0f] = tileXY(w, n, z);
  const [x1f, y1f] = tileXY(e, s, z);
  const [x0, y0, x1, y1] = [Math.floor(x0f), Math.floor(y0f), Math.floor(x1f), Math.floor(y1f)];
  const canvas = document.createElement("canvas");
  canvas.width = (x1 - x0 + 1) * 256;
  canvas.height = (y1 - y0 + 1) * 256;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const jobs: Promise<void>[] = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    jobs.push(fetch(url(z, x, y)).then((r) => r.blob()).then(createImageBitmap).then((img) => ctx.drawImage(img, (x - x0) * 256, (y - y0) * 256, 256, 256)));
  }
  await Promise.all(jobs);
  return { canvas, ctx, crop: [(x0f - x0) * 256, (y0f - y0) * 256, (x1f - x0f) * 256, (y1f - y0f) * 256] as const };
}

/**
 * The plot in 3D: real terrain at true scale with satellite imagery, the boundary, and at each
 * sample point the elements the lab measured, ranked against all sampled sites.
 */
export function PlotBlock({ plot, geochem, geology, onClose }: { plot: Plot; geochem: Geochem; geology: Geology; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<Record<string, boolean>>(() => Object.fromEntries(ELEMENTS.map((e) => [e.key, true])));
  const shownRef = useRef(shown);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => { shownRef.current = shown; }, [shown]);

  const samples = useMemo(() => geochem.samples.filter((s) => plot.samples.includes(s.id)), [geochem, plot]);
  const unit = samples.map((s) => geology.units[s.id]).find(Boolean) ?? null;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no WebGL: show the text summary only
      setState("failed");
      return;
    }
    const width = el.clientWidth;
    const height = el.clientHeight;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(-1, 2, 1);
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 50);
    let yaw = 0.7;
    let pitch = 0.32;
    let distance = 4.6;
    const place = () => {
      camera.position.set(Math.sin(yaw) * distance * Math.cos(pitch), Math.sin(pitch) * distance, Math.cos(yaw) * distance * Math.cos(pitch));
      camera.lookAt(0, 0, 0);
    };
    place();

    // The area: the plot plus a margin, mapped to a 2×2 square (x east, z south).
    const ring = (plot.geometry.type === "Polygon" ? plot.geometry.coordinates[0] : plot.geometry.coordinates[0][0]);
    const lons = ring.map(([x]) => x);
    const lats = ring.map(([, y]) => y);
    const cos = Math.cos((plot.centre[1] * Math.PI) / 180);
    const half = Math.max((Math.max(...lons) - Math.min(...lons)) * cos, Math.max(...lats) - Math.min(...lats)) * 0.85;
    const box: [number, number, number, number] = [plot.centre[0] - half / cos, plot.centre[1] - half, plot.centre[0] + half / cos, plot.centre[1] + half];
    const toX = (lon: number) => ((lon - box[0]) / (box[2] - box[0])) * 2 - 1;
    const toZ = (lat: number) => 1 - ((lat - box[1]) / (box[3] - box[1])) * 2;
    const metresAcross = half * 2 * 111_000;
    const things: { dispose: () => void }[] = [];

    let frame = 0;
    (async () => {
      try {
        const [dem, photo] = await Promise.all([mosaic(TERRARIUM, 13, box), mosaic(ESRI, 16, box)]);
        if (disposed) return;
        // Heights from the Terrarium pixels across the box, at true scale.
        const [cx, cy, cw, ch] = dem.crop;
        const data = dem.ctx.getImageData(0, 0, dem.canvas.width, dem.canvas.height).data;
        const heights: number[] = [];
        for (let j = 0; j <= GRID; j++) for (let i = 0; i <= GRID; i++) {
          const px = Math.min(dem.canvas.width - 1, Math.round(cx + (i / GRID) * cw));
          const py = Math.min(dem.canvas.height - 1, Math.round(cy + (j / GRID) * ch));
          const k = (py * dem.canvas.width + px) * 4;
          heights.push(data[k] * 256 + data[k + 1] + data[k + 2] / 256 - 32768);
        }
        const low = Math.min(...heights);
        const scale = 2 / metresAcross;
        const top = (h: number) => (h - low) * scale;

        const surface = new THREE.PlaneGeometry(2, 2, GRID, GRID);
        surface.rotateX(-Math.PI / 2);
        const pos = surface.attributes.position;
        for (let k = 0; k < pos.count; k++) pos.setY(k, top(heights[k]));
        surface.computeVertexNormals();
        const tex = document.createElement("canvas");
        tex.width = 1024;
        tex.height = 1024;
        tex.getContext("2d")!.drawImage(photo.canvas, ...photo.crop, 0, 0, 1024, 1024);
        const photoTexture = new THREE.CanvasTexture(tex);
        photoTexture.colorSpace = THREE.SRGBColorSpace;
        const surfaceMat = new THREE.MeshStandardMaterial({ map: photoTexture, roughness: 1 });
        scene.add(new THREE.Mesh(surface, surfaceMat));
        things.push(surface, surfaceMat, photoTexture);

        // The parcel boundary, draped on the surface.
        const heightAt = (x: number, z: number) => {
          const i = Math.round(((x + 1) / 2) * GRID);
          const j = Math.round(((z + 1) / 2) * GRID);
          return pos.getY(Math.max(0, Math.min(GRID, j)) * (GRID + 1) + Math.max(0, Math.min(GRID, i)));
        };
        // Densify each side so the line follows the ground instead of cutting through it.
        const along: THREE.Vector3[] = [];
        ring.forEach(([lon, lat], k) => {
          const [nlon, nlat] = ring[(k + 1) % ring.length];
          for (let t = 0; t < 1; t += 1 / 48) {
            const x = toX(lon + (nlon - lon) * t);
            const z = toZ(lat + (nlat - lat) * t);
            along.push(new THREE.Vector3(x, heightAt(x, z) + 0.012, z));
          }
        });
        const boundary = new THREE.BufferGeometry().setFromPoints(along);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        scene.add(new THREE.LineLoop(boundary, lineMat));
        things.push(boundary, lineMat);

        // At each sample point, where the sediment was actually collected: a white pin, and above it
        // one bead per measured element, sized by how that value ranks across all sampled sites
        // (below median, above median, top 10%, top 2%). Nothing is drawn underground: there is no drilling data.
        const beads: { mesh: THREE.Mesh; el: string }[] = [];
        for (const s of samples) {
          const x = toX(s.lon);
          const z = toZ(s.lat);
          const ground = heightAt(x, z);
          const pinMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), pinMat);
          pin.position.set(x, ground + 0.02, z);
          scene.add(pin);
          things.push(pin.geometry, pinMat);
          const stemMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
          const stem = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, ground, z), new THREE.Vector3(x, ground + 0.08 + ELEMENTS.length * 0.07, z)]);
          scene.add(new THREE.Line(stem, stemMat));
          things.push(stem, stemMat);
          ELEMENTS.forEach(({ key, color }, k) => {
            const cls = anomalyClass(s.values[key] ?? null, geochem.thresholds[key]);
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, transparent: cls === 0, opacity: cls === 0 ? 0.35 : 1 });
            const bead = new THREE.Mesh(new THREE.SphereGeometry(0.012 + cls * 0.01, 16, 16), mat);
            bead.position.set(x, ground + 0.1 + k * 0.07, z);
            scene.add(bead);
            beads.push({ mesh: bead, el: key });
            things.push(bead.geometry, mat);
          });
        }

        // Drag to turn, scroll to zoom.
        let dragging = false;
        let last = { x: 0, y: 0 };
        renderer.domElement.addEventListener("pointerdown", (e) => { dragging = true; last = { x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture(e.pointerId); });
        renderer.domElement.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          yaw -= (e.clientX - last.x) * 0.008;
          pitch = Math.max(-0.2, Math.min(1.35, pitch + (e.clientY - last.y) * 0.006));
          last = { x: e.clientX, y: e.clientY };
          place();
        });
        renderer.domElement.addEventListener("pointerup", () => { dragging = false; });
        renderer.domElement.addEventListener("wheel", (e) => { e.preventDefault(); distance = Math.max(1.6, Math.min(7, distance * (1 + e.deltaY * 0.001))); place(); }, { passive: false });

        const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const tick = () => {
          if (!dragging && !still) { yaw += 0.0012; place(); }
          for (const b of beads) b.mesh.visible = shownRef.current[b.el];
          renderer.render(scene, camera);
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        setState("ready");
      } catch {
        if (!disposed) setState("failed");
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      things.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [plot, samples, unit, geochem]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="block-view" role="dialog" aria-modal="true" aria-label={`Terrain and samples at plot ${plot.label}`}>
      <div ref={host} className="block-canvas" />
      <header className="block-head">
        <div>
          <p className="block-kicker">Terrain and samples · plot {plot.label}</p>
          <h2>{plot.kind === "claim" ? plot.name : "Illustrative sample square"}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close below-ground view"><X className="size-5" /></button>
      </header>
      {state === "loading" ? <p className="block-status">Loading the real terrain and imagery…</p> : null}
      {state === "failed" ? <p className="block-status">The 3D view could not load here. The plot sheet has the same facts.</p> : null}
      <aside className="block-side">
        <p className="block-label">Mapped bedrock at the surface</p>
        <p className="block-unit"><i style={{ background: unit?.color ?? "#6b7280" }} />{unit ? `${unit.name} · ${unit.age}` : "Not mapped"}</p>
        <p className="block-label">Measured in this plot&apos;s stream sediment</p>
        <ul className="block-elements">
          {ELEMENTS.map(({ key, color }) => {
            const best = samples.map((s) => ({ v: s.values[key] ?? null, k: anomalyClass(s.values[key] ?? null, geochem.thresholds[key]) })).sort((a, b) => b.k - a.k)[0];
            return (
              <li key={key}>
                <label>
                  <input type="checkbox" checked={shown[key]} onChange={(e) => setShown({ ...shown, [key]: e.target.checked })} />
                  <i style={{ background: color }} />
                  <span className="tabular">{key}</span>
                  <span className="tabular">{best ? formatAssayValue(best.v, geochem.elements[key].unit) : "—"}</span>
                  <span className="block-class">{best ? ["low", "above median", "top 10%", "top 2%"][best.k] : ""}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="block-note">
          Real terrain at true scale with satellite imagery. Beads above each sample point: one per element, larger when its value ranks higher across all {geochem.samples.length} sampled sites. Surface stream-sediment samples only; there is no drilling data, so nothing is shown underground. Bedrock: USGS SIM 3340. Drag to turn, scroll to zoom.
        </p>
      </aside>
    </div>
  );
}
