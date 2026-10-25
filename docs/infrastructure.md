# Website infrastructure: Vercel, Convex and workstream publishing

The website (`frontend/`) is a static Vite build on Vercel with an optional Convex
backend. Everything works without Convex: the gold evidence is bundled in
`frontend/public/data/`. Convex holds the teammates' outputs once they publish
them, and Vercel Functions under `/api` hold anything that needs a server secret.

```text
 teammate laptop                         Convex deployment                    browser
 ───────────────                         ─────────────────                    ───────
 decision_engine.py ─┐                   POST /ingest/<workstream>            Vercel static site
 swarm/score.py ─────┼─ publish_run.py ─▶ (.convex.site, bearer secret) ──┐   (vite build, CSP)
 research/tok-land ──┘   adapters,        checkRun → storage.store →      │        │
                         hashes, git      recordRun (runs, landMatches,   │        │ useQuery
                                          workstreams pointer)            └──────▶ │ (.convex.cloud, wss)
                                                                                    │
                                          Vercel Function /api/*  ◀─────────────────┘ same origin
                                          (server/routes.js, server secrets)
```

## Secrets and settings

Nothing secret is committed. `.env*` files are ignored except the `*.example` placeholders.

| Name | Where it is set | Who | Used by |
| --- | --- | --- | --- |
| `CONVEX_DEPLOY_KEY` (production key) | Vercel → Environment Variables, **Production** only, Sensitive | Salman | `frontend/scripts/vercel-build.sh` → `convex deploy` |
| `CONVEX_DEPLOY_KEY` (preview key) | Vercel, **Preview** only, Sensitive | Salman | Same; creates a Convex preview per branch |
| `VITE_CONVEX_URL` | Written by `convex dev` to `frontend/.env.local`; injected by `convex deploy` on Vercel | automatic | Browser client. Public by design, never a secret |
| `INGEST_SECRET_DECISION`, `INGEST_SECRET_SWARM`, `INGEST_SECRET_LAND` | Convex env on each deployment (dev, prod; preview via defaults) | Salman creates; gives each owner only their own | `frontend/convex/http.ts` publish auth |
| `CONVEX_SITE_URL` + the owner's `INGEST_SECRET_*` | Teammate's shell or `.env.publish` (ignored) | each owner | `scripts/publish_run.py` |
| Future API secrets (for example an LLM key) | Vercel, Sensitive, never `VITE_` | route owner | `requireServerEnv()` in `frontend/server/env.js` |
| `LLM_API_KEY`, Zep key (MiroFish) | Muhd's machine only (`MiroFish/.env`) | Muhd | Swarm runs; never sent to Vercel or Convex |
| `TYPESAFE_API_KEY` | Salman's machine (`.env`) | Salman | `policy_extract.py`; local only today |

Vercel exposes only `VITE_*` variables to the browser bundle, so a secret must never
use that prefix. Convex env values are limited to 8 KiB each.

## One-time setup (account owner)

From `frontend/`:

```sh
npx convex login
npm run dev:backend                    # creates the dev deployment, writes .env.local

# One secret per workstream, on dev. Use a password manager or:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
npx convex env set INGEST_SECRET_DECISION '<value>'
npx convex env set INGEST_SECRET_SWARM '<value>'
npx convex env set INGEST_SECRET_LAND '<value>'
npx convex run seed:init               # creates the three workstream rows

# Production: the same commands with --prod (use different values from dev).
npx convex env set INGEST_SECRET_LAND '<value>' --prod
npx convex run seed:init --prod

# Previews copy project defaults only when created:
npx convex env default set INGEST_SECRET_LAND '<value>' --type preview
```

Then in Vercel:

1. Import the repository and set **Root Directory** to `frontend`. `vercel.json` sets the framework,
   build, output, function and header settings.
2. Add both `CONVEX_DEPLOY_KEY` values as above. `convex deploy` refuses a production key
   in a preview build.
3. Optional: one **WAF rate-limit rule** on `/api/*` (Hobby allows one) before adding any
   route that calls a paid API.

`frontend/README.md` (Deploy to Vercel) has the same steps in short form.

## Publishing a workstream run

Each owner sets `CONVEX_SITE_URL` and their own `INGEST_SECRET_*`, then runs from the
repository root. `CONVEX_SITE_URL` is the deployment's HTTP Actions URL ending in
`.convex.site`. It is shown in the Convex dashboard's deployment settings, and for dev it is
`VITE_CONVEX_SITE_URL` in `frontend/.env.local`.

```sh
# Arjin, land and claims (measured snapshot)
python3 scripts/publish_run.py land research/tok-land

# Salman, decision engine (scenario until inputs are verified)
python3 scripts/decision_engine.py research/decision-engine/tok-demo.json \
  | python3 scripts/publish_run.py decision - --run-id tok-demo-site-b \
      --input research/decision-engine/tok-demo.json

# Muhd, swarm results after swarm/score.py has written them
python3 scripts/publish_run.py swarm swarm/records/results/results.json
```

Add `--dry-run` to see exactly what would be sent. For a decision, the summary also
carries the engine's gates as "check these first" items and its month-by-month policy
collapsed into plan steps. The website's answer card shows both. Each run records its git commit
(with `*` for uncommitted changes), the SHA-256 of every input and of the full output, and
a mode: `measured`, `evidence_only`, `scenario` or `empirical`. The website shows that
mode next to every live result.

Responses:

| Status | Meaning |
| --- | --- |
| 201 | Published; the website updates immediately |
| 200 `unchanged` | Same `runId` and identical content was already published |
| 400 | The envelope or summary failed validation; the message names the field |
| 401 / 503 | Wrong secret / this deployment has no secret for the workstream |
| 409 | The `runId` already holds different content; publish with a new `--run-id` |
| 413 | Body over 8 MB |

The full output is kept in Convex file storage. A daily Convex cron deletes stored files
that no run references (left behind only if a publish failed midway).

## Adding an API route

Add an entry to `frontend/server/routes.js`, for example
`'POST /what-if': async (request) => { const key = requireServerEnv('SOME_KEY'); ... }`.
Every `/api/<path>` request reaches the single function `frontend/api/index.js`, which
routes it. Request and response bodies are limited to 4.5 MB, and `vercel.json` sets a
30 s duration. Same-origin `/api` calls are already allowed by the CSP. A new external
host needs a CSP entry in `vercel.json`.

Because `decision_engine.py` uses only the Python standard library, a live what-if
route could later run it as a Vercel Python function. The NV mode would need its
forecast files bundled with it.

## Limits worth knowing

- **Convex documents:** 1 MiB per document, at most 8192 array items and 1024 object fields.
  Summaries are small; full outputs go to file storage.
- **Convex transactions:** 16 MiB written per transaction. Land rows are capped at 2000 per run.
- **Vercel Hobby:** cron jobs run at most once a day and only on Production.
- **Convex preview deployments:** removed after 5 days on the free plan.

The sources behind these limits are listed in `.claude/references/cached-sources.md`.
