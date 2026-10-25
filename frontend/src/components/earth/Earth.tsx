"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type * as CesiumNS from "cesium";
import type { Claims, ColorBy, Geochem, Occurrences, Plots } from "@/lib/showcase";
import { claimState, plotReading } from "@/lib/showcase";
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
 *  (about 144.05–143.05 W, 63.0–63.28 N); explore shifts it left of the 420 px side panel. */
const VIEWS: Record<Mode, View> = {
  timelapse: [-143.55, 62.74, 46_000, 0, -45],
  explore: [-143.4, 62.88, 40_000, 0, -58],
};
const GREEN = "#22c55e";
/** Plot fill by anomaly class (below median, above median, top 10%, top 2%) of the chosen element.
 *  Warm yellow is used only here, where gold is actually measured. */
const CLASS_FILL: [string, number][] = [["#ffffff", 0.18], ["#facc15", 0.45], ["#facc15", 0.75], ["#fde047", 0.95]];

/** Grey (1977) to green (2025) by the year a claim was staked. */
function stakedColor(year: number | null | undefined): [string, number] {
  if (!year) return ["#ffffff", 0];
  const t = Math.max(0, Math.min(1, (year - 1977) / (2025 - 1977)));
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return [`rgb(${mix(115, 34)}, ${mix(115, 197)}, ${mix(115, 94)})`, 0.35 + 0.5 * t];
}

type Ring = [number, number][];
const scale = ([css, alpha]: [string, number], k: number): [string, number] => [css, alpha * k];
/** Outer rings without the repeated closing point: a zero-length last segment breaks Cesium's ground polylines. */
const ringsOf = (geometry: Plots["plots"][number]["geometry"]): Ring[] =>
  (geometry.type === "Polygon" ? [geometry.coordinates[0]] : geometry.coordinates.map((poly) => poly[0])).map((ring) => {
    const [first, last] = [ring[0], ring[ring.length - 1]];
    return first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
  });

export type EarthProps = {
  mode: Mode;
  /** The explorer tab: the ground tab adds bedrock geology and known mines. */
  tab: string;
  plots: Plots | null;
  claims: Claims | null;
  year: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Called once the globe has drawn its first frame, or failed. */
  onReady: (state: "ready" | "failed") => void;
  geochem: Geochem | null;
  /** The element the plots are coloured by (chosen in the ground tab). */
  element: string;
  occurrences: Occurrences | null;
  /** Bedrock geology and known mines, switched on from the ground tab. */
  bedrock: boolean;
  colorBy: ColorBy;
  /** The plot under the pointer, on the map or in the list (plot id, no prefix). */
  hoverId: string | null;
  onHover: (id: string | null) => void;
  /** Approximate ground height at the selected plot, from the same terrain tiles. */
  onElevation: (metres: number | null) => void;
};

