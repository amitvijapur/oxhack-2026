import { ConvexReactClient } from 'convex/react';

/** The deployment URL is optional: without it the site runs on its static evidence alone. */
export const convexUrl = import.meta.env.VITE_CONVEX_URL || null;

export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;
