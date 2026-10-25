"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { signedUsd, type Decision, type Plots } from "@/lib/showcase";
import { Section, TabBody } from "../TabBody";
import type { Tab } from "../Panel";

const HOW: { tab: Tab; title: string; text: string }[] = [
  { tab: "ground", title: "What's in the ground", text: "Gold and 48 other elements measured at 67 sampled plots." },
  { tab: "market", title: "Who owns it, and when they rushed in", text: "1,469 real claims, land prices and deals since 1975." },
  { tab: "decision", title: "How the town reacts", text: "61 simulated residents react to gold news." },
  { tab: "decision", title: "Buy, hold or sell", text: "An algorithm plays out every month of a land contract." },
];

export function Overview({ decision, plots, onTab }: { decision: Decision; plots: Plots; onTab: (tab: Tab) => void }) {
  const base = decision.worlds.find((w) => w.q === 0.1 && w.acceleration) ?? decision.worlds[0];
  const q = base.break_even.buyers_per_staking_event_q;
  return (
    <TabBody
      evidence={[
        { label: "Decision engine verdict across all assumption sets", source: decision.source },
        { label: `Plots: Alaska DNR claims retrieved ${plots.claims_retrieved}` },
      ]}
    >
      <section className="answer">
        <p className="answer-label">Today&apos;s signal for the Tok Site B contract</p>
        <p className={`answer-signal${decision.verdict === "BUY" ? " is-buy" : ""}`}>{decision.verdict}</p>
        <p className="answer-why">
          Buyers for land here are too rare. In {decision.combinations - decision.combinations_buy} of {decision.combinations} versions
          of the future the engine tested, paying for the contract loses money.
        </p>
        <dl className="mini-stats three">
          <div><dt>Expected value</dt><dd className="tabular is-down">{signedUsd(decision.expected_value_usd)}</dd></div>
          <div><dt>Chance of loss</dt><dd className="tabular">{Math.round(base.p_loss * 100)}%</dd></div>
          <div><dt>Buy if buyers reach</dt><dd className="tabular">{q ? `1 in ${Math.round(1 / q)}` : "—"}</dd></div>
        </dl>
        <button type="button" className="button primary wide" onClick={() => onTab("decision")}>
          See how the deal plays out <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </section>

      <Section title="How it works" lede="Tap any plot on the map to inspect it, or follow the steps:">
        <ol className="how">
          {HOW.map((h, i) => (
            <li key={h.title}>
              <button type="button" onClick={() => onTab(h.tab)}>
                <span className="how-num tabular">{i + 1}</span>
                <span><strong>{h.title}</strong><span>{h.text}</span></span>
              </button>
            </li>
          ))}
        </ol>
      </Section>

      <a className="credit" href="https://26.oxhack.net/" target="_blank" rel="noreferrer">
        <Image src="/brand/oxhack-logo.webp" alt="OxHack" width={28} height={28} />
        Built at OxHack 26 for the TIME theme
      </a>
    </TabBody>
  );
}
