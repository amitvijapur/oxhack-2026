"use client";

import { Component, useEffect, useRef, type ReactNode } from "react";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

/**
 * The live layer. The Convex URL is optional and fixed per build: without it
 * the site runs on its static evidence alone, and nothing here renders.
 *
 * Live data reaches the page through small bridge components that render
 * nothing and report up through callbacks, each inside its own error
 * boundary, so a failing query only drops that live feature, never the page.
 */

export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || null;
export const LIVE = Boolean(CONVEX_URL);

let client: ConvexReactClient | null = null;
function getClient() {
  client ??= new ConvexReactClient(CONVEX_URL!, { unsavedChangesWarning: false });
  return client;
}

export function LiveProvider({ children }: { children: ReactNode }) {
  return LIVE ? <ConvexProvider client={getClient()}>{children}</ConvexProvider> : children;
}

/** Drops its children (and reports) if a live query throws. */
export class LiveBoundary extends Component<{ children: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("Live data unavailable:", error);
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export type Workstreams = FunctionReturnType<typeof api.workstreams.list>;
export type LatestRun = NonNullable<Workstreams[number]["latest"]>;
export type LandMatches = FunctionReturnType<typeof api.land.matchesForSample>;
export type Presence = { count: number; more: boolean; focus: Map<string, number>; me: string | null };

/** Reports whether the deployment answers. */
export function HealthBridge({ onStatus }: { onStatus: (connected: boolean) => void }) {
  const ping = useQuery(api.health.ping);
  const connected = Boolean(ping?.ok);
  useEffect(() => onStatus(connected), [connected, onStatus]);
  return null;
}

/** Every workstream with its latest run, re-reported whenever one is published. */
export function WorkstreamsBridge({ onChange }: { onChange: (streams: Workstreams) => void }) {
  const streams = useQuery(api.workstreams.list);
  useEffect(() => {
    if (streams) onChange(streams);
  }, [streams, onChange]);
  return null;
}

/** Land records at one sample, from the latest land run. */
export function LandMatchesBridge({ sampleKey, children }: { sampleKey: string; children: (land: LandMatches | null) => ReactNode }) {
  return children(useQuery(api.land.matchesForSample, { sampleKey }) ?? null);
}

const SID_KEY = "tok:sid";
const BEAT_MS = 8_000;

function tabId() {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * This tab's presence: heartbeats with the sample it's looking at, stops while
 * hidden, leaves on close. Reports how many are here and what they look at.
 */
export function PresenceBridge({ focus, onChange }: { focus: string | null; onChange: (presence: Presence) => void }) {
  const heartbeat = useMutation(api.presence.heartbeat);
  const leave = useMutation(api.presence.leave);
  const here = useQuery(api.presence.here);
  const sid = useRef<string | null>(null);
  const me = useRef<string | null>(null);
  const focusRef = useRef(focus);
  useEffect(() => { focusRef.current = focus; }, [focus]);

  useEffect(() => {
    sid.current ??= tabId();
    const id = sid.current;
    let timer: ReturnType<typeof setInterval> | undefined;
    const beat = () => {
      if (document.hidden) return;
      heartbeat({ sid: id, focus: focusRef.current }).then((pid) => { me.current = pid; }).catch(() => {});
    };
    const start = () => {
      clearInterval(timer);
      beat();
      timer = setInterval(beat, BEAT_MS);
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(timer);
        leave({ sid: id }).catch(() => {});
      } else start();
    };
    const onHide = () => { leave({ sid: id }).catch(() => {}); };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      leave({ sid: id }).catch(() => {});
    };
  }, [heartbeat, leave]);

  // A new focus goes out straight away rather than at the next beat.
  useEffect(() => {
    if (sid.current && !document.hidden) heartbeat({ sid: sid.current, focus }).catch(() => {});
  }, [focus, heartbeat]);

  useEffect(() => {
    if (!here) return;
    const counts = new Map<string, number>();
    for (const person of here.list) {
      if (person.id !== me.current && person.focus) counts.set(person.focus, (counts.get(person.focus) ?? 0) + 1);
    }
    onChange({ count: here.list.length, more: here.more, focus: counts, me: me.current });
  }, [here, onChange]);
  return null;
}
