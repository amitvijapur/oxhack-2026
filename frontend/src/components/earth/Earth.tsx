"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type * as CesiumNS from "cesium";
import type { Sample } from "@/lib/types";
import type { Claims } from "@/lib/showcase";
import { claimState } from "@/lib/showcase";
import { terrariumTerrain } from "./terrarium";
import "./earth.css";

/** Copied into public/ by scripts/copy-cesium-assets.mjs; Cesium loads workers and assets from here. */
const CESIUM_BASE_URL = "/vendor/cesium-1.146.0/";
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ESRI_IMAGERY = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export type Screen = 0 | 1 | 2 | 3 | 4;

/** Where the camera sits on each screen: lon, lat, height (m), heading and pitch (degrees). */
const VIEWS: Record<Screen, [number, number, number, number, number]> = {
  0: [-150, 50, 15_500_000, 0, -90],
  1: [-143.78, 62.76, 30_000, 12, -34],
  2: [-143.55, 62.78, 52_000, 4, -48],
  3: [-142.99, 63.27, 7_500, 0, -35],
  4: [-143.47, 62.98, 22_000, 10, -36],
};
export const TOK_TOWN: [number, number] = [-142.9856, 63.3367];
const SPIN_RAD_PER_S = 0.035;

const GOLD = "#e8b04b";

/** Pin height in metres: log scale, so 0.001 ppm is a stub and the 0.86 ppm sample towers. */
export function pinHeight(sample: Sample) {
  const p = sample.properties;
  const ppm = p.gold_primary_status === "quantified" ? p.gold_primary_value_ppm
    : p.gold_primary_status === "above_detection" ? p.gold_primary_bound_ppm : 0.0005;
  const value = Math.max(ppm ?? 0.0005, 0.0005);
  return 120 + 520 * Math.max(0, Math.log10(value / 0.0005));
}

export type EarthProps = {
  screen: Screen;
  samples: Sample[];
  claims: Claims | null;
  year: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Called once the globe has drawn its first frame, or failed. */
  onReady: (state: "ready" | "failed") => void;
};

export function Earth({ screen, samples, claims, year, selectedId, onSelect, onReady }: EarthProps) {
  const host = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<{ Cesium: typeof CesiumNS; viewer: CesiumNS.Viewer } | null>(null);
  const claimPrimitive = useRef<CesiumNS.GroundPrimitive | null>(null);
  const screenRef = useRef(screen);
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
      scene.globe.enableLighting = true;
      scene.globe.depthTestAgainstTerrain = true;
      scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1220");
      scene.backgroundColor = Cesium.Color.fromCssColorString("#05070b");
      scene.fog.density = 0.00012;
      scene.screenSpaceCameraController.minimumZoomDistance = 800;
      viewer.clock.currentTime = Cesium.JulianDate.now();
      viewer.clock.shouldAnimate = true; // the sun moves in real time

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

      const [lon, lat, h, heading, pitch] = VIEWS[0];
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
        orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
      });

      // The arrival globe turns slowly until someone touches it.
      let last = performance.now();
      let touched = 0;
      const stopSpin = () => { touched = performance.now(); };
      host.current.addEventListener("pointerdown", stopSpin);
      host.current.addEventListener("wheel", stopSpin, { passive: true });
      scene.preRender.addEventListener(() => {
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        if (screenRef.current === 0 && now - touched > 4000 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          viewer!.camera.rotate(Cesium.Cartesian3.UNIT_Z, -SPIN_RAD_PER_S * dt);
        }
      });

      const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction((event: { position: CesiumNS.Cartesian2 }) => {
        const picked = scene.pick(event.position);
        const id = picked?.id instanceof Cesium.Entity && picked.id.id.startsWith("sample:") ? picked.id.id.slice(7) : null;
        select(id);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      handler.setInputAction((event: { endPosition: CesiumNS.Cartesian2 }) => {
        const picked = scene.pick(event.endPosition);
        scene.canvas.style.cursor = picked?.id instanceof Cesium.Entity && picked.id.id.startsWith("sample:") ? "pointer" : "";
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

  // Fly to each screen's view. Lighting follows the real sun only on the globe.
  useEffect(() => {
    screenRef.current = screen;
    if (!api) return;
    const { Cesium, viewer } = api;
    const [lon, lat, h, heading, pitch] = VIEWS[screen];
    viewer.scene.globe.enableLighting = screen === 0;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, h),
      orientation: { heading: Cesium.Math.toRadians(heading), pitch: Cesium.Math.toRadians(pitch), roll: 0 },
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : screen === 0 ? 2.5 : 3.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, [api, screen]);

  // Gold pins: one thin column per sample, height by gold measured.
  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    const entities = samples.map((sample) => {
      const [lon, lat] = sample.geometry.coordinates;
      const height = pinHeight(sample);
      return viewer.entities.add({
        id: `sample:${sample.id}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, height / 2),
        cylinder: {
          length: height, topRadius: 85, bottomRadius: 85,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          material: Cesium.Color.fromCssColorString(GOLD),
        },
        show: false,
      });
    });
    return () => { entities.forEach((entity) => viewer.entities.remove(entity)); };
  }, [api, samples]);

  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    for (const sample of samples) {
      const entity = viewer.entities.getById(`sample:${sample.id}`);
      if (!entity?.cylinder) continue;
      entity.show = screen === 1 || screen === 2;
      const color = Cesium.Color.fromCssColorString(GOLD);
      const faded = screen === 2 ? color.withAlpha(0.35) : selectedId && selectedId !== sample.id ? color.withAlpha(0.45) : color;
      entity.cylinder.material = new Cesium.ColorMaterialProperty(selectedId === sample.id ? Cesium.Color.WHITE : faded);
    }
  }, [api, samples, screen, selectedId]);

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
    const active = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.fromCssColorString(GOLD).withAlpha(0.42));
    const lapsed = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.WHITE.withAlpha(0.14));
    const show = screen === 2 || screen === 4;
    const apply = () => {
      claims.features.forEach((feature, index) => {
        const state = screen === 4 ? claimState(feature.properties, new Date().getFullYear()) : claimState(feature.properties, year);
        const parts = feature.geometry.type === "Polygon" ? 1 : feature.geometry.coordinates.length;
        for (let part = 0; part < parts; part++) {
          const attributes = primitive.getGeometryInstanceAttributes(`claim:${index}:${part}`);
          if (!attributes) continue;
          attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(show && state !== "none", attributes.show);
          attributes.color = state === "active" ? active : lapsed;
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
  }, [api, claims, year, screen]);

  // Tok town, for the swarm screen.
  useEffect(() => {
    if (!api) return;
    const { Cesium, viewer } = api;
    const town = viewer.entities.add({
      id: "town",
      position: Cesium.Cartesian3.fromDegrees(...TOK_TOWN),
      point: { pixelSize: 10, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString(GOLD), outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: { text: "Tok, Alaska", font: "600 15px DM Sans, system-ui, sans-serif", fillColor: Cesium.Color.WHITE,
        showBackground: true, backgroundColor: Cesium.Color.fromCssColorString("#0b0d10").withAlpha(0.75),
        pixelOffset: new Cesium.Cartesian2(0, -24), heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY },
      show: false,
    });
    return () => { viewer.entities.remove(town); };
  }, [api]);

  useEffect(() => {
    const town = api?.viewer.entities.getById("town");
    if (town) town.show = screen === 1;
  }, [api, screen]);

  return <div ref={host} className="earth" aria-label="3D map of the Tok River valley, Alaska" role="img" />;
}
