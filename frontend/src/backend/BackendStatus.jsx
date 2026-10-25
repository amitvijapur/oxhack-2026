import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api.js';
import { convexClient } from './client.js';

const LABELS = {
  offline: 'Sample data only',
  connecting: 'Connecting',
  connected: 'Live data',
};

function StatusPill({ state }) {
  return <span className={`backend-status is-${state}`} role="status"><span className="backend-dot" aria-hidden="true" />{LABELS[state]}</span>;
}

function LiveStatus() {
  const ping = useQuery(api.health.ping);
  return <StatusPill state={ping?.ok ? 'connected' : 'connecting'} />;
}

/** Shows whether team outputs can stream in. `convexClient` is fixed per build, so the branch is stable. */
export default function BackendStatus() {
  return convexClient ? <LiveStatus /> : <StatusPill state="offline" />;
}
