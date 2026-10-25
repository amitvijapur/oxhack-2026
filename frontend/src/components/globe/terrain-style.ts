import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

export const TERRAIN_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const TERRAIN_PITCH = 48;
export const TERRAIN_BEARING = -12;
export const TERRAIN_EXAGGERATION = 1.35;
export const TERRAIN_ATTRIBUTION =
  'Terrain: <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Mapzen / USGS / ArcticDEM attribution</a>';

const TERRAIN_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/** Zoom where the night globe has fully become the daylight terrain map. */
const DAY_ZOOM = 6.5;
/** Night at globe zooms, the terrain colour by DAY_ZOOM: the descent "lights up" Alaska. */
const dusk = (night: string, day: string): ExpressionSpecification =>
  ["interpolate", ["linear"], ["zoom"], 1.5, night, DAY_ZOOM, day];

const FILL_TREATMENTS: Record<string, Record<string, unknown>> = {
  park: { "fill-color": "#6f8b5e", "fill-opacity": 0.7, "fill-outline-color": "#698653" },
  landcover_wood: { "fill-color": dusk("#13261f", "#5d8058"), "fill-opacity": 0.86 },
  landcover_grass: { "fill-color": dusk("#182a22", "#96aa7d"), "fill-opacity": 0.74 },
  landcover_ice: { "fill-color": dusk("#3a4e63", "#d5e3db"), "fill-opacity": 0.92 },
  landcover_wetland: { "fill-color": "#789b81", "fill-opacity": 0.65 },
  landcover_sand: { "fill-color": "#b9b28a", "fill-opacity": 0.85 },
  landuse_residential: { "fill-color": "#a0aa8e", "fill-opacity": 0.68 },
  landuse_pitch: { "fill-color": "#8ca572" },
  landuse_track: { "fill-color": "#8ca572" },
  landuse_cemetery: { "fill-color": "#91a477" },
  landuse_hospital: { "fill-color": "#b8b5a1" },
  landuse_school: { "fill-color": "#b1b59c" },
};

type Layer = StyleSpecification["layers"][number] & {
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  "source-layer"?: string;
};

/**
 * Restyle real cartographic features and elevation without changing geography:
 * a night globe at low zoom that turns into green land cover and shaded relief
 * as the camera descends on Tok. Terrain itself is switched on by GlobeMap
 * once the camera is close, so the globe never pays for 3D relief.
 */
export function createTerrainStyle(baseStyle: StyleSpecification): StyleSpecification {
  const style = structuredClone(baseStyle);

  // The vector land cover and real DEM provide the terrain treatment. The
  // low-zoom Natural Earth raster would otherwise wash out those colours.
  style.layers = style.layers.filter((layer) => layer.id !== "natural_earth");
  if (!style.layers.some((layer) => "source" in layer && layer.source === "ne2_shaded")) {
    delete style.sources.ne2_shaded;
  }

  for (const layer of style.layers as Layer[]) {
    layer.paint ??= {};
    const paint = layer.paint;
    const sourceLayer = layer["source-layer"];
    if (layer.type === "background") paint["background-color"] = dusk("#14233a", "#839772");

    if (layer.type === "fill" && FILL_TREATMENTS[layer.id]) {
      Object.assign(paint, FILL_TREATMENTS[layer.id]);
      if (layer.id === "landcover_wetland") delete paint["fill-pattern"];
    }
    if (layer.id === "park_outline") paint["line-color"] = "#738e60";

    if (layer.type === "fill" && sourceLayer === "water") paint["fill-color"] = dusk("#050b16", "#6e9ba1");
    if (layer.type === "line" && sourceLayer === "waterway") paint["line-color"] = "#6e9ba1";
    if (layer.type === "line" && sourceLayer === "transportation") {
      paint["line-color"] = layer.id.includes("rail") ? "#65745e" : layer.id.includes("casing") ? "#78856c" : "#d3cfaa";
    }
    if (layer.type === "line" && sourceLayer === "boundary") paint["line-color"] = dusk("#2f4a6b", "#76876c");
    if (layer.type === "fill" && sourceLayer === "building") {
      paint["fill-color"] = "#a4ad96";
      paint["fill-outline-color"] = "#7f8e75";
    }
    if (layer.id === "building-3d") layer.layout = { ...layer.layout, visibility: "none" };
    if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      const waterLabel = ["water_name", "waterway"].includes(sourceLayer ?? "");
      paint["text-color"] = dusk(waterLabel ? "#6f93b8" : "#b7c6dc", waterLabel ? "#264f58" : "#283c2e");
      paint["text-halo-color"] = dusk("rgba(6,10,18,0.85)", waterLabel ? "#b6cecb" : "#dce5c9");
      paint["text-halo-width"] = 1.2;
      paint["text-halo-blur"] = 0.5;
    }
  }

  const demSource = {
    type: "raster-dem" as const,
    tiles: [TERRAIN_TILES],
    tileSize: 256,
    encoding: "terrarium" as const,
    maxzoom: 15,
    attribution: TERRAIN_ATTRIBUTION,
  };
  // Separate DEM sources for terrain and hillshade follow MapLibre's example.
  style.sources["tok-terrain"] = { ...demSource };
  style.sources["tok-hillshade"] = { ...demSource };

  // Relief above ground cover and below transport and text layers.
  const firstOverlay = style.layers.findIndex((layer) =>
    layer.type === "symbol" || ["transportation", "aeroway"].includes((layer as Layer)["source-layer"] ?? ""));
  style.layers.splice(firstOverlay < 0 ? style.layers.length : firstOverlay, 0, {
    id: "tok-terrain-relief",
    type: "hillshade",
    source: "tok-hillshade",
    minzoom: 4,
    paint: {
      "hillshade-shadow-color": "#2d4935",
      "hillshade-highlight-color": "#e1e9be",
      "hillshade-accent-color": "#6c855a",
      "hillshade-exaggeration": 0.48,
      "hillshade-illumination-direction": 315,
      "hillshade-illumination-anchor": "map",
    },
  });

  style.projection = { type: "globe" };
  // Atmosphere glow around the globe, fading out as the camera reaches the ground.
  style.sky = {
    "sky-color": "#0a1a33",
    "horizon-color": "#2b5a86",
    "fog-color": "#0b1424",
    "sky-horizon-blend": 0.7,
    "horizon-fog-blend": 0.6,
    "fog-ground-blend": 0.85,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 8, 0],
  };
  delete style.terrain;
  return style;
}
