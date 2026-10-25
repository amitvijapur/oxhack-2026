import { HttpError, json } from './http.js';
import { routes } from './routes.js';

/** The route path under /api; src/app/api/[...path]/route.ts sends every /api request here. */
function routePath(url) {
  return `/${url.pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')}`;
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
