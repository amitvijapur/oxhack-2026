# Mining idea: "Where should we drill next?"

The idea is a good one, and there's a real company doing it: KoBold Metals, backed by Bill Gates and Jeff Bezos, uses AI to find metals for batteries (Globe and Mail). The Uber co-founder involved is unconfirmed, so check the name before saying it on stage.

**Open question:** what does "jarb" mean? Gravity data ("grav")? JORC, the mining reporting code? Something else?

## How it fits the judging

| Criterion | Fit |
|---|---|
| HRT: prediction | ✅ Strong: predict where undiscovered deposits are likely ("prospectivity mapping") |
| HRT: decision | ✅ Very strong if framed right (below) |
| Impact | ✅ Rare earths and lithium for batteries and the energy transition |
| Theme: TIME | ⚠️ Weak unless we build it in |
| Citadel: hand-made | ⚠️ Possible (a physical terrain or heat map), but less natural |
| 24-hour feasibility | ⚠️ Medium: only if we limit it to one region |

## The framing that would make it stand out

Don't build "a map of where minerals are". Build a **sequential decision engine**:

- Each drill hole costs money and weeks. After each one, the model updates its beliefs and picks the next hole that gives the most information or the best chance of a find. This is "explore vs exploit"; the technical terms are **Bayesian optimisation** and **value of information**.
- **TIME:** measure how many drill holes, and how many months or years, it takes to find the deposit, compared with drilling at random or following simple rules. Hide known deposits in a test region and see how fast each strategy finds them.
- **Headline:** "Our strategy finds the deposit in X holes instead of Y, saving Z years."

That's prediction plus decision, with a clear number to beat. Exactly HRT's style.

## The data

- **USGS Mineral Resources Data System:** known mineral sites worldwide, mainly the US, 26 MB CSV, free: <https://mrdata.usgs.gov/mrds/mrds-csv.zip>. These are the labelled deposits.
- **USGS geophysics and geology maps** (magnetic, gravity, rock types), via [mrdata.usgs.gov](https://mrdata.usgs.gov). These are the inputs; the site is up.
- **NASA EMIT:** a hyperspectral instrument on the space station that maps surface minerals from orbit (product page responds; needs a free NASA Earthdata login). Very creative input.
- **UK / Australia option:** British Geological Survey open data, and Geoscience Australia's large free magnetic, gravity and radiometric maps. Sites up; specific files not checked yet.

## What experts would ask (be ready)

- **Spatial leakage:** deposits cluster, so a random train/test split cheats. Test on a whole held-out region. This is the geography version of HRT's lookahead rule.
- **"No known deposit" doesn't mean "no deposit":** most of the map is unexplored. Treat it as a **positive-unlabelled** problem, and judges will know we get it.
- **Validation is hard:** we can't drill to check, so the proof is the held-out-region simulation.

## Verdict compared with PULSE

| | Mining (where to drill next) | PULSE (power grid) |
|---|---|---|
| Wow / impact | Very high | High |
| Fit with TIME | Needs the "time to discovery" framing | Natural (the grid is a clock) |
| Data volume and timing | Map data; no time series | Millions of 1-second readings |
| Benchmark to beat | Random or simple-rule drilling (we build it) | Official carbon forecast (ready-made) |
| Risk in 24 h | Higher (geospatial data wrangling) | Lower |

Both are strong. Mining has the bigger "wow" and impact story; PULSE is safer and fits TIME better. If we go with mining, limit it to **one region and one mineral** (for example lithium in Nevada using USGS data), and make the drill-sequence simulation the headline.
