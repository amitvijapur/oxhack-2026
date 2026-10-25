// Cesium loads its workers, assets and widget CSS from CESIUM_BASE_URL at
// runtime, which bundling breaks. Copy its built static folders to
// public/vendor/cesium-<version>/ (Earth.tsx sets the base URL to match).
// Runs before `dev` and `build`.
import { cp, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('node_modules/cesium/package.json', root), 'utf8'));
for (const folder of ['Workers', 'Assets', 'ThirdParty', 'Widgets']) {
  await cp(new URL(`node_modules/cesium/Build/Cesium/${folder}/`, root),
    new URL(`public/vendor/cesium-${version}/${folder}/`, root), { recursive: true });
}
console.log(`Copied the Cesium ${version} static assets to public/vendor/.`);
