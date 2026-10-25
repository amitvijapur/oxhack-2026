"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type * as CesiumNS from "cesium";
import type { Claims, Geochem, Occurrences, Plots } from "@/lib/showcase";
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
const CLASS_FILL: [string, number][] = [["#ffffff", 0.14], ["#facc15", 0.35], ["#facc15", 0.65], ["#fde047", 0.92]];

type Ring = [number, number][];
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
};

export function Earth({ mode, tab, plots, claims, year, selectedId, onSelect, onReady, geochem, element, occurrences, bedrock }: EarthProps) {
  const host = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{ Cesium: typeof CesiumNS; viewer: CesiumNS.Viewer } | null>(null);
  const claimPrimitive = useRef<CesiumNS.GroundPrimitive | null>(null);
  const geologyLayer = useRef<CesiumNS.ImageryLayer | null>(null);
  const plotFill = useRef<CesiumNS.GroundPrimitive | null>(null);
  const plotLines = useRef<CesiumNS.GroundPolylinePrimitive[]>([]);
  const select = useEffectEvent(onSelect);
  const ready = useEffectEvent(onReady);

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
        const id: string | null = picked?.id instanceof Cesium.Entity ? picked.id.id : typeof picked?.id === "string" ? picked.id : null;
        select(id && /^(plot|occ):/.test(id) ? id : null);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      handler.setInputAction((event: { endPosition: CesiumNS.Cartesian2 }) => {
        const picked = scene.pick(event.endPosition);
        const id = picked?.id instanceof Cesium.Entity ? picked.id.id : picked?.id;
        scene.canvas.style.cursor = typeof id === "string" && /^(plot|occ):/.test(id) ? "pointer" : "";
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
        geometry: new Cesium.GroundPolylineGeometry({ positions: Cesium.Cartesian3.fromDegreesArray(ring.flat()), width: kind === "claim" ? 2 : 1.6, loop: true }),
      }))),
      appearance: new Cesium.PolylineMaterialAppearance({
        material: kind === "claim"
          ? Cesium.Material.fromType("Color", { color: Cesium.Color.WHITE.withAlpha(0.75) })
          : Cesium.Material.fromType("PolylineDash", { color: Cesium.Color.WHITE.withAlpha(0.85), dashLength: 10 }),
      }),
      show: false,
    });
    const lines = [outline("claim"), outline("open")];
    viewer.scene.primitives.add(fill);
    lines.forEach((line) => viewer.scene.groundPrimitives.add(line));
    plotFill.current = fill;
    plotLines.current = lines;
    return () => {
      plotFill.current = null;
      plotLines.current = [];
      viewer.scene.primitives.remove(fill);
      lines.forEach((line) => viewer.scene.groundPrimitives.remove(line));
    };
  }, [api, plots]);

  useEffect(() => {
    const fill = plotFill.current;
    if (!api || !plots || !geochem || !fill) return;
    const { Cesium } = api;
    const show = mode === "explore";
    plotLines.current.forEach((line) => { line.show = show; });
    const apply = () => {
      for (const plot of plots.plots) {
        const k = plotReading(plot, geochem, element)?.k ?? 0;
        const [css, alpha] = CLASS_FILL[k];
        const color = `plot:${plot.id}` === selectedId ? Cesium.Color.WHITE.withAlpha(0.9) : Cesium.Color.fromCssColorString(css).withAlpha(alpha);
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
  }, [api, plots, geochem, element, selectedId, mode]);

  // Bring a chosen plot into view.
  useEffect(() => {
    if (!api || !plots || mode !== "explore" || !selectedId?.startsWith("plot:")) return;
    const plot = plots.plots.find((p) => `plot:${p.id}` === selectedId);
    if (!plot) return;
    const ring = ringsOf(plot.geometry)[0];
    const lon = ring.reduce((a, [x]) => a + x, 0) / ring.length;
    const lat = ring.reduce((a, [, y]) => a + y, 0) / ring.length;
    const { Cesium, viewer } = api;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon + 0.05, lat - 0.075, 6_500),
      orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-48), roll: 0 },
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.8,
    });
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
    const quiet = mode === "explore" && tab !== "market";
    const color = (css: string, alpha: number) => Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.fromCssColorString(css).withAlpha(alpha));
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
          attributes.color = state === "active" ? (!quiet && feature.properties.start === year ? fresh : active) : lapsed;
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
  }, [api, claims, year, mode, tab]);

  return <div ref={host} className="earth" aria-label="3D map of Alaska and the Tok River valley" role="img" />;
}
