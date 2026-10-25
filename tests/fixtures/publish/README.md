# Publisher fixtures

`assignment-demo.json`, `assignment-pending.json` and `assignment-real.json` are
canonical `decisionOutput` wrappers around `runWorkbench`, using the bundled 67
sample features, default controls and the stated mode. The financial outputs
remain hypothetical. Source audits, per-sample evidence rows and unrelated
diagnostics were trimmed for test size; no financial values were edited.
The current fixtures use `tok-option-demo-v2`, with an attributed, uncalibrated
gold forecast. The baseline fixture has zero swarm adjustment.

The Python adapter derives summaries by executing the canonical pure
`model/tok-option/publish.mjs` helper. It no longer accepts monthly decision-engine
or NV section output. Node.js 24 is required for these adapter tests.

Land and swarm fixtures retain their original generic producer field names.
Unknown cells and diagnostic values must remain null in the website summary.
