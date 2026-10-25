---
version: alpha
name: Tok River evidence surface
description: Source-extracted Mapbox-inspired dark evidence website with real green surface relief; exact brand approval remains open.
colors:
  canvas: "#080f1b"
  surface: "#101a2a"
  raised: "#19283e"
  border: "#2a3b53"
  text: "#f5f8fe"
  muted: "#b3bed0"
  action: "#0070e8"
  action-hover: "#0062cf"
  accent: "#007afc"
  link: "#8cc0ff"
  sage: "#a3d3b1"
  blue: "#7baecb"
  amber: "#e5bd82"
  marker-a: "#d9ffe4"
  terrain-ground: "#839772"
  terrain-water: "#6e9ba1"
  terrain-wood: "#5d8058"
  terrain-grass: "#96aa7d"
  terrain-shadow: "#2d4935"
  terrain-highlight: "#e1e9be"
  fallback-ground: "#10191e"
  white: "#ffffff"
  transparent: "transparent"
typography:
  body:
    fontFamily: "DM Sans, sans-serif"
    fontWeight: 400
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "42px"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  headline-mobile:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  section-title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  site-title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "-0.03em"
  navigation:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  action:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  compact-label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  measurement:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "25px"
    fontWeight: 500
    letterSpacing: "-0.04em"
rounded:
  area-key: "8px"
  nearby: "12px"
  panel: "16px"
  workspace: "20px"
  pill: "999px"
spacing:
  tight: "8px"
  compact: "12px"
  regular: "16px"
  mobile-gutter: "18px"
  panel: "20px"
  tablet-gutter: "24px"
  medium-gutter: "32px"
  timeline-gap: "40px"
  desktop-gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "13px 19px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-icon:
    backgroundColor: "{colors.transparent}"
    textColor: "#becbe0"
    size: "34px"
  filter-selected:
    backgroundColor: "{colors.action}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  navigation-link:
    textColor: "{colors.muted}"
    typography: "{typography.navigation}"
  pending-chip:
    backgroundColor: "#d7af7912"
    textColor: "#f0ce9c"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  site-card:
    backgroundColor: "{colors.transparent}"
    textColor: "{colors.text}"
    padding: "12px 0"
  floating-panel:
    backgroundColor: "#101a2af7"
    rounded: "{rounded.panel}"
    padding: "20px"
    width: "330px"
  map-workspace:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.workspace}"
---

# Design System: Tok River evidence surface

## Overview

**Creative North Star: "Mapbox-inspired evidence workspace"**

This records the implemented website after Amit selected Mapbox as a visual reference and requested green land relief. It extracts the current source rather than asserting final approval of every colour, font or component. The confirmed dark theme translates the reference into deep navy, white geometric typography, blue action emphasis and rounded controls. The name remains the `PROJECT` placeholder.

A full-width geographic workspace carries a floating evidence panel on desktop. OpenFreeMap Liberty cartography and Mapzen Terrarium elevation tiles provide actual surface context; Alaska DGGS supplies the separate historical sediment measurements. No generated terrain illustration from the earlier mockups is used. Modern map context is not a reconstruction of the 2016 collection campaign, and surface relief is not underground geology or mineral value.

**Key Characteristics:**

- A deep navy website around green geographic surface relief.
- Confident DM Sans headings, blue actions and rounded workspace geometry.
- A floating desktop evidence panel that becomes stacked content at narrower widths.
- Pale green area A circles and blue area B squares, with matching labels and legends.
- Explicit assay qualification, separate retests, month precision and pending team workstreams.

Source files are `frontend/src/styles.css`, `map.css`, `terrain-style.js`, `App.jsx`, `MapView.jsx`, `main.jsx` and `PRODUCT.md`. [The reference extraction](research/mapbox-reference/DESIGN.md) separates observed Mapbox facts from this adaptation. Cera Pro, Mapbox branding and proprietary font files were not copied. DM Sans is an open-font alternative, not an exact font match.

Frontmatter records the extracted implementation values. The sidecar adds previews and metadata; generated tonal strips are preview metadata, not additional production tokens. This record does not replace the final browser review.

## Colors

### Primary

Action blue is the accessible filled-control colour, with a darker hover state. The brighter accent blue supplies active navigation and related emphasis. Light link blue provides readable focus rings and links on dark surfaces. White text against the action and hover colours calculates to 4.68:1 and 5.76:1 respectively; this is a flat colour-pair check, not certification of every state.

### Secondary

Sage identifies area A in legends and area badges. The actual terrain markers use a paler green fill with a dark outline to remain visible on the green map. Area B uses blue square markers. These area colours remain distinct from the saturated action blue and never encode a prediction score.

### Tertiary

Amber marks historical context, the publication event, pending states and qualified-result context. A visible label explains each state.

### Neutral and cartographic colours

Canvas, surface, raised, border, text and muted define the dark UI. The terrain ground, wood, grass, water and hillshade colours are a cartographic treatment applied to real feature layers and elevation data. The green styling is not a claim of measured vegetation, mineralisation or subsurface layers. Fallback-ground belongs only to the explicitly labelled geographic point plot.

Exact values are in the frontmatter. Additional category treatments for ice, wetland, sand, land use, roads, boundaries and labels are maintained in `terrain-style.js`; they are not a separate geological model.

## Typography

DM Sans carries the interface with self-hosted Latin weights 400, 500, 600 and 700. The main title is 42px, weight 700, reducing to 38px at 820px and below. Desktop section headings are 20px, weight 700. Site names are 20px, becoming 22px in the stacked layout. The interface uses larger 12–15px supporting labels than the superseded dense draft, while method tags retain a compact role.

