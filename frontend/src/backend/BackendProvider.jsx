import { ConvexProvider } from 'convex/react';
import { convexClient } from './client.js';

/** Supplies Convex to the tree when a deployment is configured; otherwise renders children unchanged. */
export default function BackendProvider({ children }) {
  return convexClient ? <ConvexProvider client={convexClient}>{children}</ConvexProvider> : children;
}
