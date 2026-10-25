// Stills of the map at each camera view, shown while the live 3D map loads (see Explorer.tsx).
// Re-run when a view in Earth.tsx (VIEWS) or the claims data changes. Needs the dev server and
// Playwright with Chromium, without adding it to package.json:
//   npm run dev   (in another terminal)
//   [CHROMIUM_PATH=/path/to/chrome] npx -y -p playwright@1.61.1 node scripts/capture-map-snapshots.mjs [http://127.0.0.1:3000]
import { execFileSync } from 'node:child_process';
import { mkdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'snapshots');
// npx -p puts Playwright's bin on PATH, but ESM imports ignore it: resolve the package from the bin.
const bin = execFileSync('sh', ['-c', 'command -v playwright'], { encoding: 'utf8' }).trim();
const { chromium } = createRequire(realpathSync(bin))('playwright');
// Cesium keeps the horizontal field of view on landscape screens and the vertical one on portrait
// screens, so the stills are taller (landscape) or wider (portrait) than any screen they cover and
// are only ever cropped along the free axis (see .map-snapshot in explorer.css). 2× for sharp screens.
const SIZES = [{ suffix: '', width: 1600, height: 1250 }, { suffix: '-mobile', width: 800, height: 1000 }];

// Must match RECENT and LAST in src/components/explorer/Timelapse.tsx.
const YEARS = Array.from({ length: 11 }, (_, i) => 2016 + i);
const MANIFEST = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components', 'explorer', 'stills.json');

/** The pixel box where any frame differs from the first, padded: the part the claims recolour.
 *  Compared one pair at a time in a blank page, as full 2× frames are large. */
async function changedBox(browser, frames) {
  const page = await browser.newPage();
  let box = null;
  for (const frame of frames.slice(1)) {
    const found = await page.evaluate(async (urls) => {
      const [a, b] = await Promise.all(urls.map(async (url) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = new OffscreenCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, image.width, image.height);
      }));
      const { width, height } = a;
      let [x0, y0, x1, y1] = [width, height, -1, -1];
      for (let i = 0; i < a.data.length; i += 4) {
        if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) < 30) continue;
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
      return { width, height, x0, y0, x1, y1 };
    }, [frames[0], frame].map((png) => `data:image/png;base64,${png.toString('base64')}`));
    if (found.x1 < 0) continue;
    box = box ? { ...found, x0: Math.min(box.x0, found.x0), y0: Math.min(box.y0, found.y0), x1: Math.max(box.x1, found.x1), y1: Math.max(box.y1, found.y1) } : found;
  }
  await page.close();
  const pad = 16;
  const x = Math.max(0, box.x0 - pad) & ~1;
  const y = Math.max(0, box.y0 - pad) & ~1;
  return { width: box.width, height: box.height, x, y, w: Math.min(box.width, box.x1 + pad) - x, h: Math.min(box.height, box.y1 + pad) - y };
}

const webp = (png, name, args) => {
  const source = join(out, `${name}.png`);
  const target = join(out, `${name}.webp`);
  writeFileSync(source, png);
  execFileSync('cwebp', ['-quiet', '-m', '6', ...args, source, '-o', target]);
  rmSync(source);
  console.log(`${target} ${(statSync(target).size / 1024).toFixed(0)} KB`);
};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const manifest = { years: YEARS };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
try {
  for (const view of ['timelapse', 'explore']) {
    for (const { suffix, width, height } of SIZES) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
      await page.goto(`${base}/?snapshot=${view}`);
      await page.locator('.earth canvas').waitFor({ timeout: 60_000 });
      // The dev-server badge and the credits link are page chrome, not map; the live page shows its own.
      await page.addStyleTag({ content: 'nextjs-portal, .cesium-widget-credits, .cesium-credit-expand-link { display: none !important; }' });
      // The camera flies to the view, then every tile in view must have loaded and stayed loaded.
      await page.waitForTimeout(2_500);
      await page.waitForFunction(() => document.documentElement.dataset.tiles === 'loaded', null, { timeout: 90_000 });
      await page.waitForTimeout(2_000);
      await page.waitForFunction(() => document.documentElement.dataset.tiles === 'loaded', null, { timeout: 60_000 });
      if (view === 'explore') {
        webp(await page.screenshot(), `explore${suffix}`, ['-q', '62']);
        await page.close();
        continue;
      }
      // The opening plays 2016 to today over these until the live map is ready: the whole view as
      // of 2016, and for each later year only the patch where the claims recolour, laid on top.
      const frames = [];
      for (const year of YEARS) {
        await page.evaluate((y) => window.dispatchEvent(new CustomEvent('snapshot-year', { detail: y })), year);
        await page.waitForTimeout(700);
        frames.push(await page.screenshot());
      }
      const box = await changedBox(browser, frames);
      manifest[suffix ? 'portrait' : 'landscape'] = box;
      webp(frames[0], `timelapse${suffix}`, ['-q', '62']);
      frames.slice(1).forEach((png, i) => webp(png, `timelapse-${YEARS[i + 1]}${suffix}`, ['-q', '60', '-crop', box.x, box.y, box.w, box.h].map(String)));
      await page.close();
    }
  }
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${MANIFEST}`);
} finally {
  await browser.close();
}
