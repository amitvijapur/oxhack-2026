// MapLibre 6 finds its worker beside its own module URL, which bundling breaks.
// Copy the worker into public/ under a versioned name; GlobeMap.tsx points
// setWorkerUrl() at it (MAP_WORKER_URL). Runs before `dev` and `build`.
import { copyFile, mkdir, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('node_modules/maplibre-gl/package.json', root), 'utf8'));
await mkdir(new URL('public/vendor/', root), { recursive: true });
await copyFile(
  new URL('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', root),
  new URL(`public/vendor/maplibre-gl-worker-${version}.mjs`, root),
);
console.log(`Copied the MapLibre ${version} worker to public/vendor/.`);
