# Convex backend

The website runs without this backend; evidence comes from the static snapshot in
`public/data/`. Convex holds teammate outputs published with `scripts/publish_run.py`.
Read `_generated/ai/guidelines.md` before writing Convex code, and
[the infrastructure guide](../../docs/infrastructure.md) for secrets and deployment.

| File | Role |
| --- | --- |
| `schema.ts` | `workstreams` (owner, status, latest run), `runs` (envelope + summary + stored payload), `landMatches` (rows per sample) |
| `model/validators.ts` | Shared validators: run modes, per-workstream summaries, land rows |
| `model/envelope.ts` | Rules validators cannot express, size limits, SHA-256 helper |
| `model/auth.ts` | Per-workstream bearer secret check, constant time |
| `http.ts` | `POST /ingest/<workstream>` and `GET /health` |
| `ingest.ts` | Internal: `checkRun`, `recordRun`, `cleanupOrphanPayloads` |
| `workstreams.ts`, `land.ts` | Public queries the website subscribes to |
| `seed.ts`, `crons.ts` | Idempotent workstream rows; daily orphan-payload cleanup |
| `ingest.test.ts` | `npm run test:backend` (convex-test + vitest) |

## How a publish works

1. `publish_run.py` builds the envelope: the adapter's summary, any child rows, the git
   commit and input hashes, plus the full output as `payloadJson`.
2. `http.ts` checks `INGEST_SECRET_<WORKSTREAM>` and the size. Decision outputs must match
   the canonical assignment model's versioned payload and the summary projected by
   `model/tok-option/publish.mjs`. The argument validators and `envelopeProblem` then
   reject a bad envelope before anything is stored.
3. The payload is stored with its checksum, and `recordRun` inserts the run and its rows and
   moves the workstream's `latestRunId` in one transaction. If that step fails, the stored
   file is deleted.
4. Re-publishing the same `runId` with identical output returns `unchanged` and preserves
   the original publication metadata. Different output under the same `runId` returns 409.

## Assignment decision contract

The decision stream accepts only `tok-assignment-output-v1` with model version
`tok-option-demo-v1`. It records an explicit comparison area, 30/90/180 day horizon,
scenario, workbench status, readiness and provenance. `pending` and `real` model modes
publish as `evidence_only`, with null economics. Explicit `demo` publishes as `scenario`;
it cannot claim measured or empirical validity. Failed evidence keeps `SKIP`, unknown
gates keep no entry action, and unavailable swarm input keeps mapped values null.

The summary's `negativeCashProbability` describes negative cash by the selected horizon.
It comes from the canonical `diagnoseCash` function and is not a realized loss probability.
Stored runs are read-only historical outputs. They must never populate editable model
controls or silently become a current market quote.

The former monthly decision-engine summary is deliberately unsupported. If a deployment
contains that schema, review and migrate or remove those decision rows before applying
this schema. This integration does not deploy or change any remote data.

## Changing what a workstream publishes

1. Agree the display shape with the owner. Keep measured values, scenarios and pending
   states distinct, and use null for unknown values, never 0.
2. Update the summary validator in `model/validators.ts`. Existing rows must still match,
   or add a new `schemaVersion`.
3. Update the matching adapter in `scripts/publish_adapters.py` and its fixture test in
   `tests/test_publish_run.py`.
4. If the website needs to query inside a generic output, add a
   child table like `landMatches` with an index, insert it in `recordRun`, and add a query.
5. Keep historical publications separate from the canonical workbench, preserving its
   explicit pending state as the offline fallback.
6. Run `npm run typecheck:backend`, `npm run test:backend`, `npm test` and
   `python3 -m unittest tests/test_publish_run.py`.

`npm run dev:backend` regenerates `_generated/` while it runs. Commit those files so CI and
Vercel can typecheck without a deployment.
