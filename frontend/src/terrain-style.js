export const TERRAIN_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const TERRAIN_PITCH = 48;
export const TERRAIN_BEARING = -12;
export const TERRAIN_ATTRIBUTION = 'Terrain: <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Mapzen / USGS / ArcticDEM attribution</a>';

const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

const FILL_TREATMENTS = {
  park: { 'fill-color': '#6f8b5e', 'fill-opacity': 0.7, 'fill-outline-color': '#698653' },
  landcover_wood: { 'fill-color': '#5d8058', 'fill-opacity': 0.86 },
  landcover_grass: { 'fill-color': '#96aa7d', 'fill-opacity': 0.74 },
  landcover_ice: { 'fill-color': '#d5e3db', 'fill-opacity': 0.92 },
  landcover_wetland: { 'fill-color': '#789b81', 'fill-opacity': 0.65 },
  landcover_sand: { 'fill-color': '#b9b28a', 'fill-opacity': 0.85 },
  landuse_residential: { 'fill-color': '#a0aa8e', 'fill-opacity': 0.68 },
  landuse_pitch: { 'fill-color': '#8ca572' },
  landuse_track: { 'fill-color': '#8ca572' },
  landuse_cemetery: { 'fill-color': '#91a477' },
  landuse_hospital: { 'fill-color': '#b8b5a1' },
  landuse_school: { 'fill-color': '#b1b59c' },
};

/** Restyle actual cartographic features and elevation without changing geography. */
export function createTerrainStyle(baseStyle) {
  const style = structuredClone(baseStyle);

  // The vector land cover and real DEM provide the terrain treatment. The
  // low-zoom Natural Earth raster would otherwise wash out those colours.
  style.layers = style.layers.filter((layer) => layer.id !== 'natural_earth');
  if (!style.layers.some((layer) => layer.source === 'ne2_shaded')) {
    delete style.sources.ne2_shaded;
  }

  for (const layer of style.layers) {
    layer.paint ??= {};
    if (layer.type === 'background') layer.paint['background-color'] = '#839772';

    if (layer.type === 'fill' && FILL_TREATMENTS[layer.id]) {
      Object.assign(layer.paint, FILL_TREATMENTS[layer.id]);
      if (layer.id === 'landcover_wetland') delete layer.paint['fill-pattern'];
    }
    if (layer.id === 'park_outline') layer.paint['line-color'] = '#738e60';

    if (layer.type === 'fill' && layer['source-layer'] === 'water') {
      layer.paint['fill-color'] = '#6e9ba1';
    }
    if (layer.type === 'line' && layer['source-layer'] === 'waterway') {
      layer.paint['line-color'] = '#6e9ba1';
    }
    if (layer.type === 'line' && layer['source-layer'] === 'transportation') {
      layer.paint['line-color'] = layer.id.includes('rail') ? '#65745e'
        : layer.id.includes('casing') ? '#78856c' : '#d3cfaa';
    }
    if (layer.type === 'line' && layer['source-layer'] === 'boundary') {
      layer.paint['line-color'] = '#76876c';
    }
    if (layer.type === 'fill' && layer['source-layer'] === 'building') {
      layer.paint['fill-color'] = '#a4ad96';
      layer.paint['fill-outline-color'] = '#7f8e75';
    }
    if (layer.id === 'building-3d') {
      layer.layout = { ...layer.layout, visibility: 'none' };
    }
    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      const waterLabel = ['water_name', 'waterway'].includes(layer['source-layer']);
      layer.paint['text-color'] = waterLabel ? '#264f58' : '#283c2e';
      layer.paint['text-halo-color'] = waterLabel ? '#b6cecb' : '#dce5c9';
      layer.paint['text-halo-width'] = 1.2;
      layer.paint['text-halo-blur'] = 0.5;
    }
  }

  const demSource = {
    type: 'raster-dem',
    tiles: [TERRAIN_TILES],
    tileSize: 256,
    encoding: 'terrarium',
    maxzoom: 15,
    attribution: TERRAIN_ATTRIBUTION,
  };
  style.sources['tok-terrain'] = { ...demSource };
  style.sources['tok-hillshade'] = { ...demSource };

  // Separate DEM sources for terrain and hillshade follow MapLibre's example.
  // Put relief above ground cover and below transport and text layers.
  const firstOverlay = style.layers.findIndex((layer) =>
    layer.type === 'symbol' || ['transportation', 'aeroway'].includes(layer['source-layer']));
  style.layers.splice(firstOverlay < 0 ? style.layers.length : firstOverlay, 0, {
    id: 'tok-terrain-relief',
    type: 'hillshade',
    source: 'tok-hillshade',
    paint: {
      'hillshade-shadow-color': '#2d4935',
      'hillshade-highlight-color': '#e1e9be',
      'hillshade-accent-color': '#6c855a',
      'hillshade-exaggeration': 0.48,
      'hillshade-illumination-direction': 315,
      'hillshade-illumination-anchor': 'map',
    },
  });
  style.terrain = { source: 'tok-terrain', exaggeration: 1.35 };
  return style;
}
