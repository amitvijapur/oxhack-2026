"use client";

import { useEffect, useState } from "react";
import { usd } from "@/lib/showcase";

export type Gold = { usd_per_oz: number; updated_at: string; stale: boolean; source: string };

const TOK_TIME = new Intl.DateTimeFormat("en-US", { timeZone: "America/Anchorage", hour: "numeric", minute: "2-digit" });

/** The spot price through /api/gold-price, polled every 30 s. One poll feeds the pill and the Decide tab, so both show the same price. */
export function useGold() {
  const [gold, setGold] = useState<Gold | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/gold-price")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Gold | null) => { if (active && body) setGold(body); })
      .catch(() => {});
    load();
    const poll = window.setInterval(load, 30_000);
    return () => { active = false; window.clearInterval(poll); };
  }, []);

  return gold;
}

/** "● Live · Gold $3,997 · Tok 7:41 pm": the shared spot price and the time in Tok. */
export function LivePill({ gold }: { gold: Gold | null }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 15_000);
    const first = window.setTimeout(() => setNow(new Date()), 0); // after hydration, so server and client agree
    return () => { window.clearInterval(tick); window.clearTimeout(first); };
  }, []);

  const live = gold && !gold.stale;
  return (
    <div className="live" title={gold ? `${gold.source}, updated ${new Date(gold.updated_at).toLocaleTimeString()}` : "Connecting to the gold price"}>
      <span className={`live-dot${live ? "" : " is-off"}`} aria-hidden="true" />
      <span>{live ? "Live" : gold ? "Last price" : "Live"}</span>
      <span className="live-sep" aria-hidden="true" />
      <span>Gold <strong className="tabular">{gold ? usd(gold.usd_per_oz) : "—"}</strong></span>
      <span className="live-sep live-tok" aria-hidden="true" />
      <span className="live-tok">Tok <strong className="tabular">{now ? TOK_TIME.format(now) : "—"}</strong></span>
    </div>
  );
}
