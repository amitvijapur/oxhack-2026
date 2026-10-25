import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api.js';
import { convexClient } from './client.js';

// Render-prop wrappers: hooks run only when a Convex deployment is configured, and the
// callback receives null offline or while loading, so callers keep their static fallback.

function LiveWorkstreams({ children }) {
  return children(useQuery(api.workstreams.list) ?? null);
}

export function WithWorkstreams({ children }) {
  return convexClient ? <LiveWorkstreams>{children}</LiveWorkstreams> : children(null);
}

function LiveLandMatches({ sampleKey, children }) {
  return children(useQuery(api.land.matchesForSample, { sampleKey }) ?? null);
}

export function WithLandMatches({ sampleKey, children }) {
  return convexClient ? <LiveLandMatches sampleKey={sampleKey}>{children}</LiveLandMatches> : children(null);
}
