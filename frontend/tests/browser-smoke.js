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
  const years = page.getByRole('slider', { name: 'Year' });
  check(await years.getAttribute('min') === '2016' && await years.getAttribute('max') === '2031', 'Opening must run 2016 to 2031');
  check(await page.getByRole('link', { name: 'Swarm' }).getAttribute('href') === '/swarm', 'The opening must link to the swarm page');
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
  const today = await opening.innerText();
  const headerGold = (await page.locator('.live').innerText()).match(/\$[\d,]+/)?.[0];
  check(today.includes('Gold, live spot') && headerGold && today.includes(headerGold), 'Today must show the live gold price, the same as the header');
  check(!/months\)/.test(today), 'The part-year 2026 average must not sit beside the live price');

  // Explorer: four tabs, and Decide opens first with each site's evidence-screen call and the header's gold price.
  await page.getByRole('button', { name: /Explore the land/ }).click();
  const panel = page.getByRole('complementary', { name: 'Explorer' });
  await panel.waitFor();
  check((await page.getByRole('tab').allInnerTexts()).join('|') === 'Decide|Land|Crowd|Swarm', 'The panel must have Decide, Land, Crowd and Swarm tabs');
  check(await page.getByRole('tab', { name: 'Decide' }).getAttribute('aria-selected') === 'true', 'Decide must open first');
  const call = page.locator('.decide .answer-signal');
  await page.waitForFunction(() => /^(Screen passed|Screen failed)$/.test(document.querySelector('.decide .answer-signal')?.textContent ?? ''), null, { timeout: 15000 });
  const top = await page.locator('.decide').innerText();
  const decideGold = (await page.locator('.live').innerText()).match(/\$[\d,]+/)?.[0];
  check(decideGold && top.includes(decideGold), 'Decide must show the same gold price as the header');
  check(top.includes('Site A · Screen passed · passes the gold-evidence screen'), 'Site A must show its call and reason');
  const decide = await panel.evaluate((el) => el.textContent);
  check(!top.includes('BUY') && !top.includes('SKIP'), 'The geological screen must not be a trading instruction');
  for (const part of ['Hypothetical economics', 'Financial decision and cash risk', 'Probability of no sale', 'Probability of negative net cash', 'Maximum entry premium']) check(decide.includes(part), `Decide missing ${part}`);
  const financial = panel.locator('.financial-decision');
  check((await financial.innerText()).includes('12.82%') && (await financial.innerText()).includes('+0.47 pp'), 'Default financial scenario must use the canonical small-response synthetic preset');
  await panel.getByLabel('Holding period').selectOption('30');
  check((await financial.innerText()).includes('Skip hypothetical contract') && (await financial.innerText()).includes('-53.76%'), '30-day whole-contract cash return must be recalculated');
  await panel.getByLabel('Holding period').selectOption('180');
  check((await financial.innerText()).includes('70.58%'), '180-day return must be recalculated');
  await panel.getByLabel('Holding period').selectOption('90');
  await panel.getByLabel('Financial scenario').selectOption('mine_approval');
  check((await financial.innerText()).includes('-0.02 pp'), 'Recorded approval must retain its negative contrast');
  await panel.getByLabel('Financial scenario').selectOption('synthetic');
  for (const part of ['Whole contract', '$30,050', '$3,850.98', '$69,519.23', '12.35%', '1.09%', 'FAIL', '23,076.9', '$184,615.38', '51.2% no sale', '-$30,050.00 cash if unsold by day 90']) check((await financial.innerText()).includes(part), `Whole-contract summary missing ${part}`);
  await financial.getByText('Required resale hurdle for a 25% return', { exact: true }).click();
  check((await financial.innerText()).includes('$77,022.34'), 'Required proceeds must remain a target hurdle rather than a model assignment price');
  await financial.getByText('Required resale hurdle for a 25% return', { exact: true }).click();
  await call.scrollIntoViewIfNeeded();
  const box = await page.locator('.decide').boundingBox();
  check(box && box.y + box.height <= 900, 'The Decide top block must fit without scrolling');
  await page.getByRole('radio', { name: /Site B/ }).click();
  check(await call.innerText() === 'Screen failed', 'Site B must show a failed geological screen');
  check((await page.locator('.decide').innerText()).includes('fails the gold-evidence screen (16 of 34 samples, needs 17)'), 'Site B must give its screen counts');
  check((await financial.innerText()).includes('Skip hypothetical contract'), 'Site B must remain ineligible at the whole-contract cost');
  await page.getByRole('radio', { name: /Site A/ }).click();
  await page.screenshot({ path: 'frontend/artifacts/1-decide.png' });
  await panel.getByText('Detailed hypothetical model', { exact: true }).click();
  const model = page.locator('#option-model');
  await model.getByRole('heading', { name: 'Hypothetical option model', exact: true }).waitFor();
  check(await model.getByLabel('Comparison area').inputValue() === 'A', 'Detailed model starts at active Site A');
  check(await model.locator('#model-entryPremiumUsd').inputValue() === '30000', 'Detailed controls retain historical whole-contract default');
  check(await model.locator('.model-total-row td').last().innerText() === '12.82%', 'Synthetic workbench remains separate from baseline');
  await model.getByText('Contract economics', { exact: true }).click();
  await model.locator('#model-entryPremiumUsd').fill('35000');
  check((await model.locator('.model-total-row td').last().innerText()).startsWith('-'), 'Higher premium changes cash without changing synthetic exposure');
  await model.getByRole('button', { name: 'Reset assumptions', exact: true }).click();
  check(await model.locator('#model-entryPremiumUsd').inputValue() === '30000', 'Reset restores lot default');
  await page.getByRole('radio', { name: /Site B/ }).click();
  check(await model.getByLabel('Comparison area').inputValue() === 'B', 'Detailed model follows active site after switching');
  await page.getByRole('radio', { name: /Site A/ }).click();
  await panel.getByText('Detailed hypothetical model', { exact: true }).click();
  check(await panel.getByText('Historical validation · event model did not beat baseline', { exact: true }).count() === 1, 'Negative historical validation stays accessible');

  // Land: every sampled plot, richest first; All and Held only.
  await page.getByRole('tab', { name: 'Land' }).click();
  check(await page.getByRole('img', { name: 'OxHack' }).count() === 1, 'OxHack credit missing');
  check(await page.getByRole('radio', { name: 'Unmatched' }).count() === 0, 'The Unmatched filter was cut');
  check((await page.getByLabel('Sort plots').locator('option').allInnerTexts()).join('|') === 'Most gold|Nearest Tok', 'Sort keeps only Most gold and Nearest Tok');
  const rows = page.locator('.plot-grid button');
  check(await rows.count() === 57, 'Land tab must list 57 plots');
  check((await rows.first().innerText()).includes('B-19') && (await rows.first().getAttribute('aria-label')).includes('>1 ppm'), 'Most gold must put B-19 (>1 ppm) first');
  await rows.nth(1).hover();
  check(await rows.nth(1).getAttribute('data-hover') !== null, 'Hovering a row must mark it');
  await page.getByRole('radio', { name: 'Held' }).click();
  const held = await rows.count();
  check(held > 0 && held < 57, 'Held filter must narrow the list');
  await page.getByRole('radio', { name: 'All' }).click();

  // The plot card: gold, claim, distance to Tok and comparable deals only; ‹ › steps through.
  await rows.first().click();
  const sheet = page.getByRole('region', { name: 'Plot B-19' });
  await sheet.waitFor();
  check(await rows.count() === 57, 'Selecting a plot must retain the complete overview');
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [320, 844]]) {
    await page.setViewportSize({ width, height });
    check(await page.locator('.panel-scroll').evaluate(el => el.scrollHeight <= el.clientHeight + 1), `Default Land must fit without scrolling at ${width}x${height}`);
    check(await page.locator('.plot-grid button').evaluateAll(buttons => buttons.every(button => {
      const box = button.getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
    })), `Every plot tile must remain visible at ${width}x${height}`);
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Land must not overflow horizontally at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await sheet.getByText('Comparable deals', { exact: true }).click();
  const text = await sheet.innerText();
  for (const part of ['Noah 183', '>1 ppm', 'To Tok', 'Held by', 'Comparable deals', 'not option resale evidence', 'Test this plot in Decide', 'View on map', 'DNR record']) {
    check(text.includes(part), `Plot card missing "${part}"`);
  }
  for (const part of ['T16N R11E', 'Elevation', 'Bedrock', 'State rent context', 'Travels with it', 'Land records at the sample point', 'Coordinates']) {
    check(!text.includes(part), `Plot card should no longer show "${part}"`);
  }
  await page.screenshot({ path: 'frontend/artifacts/2-plot-card.png' });
  // The 3D terrain view draws only surface samples: nothing invented underground.
  await page.getByRole('button', { name: 'Terrain and samples in 3D' }).click();
  const block = page.getByRole('dialog', { name: 'Terrain and samples at plot B-19' });
  await block.waitFor();
  check((await block.innerText()).includes('no drilling data'), '3D view must say there is no drilling data');
  await page.keyboard.press('Escape');
  await block.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Next plot' }).click();
  await page.getByRole('region', { name: 'Plot B-17' }).waitFor();
  await page.getByRole('button', { name: 'Previous plot' }).click();
  await page.getByRole('button', { name: /Test this plot in Decide/ }).click();
  check((await page.locator('.decide').innerText()).includes('Testing plot B-19'), 'Decide must name the plot it was sent');
  check(await call.innerText() === 'Screen failed', 'B-19 sits in Site B, so Decide must show Site B');
  await page.getByRole('tab', { name: 'Land' }).click();
  check(await rows.count() === 57, 'Returning to Land must retain the overview');

  // Colour the land by ownership and by staked year.
  await page.getByRole('radio', { name: 'Ownership' }).click();
  check((await page.locator('.colorby .legend').innerText()).includes('Lapsed'), 'Ownership legend missing');
  await page.getByRole('radio', { name: 'Staked year' }).click();
  check((await page.locator('.colorby .legend').innerText()).includes('2025'), 'Staked-year legend missing');
  await page.getByRole('radio', { name: 'Gold', exact: true }).click();
  check(await page.getByText('Geology: bedrock map and known mines').count() === 0, 'The bedrock map switch was cut');

  // Crowd: one chart per group, a line per judged scenario, the headlines and the one honest line.
  await page.getByRole('tab', { name: 'Crowd' }).click();
  check(await page.locator('.crowd-chart').count() === 5, 'Crowd needs one chart per group');
  check(await page.locator('.crowd-chart').first().locator('.crowd-line').count() === 4, 'Each chart needs the four judged scenarios');
  const crowd = await panel.innerText();
  check(crowd.includes('The geological screen does not use the crowd.') && crowd.includes('the price response is uncalibrated'), 'Crowd caveat missing');
  for (const part of ['not run', 'chance band', 'gpt-', 'glm-']) check(!crowd.toLowerCase().includes(part), `Crowd should not show "${part}"`);
  await page.screenshot({ path: 'frontend/artifacts/3-crowd.png' });

  // Swarm: the workflow in six steps, with a link to the full workflow page.
  await page.getByRole('tab', { name: 'Swarm' }).click();
  await page.locator('.wf-steps').waitFor();
  check(await page.locator('.wf-steps > li').count() === 6, 'Swarm tab needs the six workflow steps');
  const steps = await panel.innerText();
  check(steps.includes('Weighted signal') && steps.includes('Support scores'), 'Swarm tab must show the scores and the signal');
  for (const part of ['Effect against baseline', 'chance band', 'Checks from the swarm report', 'gpt-', 'glm-']) check(!steps.includes(part), `Swarm tab should not show "${part}"`);
  const full = page.getByRole('link', { name: /Open the full swarm workflow/ });
  check(await full.getAttribute('href') === '/swarm', 'The Swarm tab must link to the full workflow');
  const workflow = await page.context().newPage();
  await workflow.goto('http://127.0.0.1:3000/swarm');
  await workflow.getByTestId('swarm-workflow').waitFor();
  await workflow.close();
  await page.screenshot({ path: 'frontend/artifacts/4-swarm.png' });

  // Escape clears the selected map context, then returns to the time-lapse.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Explore the land/ }).waitFor();

  // How it works: every step from data or the model, ending on what is still missing.
  await page.getByRole('button', { name: 'How it works' }).click();
  const story = page.getByRole('dialog', { name: 'How it works' });
  const storyText = await story.innerText();
  check(storyText.includes('25/33 · PASS') && storyText.includes('16/34 · FAIL'), 'Story must show the model evidence gate');
  check(storyText.includes('An available Tok option and verified terms'), 'Story must list the model gaps');
  check(!storyText.includes('$4,500'), 'The story must not quote the simulated day-1 gold price');
  check(storyText.includes('A passed geological screen is only the first gate.'), 'Story must distinguish a geological screen from a trade');
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
  await flat.getByRole('tab', { name: 'Crowd' }).click();
  await flat.close();

  check(errors.length === 0, `Unexpected runtime errors: ${errors.join('; ')}`);
  return { result: 'pass', opening: '2016 to today, then gold projected to 2031', history: [2016, 1975], panel: ['Decide', 'Land', 'Crowd', 'Swarm'], viewportWidths: [1440, 390, 320], noWebGL: 'passed', runtimeErrors: errors };
}
