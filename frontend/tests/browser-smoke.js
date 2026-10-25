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

  // Explorer: the Land tab lists every sampled plot, richest first, with the signal on top.
  await page.getByRole('button', { name: /Explore the land/ }).click();
  const panel = page.getByRole('complementary', { name: 'Explorer' });
  await panel.waitFor();
  check(await page.getByRole('tab', { name: 'Land' }).getAttribute('aria-selected') === 'true', 'Land must open first');
  check((await panel.innerText()).includes('Inputs missing'), 'Land must preserve the canonical real-input gap');
  check(await page.getByRole('img', { name: 'OxHack' }).count() === 1, 'OxHack credit missing');
  const rows = page.locator('.plot-list button');
  check(await rows.count() === 57, 'Land tab must list 57 plots');
  check((await rows.first().innerText()).includes('B-19') && (await rows.first().innerText()).includes('>1'), 'Most gold must put B-19 (>1 ppm) first');
  await rows.nth(1).hover();
  check(await rows.nth(1).getAttribute('data-hover') !== null, 'Hovering a row must mark it');
  await page.getByRole('radio', { name: 'Held' }).click();
  const held = await rows.count();
  check(held > 0 && held < 57, 'Held filter must narrow the list');
  await page.getByRole('radio', { name: 'All' }).click();

  // The plot sheet: position, survey, elevation, ownership and value context; ‹ › steps through.
  await rows.first().click();
  const sheet = page.getByRole('region', { name: 'Plot B-19' });
  await sheet.waitFor();
  const text = await sheet.innerText();
  for (const part of ['Noah 183', '>1 ppm', 'T16N R11E', 'Claim record', 'Value context', 'State rent context', 'not option resale evidence']) {
    check(text.includes(part), `Plot sheet missing "${part}"`);
  }
  await page.waitForFunction(() => /~[\d,]+ m/.test(document.querySelector('.sheet')?.innerText ?? ''), null, { timeout: 20000 });
  await page.screenshot({ path: 'frontend/artifacts/1-plot-sheet.png' });
  await page.getByRole('button', { name: 'Next plot' }).click();
  await page.getByRole('region', { name: 'Plot B-17' }).waitFor();
  await page.getByRole('button', { name: 'Close plot' }).click();

  // Colour the land by ownership and by staked year.
  await page.getByRole('radio', { name: 'Ownership' }).click();
  check((await page.locator('.colorby .legend').innerText()).includes('Lapsed'), 'Ownership legend missing');
  await page.getByRole('radio', { name: 'Staked year' }).click();
  check((await page.locator('.colorby .legend').innerText()).includes('2025'), 'Staked-year legend missing');
  await page.getByRole('radio', { name: 'Gold', exact: true }).click();

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

  // Canonical decision model: explicit synthetic preset, percentages and live recalculation.
  await page.getByRole('tab', { name: 'Decision' }).click();
  const model = page.locator('#option-model');
  await model.getByRole('heading', { name: 'Hypothetical option model' }).waitFor();
  check(await model.getByLabel('Holding period').inputValue() === '90', 'Primary horizon must be 90 days');
  check(await model.getByRole('button', { name: 'Use conservative synthetic demo', exact: true }).getAttribute('aria-pressed') === 'true', 'Synthetic preset must be explicit');
  const expectedReturn = model.locator('.model-total-row td').last();
  check(await expectedReturn.innerText() === '1.52%', 'Preset return must use all upfront capital');
  check((await model.locator('.model-delta').innerText()).includes('+0.44 pp'), 'Return lift must use percentage points');
  await model.getByText('Contract economics', { exact: true }).click();
  await model.locator('#model-entryPremiumUsd').fill('800');
  check((await expectedReturn.innerText()).startsWith('-'), 'Higher premium must preserve negative return');
  check(await model.getByRole('button', { name: 'Use conservative synthetic demo', exact: true }).getAttribute('aria-pressed') === 'false', 'Editing assumptions must clear the exact preset badge');
  await model.getByText('Simulation source and import', { exact: true }).click();
  await model.getByRole('button', { name: 'Load synthetic group-score demo', exact: true }).click();
  check((await model.innerText()).includes('Synthetic fixture loaded'), 'Imported synthetic source must retain attribution');
  await model.getByRole('button', { name: 'Reset assumptions', exact: true }).click();
  check(await expectedReturn.innerText() === '1.52%', 'Reset must restore the preset');
  check(!(await model.innerText()).includes('Synthetic fixture loaded'), 'Reset must clear imported source attribution');
  await model.getByRole('button', { name: 'Use existing swarm results', exact: true }).click();
  check((await model.locator('.model-existing-context').innerText()).includes('The actual sign is retained'), 'Recorded source sign must remain explicit');
  check((await model.locator('.model-delta').innerText()).includes('-0.04 pp'), 'Recorded approval retains its negative return delta at the 1% cap');
  await model.getByLabel('Scenario comparison').selectOption('proposed_tax');
  check(await expectedReturn.innerText() === 'Not available', 'Missing recorded scenarios must remain unavailable');
  await model.getByRole('button', { name: 'Use conservative synthetic demo', exact: true }).click();
  await page.screenshot({ path: 'frontend/artifacts/3-canonical-model.png' });

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
  await broken.route('**/data/tok-gold/site-a/samples.geojson', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await broken.goto('http://127.0.0.1:3000/');
  await broken.getByRole('alert').filter({ hasText: 'samples.geojson' }).waitFor();
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
  return { result: 'pass', timelapse: [early, 2026], decision: { default: 'evidence only', demo: 'recalculates', real: 'cash unavailable' }, viewportWidths: [1440, 390, 320], noWebGL: 'passed', runtimeErrors: errors };
}
