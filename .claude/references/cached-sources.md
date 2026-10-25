# Cached upstream sources

Upstream source for the website's dependencies is cached with
[opensrc](https://github.com/vercel-labs/opensrc) at the exact versions pinned in
`frontend/package-lock.json`. Check behaviour there before relying on docs or
memory. Print a path (it fetches on a cache miss):

```sh
npx opensrc path convex@1.47.0
```

Re-fetch at the new version whenever a dependency below is upgraded, and update
this table in the same PR.

| Package | Version | Why it is cached | Where to look |
| --- | --- | --- | --- |
| convex | 1.47.0 | Client/provider, `useQuery`; HTTP actions and `storage.store`; `convex deploy --cmd`, deploy keys and `--preview-run`; anonymous local dev; offline `typecheck`; `env default`; `ai-files` | **`frontend/node_modules/convex/src/`** (the npm package ships its TypeScript source): `react/client.ts`, `server/router.ts`, `server/impl/storage_impl.ts`, `cli/deploy.ts`, `cli/configure.ts`, `cli/typecheck.ts`, `cli/envDefault.ts`, `cli/lib/envvars.ts`, `bundler/index.ts` |
| convex-backend (Rust) | opensrc tag `1.47.0` (contains **1.48.0**) | Limits and storage behaviour not in the npm package | `crates/common/src/document.rs`, `crates/value/src/{array,object,size}.rs`, `crates/common/src/knobs.rs`, `crates/common/src/sha256.rs` |
| convex-test / vitest / @edge-runtime/vm | 0.0.65 / 5.0.5 / 5.0.0 | Backend tests; vitest peer range allows Vite 8 | `frontend/node_modules/convex-test/`, `npm view vitest@5.0.5 peerDependencies` |
| vite | 8.3.5 | `loadEnv`, `VITE_` exposure, `preview.headers` used to mirror Vercel headers | `packages/vite/src/node/env.ts`, `src/node/preview.ts` |
| maplibre-gl | 6.15.0 | Worker URL setup; compact attribution starts expanded below 640 px | `src/ui/control/attribution_control.ts` |
| vercel CLI | 63.1.2 | Offline `vercel build` check of `vercel.json`, the `/api` function and rewrites | `npx vercel@63.1.2 build` output in `.vercel/output/` |

The opensrc directory `~/.opensrc/repos/github.com/get-convex/convex-backend/1.47.0` holds
`npm-packages/convex/package.json` version 1.48.0. Use it only for the Rust crates, and
check client and CLI behaviour in `frontend/node_modules/convex/src/`, which is the installed
1.47.0. Re-check this when upgrading.

Verified facts this setup depends on:

- `convex deploy` rejects a production deploy key in a non-production Vercel
  build (`src/cli/deploy.ts`), so Production and Preview need separate keys.
- `convex typecheck` needs no deployment, so CI runs it without secrets
  (`src/cli/typecheck.ts`; checked by running it with no `.env.local`).
- The CLI writes `VITE_CONVEX_URL` for Vite projects (`src/cli/lib/envvars.ts`).
- `ctx.storage.store(blob, { sha256 })` expects the digest **base64-encoded**. It is sent as
  `Digest: sha-256=<value>` and parsed with `Sha256Digest::from_base64`
  (`crates/common/src/sha256.rs`). A hex value fails with "invalid HTTP header". The type
  comment does not say this, and it was found in the end-to-end test.
- Storing from a mutation is not in 1.47.0, so an HTTP action stores first and deletes the
  file if the recording mutation fails (`convex/http.ts`).
- `process.env` is readable in queries, mutations and HTTP actions
  (`crates/isolate/src/environment/udf/phase.rs`). The installed `convex-env` skill's
  "actions only" line is outdated.
- `crypto.subtle` exists in the Convex runtime but `timingSafeEqual` does not
  (`npm-packages/udf-runtime/src/00_crypto.ts`), hence the digest-and-XOR comparison in
  `convex/model/auth.ts`.
- `--preview-run` runs only when a preview deployment is newly created
  (`cli/deploy.ts`: `options.previewRun !== undefined && data.isNewDeployment`).
- `*.test.ts` files under `convex/` are not bundled as functions (`bundler/index.ts`).
- Limits: 1 MiB per document, 8192 array items, 1024 object fields, nesting depth 16, and
  16 MiB / 16,000 documents written per transaction.
- Vercel: `api/*.js` deploys beside the `vite` preset, and the filesystem wins over
  rewrites. Request and response bodies are limited to 4.5 MB. Node 24 is the default. Only
  `VITE_*` variables reach the browser. Sources: vercel.com/docs/functions/runtimes/node-js,
  /functions/limitations, /project-configuration/vercel-json, /environment-variables. The
  offline `vercel build` produced `functions/api/index.func` with runtime `nodejs24.x`.

## Agent skills

`npx convex ai-files install` (run in `frontend/`) installed
`frontend/convex/_generated/ai/guidelines.md`, the Convex section of
`frontend/CLAUDE.md`/`AGENTS.md`, and the `get-convex/agent-skills` set under
`frontend/.claude/skills/` and `frontend/.agents/skills/`, pinned in
`frontend/skills-lock.json`. Refresh with `npx convex ai-files update` after a
Convex upgrade.
