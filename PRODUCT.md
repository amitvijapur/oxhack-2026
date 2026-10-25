# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React website with Vite and MapLibre GL JS, explicitly chosen by Amit after the referenced skeleton could not be found. Run on localhost only. No deployment is authorised.

## Product Purpose

Explore historical Tok River, Alaska stream-sediment evidence through a map, A/B comparison cards, individual sample records and a month-precision evidence timeline. Keep future predictive modelling, algorithm and output work visibly pending until the responsible teammates supply it.

## Users

Primary user and final operational workflow are open decisions. A hackathon team demonstration and analysis workflow is the current planning assumption, not confirmed production usage.

## Operating Context

OXHack under the event's TIME theme. The current website uses a historical 2016 evidence snapshot. Collection occurred in June–July 2016 and publication in November 2016; exact per-sample dates are unavailable. The earlier hypothetical two-site proposal and static mockups are separate planning material and must not populate this evidence view with simulated probabilities or decisions.

## Capabilities and Constraints

- Show all 67 supplied sample dots, with area A/Tok west containing 33 and B/Tok east containing 34.
- Preserve GeoJSON longitude/latitude order and use supplied sampling-point bounds for framing. Centres are not deposits. Do not draw parcel boundaries or interpolated heatmaps.
- Show primary gold, separate gold retests and secondary lithium with their actual status, method, raw value, units and source reference. Missing is not zero.
- Primary gold medians are quantified-only: A 0.013 ppm, n=33; B 0.008 ppm, n=33. B has one primary result above detection. Median differences are not investment rankings.
- Pending land/contracts belongs to Arjin, MiroFish/prediction to Muhd and decision algorithm planning to Salman. Their data is currently null.
- Preserve the long-term land/modelling/algorithm/output design intent without fabricating pending sections.
- Local website implementation is authorised by the data handoff and subsequent React/MapLibre choice. Deployment is not authorised.

## Brand Commitments

- Dark theme.
- Use Mapbox as visual inspiration for navigation, typography, controls and the map-first workspace. Keep visible green land and real shaded relief, informed by the earlier reference draft.
- Project name remains blank or a placeholder, explicitly requested by Amit.
- Palette, typography, graphic motifs and layout selection remain proposals.

## Evidence on Hand

Display assets live in `frontend/public/data/`, copied unchanged from the supplied verified handoff. Source is Alaska DGGS RDF 2016-10, DOI 10.14509/29688. Keep attribution and transformation notes visible. The repository also contains earlier WA studies and a separate hypothetical proposal; they are not evidence for this Tok River website's pending modelling or decisions.

## Product Principles

- Keep land, modelling, algorithm and output linked to the same location and run.
- Make observations, model estimates and simulated assumptions identifiable.
- Preserve meaningful data gaps and unsupported results.
- Treat proposed visual artifacts as planning material until a direction is selected.
