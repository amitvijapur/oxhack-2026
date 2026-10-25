# Devpost submission draft

Draft for the OXHack 2026 Devpost entry, 25 October 2026. Copy each section into the matching Devpost field. The project name is **Orecast**. Every number below comes from the repository and the [pitch deck](README.md). Financial figures stay labelled hypothetical.

---

## Project name

Orecast

## Tagline

When gold evidence is old, the news is new and the buyer hasn't arrived: should you take a mineral option, and how long until it pays?

## Inspiration

Mineral land runs on several clocks at once:

- Geological evidence is collected years before anyone acts on it.
- News about mines and courts arrives day by day.
- A buyer for a mineral interest may take months to appear.

Most tools look at one clock. We wanted one decision that takes all three into account, for the TIME theme. We picked Tok River, Alaska, because it has public, dated sediment assays and public mining-claim records. Claims there have been staked, dropped and sold over the years.

## What it does

The user is an investor who holds a mineral option and must find a buyer before it expires.

- **Watch time run.** The app opens on a time-lapse from 2016 to today: claims held near Tok and the gold price, year by year. It then continues the 2020–2025 gold trend (14% a year) to 2031. That is a projection, not a prediction.
- **Explore the land.** A 3D globe of Tok River shows the following, each with its source and date:
  - 67 measured sediment samples
  - the state mining claims around them, with who holds each claim and when it was staked
  - context on the gold price
- **Screen the evidence.** Primary gold assays are checked against an explicit rule.
  - Area A passes: 25 of 33 samples.
  - Area B fails: 16 of 34.
  - Land records add a time story. Only 2 of A's samples sit in active claims, because its 2011 claims were mostly dropped. 20 of B's samples sit in active claims.
- **Test a scenario.** Recorded multi-agent simulations show how 61 simulated Tok stakeholders, in five groups, react to news such as a gold price jump, a mine approval or a court blockage. The groups are government, industry, community, funds and retail.
- **Test against history.** A historical event test uses real Alaska project announcements and public share prices: NOVAGOLD (Donlin) and Northern Dynasty (Pebble), with the GLD gold ETF as the gold reference.
  - The event adjustment is fitted only on earlier events (7 training events) and scored on 5 later, held-out events.
  - On those 5 events, the forecast with the event adjustment had a mean absolute error of 8.06 percentage points. "Gold-only drift" had 3.13 and "no change" had 2.56.
  - So the event signal did **not** beat the simple baselines. We show that result instead of hiding it.
- **Decide in time.** For a hypothetical assignable option, the model computes the chance of finding a buyer within 30, 90 or 180 days, the expected net cash, and a candidate or skip decision, with reasons.
  - At 90 days the example option has **+$7.60** expected net cash, yet **51.2%** of paths never sell.
  - At 30 days the expected cash is −$410; at 180 days it is +$369.89.
  - Raising the premium from $650 to $660 flips the decision to skip.

Every result can be traced back to its evidence, its scenario and its timing assumptions.

## How we built it

- **Data.** Every source is pinned with hashes and has its source date and retrieval date recorded.
  - Alaska DGGS RDF 2016-10 stream-sediment assays, split into Area A and Area B.
  - Alaska DNR state mining claims: 706 active and 763 closed in the search area. We matched each sample to the claims and land-status records that contain it.
  - Yearly holding costs from Alaska statutes and the Federal Register.
  - 7,253 state land sales from DNR's Sold Parcel Search.
  - World Bank monthly gold prices.
  - 10 priced Alaska mineral deals.
- **Simulation.** MiroFish multi-agent social simulations ran five days of posts by 61 stakeholder agents, with news on day 3. They include three baseline seeds, a sports-news placebo, mine-approval and court-blockage runs. Six of the nine planned runs were scored: 3,121 scored posts, rated 0–10 for support of mining by a judge model.
- **Event test.** A chronological test on real announcements by Alaska mining companies, using share returns. The model is fitted only on matured earlier events and scored on held-out later ones, against "no change" and "gold-only drift" baselines.
- **Model.** A pure JavaScript engine (Node 24) does the following:
  - screens evidence with conservative lower bounds
  - values a hypothetical option
  - models the sale chance in each 30-day interval, with fees, expiry and a 15-day closing buffer
  - selects a portfolio
  - reports exact cash outcomes and break-even thresholds

  The same engine powers the app, the command-line demo and the export.
