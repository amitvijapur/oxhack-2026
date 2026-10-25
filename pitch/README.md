# Orecast pitch and brand kit

The [approved current Orecast deck](orecast/README.md) defines one synthetic
whole-contract interest and makes the fee sensitivity and no-sale branch explicit.
Its seven main slides total five minutes; three appendices support questions.
Edit [the ten-slide PPTX](orecast/output/orecast-consistent-lot-review.pptx) and use
[the PDF](orecast/output/orecast-consistent-lot-review.pdf) as the appearance reference.
Follow [the rehearsal](orecast/rehearsal-consistent-lot-review.md) and
[portable speaking notes](orecast/slide-notes-consistent-lot-review.json).
[Brand assets and guidelines](../brand/orecast/BRAND.md) are shared in the repository.

Publication of these reviewed artifacts is authorized. Their `review` filenames
and build-time local-review statements are retained as provenance. The active
[handoff guide](orecast/README.md) explains this publication context.

The [earlier nine-slide Orecast PPTX](orecast/output/orecast-pitch.pptx) and
[PDF](orecast/output/orecast-pitch.pdf) are archived cost-only examples and are not
the current presentation. The binaries remain unchanged.

## Earlier neutral-title deck

The materials below preserve the previous version from PR 41. Start with Orecast
for current team edits.

# Mineral option timing pitch

Approved nine-slide pitch deck for team editing. The first seven slides form a five-minute presentation, with timings of 20, 35, 35, 55, 50, 60 and 45 seconds. The final two slides are appendices for questions.

## Pull and edit

Pull the latest `main`, then open [oxhack-pitch.pptx](oxhack-pitch.pptx) in PowerPoint or another PPTX editor. Foreground text, diagrams, the slide 6 chart and the appendix tables are editable native objects. Screenshots remain images. Save team edits in this file and submit them through the repository's usual branch and pull-request workflow. No special authoring runtime is required to edit the PPTX.

Use [oxhack-pitch.pdf](oxhack-pitch.pdf) as the fixed appearance reference. [preview.png](preview.png) shows all nine slides. Check an edited deck against the PDF before presenting, especially after importing it into a different slide editor. The files preserve the final approved deck byte-for-byte; no earlier rejected deck versions are included.

## Fonts and appearance

The deck uses DM Sans Regular and Light as visual substitutes for the commercial Alliance fonts in the design reference. The original DM Sans 300/400 WOFF2 assets and SIL Open Font License are in [assets/fonts](assets/fonts/). Fonts are not embedded in the PPTX. Desktop slide software may not install WOFF2 directly. If needed, install compatible DM Sans desktop faces from the [official Google Fonts source](https://fonts.google.com/specimen/DM+Sans).

The exported lightweight face is named `DM Sans Light`. An editor may substitute it even when DM Sans is available, so map that name to DM Sans Light or weight 300 and check line wrapping. If font substitution changes appearance, present the PDF while retaining the PPTX for editing. Native PowerPoint opening and system font rendering have not been verified.

## Notes, demo and sources

[rehearsal.md](rehearsal.md) gives the five-minute flow, demo fallback and model boundaries. [slide-notes.json](slide-notes.json) contains portable speaking notes, timings and source references. The PPTX also contains speaker notes. [assets/README.md](assets/README.md) records screenshot provenance and imagery credits.

Run the team app on its default port 3000 using the repository setup instructions. Captures were made from a newer local prototype, so the exact controls and optional financial comparison may differ from current `main`. Rehearse the actual revision before attempting the live premium change; use the PDF if it differs. The notes in the unchanged PPTX retain the original capture's local port, while this guide and the portable JSON use the team default.

The neutral title remains **Mineral option timing**. **Stratempo**, **StrataSignal**, **LodeLogic** and **Chronolith** are provisional options, not approved names.

The prototype connects observed evidence, recorded simulations and assumed assignment economics. Financial results are hypothetical; the package does not establish available rights, recoverable resources, calibrated liquidity or measured investment edge. Keep the provenance labels and failed research checks when editing.

## Design reference

Compositions were reconstructed using the [Palantir Q2 2021 Business Update reference](https://www.deck.gallery/palantir-q2-business-2021/), adapted to the project's palette and content. Reference pages for slides 1–9 are 1, 12, 5, 11, 13, 20, 23, 43 and 44. Palantir logos and business claims are not included. The complete reference PDF is not redistributed in this package.
