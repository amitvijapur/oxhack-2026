// Every user-facing sentence in one place, so wording can change without touching layout.

/** Orecast, Amit's final name (brand/orecast/BRAND.md), replacing "Land Arbitrage: Gold" on 25 Oct 2026. */
export const SITE_NAME = 'Orecast';
export const SITE_PLACE = 'Tok River, Alaska';
/** Draft descriptor (BRAND.md): page metadata only until it is final. */
export const SITE_DESCRIPTOR = 'Mineral intelligence over time';

export const HERO = {
  question: 'Is there gold worth claiming near Tok, Alaska?',
  lede: 'Explore observed Tok sediment samples, land records and an explicit option-assignment scenario model.',
  cta: 'Explore the map',
  secondary: 'How it works',
};

export const AREA_LABELS = { A: 'Tok west', B: 'Tok east' };

/** The four pieces of the project, in the order data flows through them. */
export const STEPS = [
  {
    key: 'evidence', live: null, owner: 'Amit', title: 'Soil evidence', href: '#map',
    body: 'Alaska’s 2016 survey measured gold in 67 stream-sediment samples across two areas.',
  },
  {
    key: 'land_contracts', live: 'land', owner: 'Arjin', title: 'Land claims', href: '#map',
    body: 'Which sample points sit inside today’s mining claims, and who holds them.',
  },
  {
    key: 'simulation_prediction', live: 'swarm', owner: 'Muhd', title: 'Crowd simulation', href: '#how-it-works',
    body: 'How locals, government and investors might react to news, simulated with MiroFish.',
  },
  {
    key: 'decision', live: 'decision', owner: 'Salman', title: 'Decision', href: '#answer',
    body: 'Compares assumed option assignment cash over 30, 90 and 180 days, including no-sale risk.',
  },
];

export const DISCLAIMER = 'Soil samples show where gold was measured, not who owns the land or what it is worth.';