IBM Plex Mono is used sparingly for measured readouts, coordinates, raw values and method identifiers. Primary and secondary card medians use 25px numeric readouts on desktop; the stacked tablet layout can use 28px. Units and quantified denominators stay attached to their numbers.

The placeholder identity is compact and bold with tracking of -0.035em. It is not the Mapbox wordmark. Exact family and size roles above describe the implementation rather than a new typography proposal.

## Layout

The shell has a maximum width of 1680px and 48px desktop horizontal gutters. Gutters reduce to 32px at 1300px, 24px at 820px and 18px at 640px. The introduction uses a strong title, concise geographic context and a working View sample records anchor.

The full-width map workspace has a rounded outer boundary, a top toolbar and a bottom legend/caption strip. The map frame itself is 620px high on desktop. The floating evidence panel is 330px wide, inset 20px from the right, 88px from the workspace top and 66px from its bottom. It has internal vertical scrolling, an explicit scroll instruction and compacted card spacing that keeps both areas' core values and the B censoring note available without reducing font sizes.

Above 1120px, the map camera reserves 390px on the right for the panel. The fallback point plot reserves 370px, and bottom-right attribution is shifted left by 370px to remain outside the panel. Navigation and terrain controls sit at the map's bottom left.

At 1120px and below, the panel becomes normal content below the map, with two comparison cards side by side. At 640px and below, the cards form one column. The map frame becomes 430px high at its separate 620px breakpoint. Searchable records scroll inside their own rounded table region. Header navigation is hidden at 820px and below; the primary records anchor and section flow remain available.

The rounded timeline strip follows the workspace. Pending workstreams use a simple horizontal stage row on larger screens and stack at 820px. A selected sample replaces comparison content within the same evidence panel.

## Elevation & Depth

UI depth comes from navy tonal layers and a restrained offset shadow beneath the floating panel. The panel uses `0 14px 38px #0005`; the nearby-sample chooser uses `0 8px 24px #0005`. Terrain-marker dots use `0 1px 3px #0007`, and MapLibre controls use `0 1px 5px #0004`.

Geographic relief uses real elevation inputs, with a default pitch of 48 degrees, bearing of -12 degrees and terrain vertical exaggeration of 1.35. Hillshade is a separate layer, with exaggeration 0.48. These are view settings, not uncertainty or geological scores. Terrain can be toggled using the real MapLibre terrain control.

If the geographic renderer fails, the labelled fallback shows the supplied coordinates on a plot. Neither a generated image nor a simulated ore body replaces missing map data.

## Shapes

The workspace radius is 20px; the floating panel, timeline and desktop record table use 16px. Nearby-sample controls use 12px. Primary actions, filters, search and pending badges use pill forms. On phones, some containers use slightly smaller radii as recorded in the CSS.

Area A markers are circular and area B markers square with softened corners. Selected points receive a pale outline. Area badges pair a letter with colour. Focus rings remain distinct from selection and status.

## Components

### Actions, navigation and area filters

The primary records anchor and retry action use action blue with white text and a darker hover state. The navigation keeps a bright blue active underline. Icon controls use round hit areas. The All/A/B filter includes counts and pressed state; Reset view retains its label. Blue focus outlines and labelled controls remain available for keyboard use.

### Floating comparison and sample details

Comparison cards use open dividers within one floating panel rather than separate floating rectangles. Their paired numeric columns show primary gold and secondary lithium medians with units and quantified denominators. Censoring notes, separate retests and method context remain distinct. Scrolling exposes the complete metadata without replacing a primary result with its retest.

The nonmodal sample inspector preserves identity, primary gold, separate gold retest, secondary lithium, status, method, raw value, source row, laboratory batch and coordinates. Qualified values retain their inequality; null values do not become zero. Escape and the close button restore the originating focus when it remains connected.

### Geographic surface and points

The map uses the supplied longitude/latitude points and real basemap/elevation context. It does not draw parcels, deposit boundaries or an interpolated assay heatmap. Nearby overlapping marker hit areas open a chooser for the individual records. The searchable sample table remains a keyboard alternative.

OpenFreeMap/OpenStreetMap attribution and terrain-source attribution are displayed separately from the Alaska DGGS evidence attribution. The different sources do not share an implied observation date or scientific meaning.

### Timeline and pending workstreams

The rounded timeline shows collection in June–July 2016 and publication in November 2016 at month precision. Connecting geometry does not imply per-sample playback. Pending panels use the supplied statuses and owners: Arjin for land/contracts, Muhd for MiroFish/prediction and Salman for algorithm planning. Null handoffs do not become fabricated charts or decisions.

### Search, tables and feedback

The search field is rounded and the table uses a rounded container, a sticky header, readable rows and a distinct selected state. Data-loading and limited-basemap states explain the problem and provide a real retry action. Button feedback uses a 150ms background-colour transition; loading uses an opacity pulse. Reduced-motion preference disables these animations and smooth scrolling.

## Do's and Don'ts

### Do:

- **Do** preserve the confirmed dark theme, Mapbox-inspired hierarchy and green surface-relief direction.
- **Do** distinguish action blue from area B markers, and retain area labels and marker shapes.
- **Do** keep units, quantified denominators, censoring, separate retests and source attribution visible.
- **Do** preserve the floating-panel and camera-padding relationship above 1120px, and stack below it.
- **Do** keep exact brand approval open while documenting actual implemented values.

### Don't:

- **Don't** copy the Mapbox wordmark, Cera Pro files, sales claims or signup flow.
- **Don't** treat cartographic green, elevation relief or area colour as mineral probability.
- **Don't** substitute a retest for a primary bound or convert missing measurements to zero.
- **Don't** obscure map attribution behind the evidence panel.
- **Don't** populate pending workstreams with simulated forecasts, values or recommendations.