export function Earth({ mode, tab, plots, claims, year, selectedId, onSelect, onReady, geochem, element, occurrences, bedrock, colorBy, hoverId, onHover, onElevation }: EarthProps) {
  const host = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{ Cesium: typeof CesiumNS; viewer: CesiumNS.Viewer } | null>(null);
  const claimPrimitive = useRef<CesiumNS.GroundPrimitive | null>(null);
  const geologyLayer = useRef<CesiumNS.ImageryLayer | null>(null);
  const plotFill = useRef<CesiumNS.GroundPrimitive | null>(null);
  const plotLines = useRef<CesiumNS.GroundPolylinePrimitive[]>([]);
  const select = useEffectEvent(onSelect);
  const ready = useEffectEvent(onReady);
  const hover = useEffectEvent(onHover);
  const elevation = useEffectEvent(onElevation);
  const plotGlow = useRef<CesiumNS.GroundPolylinePrimitive | null>(null);

  // One viewer for the life of the page.
  useEffect(() => {
    let disposed = false;
    let viewer: CesiumNS.Viewer | null = null;
    (async () => {
      (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = CESIUM_BASE_URL;
      const Cesium = await import("cesium");
      if (disposed || !host.current) return;
      try {
        viewer = new Cesium.Viewer(host.current, {
          baseLayer: new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
            url: ESRI_IMAGERY, maximumLevel: 18, credit: "Imagery: Esri, Maxar, Earthstar Geographics",
          })),
          terrainProvider: terrariumTerrain(Cesium),
          animation: false, timeline: false, baseLayerPicker: false, geocoder: false, homeButton: false,
          sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false, infoBox: false,
          selectionIndicator: false, scene3DOnly: true, msaaSamples: 4,
        });
      } catch {
        ready("failed");
        return;
      }
      const { scene } = viewer;
      scene.globe.depthTestAgainstTerrain = true;
      scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1220");
      scene.backgroundColor = Cesium.Color.fromCssColorString("#05070b");
      scene.fog.density = 0.00012;
      scene.screenSpaceCameraController.minimumZoomDistance = 800;

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

      const [lon, lat, h, heading, pitch] = VIEWS.timelapse;
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
        orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
      });

      const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction((event: { position: CesiumNS.Cartesian2 }) => {
        const picked = scene.pick(event.position);
        // Plots are ground-primitive instances (string ids); mines are entities.
        const raw: string | null = picked?.id instanceof Cesium.Entity ? picked.id.id : typeof picked?.id === "string" ? picked.id : null;
        const id = raw?.replace(/^label:/, "plot:") ?? null;
        select(id && /^(plot|occ):/.test(id) ? id : null);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      handler.setInputAction((event: { endPosition: CesiumNS.Cartesian2 }) => {
        const picked = scene.pick(event.endPosition);
        const raw = picked?.id instanceof Cesium.Entity ? picked.id.id : picked?.id;
        // Plot labels are entities named "label:<plot id>"; treat them like the plot itself.
        const id = typeof raw === "string" ? raw.replace(/^label:/, "plot:") : null;
        scene.canvas.style.cursor = id && /^(plot|occ):/.test(id) ? "pointer" : "";
        hover(id?.startsWith("plot:") ? id.slice(5) : null);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      scene.globe.tileLoadProgressEvent.addEventListener(function first(pending: number) {
        if (pending === 0) {
          scene.globe.tileLoadProgressEvent.removeEventListener(first);
          ready("ready");
        }
      });
      setApi({ Cesium, viewer });
    })();
    return () => {
      disposed = true;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  // Fly to each mode's view.
  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    const [lon, lat, h, heading, pitch] = VIEWS[mode];
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
      orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.6,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, [api, mode]);

  // Land plots under the samples: one batched fill, coloured by the chosen element, plus clamped
  // outlines (solid for claims, dashed for open ground).
  useEffect(() => {
    if (!api || !plots) return;
    const { Cesium, viewer } = api;
    const fills = plots.plots.flatMap((plot) => ringsOf(plot.geometry).map((ring) => new Cesium.GeometryInstance({
      id: `plot:${plot.id}`,
      geometry: new Cesium.PolygonGeometry({ polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ring.flat())) }),
      attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.TRANSPARENT), show: new Cesium.ShowGeometryInstanceAttribute(false) },
    })));
    const fill = new Cesium.GroundPrimitive({
      geometryInstances: fills,
      appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
      classificationType: Cesium.ClassificationType.BOTH,
      asynchronous: true,
    });
    const outline = (kind: "claim" | "open") => new Cesium.GroundPolylinePrimitive({
      geometryInstances: plots.plots.filter((p) => p.kind === kind).flatMap((plot) => ringsOf(plot.geometry).map((ring) => new Cesium.GeometryInstance({
        geometry: new Cesium.GroundPolylineGeometry({ positions: Cesium.Cartesian3.fromDegreesArray(ring.flat()), width: 2, loop: true }),
      }))),
      appearance: new Cesium.PolylineMaterialAppearance({
        material: kind === "claim"
          ? Cesium.Material.fromType("Color", { color: Cesium.Color.WHITE.withAlpha(0.9) })
          : Cesium.Material.fromType("PolylineDash", { color: Cesium.Color.WHITE.withAlpha(0.9), dashLength: 10 }),
      }),
      show: false,
    });
    const lines = [outline("claim"), outline("open")];
    // A soft halo around the top-10% gold plots, so the best ground stands out from the valley.
    const best = geochem ? plots.plots.filter((p) => (plotReading(p, geochem, "Au")?.k ?? 0) >= 2) : [];
    const glow = new Cesium.GroundPolylinePrimitive({
      geometryInstances: best.flatMap((plot) => ringsOf(plot.geometry).map((ring) => new Cesium.GeometryInstance({
        geometry: new Cesium.GroundPolylineGeometry({ positions: Cesium.Cartesian3.fromDegreesArray(ring.flat()), width: 10, loop: true }),
      }))),
      appearance: new Cesium.PolylineMaterialAppearance({ material: Cesium.Material.fromType("PolylineGlow", { color: Cesium.Color.fromCssColorString("#fde047").withAlpha(0.6), glowPower: 0.35 }) }),
      show: false,
    });
    // ID chips at each plot's centre, readable from about 32 km in.
    const labels = plots.plots.map((plot) => viewer.entities.add({
      id: `label:${plot.id}`,
      position: Cesium.Cartesian3.fromDegrees(...plot.centre),
      label: {
        text: plot.label, font: "600 12px ui-monospace, monospace", fillColor: Cesium.Color.WHITE,
        showBackground: true, backgroundColor: Cesium.Color.fromCssColorString("#0a0a0a").withAlpha(0.78), backgroundPadding: new Cesium.Cartesian2(6, 4),
        pixelOffset: new Cesium.Cartesian2(0, -16), heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY, distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 32_000),
      },
      show: false,
    }));
    viewer.scene.primitives.add(fill);
    lines.forEach((line) => viewer.scene.groundPrimitives.add(line));
    viewer.scene.groundPrimitives.add(glow);
    plotFill.current = fill;
    plotLines.current = lines;
    plotGlow.current = glow;
    return () => {
      plotFill.current = null;
      plotLines.current = [];
      plotGlow.current = null;
      viewer.scene.primitives.remove(fill);
      lines.forEach((line) => viewer.scene.groundPrimitives.remove(line));
      viewer.scene.groundPrimitives.remove(glow);
      labels.forEach((label) => viewer.entities.remove(label));
    };
  }, [api, plots, geochem]);

  useEffect(() => {
    const fill = plotFill.current;
    if (!api || !plots || !geochem || !fill) return;
    const { Cesium } = api;
    const show = mode === "explore";
    plotLines.current.forEach((line) => { line.show = show; });
    if (plotGlow.current) plotGlow.current.show = show && colorBy === "gold" && element === "Au";
    for (const plot of plots.plots) {
      const label = api.viewer.entities.getById(`label:${plot.id}`);
      if (!label?.label) continue;
      const focus = `plot:${plot.id}` === selectedId || plot.id === hoverId;
      label.show = show;
      label.label.distanceDisplayCondition = new Cesium.ConstantProperty(focus ? undefined : new Cesium.DistanceDisplayCondition(0, 32_000));
      label.label.backgroundColor = new Cesium.ConstantProperty(focus ? Cesium.Color.WHITE : Cesium.Color.fromCssColorString("#0a0a0a").withAlpha(0.78));
      label.label.fillColor = new Cesium.ConstantProperty(focus ? Cesium.Color.BLACK : Cesium.Color.WHITE);
    }
    const apply = () => {
      for (const plot of plots.plots) {
        const status = plot.kind === "open" ? "open" : plot.status === "active" ? "held" : "lapsed";
        const [css, alpha] = colorBy === "ownership"
          ? (status === "held" ? ["#ffffff", 0.6] : status === "lapsed" ? ["#ffffff", 0.2] : ["#ffffff", 0.04]) as [string, number]
          : colorBy === "staked" ? (plot.kind === "claim" ? stakedColor(plot.start) : ["#ffffff", 0.04] as [string, number])
          : CLASS_FILL[plotReading(plot, geochem, element)?.k ?? 0];
        const color = `plot:${plot.id}` === selectedId ? Cesium.Color.WHITE.withAlpha(0.92)
          : plot.id === hoverId ? Cesium.Color.WHITE.withAlpha(0.7)
          : Cesium.Color.fromCssColorString(css).withAlpha(alpha);
        const attributes = fill.getGeometryInstanceAttributes(`plot:${plot.id}`);
        if (!attributes) continue;
        attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(color, attributes.color);
        attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(show, attributes.show);
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
  }, [api, plots, geochem, element, selectedId, mode, colorBy, hoverId]);

  // Bring a chosen plot into view; closing it returns to the whole valley.
  const zoomedIn = useRef(false);
  useEffect(() => {
    if (api && mode === "explore" && !selectedId && zoomedIn.current) {
      zoomedIn.current = false;
      const [lon, lat, h, heading, pitch] = VIEWS.explore;
      api.viewer.camera.flyTo({
        destination: api.Cesium.Cartesian3.fromDegrees(lon, lat, h),
        orientation: { heading: api.Cesium.Math.toRadians(heading), pitch: api.Cesium.Math.toRadians(pitch), roll: 0 },
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.4,
      });
    }
    if (!api || !plots || mode !== "explore" || !selectedId?.startsWith("plot:")) return;
    zoomedIn.current = true;
    const plot = plots.plots.find((p) => `plot:${p.id}` === selectedId);
    if (!plot) return;
    const [lon, lat] = plot.centre;
    const { Cesium, viewer } = api;
    // A close oblique view, about 4 km out, framed left of the side panel.
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon + 0.028, lat - 0.04, 4_200),
      orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-40), roll: 0 },
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.6,
    });
    elevation(null);
    let cancelled = false;
    Cesium.sampleTerrain(viewer.terrainProvider, 12, [Cesium.Cartographic.fromDegrees(lon, lat)])
      .then(([point]) => { if (!cancelled) elevation(Number.isFinite(point.height) ? point.height : null); })
      .catch(() => { if (!cancelled) elevation(null); });
    return () => { cancelled = true; };
  }, [api, plots, selectedId, mode]);

  // Bedrock geology (USGS SIM 3340 via Macrostrat) under the plots, when switched on in the ground tab.
  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    const layer = viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: GEOLOGY_TILES, maximumLevel: 12, credit: "Geology: USGS SIM 3340 via Macrostrat (CC-BY 4.0)",
    }));
    layer.alpha = 0.4;
    layer.show = false;
    geologyLayer.current = layer;
    return () => {
      geologyLayer.current = null;
      if (!viewer.isDestroyed()) viewer.imageryLayers.remove(layer);
    };
  }, [api]);

  useEffect(() => {
    if (geologyLayer.current) geologyLayer.current.show = mode === "explore" && tab === "ground" && bedrock;
  }, [api, mode, tab, bedrock]);

  // Known mines, prospects and occurrences (USGS ARDF): gold-bearing ones in gold.
  useEffect(() => {
    if (!api || !occurrences) return;
    const { Cesium, viewer } = api;
    const entities = occurrences.records.map((o) => {
      const gold = o.commodities.includes("Au") || o.other.includes("Au");
      return viewer.entities.add({
        id: `occ:${o.id}`,
        position: Cesium.Cartesian3.fromDegrees(o.lon, o.lat),
        point: {
          pixelSize: o.type === "Mine" ? 13 : 9,
          color: gold ? Cesium.Color.fromCssColorString("#facc15") : Cesium.Color.fromCssColorString("#a3a3a3"),
          outlineColor: Cesium.Color.fromCssColorString("#0b0d10"),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        show: false,
      });
    });
    return () => { entities.forEach((entity) => viewer.entities.remove(entity)); };
  }, [api, occurrences]);

  useEffect(() => {
    if (!api || !occurrences) return;
    for (const o of occurrences.records) {
      const entity = api.viewer.entities.getById(`occ:${o.id}`);
      if (entity) entity.show = mode === "explore" && tab === "ground" && bedrock;
    }
  }, [api, occurrences, mode, tab, bedrock]);

  // Claims: one batched ground primitive; colour per claim follows the time scrubber.
  useEffect(() => {
    if (!api || !claims) return;
    const { Cesium, viewer } = api;
    const instances = claims.features.flatMap((feature, index) => {
      const rings = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      return rings.map((ring, part) => new Cesium.GeometryInstance({
        id: `claim:${index}:${part}`,
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(ring[0].flat())),
        }),
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
      viewer.scene.primitives.remove(primitive);
    };
  }, [api, claims]);

  useEffect(() => {
    const primitive = claimPrimitive.current;
    if (!api || !claims || !primitive) return;
    const { Cesium } = api;
    // The time-lapse: claims staked this year flash green, held ones are white, lapsed ones fade.
    // Exploring the plots, every claim steps back so the sampled plots stand out.
    const quiet = mode === "explore" && tab !== "market" && colorBy === "gold";
    const color = (css: string, alpha: number) => Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.fromCssColorString(css).withAlpha(alpha));
    const recolour = mode === "explore" && colorBy !== "gold";
    const fresh = color(GREEN, 0.6);
    const active = color("#ffffff", quiet ? 0.1 : 0.24);
    const lapsed = color("#ffffff", quiet ? 0.03 : 0.07);
    const apply = () => {
      claims.features.forEach((feature, index) => {
        const state = claimState(feature.properties, year);
        const parts = feature.geometry.type === "Polygon" ? 1 : feature.geometry.coordinates.length;
        for (let part = 0; part < parts; part++) {
          const attributes = primitive.getGeometryInstanceAttributes(`claim:${index}:${part}`);
          if (!attributes) continue;
          attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(state !== "none", attributes.show);
          attributes.color = recolour
            ? colorBy === "staked" ? color(...scale(stakedColor(feature.properties.start), 0.55)) : state === "active" ? color("#ffffff", 0.32) : color("#ffffff", 0.08)
            : state === "active" ? (!quiet && feature.properties.start === year ? fresh : active) : lapsed;
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
  }, [api, claims, year, mode, tab, colorBy]);

  return <div ref={host} className="earth" aria-label="3D map of Alaska and the Tok River valley" role="img" />;
}
