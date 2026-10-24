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
| convex | 1.47.0 | `ConvexReactClient`/`ConvexProvider`, `useQuery`; `convex deploy --cmd` and deploy-key rules for Vercel; `CONVEX_AGENT_MODE=anonymous` local dev; offline `convex typecheck`; `ai-files install` | `npm-packages/convex/src/react/client.ts`, `src/cli/deploy.ts`, `src/cli/configure.ts`, `src/cli/typecheck.ts`, `src/cli/aiFiles.ts` |
| vite | 8.3.5 | `loadEnv`, `VITE_` exposure, `preview.headers` used to mirror Vercel headers | `packages/vite/src/node/env.ts`, `src/node/preview.ts` |
| maplibre-gl | 6.15.0 | Worker URL setup; compact attribution starts expanded below 640 px | `src/ui/control/attribution_control.ts` |

Verified facts this setup depends on:

- `convex deploy` rejects a production deploy key in a non-production Vercel
  build (`src/cli/deploy.ts`), so Production and Preview need separate keys.
- `convex typecheck` needs no deployment, so CI runs it without secrets
  (`src/cli/typecheck.ts`; checked by running it with no `.env.local`).
- The CLI writes `VITE_CONVEX_URL` for Vite projects (`src/cli/lib/envvars.ts`).

## Agent skills

`npx convex ai-files install` (run in `frontend/`) installed
`frontend/convex/_generated/ai/guidelines.md`, the Convex section of
`frontend/CLAUDE.md`/`AGENTS.md`, and the `get-convex/agent-skills` set under
`frontend/.claude/skills/` and `frontend/.agents/skills/`, pinned in
`frontend/skills-lock.json`. Refresh with `npx convex ai-files update` after a
Convex upgrade.
