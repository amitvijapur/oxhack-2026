// Every user-facing sentence in one place, so wording can change without touching layout.

/** Chosen by Salman on 25 Oct 2026, replacing the blank placeholder (see PRODUCT.md). */
export const SITE_NAME = 'Land Arbitrage: Gold';

export const HERO = {
  question: 'Is there gold worth claiming near Tok, Alaska?',
  lede: 'We combine 2016 soil samples, today’s land claims and a decision model, then tell you what to check before paying.',
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
    body: 'Weighs the cost of an option on the land against the chance a buyer appears, month by month.',
  },
];

/** Decision-engine gate names in plain words. */
export const CHECK_LABELS = {
  counterparty: 'Someone to deal with',
  land_status: 'Land status',
  mineral_rights_conveyed: 'Mineral rights',
};

export const DISCLAIMER = 'Soil samples show where gold was measured, not who owns the land or what it is worth.';
