# Mapbox reference extraction

24 October 2026. User-selected visual reference: [Mapbox homepage](https://www.mapbox.com/). This is inspiration for the Tok River website, not a request to copy Mapbox branding or change mapping providers.

## Observed evidence

A live Chromium capture at 1440×1000 was inspected. Its local reference screenshot is `frontend/artifacts/mapbox-reference.png`, excluded from Git. The page has a white background, a compact horizontal navigation, a strong two-column hero, rounded imagery, blue primary actions and spacious geometric typography. A cookie-consent panel partly covered the bottom of the captured viewport; it is not a pattern to borrow.

Computed CSS from the actual page identified Cera Pro with Trebuchet MS/sans-serif fallback. Visible H1/H2 samples were 56 px, weight 700, colour rgb(14,16,18). Body ground was rgb(255,255,255). A visible primary control used rgb(0,122,252). Hero primary buttons appeared pill-shaped; consent buttons were 8 px radius. Spacing judgments are visual estimates rather than a complete token export.

The Firecrawl branding/markdown/screenshot request timed out. This extraction relies on the inspected browser pixels, visible computed styles and official page content, not a claimed complete Firecrawl capture. No mobile, hover or animation fidelity was established for the reference.

## Adaptation for the Tok River website

- Preserve Amit's dark-theme constraint, translating the reference into deep navy/charcoal surfaces and clear white text.
- Use a larger, confident geometric heading and a controlled readable UI hierarchy. DM Sans is the proposed open-font alternative; it is not Cera Pro or an exact font match.
- Borrow blue action emphasis, deliberate spacing and rounded controls without copying the Mapbox logo, wordmark, sales copy or signup flow.
- Give the green terrain a full-width workspace and use a floating right-side evidence inspector on desktop. This composition is a proposed mapping-product adaptation, not an observed copy of the homepage layout.
- Keep desktop evidence controls compact and readable. Stack the inspector on narrower screens.
- Keep all actual sample measurements, provenance, month-precision timeline and pending workstreams unchanged.

## Roles and boundaries

The new surface remains a localhost React/MapLibre website. OpenFreeMap supplies cartographic context, Mapzen terrain tiles supply surface relief, and Alaska DGGS supplies the historical sediment evidence. These are separate sources and dates. Green map styling does not infer vegetation measurements, underground geology or mineral value.

Root `DESIGN.md` records the implemented system after review. This file records the source reference and the distinction between observed facts and proposed adaptations.
