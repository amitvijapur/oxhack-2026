# Canonical integration handoff

25 October 2026. Human owner: Amit. Integration owner: Codex.

The active decision path uses `model/tok-option/workbench.mjs` throughout the
UI and publication contract. Our assignment model is canonical. The earlier
monthly/exercise engine remains historical research and is excluded from runtime.

## Retained source work

| Source | Preserved contribution |
| --- | --- |
| PR 27, `e9d60c8` | Runnable evidence frontend and original 67-sample handoff |
| PR 29, `8bcc630` | Canonical valuation, dated sale/cash model, portfolio and diagnostics |
| PRs 28/30, through `e21afcd` | Optional backend, ingestion and API concepts, adapted to the canonical contract |
| PRs 32–34, through `1ce08e4` | Latest Earth explorer, land metadata, plot sheets, colour controls and presentation |
| Land `34eaf1d` | Attributed claim matches, cost/deal context and historical gold means |
| Swarm `f2fe2971` | Six scored simulation outputs, partial coverage and original failed diagnostics |

Exact original heads are recorded in `integration-source-heads.json`. The source
PRs and their branches retain historical work; superseded prototypes were not
silently substituted for the chosen model.

The six implementation squashes and exact resulting revisions are recorded in
`integration-merges.json`. Superseded PRs 23–26, 28 and 30–34 are closed with links
to the replacements. The automated dependency update remains separate.

## What is verified

The consolidated application passes 23 frontend tests, 94 canonical model tests,
17 Convex tests and 16 Python publisher/transport tests. Production build,
application/backend typechecks, source/specification audit and lint pass. Four
incumbent backend lint warnings are nonblocking. Required check names remain
Repository checks, Secret scan and Frontend checks, issued by GitHub Actions.

The model suite and source audit run explicitly in CI, independently of the
framework test command. Ingestion rejects legacy monthly outputs, mismatched
evidence gates and cash expectations inconsistent with their outcome distribution.

Production browser checks verify rendered terrain/overlays, 57 sampled areas,
illustrative-square labels, the $7.60 baseline, recalculation to -$142.40 when
premium becomes $800, failed Area B eligibility, unavailable real-input money,
synthetic news deltas and returning to pending when that import is cleared.
No page overflow was observed at 1440, 390 and 320 pixels. Independent source
and four-capture visual review returned ship within the integration scope.

The full-history secret findings were classified as prompt SHA-256 cache
fingerprints. A rule/path/pattern-specific exception and five boundary tests
preserve credential detection. Local fonts avoid a build-time Google request;
the engine-only CesiumWidget avoids a CSP-blocked widget dependency without
weakening the security policy. The production build uses the supported Webpack
builder, with SDK assets regenerated from locked packages.

## Still required

See [remaining work](../docs/remaining-work.md). No verified available Tok option,
recoverable resource estimate, fitted assignment liquidity or measured predictive
edge has been supplied. Three swarm scenarios and several interviews remain
absent; failed diagnostics, configuration confounds and unknown input cutoff
continue to block monetary news effects. Demo economics remain explicitly
hypothetical.

Optional Convex storage and hosted deployment still need account configuration
and verification. This integration does not configure credentials, deploy a
hosted application, change repository visibility or execute trades. Automated
dependency PR 35 is separate from the integration scope.
