async page => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const heading = (name) => page.getByRole('heading', { name, exact: true }).waitFor({ timeout: 20000 });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/');

  // Arrival: the question, live ticker and the two ways in.
  await heading('Should we buy this piece of Alaska?');
  await page.getByRole('button', { name: /Go to Tok/ }).waitFor();
  await page.waitForFunction(() => document.querySelector('.ticker')?.innerText.includes('/oz'), null, { timeout: 15000 });
  await page.screenshot({ path: 'frontend/artifacts/0-arrival.png' });

  // 1. The ground: the richest sample is above the lab's upper limit and must read as such.
  await page.getByRole('button', { name: /Go to Tok/ }).click();
  await heading('Is there gold in the ground?');
  await page.getByRole('button', { name: /Show the richest sample, 16MBW012/ }).click();
  const callout = await page.locator('.callout').innerText();
  check(callout.includes('16MBW012') && callout.includes('>1 ppm'), `Richest sample callout wrong: ${callout}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'frontend/artifacts/1-ground.png' });

  // 2. The land: the scrubber changes the year and the claim count.
  await page.keyboard.press('ArrowRight');
  await heading('Who already owns it?');
  const held = async () => page.locator('.stat-row dd').nth(1).innerText();
  const now = await held();
  await page.getByRole('slider', { name: 'Year' }).fill('1990');
  check((await page.locator('.stat-row dd').first().innerText()) === '1990', 'Scrubber did not move the year');
  check((await held()) !== now, 'Claim count did not change with the year');
  await page.getByRole('slider', { name: 'Year' }).fill('2026');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'frontend/artifacts/2-land.png' });

  // 3. The people: a full simulated day plays and every scored post is counted.
  await page.getByRole('button', { name: 'What would the town think?' }).click();
  await heading('What would the town think?');
  check(await page.locator('.town-svg circle.town-dot').count() === 60, 'Town must show 60 people plus the news wire');
  await page.getByRole('button', { name: 'Play the day' }).click();
  await page.getByRole('button', { name: 'Play again' }).waitFor({ timeout: 30000 });
  const town = await page.locator('.stat-row').innerText();
  check(town.includes('24 / 24') && town.includes('277'), `Town did not finish the day: ${town}`);
  check(/\d\.\d/.test(await page.locator('.stat-row dd').nth(2).innerText()), 'Town mood missing');
  await page.screenshot({ path: 'frontend/artifacts/3-town.png' });

  // 4. The decision: SKIP by default, BUY only at the optimistic end with early completion.
  await page.getByRole('button', { name: 'So, do we buy?' }).click();
  await heading('So, do we buy?');
  const stamp = page.locator('.stamp');
  await stamp.waitFor({ timeout: 15000 });
  check(await stamp.innerText() === 'SKIP', 'Default decision must be SKIP');
  check((await page.locator('.board-overall').innerText()).includes('BUY in only 5'), 'Robust summary missing');
  await page.locator('#q-slider').focus();
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('.stamp')?.innerText === 'BUY', null, { timeout: 15000 });
  check((await page.locator('.verdict-line').innerText()).includes('+$1,499'), 'Optimistic world value wrong');
  await page.screenshot({ path: 'frontend/artifacts/4-decision-buy.png' });
  await page.getByText('We may pay the rest early to close a sale').click();
  await page.waitForFunction(() => document.querySelector('.stamp')?.innerText === 'SKIP', null, { timeout: 15000 });

  // Arrow keys move back through the steps; the stepper names each one.
  await page.keyboard.press('Escape');
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.getByRole('navigation', { name: 'Steps' }).getByRole('button', { name: 'The ground' }).click();
  await heading('Is there gold in the ground?');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Horizontal overflow at ${width}px`);
  }
  await page.screenshot({ path: 'frontend/artifacts/mobile-ground.png' });

  // Missing data: say so instead of showing a blank page.
  const broken = await page.context().newPage();
  await broken.route('**/data/showcase/decision.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await broken.goto('http://127.0.0.1:3000/');
  await broken.getByRole('alert').filter({ hasText: 'decision.json' }).waitFor();
  await broken.close();

  // No WebGL: the 3D map is skipped with a note, and the steps still work.
  const flat = await page.context().newPage();
  await flat.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).includes('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await flat.goto('http://127.0.0.1:3000/');
  await flat.getByText('could not start the 3D map').waitFor({ timeout: 20000 });
  await flat.getByRole('button', { name: /Go to Tok/ }).click();
  await flat.getByRole('heading', { name: 'Is there gold in the ground?' }).waitFor();
  await flat.close();

  check(errors.length === 0, `Unexpected runtime errors: ${errors.join('; ')}`);
  return { result: 'pass', screens: 5, richestSample: '16MBW012', decision: { default: 'SKIP', optimistic: 'BUY +$1,499' }, viewportWidths: [1440, 390, 320], noWebGL: 'passed', runtimeErrors: errors };
}
