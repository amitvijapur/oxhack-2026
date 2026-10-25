import { json } from './http.js';

/**
 * Every API route, keyed "METHOD /path" under /api. Add a route here, not a new file in
 * api/: one function lets Fluid compute reuse instances. Read secrets with
 * requireServerEnv() from ./env.js inside the handler.
 */
export const routes = {
  'GET /health': () => json(200, {
    ok: true,
    environment: process.env.VERCEL_ENV ?? 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  }),
};
