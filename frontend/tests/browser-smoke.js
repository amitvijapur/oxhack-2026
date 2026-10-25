async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:3000/');
  await page.getByRole('heading', { name: 'Compare the two areas' }).waitFor();
  await page.waitForFunction(() => document.querySelector('.globe-frame')?.dataset.mapStatus === 'ready');
  // The globe flies down to Tok first; sample markers exist only after it lands.
  await page.getByRole('link', { name: 'Explore the map' }).click();
  await page.waitForFunction(() => document.querySelector('.globe-frame')?.dataset.arrived === 'true', null, { timeout: 30000 });
  check((await page.locator('h1').innerText()).includes('gold worth claiming near Tok'), 'Hero question missing');
  await page.getByRole('button', { name: 'Browse all 67 samples' }).click();
  await page.evaluate(() => document.fonts.ready);
  check(await page.locator('[data-sample-id]').count() === 67, 'All view must contain 67 map markers');
  check(await page.locator('tbody tr').count() === 67, 'Sample table must contain 67 records');
  check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Desktop horizontal overflow');
  await page.screenshot({ path: 'frontend/artifacts/desktop.png', fullPage: true });

  const filters = page.getByRole('group', { name: 'Filter and frame sampling area' });
  await filters.getByRole('button', { name: /^Tok east/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-sample-id]').length === 34);
  // The map sits below the hero; bring it into view before clicking a marker.
  await page.locator('.map-shell').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  const point = await page.locator('[data-sample-id="16MBW012"]').boundingBox();
  await page.mouse.click(point.x + point.width / 2, point.y + point.height / 2);
  await page.getByRole('button', { name: 'Inspect nearby sample 16MBW012', exact: true }).click();
  const drawer = page.locator('.sample-drawer');
  await drawer.getByRole('heading', { name: '16MBW012' }).waitFor();
  await drawer.getByText('Lab details', { exact: true }).click();
  check(await drawer.getByText('>1 ppm', { exact: true }).count() === 1, 'Qualified primary gold not displayed');
  check(await drawer.getByText('1.1 ppm', { exact: true }).count() === 1, 'Separate retest not displayed');
  check((await drawer.innerText()).includes('PGM-MS23') && (await drawer.innerText()).includes('Au-AA25'), 'Methods must remain separate');
  check((await drawer.innerText()).includes('-143.388173') && (await drawer.innerText()).includes('63.163121'), 'Selected sample coordinates wrong');
  check((await drawer.innerText()).includes('-2'), 'Primary raw qualification missing');
  await page.screenshot({ path: 'frontend/artifacts/sample-details.png', fullPage: true });
  await drawer.getByRole('button', { name: 'Close sample details' }).click();
  check(await page.locator('[data-sample-id="16MBW012"]').evaluate(el => document.activeElement === el), 'Closing drawer must restore keyboard focus');

  await page.getByRole('button', { name: 'Frame Tok west on map' }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-sample-id]').length === 33);
  await filters.getByRole('button', { name: /^All/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-sample-id]').length === 67);
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  const search = page.getByRole('searchbox');
  await search.fill('16MBW012');
  check(await page.locator('tbody tr').count() === 1, 'Search must isolate selected sample');
  await page.getByRole('button', { name: '16MBW012', exact: true }).focus();
  await page.keyboard.press('Enter');
  await drawer.getByRole('heading', { name: '16MBW012' }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Compare the two areas' }).waitFor();
  await search.fill('no-such-sample');
  check(await page.locator('tbody tr').count() === 0, 'Empty search should show no records');
  check((await page.locator('.no-records').innerText()).includes('No samples match'), 'Missing empty-search feedback');
  await search.fill('');

  const timeline = await page.locator('.timeline-section').innerText();
  check(timeline.includes('Jun–Jul 2016') && timeline.includes('Nov 2016'), 'Timeline must preserve month precision');
  const streams = await page.locator('.workstreams').innerText();
  check(['Amit', 'Arjin', 'Muhd', 'Salman'].every(value => streams.includes(value)), 'Workstream owners missing');
  check(/Live|Coming soon/.test(streams), 'Workstream statuses missing');
  check(await page.locator('.workstream').count() === 4, 'Must show the four pieces');
  check((await page.locator('.evidence-footer').innerText()).includes('RDF 2016-10'), 'DGGS attribution missing');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Horizontal overflow at ${width}px`);
    check(await page.locator('[data-sample-id]').count() === 67, 'Mobile lost sample markers');
    await page.waitForFunction(() => {
      const frame = document.querySelector('.globe-frame').getBoundingClientRect();
      return [...document.querySelectorAll('[data-sample-id]')].every((marker) => {
        const box = marker.getBoundingClientRect();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        return x >= frame.left && x <= frame.right && y >= frame.top && y <= frame.bottom;
      });
    });
    if (width === 390) await page.screenshot({ path: 'frontend/artifacts/mobile.png', fullPage: true });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/data/gold-frontend-data.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.reload();
  await page.getByRole('heading', { name: 'Evidence could not be loaded' }).waitFor();
  check(await page.getByRole('button', { name: 'Retry loading evidence' }).isVisible(), 'Failed load needs retry');
  await page.unroute('**/data/gold-frontend-data.json');
  await page.getByRole('button', { name: 'Retry loading evidence' }).click();
  await page.getByRole('heading', { name: 'Compare the two areas' }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('[data-sample-id]').length === 67);

  const fallbackPage = await page.context().newPage();
  await fallbackPage.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).includes('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await fallbackPage.goto('http://127.0.0.1:3000/');
  await fallbackPage.locator('.sample-plot').waitFor();
  check(await fallbackPage.locator('[data-sample-id]').count() === 67, 'No-WebGL fallback lost samples');
  await fallbackPage.locator('[data-sample-id="16MBW012"]').focus();
  await fallbackPage.keyboard.press('Enter');
  await fallbackPage.getByRole('button', { name: 'Inspect nearby sample 16MBW012', exact: true }).click();
  await fallbackPage.locator('.sample-drawer').getByRole('heading', { name: '16MBW012' }).waitFor();
  await fallbackPage.close();
  await page.evaluate(() => window.scrollTo(0, 0));
  check(errors.length === 0, `Unexpected runtime errors: ${errors.join('; ')}`);
  return { result: 'pass', markerCounts: [67, 34, 33, 67], viewportWidths: [1440, 390, 320], qualifiedSample: '16MBW012', retries: 'passed', noWebGLFallback: 'passed', runtimeErrors: errors };
}
