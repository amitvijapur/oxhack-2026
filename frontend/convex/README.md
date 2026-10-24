# Convex backend

The website runs without this backend: evidence comes from the static snapshot
in `public/data/`. Convex is where teammate outputs (land/contracts, MiroFish,
decision engine) will live once each output shape is agreed. Read
`_generated/ai/guidelines.md` before writing Convex code.

Today the deployment holds no tables. `health.ping` proves the website is
connected; the Workstreams section shows "Backend connected" when it answers.

## Add a workstream

1. Agree the output shape with the owner (see `../CONTRIBUTING.md`, Pending
   integrations). Keep measured values, scenarios and pending states distinct.
2. Add a table with validators to `schema.ts`, for example `landClaims`, with
   an index for each query you need.
3. Add `convex/<workstream>.ts` exporting queries (and mutations if the website
   writes). Give every function `args` and `returns` validators.
4. If a Python script under `scripts/` produces the output, add an
   `httpAction` route in `convex/http.ts`. Have it check a shared secret from
   an environment variable (`npx convex env set WORKSTREAM_PUSH_SECRET ...`),
   validate the body and call an internal mutation. Never commit the secret.
5. In the website, read the data with `useQuery(api.<workstream>.<query>)`
   inside a component rendered only when `convexClient` is set (see
   `src/backend/BackendStatus.jsx`), and keep the Pending card as the offline
   fallback.
6. Run `npm run typecheck:backend`, `npm test` and `npm run build`.

`npm run dev:backend` regenerates `_generated/` while it runs; commit those
files with your change so CI and Vercel typecheck without a deployment.
