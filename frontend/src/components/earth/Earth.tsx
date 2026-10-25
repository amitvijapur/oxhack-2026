"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type * as CesiumNS from "@cesium/engine";
import type { Claims, ColorBy, Geochem, Occurrences, Plot, Plots } from "@/lib/showcase";
import { assayLevel, claimState, formatAssayValue, km, plotReading, stakedRange } from "@/lib/showcase";
import { terrariumTerrain } from "./terrarium";
import "./earth.css";

/** Copied into public/ by scripts/copy-cesium-assets.mjs; Cesium loads workers and assets from here. */
const CESIUM_BASE_URL = "/vendor/cesium-1.146.0/";
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ESRI_IMAGERY = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const GEOLOGY_TILES = "https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png";

export type Mode = "timelapse" | "explore";
type View = [number, number, number, number, number];

/** Camera per mode: lon, lat, height (m), heading and pitch (degrees). Both frame the claims box
 *  (about 144.05–143.05 W, 63.0–63.28 N); explore shifts it left of the 440 px side panel. */
const VIEWS: Record<Mode, View> = {
  timelapse: [-143.55, 62.74, 46_000, 0, -45],
  explore: [-143.4, 62.88, 40_000, 0, -58],
};
const GREEN = "#22c55e";
const RED = "#ef4444";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Plot fill by anomaly class (below median, above median, top 10%, top 2%) of the chosen element.
 *  Soft, so the real ground shows through; yellow is used only where gold is measured. */
const CLASS_FILL: [string, number][] = [["#ffffff", 0.1], ["#facc15", 0.3], ["#facc15", 0.5], ["#fde047", 0.7]];

/** Grey (first staked) to green (latest staked) by the year a claim was staked. */
function stakedColor(year: number | null | undefined, [first, last]: [number, number]): [string, number] {
  if (!year) return ["#ffffff", 0];
  const t = Math.max(0, Math.min(1, (year - first) / Math.max(1, last - first)));
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return [`rgb(${mix(115, 34)}, ${mix(115, 197)}, ${mix(115, 94)})`, 0.3 + 0.45 * t];
}

/** Sample glows by anomaly class: radius on the ground (m) and colour, cool white to bright gold. */
const GLOW_RADIUS = [220, 320, 470, 650];
const GLOW_COLOR: [string, number][] = [["#e5e7eb", 0.6], ["#facc15", 0.85], ["#fbbf24", 1], ["#fde047", 1]];
/** The dot on each chip, by the same classes. */
const CHIP_DOT = ["#a3a3a3", "#facc15", "#fbbf24", "#fde047"];

/** A white radial falloff, tinted per sample by its material colour. Drawn once. */
let glow: string | null = null;
function glowImage() {
  if (glow) return glow;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.85)");
  g.addColorStop(0.5, "rgba(255,255,255,0.3)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glow = canvas.toDataURL();
  return glow;
}

/** A rounded label chip with a coloured dot, drawn at 2× and shown at half scale for crisp text. */
function chipImage(text: string, dot: string, focus: boolean) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = "600 22px 'DM Sans', system-ui, sans-serif";
  ctx.font = font;
  const [h, pad, dotR] = [40, 16, 7];
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2 + dotR * 2 + 10;
  canvas.width = w + 4;
  canvas.height = h + 4;
  ctx.font = font;
  ctx.beginPath();
  ctx.roundRect(2, 2, w, h, h / 2);
  ctx.fillStyle = focus ? "#ffffff" : "rgba(10,10,10,0.78)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = focus ? "#ffffff" : "rgba(255,255,255,0.22)";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(2 + pad + dotR, 2 + h / 2, dotR, 0, Math.PI * 2);
  ctx.fillStyle = dot;
  ctx.fill();
  ctx.fillStyle = focus ? "#0a0a0a" : "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 2 + pad + dotR * 2 + 10, 2 + h / 2 + 1);
  return canvas.toDataURL();
}

type Ring = [number, number][];
/** Outer rings without the repeated closing point: a zero-length last segment breaks Cesium's ground polylines. */
const ringsOf = (geometry: Plot["geometry"]): Ring[] =>
  (geometry.type === "Polygon" ? [geometry.coordinates[0]] : geometry.coordinates.map((poly) => poly[0])).map((ring) => {
    const [first, last] = [ring[0], ring[ring.length - 1]];
    return first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
  });

/** A piece of land on the map: a sampled plot ("plot:<id>") or any state claim ("claim:<index>"). */
type Parcel = { ring: Ring; centre: [number, number]; title: string; open?: boolean };
function parcelOf(id: string | null, plots: Plots | null, claims: Claims | null): Parcel | null {
  if (!id) return null;
  if (id.startsWith("plot:") && plots) {
    const plot = plots.plots.find((p) => `plot:${p.id}` === id);
    if (!plot) return null;
    return { ring: ringsOf(plot.geometry)[0], centre: plot.centre, title: `${plot.label}  ${plot.kind === "claim" ? plot.name : "Stream sample, no state claim"}`, open: plot.kind === "open" };
  }
  if (id.startsWith("claim:") && claims) {
    const feature = claims.features[Number(id.slice(6))];
    if (!feature) return null;
    const ring = ringsOf(feature.geometry)[0];
    const centre: [number, number] = [ring.reduce((a, [x]) => a + x, 0) / ring.length, ring.reduce((a, [, y]) => a + y, 0) / ring.length];
    return { ring, centre, title: feature.properties.name };
  }
  return null;
}

