async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/');

  // Opening: the time-lapse plays from 1975 to today by itself, and the counters follow.
  await page.getByText('Land Arbitrage: Gold').first().waitFor();
  await page.locator('.tl-year').waitFor({ timeout: 20000 });
  const early = Number(await page.locator('.tl-year').textContent());
  check(early < 2026, `Time-lapse should start in the past, got ${early}`);
  await page.waitForFunction(() => document.querySelector('.tl-year')?.textContent === '2026', null, { timeout: 30000 });
  check((await page.locator('.tl-readout').innerText()).includes('Claims held near Tok'), 'Readout missing');
  await page.waitForFunction(() => /\$[\d,]+/.test(document.querySelector('.live')?.innerText ?? ''), null, { timeout: 15000 });
  await page.getByRole('slider', { name: 'Year' }).fill('1990');
  check(await page.locator('.tl-year').textContent() === '1990', 'Scrubbing did not move the year');
  await page.screenshot({ path: 'frontend/artifacts/0-timelapse.png' });

  // Explorer: Overview gives the answer first.
  await page.getByRole('button', { name: /Explore the land/ }).click();
  const panel = page.getByRole('complementary', { name: 'Explorer' });
  await panel.waitFor();
  check(await page.getByRole('tab', { name: 'Overview' }).getAttribute('aria-selected') === 'true', 'Overview must open first');
  check((await panel.innerText()).includes('SKIP'), 'Overview must show the signal');
  check(await page.getByRole('img', { name: 'OxHack' }).count() === 1, 'OxHack credit missing');
  await page.screenshot({ path: 'frontend/artifacts/1-overview.png' });

  // Ground: the element picker, and what travels with gold.
  await page.getByRole('tab', { name: 'Ground' }).click();
  const ground = await panel.innerText();
  check(ground.includes('49 elements') && ground.includes('What travels with gold here'), 'Ground tab incomplete');
  await page.getByRole('radio', { name: 'As' }).click();
  check(await page.getByRole('radio', { name: 'As' }).getAttribute('aria-checked') === 'true', 'Element picker did not select arsenic');
  await page.getByText('Show the bedrock map and known mines on the map').click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'frontend/artifacts/2-ground.png' });

  // Market: six series that follow the year.
  await page.getByRole('tab', { name: 'Market' }).click();
  check(await page.locator('.mini-chart').count() === 6, 'Market timeline needs six series');

  // Decision: SKIP by default, BUY only at the optimistic end with early completion; the town plays a day.
  await page.getByRole('tab', { name: 'Decision' }).click();
  const signal = page.locator('.verdict-row .signal');
  check(await signal.innerText() === 'SKIP', 'Default decision must be SKIP');
  await page.locator('#q-slider').focus();
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('.verdict-row .signal')?.textContent === 'BUY');
  check((await page.locator('.verdict-row').innerText()).includes('+$1,499'), 'Optimistic world value wrong');
  check(await page.locator('.sell-chart').count() === 1, 'Sell line missing');
  await page.screenshot({ path: 'frontend/artifacts/3-decision-buy.png' });
  await page.getByText('We may pay the rest early to close a sale').click();
  await page.waitForFunction(() => document.querySelector('.verdict-row .signal')?.textContent === 'SKIP');
  check((await panel.innerText()).includes("can't be sold until every stage is paid"), 'No-acceleration note missing');
  await page.getByRole('button', { name: 'Play the day' }).click();
  await page.getByRole('button', { name: 'Play again' }).waitFor({ timeout: 30000 });
  check((await page.locator('.swarm .mini-stats').innerText()).includes('277'), 'The town did not post all 277 scored posts');

  // Escape returns to the time-lapse.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Explore the land/ }).waitFor();

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Horizontal overflow at ${width}px`);
  }
  await page.screenshot({ path: 'frontend/artifacts/mobile.png' });

  // Missing data: say so instead of showing a blank page.
  const broken = await page.context().newPage();
  await broken.route('**/data/showcase/decision.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await broken.goto('http://127.0.0.1:3000/');
  await broken.getByRole('alert').filter({ hasText: 'decision.json' }).waitFor();
  await broken.close();

  // No WebGL: the map is skipped with a note, and the explorer still works.
  const flat = await page.context().newPage();
  await flat.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).includes('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await flat.goto('http://127.0.0.1:3000/');
  await flat.getByText('could not start the 3D map').waitFor({ timeout: 20000 });
  await flat.getByRole('button', { name: /Explore the land/ }).click();
  await flat.getByRole('tab', { name: 'Decision' }).click();
  await flat.close();

  check(errors.length === 0, `Unexpected runtime errors: ${errors.join('; ')}`);
  return { result: 'pass', timelapse: [early, 2026], decision: { default: 'SKIP', optimistic: 'BUY +$1,499' }, viewportWidths: [1440, 390, 320], noWebGL: 'passed', runtimeErrors: errors };
}
