---
version: alpha
name: Land Arbitrage Gold explorer
description: Current integrated monochrome and green Cesium explorer, recorded from source.
colors:
  canvas: "#0a0a0a"
  panel: "rgba(17,17,17,0.92)"
  raised: "#1a1a1a"
  border: "#262626"
  border-strong: "#333333"
  text: "#fafafa"
  muted: "#a3a3a3"
  quiet: "#737373"
  green: "#22c55e"
  red: "#ef4444"
  gold: "#facc15"
typography:
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  measurement:
    fontFamily: "IBM Plex Mono, monospace"
    fontWeight: 500
rounded:
  panel: "14px"
  sheet: "12px"
  button: "10px"
  icon: "8px"
spacing:
  panel-content: "20px"
  time-desktop: "32px"
  time-mobile: "16px"
---

# Design System: Land Arbitrage Gold

This records the current integrated interface, inherited from the latest
explorer implementation. It supersedes the navy and blue Mapbox-inspired app
record. The earlier [Mapbox extraction](research/mapbox-reference/DESIGN.md) and
brand drafts remain historical references. No new visual direction is proposed.

## Surface and colour

`frontend/src/components/explorer/explorer.css` scopes the visible explorer to
near-black canvas, translucent charcoal panels, neutral borders and white text.
Green identifies activity, growth, selected geographic context and support-score
displays. Red marks negative changes. Warm yellow identifies measured gold and
its history. Colour is accompanied by labels, values or state text.

Primary buttons are white with dark text. Secondary actions use neutral outlined
surfaces. Selected tabs have white text and a two-pixel underline. Selection,
source status and model readiness retain their separate meanings. A green
activity indicator does not establish a valid trading signal.

The shared application tokens in `src/app/globals.css` retain slate surfaces,
gold primary, glacier focus, sage A and blue B for shared controls and model
components. Explorer-scoped values above describe the current main surface;
these two scopes must not be flattened into an invented uniform palette.

## Typography and layout

DM Sans and IBM Plex Mono are bundled locally through Next's font integration.
IBM Plex Mono provides
numeric alignment and technical readouts. The explorer body is 15px. The compact
identity is 16px bold. The time readout is 64px on desktop and 44px on phones.

Cesium fills the geographic workspace. The 60px top bar shows identity and the
attributed live gold/time indicator. A time slider, claim count and gold history
occupy the lower area in time mode. The explorer panel sits at the right,
68px from the top, with a width up to 440px and 14px corners. Land, Ground,
Market and Decision are actual tab controls with a shared scrolling panel.

At 860px and below the panel becomes a full-width bottom sheet starting at
46dvh, while time content stacks. Maps, sources, sample details and model controls
remain reachable. Changes to these layouts should be verified in a browser.

## Geography and evidence

The Cesium renderer uses satellite imagery, actual terrain and optional geology
context, with attribution. Recorded claim outlines and illustrative sample
squares stay distinguishable. Yellow assay classes describe measurements or
reported bounds, never recovered gold or investment value. Surface relief does
not establish underground geology. Sample primary/retest distinctions and
month-precision dates survive every presentation.

## Components and behaviour

The side panel groups list tools, selection details, sources and diagnostics.
Land selection links the map and list; Ground exposes measurement and geological
context; Market preserves scope labels; Decision embeds the canonical workbench.
The workbench's explicit demo controls, pending states and diagnostic failures
must remain legible inside the inherited shell.

Buttons use 150ms transitions; map scrims and simulation dots use 400ms
transitions. Shared reduced-motion rules remain in `globals.css`. Keyboard
focus, native tab semantics, readable scroll areas and explicit load/failure
states are part of the existing implementation. Browser verification is required
before claiming accessibility or responsive correctness.

The source of truth is `frontend/src/components/explorer/explorer.css`,
`frontend/src/components/earth/`, `frontend/src/app/globals.css` and
`frontend/src/model-workbench.css`. `.impeccable/design.json` records matching
metadata and does not generate the production UI.