- **App.** Next.js 16 and React 19 with a Cesium 1.146 globe, Esri imagery and Terrarium terrain. It has Land, Ground, Market and Decision tabs. An optional Convex backend stores attributed results, and a Python publisher sends them there.
- **Checks.**
  - Tests: 94 model, 23 frontend, 17 Convex and 16 Python publisher tests.
  - Type checks and a production build.
  - CI runs repository-hygiene and secret-scan checks.

## Challenges we ran into

- **No real prices for mineral options.** There is no public market for options on Tok mineral interests. We made the economics explicit, labelled assumptions and kept unknown inputs visible as unknown, instead of filling them with invented numbers.
- **Messy public data.**
  - The claim service's paging dropped records, so we fetched by ID instead.
  - The land-sale search only answers one auction at a time, so we made about 770 requests and checked the totals against DNR press releases.
- **Honest simulations.**
  - The approval and blockage runs moved support in the *opposite* direction to the headline story.
  - Placebo, mirror and grounding checks failed.
  - We show those results and failures instead of forcing the expected story.

## Accomplishments that we're proud of

- One decision that links evidence from 2016, five days of simulated news and a 30/90/180-day exit.
- Every number on screen carries its source. Failed checks stay visible.
- A clear finding about time: the same option loses money if you need a buyer in 30 days and earns money if you can wait 180 days.
- A dataset we built ourselves: claim histories, holding costs and land-sale prices for Alaska, by year, from official records.
- A real out-of-sample test against simple baselines. Our event signal lost to them, and the app says so.

## What we learned

- Positive expected cash can hide a likely loss. At 90 days the median outcome is −$700.
- When data was collected, when it was published and when you need to sell all change the answer.
- Simulated stakeholders are useful for exploring scenarios. They need placebos and controls before anyone should trust them with money.

## What's next

- Chronological validation with dated option prices and with completed and unsold assignments, compared against a simple baseline.
- Finishing the remaining simulation runs (tax rise, protest, gold reversal) and fixing the failed checks.
- Adding federal (BLM) claims and Native corporation land to the land layer.

## Built with

Next.js, React, TypeScript, JavaScript, Node.js, Cesium, Python, Convex, MiroFish, Claude, OpenAI, ArcGIS REST, Alaska DNR, Alaska DGGS, World Bank Pink Sheet, GitHub Actions

## Links and media

- **Try it out:** https://oxhack-land-arbitrage.vercel.app. This is the live site; every push to main that passes CI is deployed. The financial figures use hypothetical assumptions.
- **GitHub:** https://github.com/amitvijapur/oxhack-2026. The repository is private; it must be made public, or access confirmed with the organisers, before judges can open it.
- **Thumbnail:** the opening screen of the app ("Where could it go from here?"), 1500×1000.
- **Images:** app screenshots of the land explorer, the claims by staked year, a plot sheet, the Market, Swarm and Decision tabs; [preview.png](preview.png); and the land chart [alaska-gold-price-vs-land-price-vs-claim-rent-2000-2025.png](https://github.com/amitvijapur/oxhack-2026/blob/arjin/tok-land-data/research/tok-land/img/alaska-gold-price-vs-land-price-vs-claim-rent-2000-2025.png).
- **Video (2–3 minutes):** follow slides 1, 3, 4, 6 and 7 of [rehearsal.md](rehearsal.md), then show the live premium change from $650 to $660.

## Team

- **Amit:** evidence packs, app and integration.
- **Salman:** decision model.
- **Muhd:** stakeholder simulations.
- **Arjin:** land, claims and cost data.

## Before submitting

- [ ] Confirm the deadline with an organiser. Our working assumption is Sunday 12:00.
- [ ] Add all four teammates to the Devpost project.
- [ ] Decide whether the repository goes public.
- [ ] Select the challenges: HRT (best use of data for predictions and decision-making) and any others the team enters.
