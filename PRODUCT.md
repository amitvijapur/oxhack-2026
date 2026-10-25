# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16.4.3, React 19.3.1 and Cesium 1.146.0. The app runs locally on loopback
port 3000. Convex storage and hosting are optional configuration work, with no
hosted deployment or credentials established by the current integration.

## Product Purpose

Explore Tok River, Alaska land history, sediment evidence and market context,
then inspect an explicitly hypothetical mineral-interest assignment model.
The TIME theme links historical source dates to holding horizons and the
consequences of selling or retaining an option.

## Users

The current workflow is a hackathon team demonstration and analysis surface.
Production users, verified trade inputs and operational responsibilities remain
open beyond the team's current module owners.

## Capabilities and Constraints

- A Cesium globe, historical time slider and Land, Ground, Market and Decision tabs.
- All 67 supplied sediment samples, split into A33/B34, retain qualification,
  units, methods, raw values and separate retests. Missing values remain unknown.
- Collection is June–July 2016 and publication November 2016. Per-sample days are
  unavailable. Historical claims and annual gold means use their own dates.
- Claim snapshots, sample squares and mineral occurrences are context. They do
  not establish recoverable resources, available rights or investable parcels.
- `model/tok-option/` is the sole decision engine. Pending and real modes retain
  unavailable financial inputs. Explicit demo mode illustrates 30/90/180-day
  assignment economics, cash branches and sensitivity.
- Six supplied simulation score sets remain diagnostically incomplete. Failed
  checks and unknown input cutoff block monetary signal use.
- Historical gold CAGR is an optional assumption, not a forecast. Live XAU data
  is attributed and does not populate model controls automatically.
- The model does not exercise options, execute trades or establish predictive skill.

## Brand Commitments

Retain the current **Land Arbitrage: Gold** explorer and its dark monochrome
surface, green activity/growth signals, red negative states and yellow measured
gold. DM Sans carries the interface and IBM Plex Mono carries tabular readouts.
The implemented system is recorded in `DESIGN.md`; earlier Mapbox drafts remain
historical reference material. This integration introduces no new visual concept.

## Evidence on Hand

The original handoff lives in `frontend/public/data/`; showcase context lives in
`frontend/public/data/showcase/`. The primary measurement source is Alaska DGGS
RDF 2016-10, DOI 10.14509/29688. Pinned land and swarm sources retain separate
provenance. Their presence does not fill missing contracts, resources, liquidity
or validation. See `docs/architecture.md` and `docs/remaining-work.md`.

## Product Principles

- Link location, source, time and model selection without merging their meanings.
- Make observations, historical context, simulations and assumptions identifiable.
- Keep unsupported results unavailable and preserve diagnostic failure states.
- Treat cash, no-sale outcomes and unsold marks separately.
