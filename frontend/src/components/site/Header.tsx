import { SITE_NAME } from "@/lib/copy.js";
import type { Presence } from "@/lib/live";

const NAV = [
  ["#answer", "Answer"],
  ["#map", "Map"],
  ["#how-it-works", "How it works"],
  ["#data", "Data"],
] as const;

export function Header({ live, presence }: { live: boolean; presence: Presence }) {
  const readers = presence.count + (presence.more ? "+" : "");
  return (
    <header className="site-header">
      <a className="flex items-center gap-2 font-semibold tracking-tight" href="#answer" aria-label={`${SITE_NAME}, home`}>
        <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2" aria-hidden="true">
          <path d="M3 15c4 0 5-7 9-7s5 7 9 7M3 20c4 0 5-7 9-7s5 7 9 7" />
        </svg>
        <span>{SITE_NAME}</span>
      </a>
      <nav className="hidden gap-6 text-sm text-muted-foreground md:flex" aria-label="Page sections">
        {NAV.map(([href, label]) => (
          <a key={href} href={href} className="transition-colors hover:text-foreground">{label}</a>
        ))}
      </nav>
      <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
        <span className={`size-2 rounded-full ${live ? "animate-live-dot bg-ok" : "bg-muted-foreground/50"}`} aria-hidden="true" />
        {live ? (presence.count > 0 ? `${readers} here now` : "Live") : "Offline snapshot"}
      </p>
    </header>
  );
}