/** A small diamond marker for known mines and prospects. */
const diamond = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M9 1 17 9 9 17 1 9Z" fill="${fill}" stroke="#0a0a0a" stroke-width="2"/></svg>`)}`;

/** Imperative map controls for the buttons on the map. */
export type MapControl = { zoom: (factor: number) => void; reset: () => void; tilt: () => void; north: () => void };

export type EarthProps = {
  mode: Mode;
  plots: Plots | null;
  claims: Claims | null;
  year: number;
  /** Years into the projection (0 up to today): the sample glows warm with the projected gold price. */
  ahead: number;
  /** "plot:<id>" or "occ:<ARDF number>" chosen on the map or in the list. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** The land to fly into for a close, real-ground parcel view: "plot:<id>" or "claim:<index>". */
  zoomTo: string | null;
  onReady: (state: "ready" | "failed") => void;
  geochem: Geochem | null;
  /** The element the plots are coloured by (chosen in the ground tab). */
  element: string;
  occurrences: Occurrences | null;
  /** Bedrock geology and known mines: on by default. */
  bedrock: boolean;
  colorBy: ColorBy;
  /** The plot under the pointer, on the map or in the list (plot id, no prefix). */
  hoverId: string | null;
  onHover: (id: string | null) => void;
  /** Approximate ground height at the selected plot, from the same terrain tiles. */
  onElevation: (metres: number | null) => void;
  /** An element kept on top of the selected plot (the map popover); moved directly, without re-rendering. */
  anchor: React.RefObject<HTMLDivElement | null>;
  /** While the time-lapse plays, steer the camera to where claims are being staked or lapsing. */
  follow: boolean;
  /** A small label that follows the pointer over any land; written directly, without re-rendering. */
  hoverChip: React.RefObject<HTMLDivElement | null>;
  controls: React.RefObject<MapControl | null>;
};

