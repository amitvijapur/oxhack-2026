# Optional backend and workstream publishing

The website can run from bundled evidence and the canonical assignment workbench
without a backend. Optional Convex storage holds attributed historical publications
for the land, swarm and decision workstreams. Nothing in this integration deploys
Convex or Vercel, configures secrets, or writes remote data.

The decision model is exclusively `model/tok-option/workbench.mjs`, with 30, 90 and
180 day assignment horizons. The previous monthly engine, exercise policy and NV
section publisher are unsupported. Publishing preserves an output for inspection;
it does not authorize a trade, produce an executable quote or fill live controls.

## Secrets

Copy `.env.publish.example` to the ignored `.env.publish`, or set the same names in
the shell. `CONVEX_SITE_URL` is the HTTP Actions endpoint ending in `.convex.site`.
Each owner receives only their workstream's `INGEST_SECRET_DECISION`,
`INGEST_SECRET_SWARM` or `INGEST_SECRET_LAND`. Its value must match the corresponding
server environment variable on the chosen Convex deployment.

All secrets stay on the server or publisher machine. Browser configuration uses
`NEXT_PUBLIC_CONVEX_URL` only for the public query URL ending in `.convex.cloud`.
Never prefix ingest secrets, deployment keys or upstream API keys with
`NEXT_PUBLIC_` or `VITE_`. Do not install any real backend keys to run local tests.

## Export and dry-run a canonical decision

Node.js 24 and Python 3 are required. With no request file, export stays pending
and contains no financial result:

```sh
node model/tok-option/export.mjs > /tmp/tok-pending.json
python3 scripts/publish_run.py decision /tmp/tok-pending.json --dry-run
```

An explicit demonstration request can select assumptions, for example save this
to a local `request.json`:

```json
{"controls":{"mode":"demo","area":"A","horizonDays":90,"scenarioId":"baseline"}}
```

```sh
node model/tok-option/export.mjs request.json > /tmp/tok-assignment.json
python3 scripts/publish_run.py decision /tmp/tok-assignment.json \
  --input request.json \
  --input frontend/public/data/tok-gold/site-a/samples.geojson \
  --input frontend/public/data/tok-gold/site-b/samples.geojson \
  --input model/tok-option/data/land-source.json \
  --input model/tok-option/data/swarm-source.json \
  --dry-run
```

`--dry-run` prints only the bounded summary, mode, producer and fingerprints, then
stops. It reads no publish secret and sends no request. A request may supply
`features` and an attributed `swarmRuns` import; the exporter validates imports
through the canonical parser. Fingerprint any replacement source files with
additional `--input` arguments. The complete workbench output retains source
attribution, selection and calculation details.

The payload contract is `tok-assignment-output-v1`. Its summary contract is
`tok-assignment-summary-v1`, projected by the pure `model/tok-option/publish.mjs`
helper. Python delegates to that helper; it contains no assignment equations.
Convex independently projects the payload and rejects a different summary.
Explicit selection metadata is mandatory even for pending results.

`pending` and `real` model outputs use `evidence_only` publication mode and null
economics. Explicit `demo` uses `scenario` with assumed economics and liquidity.
The publisher rejects a conflicting `--mode`; neither path may claim `measured`
or `empirical` financial validity. Missing swarm input leaves mapped money null.
Failed evidence stays `SKIP`, and unknown gates never become `BUY_CANDIDATE`.
`negativeCashProbability` is negative cash by the day horizon, excluding unsold
marks from receipts. It is not a realized investment loss probability.

## Publish when a backend has been configured

Removing `--dry-run` explicitly sends the prepared body to the configured backend.
Use a fresh `--run-id` when output changes. Reusing a run ID with identical output
returns `unchanged`, preserving the first publication's metadata.

```sh
python3 scripts/publish_run.py decision /tmp/tok-assignment.json \
  --input request.json --run-id tok-assignment-demo-90d
python3 scripts/publish_run.py land research/tok-land
python3 scripts/publish_run.py swarm swarm/records/results/results.json
```

Land and swarm retain their generic adapters, input hashes and nullable unknown
values. Raw swarm publication is diagnostic only; it does not bypass canonical
scenario readiness checks or change financial controls.

The HTTP publisher authenticates each workstream before parsing its body. It
rejects unknown envelope fields, invalid JSON, mismatched summaries and bodies
over 8 MiB. Full payloads use file storage, with checksums and transactional run
pointers. Land rows are bounded to 2,000 per run. The responses are 201 for a new
run, 200 for unchanged output, 400 for invalid content, 401 for a wrong secret,
503 for an unconfigured secret, 409 for conflicting output and 413 for excess
body size. Failed run recording removes its newly stored payload; a daily cleanup
also removes old unreferenced files.

## Local checks and backend setup

From `frontend/`, after installing the committed lockfile:

```sh
npm run test:backend
npm run typecheck:backend
node --test tests/api.test.js
```

From the repository root:

```sh
node --test model/tok-option/tests/*.test.mjs
python3 -m unittest tests/test_publish_run.py
```

The backend test suite uses the local Convex mock and no deployment or secret.
Account owners can later run `npm run dev:backend`, configure only their intended
deployment's ingest secrets, then seed workstreams with `npx convex run seed:init`.
Deployment keys, preview environments, hosting and data migration need separate
review. Existing deployments containing the former monthly decision schema must
migrate or remove those decision rows before this schema is applied.

Server-only health and gold-price API routes stay under `frontend/src/server/`,
served by the Next catch-all route. They do not run a second decision engine.
The gold endpoint is an attributed external observation; the model never adopts
its price automatically.

The validation and testing patterns follow the official
[Convex validator documentation](https://docs.convex.dev/functions/validation) and
[Convex test guide](https://docs.convex.dev/testing/convex-test). Consult current
provider documentation before configuring hosting or remote deployment.
