# Devpost submission draft

Draft for the OXHack 2026 Devpost entry, 25 October 2026. Copy each section into the matching Devpost field. The facts come from the live site (https://oxhack-land-arbitrage.vercel.app) and `main`. The money figures are hypothetical and are labelled that way.

---

## Project name

Orecast

## Tagline

Gold in the ground, claims on the map, news in the air: Orecast puts all three on one timeline and asks whether a mineral option can pay before time runs out.

## Inspiration

We started with a simple question: if you could buy a cheap option on a patch of Alaskan ground, how would you know whether it's worth it, and how long you'd have to wait to sell it on?

The more we dug, the clearer it became that the hard part is **time**:

- The geology was sampled in 2016 and published months later.
- The claims on that land have been staked, dropped and restaked since 1976.
- News moves the mood around a mine in days.
- A buyer for your option might show up in a month, or not for half a year.

Most tools look at one of those clocks. We wanted to put all of them on the same screen, for a real place, using real public data. We chose Tok River in Interior Alaska. The state has published stream-sediment assays there, the claim records are public, and there's real deal activity nearby. In September 2026 a deal was signed to sell a 249-claim project right next to one of our areas.

## What it does

Orecast opens on a 3D globe of Tok River and a time-lapse. Claims held near Tok and the gold price play out year by year from 2016 to today. The 2020–2025 gold trend (about 14% a year) is then carried forward to 2031, clearly marked as a projection, not a prediction.

From there you can explore five layers:

- **Ground.** 67 stream samples from the Alaska state survey, each measured for 49 elements. You can colour the map by any element.
  - 7 streams are in the top 10% for gold.
  - In most of those 7, tungsten, tellurium and copper run high at the same time. Geologists link that pattern to intrusion-related gold.
- **Land.** 1,469 real state mining claims near Tok, the first staked in 1976.
  - You can see who holds each one today: Contango, Peak Gold, the Delta Project and others.
  - You can see when it was staked, and which ones lapsed.
  - Click any sample and you get its plot sheet: gold grade, terrain in 3D, the bedrock underneath and the nearest held claim.
- **Market.** Ten years of gold price, claims staked and held, land prices per acre, and the yearly rent to hold a claim, all on charts that move together.
  - You can also see what companies actually paid for Alaska gold projects nearby, from a $50k related-party transfer up to the $1bn Donlin deal.
- **Swarm.** 61 simulated Tok stakeholders react to the same news for five simulated days, and we compare how scenarios like a mine approval or a court blockage shift their support. The groups are government, industry, community, funds and retail.
- **Decision.** An evidence gate first, then a hypothetical option model. Then a real-world check:
  - The gate: Area A passes, with 25 of 33 samples clearing the gold threshold. Area B fails, with 16 of 34.
  - The option model: for a 90-day holding period the example option returns about 1.1% on average. But there's a 51.2% chance it never sells at all.
  - The real-world check: a historical event test on real Alaska mining announcements.

Every number on the screen says where it came from. Anything we don't actually know is shown as missing instead of being quietly filled in.

## How we built it

**Data.** We used public, dated sources, pinned with hashes:

- Alaska DGGS stream-sediment geochemistry (RDF 2016-10)
- Alaska DNR state mining claims, active and closed. We matched each sample to the claims and land records that contain it.
- 7,253 state land sales from DNR's parcel search, cross-checked against DNR press releases
- Claim rent from Alaska statutes and BLM fees from the Federal Register
- World Bank monthly gold prices
- Priced Alaska mining deals from SEC filings and company releases

**Swarm.** We ran multi-agent social simulations with MiroFish. Stakeholder agents post for five simulated days with news on day 3, and a judge model scores each post 0–10 for support of mining.

- The runs are three baseline seeds, a sports-news placebo (to check if *any* news moves people), a mine approval and a court blockage.
- Six of the nine planned runs finished and were scored, giving 3,121 scored posts.

**Model.** A pure JavaScript engine is shared by the website, a command-line demo and an export tool. It:

- screens the evidence with conservative bounds
- values a hypothetical assignable option
- models the chance of finding a buyer in each 30-day window, including fees, expiry and a closing buffer
- reports exact cash outcomes and break-even points

**Event test.** We collected real announcements for NOVAGOLD (Donlin) and Northern Dynasty (Pebble), with the GLD gold ETF as the reference.

- Training uses only events whose outcome was already known at the time. Scoring is on later events the model never saw.
- The comparison is against two simple baselines: "no change" and "gold-only drift".

**App.** Built with Next.js, React and a Cesium 3D globe, using Esri imagery and Terrarium terrain. It's deployed on Vercel straight from our main branch after the tests pass. The project has tests for the model, the frontend, the backend and the data publisher, plus secret scanning in CI.

## Challenges we ran into

- **There's no market price for what we wanted to value.** Nobody publishes prices for options on small Alaskan mineral claims. Instead of inventing one, we made every money input an explicit, labelled assumption. With real data only, the app refuses to show a dollar figure.
- **Public data is messier than it looks.**
  - The claims service silently dropped records when we paged through it, so we re-fetched by ID.
  - The land-sale search only answers one auction at a time, so we made about 770 requests and checked the totals against the state's press releases.
- **Our own simulation disagreed with the story we expected.**
  - A court blocking the mine *raised* support among funds, the opposite of what we expected. A mine approval barely moved them.
  - The sports-news placebo moved government and industry agents too, so we can't yet tell a real reaction from noise.
  - We kept those results and the failed checks on screen instead of tuning the swarm until it agreed with us.
- **Different models across runs.** Baseline runs used OpenAI models and the scenario runs used Claude models with a different simulator version. That mixes the effect of the news with the effect of the setup, so we say so wherever the comparison appears.

## Accomplishments that we're proud of

- A single timeline that connects 2016 geology, 50 years of claim staking, five days of simulated news and a 30/90/180-day exit decision.
- A genuine out-of-sample test. On 5 held-out events the event model's error was 8.06 percentage points, against 2.56 for simply predicting "no change". It lost, and the app tells you that plainly.
- A land dataset for Tok we built from official records: who holds what, when it was staked, what land sells for and what it costs to hold a claim each year.
- A live site anyone can open, with every number traceable to its source.

## What we learned

- **Time changes the answer more than we expected.** The same option looks like a loss if you need a buyer within 30 days and a win if you can wait 180.
- **A positive average can hide a likely loss.** At 90 days the typical outcome is still that nothing sells.
- **Simulated people are a great way to explore scenarios, and a bad thing to trust blindly.** Placebos and controls aren't optional.
- **Being honest about what's missing makes the tool more useful, not less.**

## What's next

- Real option prices and real completed (and failed) sales, so we can measure time-to-sale instead of assuming it.
- Finishing the three missing swarm runs (tax rise, protest, gold falling back), and rerunning everything on one model setup so the scenarios are comparable.
- A bigger historical event sample, to see whether any news signal actually beats "no change".
- Federal (BLM) claims and Native corporation land on the map.

## Built with

nextjs, react, typescript, javascript, node.js, cesium, three.js, python, convex, vercel, mirofish, claude, openai, arcgis, github-actions

## Try it out

- Live site: https://oxhack-land-arbitrage.vercel.app
- GitHub: https://github.com/amitvijapur/oxhack-2026. It's private for now; make it public, or check with the organisers, before judges need it.

## Images

- **Thumbnail:** `app-0-opening-THUMBNAIL.png` (1500×1000, 3:2).
- **Gallery:**
  - land explorer
  - claims by staked year
  - plot sheet
  - Market
  - Swarm
  - Decision
  - the land chart

The images are in the `orecast-devpost-images` folder.

## Team

- **Amit:** evidence packs and integration.
- **Salman:** the decision model, the website and deployment.
- **Muhd:** the stakeholder swarm.
- **Arjin:** land, claims, prices and cost data.

## Before submitting

- [ ] Confirm the deadline with an organiser. We are assuming Sunday 12:00.
- [ ] Add all four teammates to the Devpost project.
- [ ] Decide whether the repository goes public.
- [ ] Record a 2–3 minute video and upload it to YouTube or Vimeo. Video is required.
- [ ] Select the challenges: HRT (best use of data for predictions and decision-making), plus any others the team enters.
