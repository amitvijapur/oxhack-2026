"use client";

import { useEffect, useState } from "react";
import { usd } from "@/lib/showcase";

type Gold = { usd_per_oz: number; updated_at: string; stale: boolean };

const TOK_TIME = new Intl.DateTimeFormat("en-US", { timeZone: "America/Anchorage", hour: "numeric", minute: "2-digit" });

/** Live gold spot price (polled every 30 s through /api/gold-price) and the time in Tok right now. */
export function Ticker() {
  const [gold, setGold] = useState<Gold | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/gold-price")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Gold | null) => { if (active && body) setGold(body); })
      .catch(() => {});
    load();
    const poll = window.setInterval(load, 30_000);
    const tick = window.setInterval(() => setNow(new Date()), 15_000);
    const first = window.setTimeout(() => setNow(new Date()), 0); // after hydration, so server and client agree
    return () => { active = false; window.clearInterval(poll); window.clearInterval(tick); window.clearTimeout(first); };
  }, []);

  return (
    <div className="ticker" aria-live="off">
      <span className="ticker-item" title={gold ? `Spot price, updated ${new Date(gold.updated_at).toLocaleTimeString()}` : undefined}>
        <span className={`live-dot${gold && !gold.stale ? "" : " is-off"}`} aria-hidden="true" />
        <span className="ticker-label">Gold</span>
        <span className="tabular ticker-value">{gold ? `${usd(gold.usd_per_oz)}/oz` : "—"}</span>
        <span className="ticker-label">{gold ? (gold.stale ? "last" : "live") : ""}</span>
      </span>
      <span className="ticker-item">
        <span className="ticker-label">Tok</span>
        <span className="tabular ticker-value">{now ? TOK_TIME.format(now) : "—"}</span>
      </span>
    </div>
  );
}
