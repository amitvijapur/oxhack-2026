async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/');

  // Opening: a still of the map at once, then the live map; history plays from 2016 to today,
  // rests on today, and carries on into the five-year gold projection.
  await page.getByText('Orecast').first().waitFor();
  await page.locator('.map-snapshot img').first().waitFor({ state: 'attached' });
  const opening = page.locator('.timelapse');
  await opening.waitFor({ timeout: 20000 });
  check(await page.getByRole('link', { name: 'Swarm' }).getAttribute('href') === '/swarm', 'The opening must link to the swarm page');
  const years = page.getByRole('slider', { name: 'Year' });
  check(await years.getAttribute('min') === '2016' && await years.getAttribute('max') === '2031', 'Opening must run 2016 to 2031');
  await page.waitForFunction(() => document.querySelector('.explorer')?.dataset.earth === 'ready', null, { timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('input[aria-label="Year"]')?.value === '2031', null, { timeout: 60000 });
  const future = await opening.innerText();
  check(future.includes('not a prediction') && future.includes('Gold, projected') && future.includes('no claims projection'), 'Projection must be labelled and claims must not be projected');
  await page.waitForFunction(() => /\$[\d,]+/.test(document.querySelector('.live')?.innerText ?? ''), null, { timeout: 15000 });
  await page.screenshot({ path: 'frontend/artifacts/0-projection.png' });
  await years.fill('2020');
  check(await page.locator('.tl-year').textContent() === '2020', 'Scrubbing did not move the year');
  check((await opening.innerText()).includes('Gold, yearly average'), 'History years must show measured gold');
  await page.getByRole('radio', { name: 'Since 1975' }).click();
  check(await years.getAttribute('min') === '1975', 'History must reach back to 1975');
  await years.fill('1990');
  check(await page.locator('.tl-year').textContent() === '1990', 'Scrubbing did not move the year');
  await page.screenshot({ path: 'frontend/artifacts/0b-history.png' });
  await page.getByRole('button', { name: 'Jump to today' }).click();
  check(await page.locator('.tl-year').textContent() === '2026', 'Jump to today must land on 2026');

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
  // Team land bundle: the recorded layers at each sample point.
  check(text.includes('Land records at the sample point') && /ADL \d+/.test(text), 'Plot sheet must list the land records at its samples');
  await page.screenshot({ path: 'frontend/artifacts/1-plot-sheet.png' });
  // The 3D terrain view draws only surface samples: nothing invented underground.
  await page.getByRole('button', { name: 'Terrain and samples in 3D' }).click();
  const block = page.getByRole('dialog', { name: 'Terrain and samples at plot B-19' });
  await block.waitFor();
  check((await block.innerText()).includes('no drilling data'), '3D view must say there is no drilling data');
  await page.keyboard.press('Escape');
  await block.waitFor({ state: 'detached' });
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
  check(ground.includes('The gold evidence, area by area') && ground.includes('1.1 ppm') && ground.includes('31.6 ppm'), 'A/B evidence card must show primary, retest and lithium separately');
  await page.getByText('Show the bedrock map and known mines on the map').click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'frontend/artifacts/2-ground.png' });

  // Market: six series that follow the year.
  await page.getByRole('tab', { name: 'Market' }).click();
  check(await page.locator('.mini-chart').count() === 6, 'Market timeline needs six series');
  const market = await panel.innerText();
  check(market.includes('correlate at 0.19') && market.includes('What mineral ground has cost') && market.includes('Source quality'), 'Market facts must be computed and the land costs shown');

  // Swarm: the pinned MiroFish runs, their spread and the failed checks, as reported.
  await page.getByRole('tab', { name: 'Swarm' }).click();
  const swarm = await panel.innerText();
  for (const part of ['6/9', '26/30', '8 of 20 grounded', 'Court blocks mine', 'not run', 'Effect against baseline']) {
    check(swarm.includes(part), `Swarm tab missing "${part}"`);
  }
  check(await panel.locator('.swarm-chart path.swarm-band').count() === 1, 'Swarm chart must draw the baseline band');
  await page.getByRole('radio', { name: /Government/ }).click();
  await page.screenshot({ path: 'frontend/artifacts/2b-swarm.png' });

  // Canonical decision model: explicit synthetic preset, percentages and live recalculation.
  await page.getByRole('tab', { name: 'Decision' }).click();
  const model = page.locator('#option-model');
  await model.getByRole('heading', { name: 'Hypothetical option model' }).waitFor();
  check(await model.getByLabel('Holding period').inputValue() === '90', 'Primary horizon must be 90 days');
  check(await model.getByRole('button', { name: 'Use conservative synthetic demo', exact: true }).getAttribute('aria-pressed') === 'true', 'Synthetic preset must be explicit');
  const expectedReturn = model.locator('.model-total-row td').last();
  check(await expectedReturn.innerText() === '-97.64%', 'Preset return must use all upfront capital');
  check((await model.locator('.model-delta').innerText()).includes('+0.01 pp'), 'Return lift must use percentage points');
  await model.getByText('Contract economics', { exact: true }).click();
  await model.locator('#model-entryPremiumUsd').fill('31000');
  check((await expectedReturn.innerText()).startsWith('-'), 'Higher premium must preserve negative return');
  check(await model.getByRole('button', { name: 'Use conservative synthetic demo', exact: true }).getAttribute('aria-pressed') === 'false', 'Editing assumptions must clear the exact preset badge');
  await model.getByText('Simulation source and import', { exact: true }).click();
  await model.getByRole('button', { name: 'Load synthetic group-score demo', exact: true }).click();
  check((await model.innerText()).includes('Synthetic fixture loaded'), 'Imported synthetic source must retain attribution');
  await model.getByRole('button', { name: 'Reset assumptions', exact: true }).click();
  check(await expectedReturn.innerText() === '-97.64%', 'Reset must restore the preset');
  check(!(await model.innerText()).includes('Synthetic fixture loaded'), 'Reset must clear imported source attribution');
  await model.getByRole('button', { name: 'Use existing swarm results', exact: true }).click();
  check((await model.locator('.model-existing-context').innerText()).includes('The actual sign is retained'), 'Recorded source sign must remain explicit');
  check(Number.parseFloat(await model.locator('.model-delta strong').last().innerText()) < 0, 'Recorded approval retains its negative return delta at the 1% cap');
  await model.getByLabel('Scenario comparison').selectOption('proposed_tax');
  check(await expectedReturn.innerText() === 'Not available', 'Missing recorded scenarios must remain unavailable');
  await model.getByRole('button', { name: 'Use conservative synthetic demo', exact: true }).click();
  await page.screenshot({ path: 'frontend/artifacts/3-canonical-model.png' });

  // Escape returns to the time-lapse.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Explore the land/ }).waitFor();

  // How it works: every step from data or the model, ending on what is still missing.
  await page.getByRole('button', { name: 'How it works' }).click();
  const story = page.getByRole('dialog', { name: 'How it works' });
  const storyText = await story.innerText();
  check(storyText.includes('25/33 · PASS') && storyText.includes('16/34 · FAIL'), 'Story must show the model evidence gate');
  check(storyText.includes('An available Tok option and verified terms'), 'Story must list the model gaps');
  await page.keyboard.press('Escape');
  await story.waitFor({ state: 'detached' });

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
  return { result: 'pass', opening: '2016 to today, then gold projected to 2031', history: [2016, 1975], decision: { default: 'evidence only', demo: 'recalculates', real: 'cash unavailable' }, viewportWidths: [1440, 390, 320], noWebGL: 'passed', runtimeErrors: errors };
}
