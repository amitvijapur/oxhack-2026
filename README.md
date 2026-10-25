<p align="center">
  <img src="brand/orecast/readme/cover.png" alt="Orecast. Mineral intelligence over time. Built at OXHack 2026." width="100%">
</p>

# Orecast

Explore Alaska's gold evidence and see how news and waiting time could change a
hypothetical investment decision.

**[Open Orecast →](https://oxhack-land-arbitrage.vercel.app)** · [Explore the full swarm workflow](https://oxhack-land-arbitrage.vercel.app/swarm) · [View the pitch](pitch/orecast/output/orecast-consistent-lot-review.pdf) · [Run locally](#run-locally)

Start with the terrain around Tok River, follow simulated reactions to mining news,
and compare possible outcomes before committing to a decision. Orecast brings the
map, the story and the assumptions together so you can inspect what changes the answer.

<p align="center">
  <a href="https://oxhack-land-arbitrage.vercel.app">
    <img src="brand/orecast/readme/explorer.jpg" alt="An Orecast explorer capture showing Tok River terrain, evidence and a separate hypothetical financial decision." width="100%">
  </a>
</p>

*An earlier deployed explorer capture. Imagery: Esri, Maxar and Earthstar Geographics.
Terrain: Mapzen. The current demo includes the latest layout and controls.*

## Take a three-step tour

1. **Explore the ground in Land.** Browse the 57 sampled plots, pick a location,
   and inspect its measured gold, claim context and 3D terrain. Keep the selected
   location in view as you move between the map and its details.

2. **Follow the news in Crowd and Swarm.** Compare how five simulated stakeholder
   groups react over time. Open the Swarm walkthrough to follow a scenario from
   inputs and support scores through to its hypothetical financial effect.
   The full workflow lets you inspect the saved calculations behind each step.

3. **Compare outcomes in Decide.** Choose a comparison area, scenario and holding
   period. See its geological screen separately from the financial decision, then
   inspect the possible cash outcome and the risk of remaining unsold. A selected
   plot provides context; the decision covers its comparison area.

## Why time matters

Orecast puts historical claims and gold prices beside reactions across five simulated
news days, so you can explore how the context changes. Compare **30, 90 and 180-day**
windows to see how waiting, sale timing and expiry affect a hypothetical contract.

> **Prototype:** Orecast combines 67 real historical sediment samples, simulated
> stakeholders and assumed contract economics. Its forecasts are uncalibrated;
> explore the mechanism and its [evidence and limits](docs/developer-guide.md#evidence-and-model-limits).

## Run locally

Use **Node.js 24** and npm. No API keys or account setup are needed for the local demo.

```sh
git clone https://github.com/amitvijapur/oxhack-2026.git
cd oxhack-2026/frontend
npm ci --ignore-scripts
npm run dev
```

Open **[127.0.0.1:3000](http://127.0.0.1:3000/)**. Imagery, terrain and live gold
prices need internet access; the evidence snapshots are included.

For a local check and production build, run from `frontend/`:

```sh
npm test
node --test ../model/tok-option/tests/*.test.mjs
npm run build
```

The [developer guide](docs/developer-guide.md) covers the full checks, data downloads,
model assumptions, deployment and contributing. For a presentation, use the
[pitch and rehearsal guide](pitch/orecast/README.md).

---

Built at **OXHack 2026** for the theme **TIME** by
[Amit](https://github.com/amitvijapur), [Muhammad](https://github.com/meep-boop),
[Arjin](https://github.com/arjn15) and [Salman](https://github.com/iloveclouduk).
