import { handle } from '../server/router.js';

// The single Vercel Function behind /api/*; routes live in server/routes.js.
export default { fetch: handle };
