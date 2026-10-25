import { HttpError, json } from './http.js';
import { routes } from './routes.js';

/** The route path: vercel.json rewrites /api/<path> to /api?path=<path>. */
function routePath(url) {
  const rewritten = url.searchParams.get('path');
  const path = rewritten ?? url.pathname.replace(/^\/api\/?/, '');
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

export async function handle(request) {
  const path = routePath(new URL(request.url));
  const route = routes[`${request.method} ${path}`];
  if (!route) {
    const allowed = Object.keys(routes).filter((key) => key.endsWith(` ${path}`)).map((key) => key.split(' ')[0]);
    return allowed.length ? json(405, { error: 'method not allowed', allowed }) : json(404, { error: 'not found' });
  }
  try {
    return await route(request);
  } catch (error) {
    if (error instanceof HttpError) return json(error.status, { error: error.message });
    console.error(error);
    return json(500, { error: 'internal error' });
  }
}