export function Earth(props: EarthProps) {
  const { mode, plots, claims, year, ahead, selectedId, zoomTo, geochem, element, occurrences, bedrock, colorBy, hoverId, anchor, controls, hoverChip, follow } = props;
  const host = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{ Cesium: typeof CesiumNS; viewer: CesiumNS.CesiumWidget } | null>(null);
  const claimPrimitive = useRef<CesiumNS.GroundPrimitive | null>(null);
  const geologyLayer = useRef<CesiumNS.ImageryLayer | null>(null);
  const plotFill = useRef<CesiumNS.GroundPrimitive | null>(null);
  const plotLines = useRef<CesiumNS.GroundPolylinePrimitive[]>([]);
  const plotPulse = useRef<CesiumNS.GroundPolylinePrimitive | null>(null);
  const [chipsVersion, setChipsVersion] = useState(0);
  const modeRef = useRef(mode);
  const range = useMemo(() => stakedRange(claims), [claims]);
  // The latest data for the pointer handlers, which are set up once with the viewer.
  const latest = useRef({ plots, claims, geochem, year });
  useEffect(() => { latest.current = { plots, claims, geochem, year }; }, [plots, claims, geochem, year]);
  const select = useEffectEvent(props.onSelect);
  const ready = useEffectEvent(props.onReady);
  const hover = useEffectEvent(props.onHover);
  const elevation = useEffectEvent(props.onElevation);

  // One viewer for the life of the page.
  useEffect(() => {
    let disposed = false;
    let viewer: CesiumNS.CesiumWidget | null = null;
    let handler: CesiumNS.ScreenSpaceEventHandler | null = null;
    (async () => {
      try {
        (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = CESIUM_BASE_URL;
        const Cesium = await import("@cesium/engine");
        if (disposed || !host.current) return;
        viewer = new Cesium.CesiumWidget(host.current, {
          baseLayer: new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
            url: ESRI_IMAGERY, maximumLevel: 18, credit: "Imagery: Esri, Maxar, Earthstar Geographics",
          })),
          terrainProvider: terrariumTerrain(Cesium),
          scene3DOnly: true, msaaSamples: 4,
          // Render at the screen's real pixel density (up to 2×), so the map is as sharp as the page.
          useBrowserRecommendedResolution: false,
        });
        viewer.resolutionScale = Math.min(2, devicePixelRatio) / devicePixelRatio;
        const { scene } = viewer;
        scene.globe.depthTestAgainstTerrain = true;
        scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1220");
        scene.backgroundColor = Cesium.Color.fromCssColorString("#05070b");
        scene.fog.density = 0.00012;
        // Coarser detail far off (it sits under the dark top fade anyway), so the view loads sooner.
        scene.fog.screenSpaceErrorFactor = 6;
        scene.screenSpaceCameraController.minimumZoomDistance = 300;
        // Keep tiles around once seen, so returning to a view never streams it in again.
        scene.globe.tileCacheSize = 1_000;
        scene.globe.preloadSiblings = true;

        if (GOOGLE_KEY) {
          try {
            const tiles = await Cesium.createGooglePhotorealistic3DTileset({ key: GOOGLE_KEY, onlyUsingWithGoogleGeocoder: true });
            if (!disposed) {
              scene.primitives.add(tiles);
              scene.globe.show = false;
            }
          } catch {
            // Keep the keyless satellite globe.
          }
        }

        if (disposed) return;
        const [lon, lat, h, heading, pitch] = VIEWS.timelapse;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
          orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
        });

        // Plots and claims are ground-primitive instances (string ids); labels, parcel marks and mines
        // are entities. Everything resolves to "plot:<id>", "claim:<index>" or "occ:<ARDF number>".
        const idAt = (position: CesiumNS.ScreenSpaceEventHandler.PositionedEvent["position"]) => {
          const picked = scene.pick(position);
          const raw = picked?.id instanceof Cesium.Entity ? picked.id.id : picked?.id;
          if (typeof raw !== "string") return null;
          const id = raw.replace(/^(label|glow):/, "plot:").replace(/^parcel:/, "").replace(/:edge\d+$|:corner\d+$|:name$/, "").replace(/^(claim:\d+):\d+$/, "$1");
          return /^(plot|claim|occ):/.test(id) ? id : null;
        };
        const describe = (id: string) => {
          const { plots: ps, claims: cs, geochem: gc } = latest.current;
          if (id.startsWith("plot:")) {
            const plot = ps?.plots.find((p) => `plot:${p.id}` === id);
            const gold = plot && gc ? plotReading(plot, gc, "Au") : null;
            const value = gold?.value;
            const goldText = value === null || value === undefined ? "" : typeof value === "number" ? ` · ${value} ppm gold in sediment` : "above" in value ? ` · >${value.above} ppm gold in sediment` : ` · <${value.below} ppm gold in sediment`;
            return plot ? `${plot.label} · ${plot.kind === "claim" ? plot.name : "Stream sample"}${goldText}` : "";
          }
          if (id.startsWith("claim:")) {
            const p = cs?.features[Number(id.slice(6))]?.properties;
            return p ? `Claim ${p.name} · ${p.owner.split(",")[0]} · ${p.status === "active" ? `since ${p.start}` : `lapsed ${p.end}`}` : "";
          }
          return "Known mine or prospect · click for its record";
        };
        handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        handler.setInputAction((event: CesiumNS.ScreenSpaceEventHandler.PositionedEvent) => {
          select(idAt(event.position));
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction((event: CesiumNS.ScreenSpaceEventHandler.MotionEvent) => {
          const id = idAt(event.endPosition);
          scene.canvas.style.cursor = id ? "pointer" : "";
          hover(id?.startsWith("plot:") ? id.slice(5) : null);
          const chip = hoverChip.current;
          if (chip) {
            if (id) {
              chip.textContent = describe(id);
              chip.style.transform = `translate(${Math.round(event.endPosition.x + 14)}px, ${Math.round(event.endPosition.y + 14)}px)`;
              chip.dataset.visible = "true";
            } else chip.dataset.visible = "false";
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // For scripts/capture-map-snapshots.mjs: whether every tile in view has loaded.
        scene.globe.tileLoadProgressEvent.addEventListener((pending: number) => {
          document.documentElement.dataset.tiles = pending === 0 && scene.globe.tilesLoaded ? "loaded" : "loading";
        });
        // Ready only once the opening view is fully sharp: every tile in view loaded, and still so
        // half a second later (coarse tiles finish first, then finer ones start). The page shows a
        // still of this view until then; after 20 s the live map shows regardless.
        const began = Date.now();
        let since = 0;
        scene.postRender.addEventListener(function sharp() {
          const now = Date.now();
          if (!scene.globe.tilesLoaded) since = 0;
          else if (!since) since = now;
          if ((since && now - since > 500) || now - began > 20_000) {
            scene.postRender.removeEventListener(sharp);
            ready("ready");
          }
        });
        setApi({ Cesium, viewer });
      } catch {
        if (disposed) return;
        if (handler && !handler.isDestroyed()) handler.destroy();
        if (viewer && !viewer.isDestroyed()) viewer.destroy();
        ready("failed");
      }
    })();
    return () => {
      disposed = true;
      if (handler && !handler.isDestroyed()) handler.destroy();
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hoverChip is a stable ref, read when the pointer moves
  }, []);

  // Map controls: zoom, back to the overview, tilt between 3D and straight down, face north.
  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    const { camera, scene } = viewer;
    const centre = () => {
      const ray = camera.getPickRay(new Cesium.Cartesian2(scene.canvas.clientWidth / 2, scene.canvas.clientHeight / 2));
      return ray ? scene.globe.pick(ray, scene) : undefined;
    };
    const orbit = (heading: number, pitch: number) => {
      const target = centre();
      if (!target) return;
      const range = Cesium.Cartesian3.distance(camera.positionWC, target);
      camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 0), {
        offset: new Cesium.HeadingPitchRange(heading, pitch, range), duration: reduced() ? 0 : 0.8,
      });
    };
    controls.current = {
      zoom: (factor) => {
        const target = centre();
        const range = target ? Cesium.Cartesian3.distance(camera.positionWC, target) : camera.positionCartographic.height;
        if (factor > 1) camera.zoomIn(range * (1 - 1 / factor));
        else camera.zoomOut(range * (1 / factor - 1));
      },
      reset: () => {
        const [lon, lat, h, heading, pitch] = VIEWS[modeRef.current];
        camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
          orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
          duration: reduced() ? 0 : 1.2,
        });
      },
      tilt: () => orbit(camera.heading, camera.pitch < Cesium.Math.toRadians(-75) ? Cesium.Math.toRadians(-35) : Cesium.Math.toRadians(-89.9)),
      north: () => orbit(0, camera.pitch),
    };
    return () => { controls.current = null; };
  }, [api, controls]);

  // Follow the action: for each year, the box around claims staked or lapsing that year and the
  // years either side. Busy years pull the camera in; quiet ones let it drift back to the valley.
  const action = useMemo(() => {
    const byYear = new Map<number, [number, number][]>();
    for (const f of claims?.features ?? []) {
      const ring = ringsOf(f.geometry)[0];
      const c: [number, number] = [ring.reduce((a, [x]) => a + x, 0) / ring.length, ring.reduce((a, [, y]) => a + y, 0) / ring.length];
      for (const y of [f.properties.start, f.properties.status === "closed" ? f.properties.end : null]) {
        if (!y) continue;
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y)!.push(c);
      }
    }
    return byYear;
  }, [claims]);
  const following = useRef(false);
  useEffect(() => {
    if (!api || mode !== "timelapse" || zoomTo) return;
    const { Cesium, viewer } = api;
    const points = follow ? [year - 1, year, year + 1].flatMap((y) => action.get(y) ?? []) : [];
    if (points.length >= 4) {
      following.current = true;
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      const [w, e, so, n] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const span = Math.max((e - w) * Math.cos((63 * Math.PI) / 180) * 111, (n - so) * 111); // km
      const height = Math.max(14_000, Math.min(36_000, span * 1_400));
      // Pitch −45° looks ahead by about the camera height, so sit that far south of the action.
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees((w + e) / 2, (so + n) / 2 - height / 111_000, height),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
        duration: reduced() ? 0 : 1.1,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      });
    } else if (following.current) {
      following.current = false;
      const [lon, lat, h, heading, pitch] = VIEWS.timelapse;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
        orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
        duration: reduced() ? 0 : 1.4,
      });
    }
  }, [api, mode, year, follow, action, zoomTo]);

  // Fly to each mode's view; leaving the close parcel view (zoomTo cleared) returns here too.
  useEffect(() => {
    modeRef.current = mode;
    if (!api || zoomTo) return;
    const { Cesium, viewer } = api;
    const [lon, lat, h, heading, pitch] = VIEWS[mode];
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
      orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
      duration: reduced() ? 0 : 1.6,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, [api, mode, zoomTo]);

  // The land under the samples. Each stream-sediment sample is a soft glow on the ground, warm where
  // gold runs high, so rich ground reads at a glance; the real DNR claims that hold a sample keep
  // their outline and a tinted fill; a small chip names each plot and its reading.
  useEffect(() => {
    if (!api || !plots) return;
    const { Cesium, viewer } = api;
    const held = plots.plots.filter((p) => p.kind === "claim");
    const fill = new Cesium.GroundPrimitive({
      geometryInstances: held.flatMap((plot) => ringsOf(plot.geometry).map((ring) => new Cesium.GeometryInstance({
        id: `plot:${plot.id}`,
        geometry: new Cesium.PolygonGeometry({ polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ring.flat())) }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.TRANSPARENT), show: new Cesium.ShowGeometryInstanceAttribute(false) },
      }))),
      appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
      classificationType: Cesium.ClassificationType.BOTH,
      asynchronous: true,
    });
    const outline = (list: Plot[], width: number, material: CesiumNS.Material) => new Cesium.GroundPolylinePrimitive({
      geometryInstances: list.flatMap((plot) => ringsOf(plot.geometry).map((ring) => new Cesium.GeometryInstance({
        geometry: new Cesium.GroundPolylineGeometry({ positions: Cesium.Cartesian3.fromDegreesArray(ring.flat()), width, loop: true }),
      }))),
      appearance: new Cesium.PolylineMaterialAppearance({ material }),
      show: false,
    });
    const lines = [outline(held, 1, Cesium.Material.fromType("Color", { color: Cesium.Color.WHITE.withAlpha(0.6) }))];
    const best = geochem ? held.filter((p) => (plotReading(p, geochem, "Au")?.k ?? 0) >= 2) : [];
    const pulse = outline(best, 2.5, Cesium.Material.fromType("Color", { color: Cesium.Color.fromCssColorString("#fde047").withAlpha(0.8) }));
    // The richest claims breathe slowly, so the eye finds them first.
    const breathe = viewer.scene.preRender.addEventListener(() => {
      if (!pulse.show || reduced()) return;
      const alpha = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(performance.now() / 600));
      (pulse.appearance.material.uniforms as { color: InstanceType<typeof CesiumNS.Color> }).color = Cesium.Color.fromCssColorString("#fde047").withAlpha(alpha);
    });
    // Glows sit on the sample itself (the plot's strongest gold reading), not on a drawn square.
    const materials = Cesium.GroundPrimitive.supportsMaterials(viewer.scene);
    const glows = plots.plots.map((plot) => {
      const reading = geochem ? plotReading(plot, geochem, "Au") : null;
      const [lon, lat] = reading ? [reading.sample.lon, reading.sample.lat] : plot.centre;
      const radius = GLOW_RADIUS[reading?.k ?? 0];
      return viewer.entities.add({
        id: `glow:${plot.id}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        ellipse: {
          semiMajorAxis: radius, semiMinorAxis: radius, classificationType: Cesium.ClassificationType.BOTH,
          material: materials
            ? new Cesium.ImageMaterialProperty({ image: glowImage(), transparent: true, color: Cesium.Color.WHITE.withAlpha(0) })
            : new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0)),
        },
        show: false,
      });
    });
    viewer.scene.primitives.add(fill);
    [...lines, pulse].forEach((line) => viewer.scene.groundPrimitives.add(line));
    plotFill.current = fill;
    plotLines.current = lines;
    plotPulse.current = pulse;
    return () => {
      breathe();
      plotFill.current = null;
      plotLines.current = [];
      plotPulse.current = null;
      // The viewer's owner effect may already have destroyed the scene on route exit.
      if (viewer.isDestroyed()) return;
      viewer.scene.primitives.remove(fill);
      [...lines, pulse].forEach((line) => viewer.scene.groundPrimitives.remove(line));
      glows.forEach((glow) => viewer.entities.remove(glow));
    };
  }, [api, plots, geochem]);

  // Chips: the plot's ID and its reading of the chosen element. The richest show from afar, the rest
  // as you come closer; the plot under the pointer or selected is always shown, inverted.
  useEffect(() => {
    if (!api || !plots || !geochem) return;
    const { Cesium, viewer } = api;
    const unit = geochem.elements[element]?.unit ?? "ppm";
    const chips = plots.plots.map((plot) => {
      const reading = plotReading(plot, geochem, element);
      const k = reading?.k ?? 0;
      const text = `${plot.label} · ${reading ? formatAssayValue(reading.value, unit) : "—"}`;
      const [lon, lat] = reading ? [reading.sample.lon, reading.sample.lat] : plot.centre;
      return viewer.entities.add({
        id: `label:${plot.id}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        billboard: {
          image: chipImage(text, CHIP_DOT[k], false), scale: 0.5, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -6),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(4_000, 1, 60_000, 0.8),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, k >= 2 ? 70_000 : 16_000),
        },
        properties: { normal: chipImage(text, CHIP_DOT[k], false), focus: chipImage(text, CHIP_DOT[k], true), far: k >= 2 ? 70_000 : 16_000 },
        show: false,
      });
    });
    setChipsVersion((v) => v + 1);
    // Declutter: where chips would overlap on screen, keep the richer plot's (or the focused one).
    const rank = new Map(plots.plots.map((plot) => [`label:${plot.id}`, assayLevel(plotReading(plot, geochem, element)?.value ?? null)]));
    const ordered = [...chips].sort((a, b) => (rank.get(b.id) ?? -1) - (rank.get(a.id) ?? -1));
    let last = 0;
    const declutter = viewer.scene.postRender.addEventListener(() => {
      const now = performance.now();
      if (now - last < 150) return;
      last = now;
      const taken: [number, number, number, number][] = [];
      const time = Cesium.JulianDate.now();
      const camera = viewer.camera.positionWC;
      const focused = ordered.filter((c) => c.billboard?.distanceDisplayCondition?.getValue(time) === undefined);
      for (const chip of [...focused, ...ordered.filter((c) => !focused.includes(c))]) {
        const b = chip.billboard;
        const at = chip.position?.getValue(time);
        if (!b || !at || !chip.show) continue;
        const far = b.distanceDisplayCondition?.getValue(time) as { far: number } | undefined;
        const xy = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, at);
        const inRange = !far || Cesium.Cartesian3.distance(camera, at) <= far.far;
        if (!xy || !inRange) { b.show = new Cesium.ConstantProperty(true); continue; }
        // Chip boxes are roughly 150 × 22 px, centred above the sample.
        const box: [number, number, number, number] = [xy.x - 75, xy.y - 30, xy.x + 75, xy.y - 6];
        const hit = taken.some(([x1, y1, x2, y2]) => box[0] < x2 && box[2] > x1 && box[1] < y2 && box[3] > y1);
        b.show = new Cesium.ConstantProperty(!hit);
        if (!hit) taken.push(box);
      }
    });
    return () => { declutter(); if (!viewer.isDestroyed()) chips.forEach((chip) => viewer.entities.remove(chip)); };
  }, [api, plots, geochem, element]);

  useEffect(() => {
    const fill = plotFill.current;
    if (!api || !plots || !geochem || !fill) return;
    const { Cesium } = api;
    const explore = mode === "explore";
    plotLines.current.forEach((line) => { line.show = true; });
    if (plotPulse.current) plotPulse.current.show = explore && colorBy === "gold" && element === "Au" && !zoomTo;
    // Into the projection the glows warm a little with each year, as the gold price climbs.
    const warmth = 1 + Math.min(5, ahead) * 0.08;
    for (const plot of plots.plots) {
      const id = `plot:${plot.id}`;
      const focus = id === selectedId || plot.id === hoverId;
      const k = plotReading(plot, geochem, element)?.k ?? 0;
      const chip = api.viewer.entities.getById(`label:${plot.id}`);
      if (chip?.billboard && chip.properties) {
        chip.show = id !== zoomTo;
        const now = Cesium.JulianDate.now();
        chip.billboard.image = new Cesium.ConstantProperty(chip.properties[focus ? "focus" : "normal"].getValue(now));
        chip.billboard.distanceDisplayCondition = new Cesium.ConstantProperty(focus ? undefined : new Cesium.DistanceDisplayCondition(0, chip.properties.far.getValue(now)));
      }
      const glow = api.viewer.entities.getById(`glow:${plot.id}`);
      if (glow?.ellipse) {
        const [css, alpha] = GLOW_COLOR[k];
        const dim = !explore || colorBy === "gold" ? 1 : 0.35;
        const color = focus ? Cesium.Color.WHITE.withAlpha(0.95) : Cesium.Color.fromCssColorString(css).withAlpha(Math.min(1, alpha * dim * warmth * (zoomTo ? 0.5 : 1)));
        const material = glow.ellipse.material;
        if (material instanceof Cesium.ImageMaterialProperty) material.color = new Cesium.ConstantProperty(color);
        else glow.ellipse.material = new Cesium.ColorMaterialProperty(color.withAlpha(color.alpha * 0.4));
        glow.show = true;
      }
    }
    const apply = () => {
      for (const plot of plots.plots) {
        if (plot.kind !== "claim") continue;
        const status = plot.status === "active" ? "held" : "lapsed";
        const [css, alpha] = !explore ? ["#ffffff", 0.1] as [string, number]
          : colorBy === "ownership" ? (status === "held" ? ["#ffffff", 0.45] : ["#ffffff", 0.15]) as [string, number]
          : colorBy === "staked" ? stakedColor(plot.start, range)
          : CLASS_FILL[plotReading(plot, geochem, element)?.k ?? 0];
        // In the close parcel view the chosen plot is left clear, so the real ground shows.
        const faded = status === "lapsed" && colorBy === "gold" ? 0.6 : 1;
        const color = `plot:${plot.id}` === zoomTo ? Cesium.Color.WHITE.withAlpha(0.03)
          : `plot:${plot.id}` === selectedId ? Cesium.Color.WHITE.withAlpha(0.5)
          : plot.id === hoverId ? Cesium.Color.WHITE.withAlpha(0.35)
          : Cesium.Color.fromCssColorString(css).withAlpha((zoomTo ? alpha * 0.5 : alpha) * faded);
        const attributes = fill.getGeometryInstanceAttributes(`plot:${plot.id}`);
        if (!attributes) continue;
        attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(color, attributes.color);
        attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(true, attributes.show);
      }
    };
    if (fill.ready) apply();
    else {
      const remove = api.viewer.scene.postRender.addEventListener(() => {
        if (fill.isDestroyed() || !fill.ready) return;
        remove();
        apply();
      });
      return remove;
    }
  }, [api, plots, geochem, element, selectedId, mode, colorBy, hoverId, zoomTo, range, ahead, chipsVersion]);

  // A soft glowing edge around the claim under the pointer or selected, over its thin outline.
  useEffect(() => {
    if (!api || !plots) return;
    const id = selectedId?.startsWith("plot:") ? selectedId : hoverId ? `plot:${hoverId}` : null;
    const plot = id ? plots.plots.find((p) => `plot:${p.id}` === id && p.kind === "claim") : null;
    if (!plot || id === zoomTo) return;
    const { Cesium, viewer } = api;
    const edges = ringsOf(plot.geometry).map((ring, i) => viewer.entities.add({
      id: `glow:${plot.id}:edge${i}`,
      polyline: { positions: Cesium.Cartesian3.fromDegreesArray([...ring, ring[0]].flat()), width: 10, clampToGround: true,
        material: new Cesium.PolylineGlowMaterialProperty({ color: Cesium.Color.WHITE.withAlpha(0.9), glowPower: 0.25, taperPower: 1 }) },
    }));
    return () => { if (!viewer.isDestroyed()) edges.forEach((edge) => viewer.entities.remove(edge)); };
  }, [api, plots, selectedId, hoverId, zoomTo]);

  // Keep the popover anchored to the selected land as the camera moves.
  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    const parcel = parcelOf(selectedId, plots, claims);
    const el = anchor.current;
    if (!parcel || !el) return;
    // Pin to the middle of the north edge, so the popover sits above the land, not on it.
    const north = Math.max(...parcel.ring.map(([, y]) => y));
    const lon = parcel.centre[0];
    const position = Cesium.Cartesian3.fromDegrees(lon, north, 0);
    let ground = 0;
    Cesium.sampleTerrain(viewer.terrainProvider, 12, [Cesium.Cartographic.fromDegrees(lon, north)])
      .then(([point]) => { if (Number.isFinite(point.height)) ground = point.height; })
      .catch(() => {});
    const place = () => {
      const at = ground ? Cesium.Cartesian3.fromDegrees(lon, north, ground + 20) : position;
      const xy = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, at);
      if (xy) {
        el.style.transform = `translate(${Math.round(xy.x)}px, ${Math.round(xy.y)}px)`;
        el.dataset.visible = "true";
        // Near the top of the screen there's no room above the land: open the popover below it.
        el.dataset.flip = xy.y < 300 ? "true" : "false";
      } else el.dataset.visible = "false";
    };
    place();
    return viewer.scene.postRender.addEventListener(place);
  }, [api, plots, claims, selectedId, anchor]);

  // The close parcel view: fly in to about 1.6 km above the ground, then draw the boundary, its
  // corners and the length of each side, measured from the claim geometry.
  useEffect(() => {
    if (!api || !zoomTo) return;
    const parcel = parcelOf(zoomTo, plots, claims);
    if (!parcel) return;
    const { Cesium, viewer } = api;
    const [lon, lat] = parcel.centre;
    const ring = parcel.ring;
    const key = zoomTo;
    const added: CesiumNS.Entity[] = [];
    const add = (options: CesiumNS.Entity.ConstructorOptions) => added.push(viewer.entities.add(options));
    // A sample with no claim around it has no real boundary to measure, only its glow.
    if (!parcel.open) add({
      id: `parcel:${key}`,
      polyline: { positions: Cesium.Cartesian3.fromDegreesArray([...ring, ring[0]].flat()), width: 3, clampToGround: true, material: Cesium.Color.WHITE },
    });
    if (!parcel.open) ring.forEach(([x, y], i) => {
      add({ id: `parcel:${key}:corner${i}`, position: Cesium.Cartesian3.fromDegrees(x, y),
        point: { pixelSize: 7, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString("#0a0a0a"), outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY } });
      const [nx, ny] = ring[(i + 1) % ring.length];
      const metres = km(x, y, nx, ny) * 1000;
      if (metres < 60) return;
      add({ id: `parcel:${key}:edge${i}`, position: Cesium.Cartesian3.fromDegrees((x + nx) / 2, (y + ny) / 2),
        label: { text: `${Math.round(metres)} m`, font: "500 11px ui-monospace, monospace", fillColor: Cesium.Color.WHITE,
          showBackground: true, backgroundColor: Cesium.Color.fromCssColorString("#0a0a0a").withAlpha(0.7), backgroundPadding: new Cesium.Cartesian2(5, 3),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 9_000) } });
    });
    add({ id: `parcel:${key}:name`, position: Cesium.Cartesian3.fromDegrees(lon, lat),
      label: { text: parcel.title, font: "600 13px DM Sans, system-ui, sans-serif",
        fillColor: Cesium.Color.BLACK, showBackground: true, backgroundColor: Cesium.Color.WHITE, backgroundPadding: new Cesium.Cartesian2(8, 5),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY } });

    let cancelled = false;
    elevation(null);
    const fly = (ground: number) => {
      if (cancelled) return;
      // Pitch −35° from about 1.6 km above the ground, the camera sits ~2.3 km south of the plot;
      // in the explorer the view also shifts east so the plot sits left of the side panel.
      const shiftLon = modeRef.current === "explore" ? 0.012 : 0;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon + shiftLon, lat - 0.0205, ground + 1_600),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-35), roll: 0 },
        duration: reduced() ? 0 : 1.8,
      });
    };
    Cesium.sampleTerrain(viewer.terrainProvider, 12, [Cesium.Cartographic.fromDegrees(lon, lat)])
      .then(([point]) => {
        const ground = Number.isFinite(point.height) ? point.height : null;
        if (!cancelled) elevation(ground);
        fly(ground ?? 900);
      })
      .catch(() => fly(900));
    return () => {
      cancelled = true;
      if (!viewer.isDestroyed()) added.forEach((entity) => viewer.entities.remove(entity));
    };
  }, [api, plots, claims, zoomTo]);

  // Selecting a plot in the explorer also measures its elevation for the sheet, even without zooming.
  useEffect(() => {
    if (!api || !plots || !selectedId?.startsWith("plot:") || zoomTo === selectedId) return;
    const plot = plots.plots.find((p) => `plot:${p.id}` === selectedId);
    if (!plot) return;
    const { Cesium, viewer } = api;
    let cancelled = false;
    elevation(null);
    Cesium.sampleTerrain(viewer.terrainProvider, 12, [Cesium.Cartographic.fromDegrees(...plot.centre)])
      .then(([point]) => { if (!cancelled) elevation(Number.isFinite(point.height) ? point.height : null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [api, plots, selectedId, zoomTo]);

  // Bedrock geology (USGS SIM 3340 via Macrostrat), soft, under everything while exploring.
  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    const layer = viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: GEOLOGY_TILES, maximumLevel: 12, credit: "Geology: USGS SIM 3340 via Macrostrat (CC-BY 4.0)",
    }));
    layer.alpha = 0.2;
    layer.show = false;
    geologyLayer.current = layer;
    return () => {
      geologyLayer.current = null;
      if (!viewer.isDestroyed()) viewer.imageryLayers.remove(layer);
    };
  }, [api]);

  useEffect(() => {
    // The close parcel view keeps the real ground clear of the overlay.
    if (geologyLayer.current) geologyLayer.current.show = mode === "explore" && bedrock && !zoomTo;
  }, [api, mode, bedrock, zoomTo]);

  // Known mines, prospects and occurrences (USGS ARDF) as diamonds: gold-bearing ones yellow.
  useEffect(() => {
    if (!api || !occurrences) return;
    const { Cesium, viewer } = api;
    const entities = occurrences.records.map((o) => {
      const gold = o.commodities.includes("Au") || o.other.includes("Au");
      return viewer.entities.add({
        id: `occ:${o.id}`,
        position: Cesium.Cartesian3.fromDegrees(o.lon, o.lat),
        billboard: { image: diamond(gold ? "#facc15" : "#a3a3a3"), scale: o.type === "Mine" ? 1.1 : 0.8,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: { text: o.name.split(";")[0], font: "500 11px DM Sans, system-ui, sans-serif", fillColor: Cesium.Color.WHITE,
          showBackground: true, backgroundColor: Cesium.Color.fromCssColorString("#0a0a0a").withAlpha(0.7), backgroundPadding: new Cesium.Cartesian2(5, 3),
          pixelOffset: new Cesium.Cartesian2(0, -16), heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 12_000) },
        show: false,
      });
    });
    return () => { if (!viewer.isDestroyed()) entities.forEach((entity) => viewer.entities.remove(entity)); };
  }, [api, occurrences]);

  useEffect(() => {
    if (!api || !occurrences) return;
    for (const o of occurrences.records) {
      const entity = api.viewer.entities.getById(`occ:${o.id}`);
      if (entity) entity.show = mode === "explore" && bedrock;
    }
  }, [api, occurrences, mode, bedrock]);

  // Claims: one batched ground primitive; colour per claim follows the year.
  useEffect(() => {
    if (!api || !claims) return;
    const { Cesium, viewer } = api;
    const instances = claims.features.flatMap((feature, index) => {
      const rings = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      return rings.map((ring, part) => new Cesium.GeometryInstance({
        id: `claim:${index}:${part}`,
        geometry: new Cesium.PolygonGeometry({ polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ring[0].flat())) }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.TRANSPARENT),
          show: new Cesium.ShowGeometryInstanceAttribute(false),
        },
      }));
    });
    const primitive = new Cesium.GroundPrimitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
      classificationType: Cesium.ClassificationType.BOTH,
      asynchronous: true,
    });
    viewer.scene.primitives.add(primitive);
    claimPrimitive.current = primitive;
    return () => {
      claimPrimitive.current = null;
      if (!viewer.isDestroyed()) viewer.scene.primitives.remove(primitive);
    };
  }, [api, claims]);

  useEffect(() => {
    const primitive = claimPrimitive.current;
    if (!api || !claims || !primitive) return;
    const { Cesium } = api;
    const color = (css: string, alpha: number) => Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.fromCssColorString(css).withAlpha(alpha));
    const explore = mode === "explore";
    const dim = zoomTo ? 0.4 : 1;
    const apply = () => {
      claims.features.forEach((feature, index) => {
        const p = feature.properties;
        const state = claimState(p, year);
        let fill: ReturnType<typeof color>;
        if (!explore) {
          // The time-lapse, like a market: staked this year green, lapsed this year red, held soft white.
          fill = p.start === year ? color(GREEN, 0.65)
            : state === "lapsed" && p.end === year ? color(RED, 0.6)
            : state === "active" ? color("#ffffff", 0.2) : color("#ffffff", 0.03);
        } else if (colorBy === "staked") {
          const [css, alpha] = stakedColor(p.start, range);
          fill = color(css, alpha * 0.5 * dim);
        } else if (colorBy === "ownership") {
          fill = state === "active" ? color("#ffffff", 0.28 * dim) : color("#ffffff", 0.06 * dim);
        } else {
          fill = state === "active" ? color("#ffffff", 0.08 * dim) : color("#ffffff", 0.02 * dim);
        }
        const parts = feature.geometry.type === "Polygon" ? 1 : feature.geometry.coordinates.length;
        for (let part = 0; part < parts; part++) {
          const attributes = primitive.getGeometryInstanceAttributes(`claim:${index}:${part}`);
          if (!attributes) continue;
          attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(state !== "none", attributes.show);
          attributes.color = fill;
        }
      });
    };
    if (primitive.ready) apply();
    else {
      const remove = api.viewer.scene.postRender.addEventListener(() => {
        if (primitive.isDestroyed() || !primitive.ready) return;
        remove();
        apply();
      });
      return remove;
    }
  }, [api, claims, year, mode, colorBy, zoomTo, range]);

  return <div ref={host} className="earth" aria-label="3D map of the Tok River valley, Alaska" role="img" />;
}
