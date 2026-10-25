"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { supportColor, type Post, type Town } from "@/lib/showcase";
import { Section } from "../TabBody";

/** Plain names for the swarm's groups, and where each sits in the small chart. */
const GROUPS: { key: string; label: string; angle: number }[] = [
  { key: "Government", label: "Officials", angle: -90 },
  { key: "Land side: industry", label: "Miners", angle: -18 },
  { key: "Funds", label: "Investors", angle: 54 },
  { key: "Retail", label: "Gold buyers", angle: 126 },
  { key: "Land side: community", label: "Locals", angle: 198 },
];
const HOUR_MS = 420;
const W = 380;
const H = 260;

function layout(people: Town["people"]) {
  return GROUPS.flatMap((group) => {
    const cx = W / 2 + Math.cos((group.angle * Math.PI) / 180) * 120;
    const cy = H / 2 + Math.sin((group.angle * Math.PI) / 180) * 88;
    return people.filter((p) => p.group === group.key).sort((a, b) => a.tier - b.tier).map((p, i) => ({
      ...p, x: cx + 7 * Math.sqrt(i) * Math.cos(i * 2.39996), y: cy + 7 * Math.sqrt(i) * Math.sin(i * 2.39996),
    }));
  });
}

/** How the simulated town reacts: 61 AI residents replaying their scored day-1 posts. */
export function Swarm({ town }: { town: Town }) {
  const dots = useMemo(() => layout(town.people), [town]);
  const [hour, setHour] = useState(0);
  const [playing, setPlaying] = useState(false);
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
  const latest = useMemo(() => new Map<string, Post>(seen.map((p) => [p.name, p])), [seen]);
  const mood = seen.length ? seen.reduce((sum, p) => sum + p.score, 0) / seen.length : null;
  const last = seen[seen.length - 1];

  return (
    <Section
      title="How the town reacts"
      lede={<>61 AI residents of Tok hear one piece of news, &ldquo;gold just jumped to $4,500&rdquo;, and post for a day. Each dot is a person, from grey (against mining) to green (for).</>}
    >
      <div className="swarm">
        <svg viewBox={`0 0 ${W} ${H}`} className="swarm-svg" role="img" aria-label={`61 residents; town mood ${mood?.toFixed(1) ?? "not yet known"} out of 10`}>
          {GROUPS.map((g) => {
            const x = W / 2 + Math.cos((g.angle * Math.PI) / 180) * 120;
            const y = H / 2 + Math.sin((g.angle * Math.PI) / 180) * 88;
            return <text key={g.key} x={x} y={g.angle > 0 && g.angle < 180 ? y + 44 : y - 38} textAnchor="middle" className="swarm-group">{g.label}</text>;
          })}
          {dots.map((d) => {
            const post = latest.get(d.name);
            return (
              <circle key={d.name} cx={d.x} cy={d.y} r={d.tier === 1 ? 5 : d.tier === 2 ? 4 : 3.2}
                fill={post ? supportColor(post.score) : "transparent"} className={post ? "swarm-dot" : "swarm-dot is-quiet"}>
                <title>{`${d.name}, ${d.role}${post ? `: ${post.score}/10` : ""}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="swarm-side">
          <dl className="mini-stats">
            <div><dt>Hour</dt><dd className="tabular">{hour}/{hours}</dd></div>
            <div><dt>Posts</dt><dd className="tabular">{seen.length}</dd></div>
            <div><dt>Mood</dt><dd className="tabular">{mood === null ? "—" : mood.toFixed(1)}<small>/10</small></dd></div>
          </dl>
          <button type="button" className="button secondary" onClick={() => { if (hour >= hours) setHour(0); setPlaying(true); }} disabled={playing}>
            {hour >= hours ? <RotateCcw className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            {hour === 0 ? "Play the day" : hour >= hours ? "Play again" : "Playing…"}
          </button>
        </div>
      </div>
      {last ? (
        <blockquote className="post" aria-live="polite">
          <p>{last.text.length > 200 ? `${last.text.slice(0, 197)}…` : last.text}</p>
          <footer>{last.name} · {GROUPS.find((g) => g.key === last.group)?.label ?? last.group} · {last.score}/10</footer>
        </blockquote>
      ) : null}
      <p className="note">Separate pilot illustration, not a survey or a pricing input. The workbench above checks attributed scenario runs before allowing a signal to change a demo price.</p>
    </Section>
  );
}
