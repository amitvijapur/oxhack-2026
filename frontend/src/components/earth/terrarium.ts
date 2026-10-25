import type * as CesiumNS from "@cesium/engine";

/**
 * Keyless 3D terrain for Cesium from the Terrarium elevation tiles the old MapLibre globe
 * read (s3.amazonaws.com/elevation-tiles-prod). Each PNG encodes height as
 * (R * 256 + G + B / 256) - 32768 metres on the Web Mercator z/x/y grid.
 *
 * Cesium asks for tiles on its own geographic grid, which also covers the poles; Web Mercator
 * stops at about 85°, so a Mercator-tiled terrain would leave a hole at the North Pole. Each
 * geographic sample is therefore projected into Mercator pixels and read from whichever
 * Terrarium tiles it falls in, and samples beyond 85° are sea level.
 */
const TERRARIUM_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
const MAX_ZOOM = 13;
const TILE = 256;
const SIZE = 65;
const MAX_LAT = 85.05;

async function pixels(z: number, x: number, y: number) {
  const response = await fetch(`${TERRARIUM_URL}/${z}/${x}/${y}.png`);
  if (!response.ok) throw new Error(`Terrain tile ${z}/${x}/${y}: HTTP ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height).data;
}

export function terrariumTerrain(Cesium: typeof CesiumNS) {
  const cache = new Map<string, Promise<Uint8ClampedArray>>();
  const tile = (z: number, x: number, y: number) => {
    const key = `${z}/${x}/${y}`;
    if (!cache.has(key)) {
      cache.set(key, pixels(z, x, y));
      if (cache.size > 384) cache.delete(cache.keys().next().value!);
    }
    return cache.get(key)!;
  };
  const tilingScheme = new Cesium.GeographicTilingScheme();

  return new Cesium.CustomHeightmapTerrainProvider({
    width: SIZE,
    height: SIZE,
    tilingScheme,
    credit: "Terrain: Mapzen Terrarium (AWS Open Data)",
    callback: async (x, y, level) => {
      // Mercator pixels at the same zoom are already finer than this tile's 65 samples, and
      // fewer source tiles per request keeps the valley loading fast.
      const z = Math.min(level, MAX_ZOOM);
      const world = TILE * 2 ** z;
      const rect = tilingScheme.tileXYToRectangle(x, y, level);
      const west = Cesium.Math.toDegrees(rect.west);
      const east = Cesium.Math.toDegrees(rect.east);
      const north = Cesium.Math.toDegrees(rect.north);
      const south = Cesium.Math.toDegrees(rect.south);

      // Global Mercator pixel of every sample, or -1 beyond the Mercator limit.
      const px = new Float64Array(SIZE);
      const py = new Float64Array(SIZE);
      for (let i = 0; i < SIZE; i++) {
        px[i] = ((west + ((east - west) * i) / (SIZE - 1) + 180) / 360) * world;
        const lat = north - ((north - south) * i) / (SIZE - 1);
        if (Math.abs(lat) > MAX_LAT) py[i] = -1;
        else {
          const phi = Cesium.Math.toRadians(lat);
          py[i] = ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * world;
        }
      }
      const clampPx = (v: number) => Math.min(world - 1, Math.max(0, Math.floor(v)));
      const needed = new Map<string, [number, number]>();
      for (let r = 0; r < SIZE; r++) {
        if (py[r] < 0) continue;
        for (let c = 0; c < SIZE; c++) {
          const tx = clampPx(px[c]) >> 8;
          const ty = clampPx(py[r]) >> 8;
          needed.set(`${tx}/${ty}`, [tx, ty]);
        }
      }
      const loaded = new Map<string, Uint8ClampedArray>();
      await Promise.all([...needed].map(async ([key, [tx, ty]]) => loaded.set(key, await tile(z, tx, ty))));

      const heights = new Float32Array(SIZE * SIZE);
      for (let r = 0; r < SIZE; r++) {
        if (py[r] < 0) continue; // polar cap: sea level
        const gy = clampPx(py[r]);
        for (let c = 0; c < SIZE; c++) {
          const gx = clampPx(px[c]);
          const data = loaded.get(`${gx >> 8}/${gy >> 8}`)!;
          const i = ((gy & 255) * TILE + (gx & 255)) * 4;
          heights[r * SIZE + c] = data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768;
        }
      }
      return heights;
    },
  });
}
