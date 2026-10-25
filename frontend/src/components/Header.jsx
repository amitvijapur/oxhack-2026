import BackendStatus from '../backend/BackendStatus.jsx';
import { SITE_NAME } from '../copy.js';

const NAV = [['#answer', 'Answer'], ['#map', 'Map'], ['#how-it-works', 'How it works'], ['#data', 'Data']];

export default function Header() {
  return <header className="site-header">
    <a className="wordmark" href="#answer" aria-label={`${SITE_NAME}, home`}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c4 0 5-7 9-7s5 7 9 7M3 20c4 0 5-7 9-7s5 7 9 7" /></svg>
      <span>{SITE_NAME}</span>
    </a>
    <nav className="site-nav" aria-label="Page sections">
      {NAV.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
    </nav>
    <BackendStatus />
  </header>;
}
