"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { supportColor, type Post, type Town as TownData } from "@/lib/showcase";
import { Panel } from "./Panel";

/** Plain names for the swarm's groups, and where each sits around the square. */
const GROUPS: { key: string; label: string; angle: number }[] = [
  { key: "Government", label: "Officials", angle: -90 },
  { key: "Land side: industry", label: "Miners & industry", angle: -18 },
  { key: "Funds", label: "Investors", angle: 54 },
  { key: "Retail", label: "Gold buyers", angle: 126 },
  { key: "Land side: community", label: "Locals", angle: 198 },
];
const HOUR_MS = 520;
const W = 560;
const H = 460;

type Dot = { name: string; role: string; group: string; tier: number; x: number; y: number };

function layout(people: TownData["people"]): Dot[] {
  const dots: Dot[] = [];
  for (const group of GROUPS) {
    const members = people.filter((p) => p.group === group.key).sort((a, b) => a.tier - b.tier);
    const cx = W / 2 + Math.cos((group.angle * Math.PI) / 180) * 168;
    const cy = H / 2 + Math.sin((group.angle * Math.PI) / 180) * 150;
    members.forEach((p, i) => {
      // Sunflower packing: the most senior people sit in the middle of their group.
      const r = 9.5 * Math.sqrt(i);
      const a = i * 2.39996;
      dots.push({ ...p, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    });
  }
  return dots;
}

export function Town({ town, tour, onNext }: { town: TownData; tour: boolean; onNext: () => void }) {
  const dots = useMemo(() => layout(town.people), [town]);
  const [hour, setHour] = useState(0);
  const [playing, setPlaying] = useState(tour);
  const hours = town.run.simulated_hours;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setHour((h) => {
        if (h >= hours) { setPlaying(false); return h; }
        return h + 1;
      });
    }, HOUR_MS);
    return () => window.clearInterval(timer);
  }, [playing, hours]);

  const seen = useMemo(() => town.posts.filter((p) => p.round <= hour), [town, hour]);
  const latest = useMemo(() => {
    const byName = new Map<string, Post>();
    for (const p of seen) byName.set(p.name, p);
    return byName;
  }, [seen]);
  const speaking = new Set(seen.filter((p) => p.round === hour).map((p) => p.name));
  const mood = seen.length ? seen.reduce((sum, p) => sum + p.score, 0) / seen.length : null;
  const feed = [...seen].reverse().slice(0, 1);
  const groupLabel = (key: string) => GROUPS.find((g) => g.key === key)?.label ?? key;

  const start = () => {
    if (hour >= hours) setHour(0);
    setPlaying(true);
  };

  return (
    <>
      <Panel
        step={3}
        mode="Simulated"
        title="What would the town think?"
        lede={<>We built 61 AI people of Tok (officials, miners, locals, investors) and gave them one piece of news: <em>gold just jumped to $4,500.</em> Each dot is a person; gold means they back mining, grey means they don&apos;t.</>}
        next={{ label: "So, do we buy?", onClick: onNext }}
        evidence={[
          { label: `MiroFish society, ${town.run.kind} run, seed ${town.run.seed}, ${town.posts.length} on-topic posts scored 0–10`, source: town.source },
          { label: `Judge check: ${town.run.judge_check}` },
          { label: "The scored scenario runs (mine approved, protest, gold falls…) feed the algorithm once they pass their checks" },
        ]}
      >
        <dl className="stat-row">
          <div><dt>Simulated hour</dt><dd className="tabular">{hour} / {hours}</dd></div>
          <div><dt>Posts</dt><dd className="tabular">{seen.length}</dd></div>
          <div><dt>Town mood</dt><dd className="tabular">{mood === null ? "—" : mood.toFixed(1)} <small>/ 10</small></dd></div>
        </dl>
        <button type="button" className="primary-button wide" onClick={start} disabled={playing}>
          {hour >= hours ? <RotateCcw className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {hour === 0 ? "Play the day" : hour >= hours ? "Play again" : "Playing…"}
        </button>
      </Panel>

      <div className="stage stage-town" aria-label="The simulated town">
        <svg viewBox={`0 0 ${W} ${H}`} className="town-svg" role="img" aria-label={`61 people; town mood ${mood?.toFixed(1) ?? "not yet known"} out of 10`}>
          {GROUPS.map((g) => {
            const x = W / 2 + Math.cos((g.angle * Math.PI) / 180) * 168;
            const y = H / 2 + Math.sin((g.angle * Math.PI) / 180) * 150;
            const below = g.angle > 0 && g.angle < 180;
            return <text key={g.key} x={x} y={below ? y + 66 : y - 58} className="town-group" textAnchor="middle">{g.label}</text>;
          })}
          <g>
            <circle cx={W / 2} cy={H / 2} r={30} className="town-news" />
            <text x={W / 2} y={H / 2 + 4} textAnchor="middle" className="town-news-label">NEWS</text>
          </g>
          {dots.map((d) => {
            const post = latest.get(d.name);
            const talking = speaking.has(d.name);
            return (
              <g key={d.name}>
                {talking ? <circle cx={d.x} cy={d.y} r={14} className="town-ripple" /> : null}
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={d.tier === 1 ? 7 : d.tier === 2 ? 5.5 : 4.2}
                  fill={post ? supportColor(post.score) : "transparent"}
                  className={post ? "town-dot" : "town-dot is-quiet"}
                >
                  <title>{`${d.name}, ${d.role}${post ? `: ${post.score}/10` : ""}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
        <div className="town-legend" aria-hidden="true">
          <span>against</span><i className="mood-bar" /><span>for mining</span>
        </div>
        <div className="feed" aria-live="polite">
          <AnimatePresence initial={false}>
            {feed.map((p) => (
              <motion.figure
                key={`${p.round}-${p.name}-${p.platform}`}
                className="post"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <figcaption>
                  <span className="post-score tabular" style={{ background: supportColor(p.score) }}>{p.score}</span>
                  <strong>{p.name}</strong> · {groupLabel(p.group)} · hour {p.round}
                </figcaption>
                <blockquote>{p.text.length > 180 ? `${p.text.slice(0, 177)}…` : p.text}</blockquote>
              </motion.figure>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
