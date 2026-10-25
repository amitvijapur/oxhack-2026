# README assets

`cover.png` is a 2560 × 1024 editorial cover generated from the existing Orecast palette tokens and bundled DM Sans 300/400 fonts. The ring represents a holding horizon, not predictive accuracy or investment return.

To regenerate from the repository root with `@napi-rs/canvas` available in your Node environment:

```sh
node brand/orecast/readme/build-cover.cjs
```

The renderer is a documentation authoring tool, not an application dependency. It makes no network requests. The font license remains in `../fonts/dm-sans-LICENSE.txt`.

`explorer.jpg` is an unretouched capture of the deployed [Orecast explorer](https://oxhack-land-arbitrage.vercel.app) on 25 October 2026, after PR #50, reviewed main revision `976f6764544fb54d97e48af966b8146c58d00291`. It shows the four-tab interface and Site A under the whole-contract 90-day baseline. The live gold observation is capture-time context, separate from the model’s fixed gold input.

Imagery: **Esri, Maxar, Earthstar Geographics**, through the [Esri World Imagery service](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer). Terrain: **Mapzen Terrarium**, through [AWS Open Data](https://registry.opendata.aws/terrain-tiles/). Preserve these credits when reusing the screenshot. The image is a geographic display and hypothetical model output, not evidence of available mineral rights or investment performance.
