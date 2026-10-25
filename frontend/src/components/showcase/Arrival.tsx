"use client";

import { ArrowRight, Play } from "lucide-react";

export function Arrival({ ready, onGo, onTour }: { ready: boolean; onGo: () => void; onTour: () => void }) {
  return (
    <section className="arrival" aria-labelledby="arrival-title">
      <p className="arrival-kicker">A gold land contract on the Tok River, Alaska</p>
      <h1 id="arrival-title" className="arrival-title">Should we buy this piece of&nbsp;Alaska?</h1>
      <p className="arrival-lede">
        We read the ground, the land records, and a simulated town, then let an algorithm play out every month of the
        deal. Four steps, one answer.
      </p>
      <div className="arrival-actions">
        <button type="button" className="primary-button" onClick={onGo} disabled={!ready}>
          Go to Tok <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="ghost-button" onClick={onTour} disabled={!ready}>
          <Play className="size-4" aria-hidden="true" /> Take the 60-second tour
        </button>
      </div>
      <p className="arrival-note">The globe shows the real sun on Earth right now.</p>
    </section>
  );
}
