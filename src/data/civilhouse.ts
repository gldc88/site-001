/**
 * CIVIL HOUSE MAKELAARS , shared data (website28, round 2). Dutch real-estate office run like an
 * execution desk. Imported by the layout, the tool components, and the pages.
 */
export const BRAND = 'CIVIL HOUSE MAKELAARS';
export const SHORT = 'CIVIL HOUSE';
export const TAGLINE = 'Structured representation. Clean decisions. Calm closings.';
export const AREA = 'Amsterdam · Haarlem · Utrecht (and nearby)';
export const EMAIL = 'office@civilhouse.example';
export const PHONE = '+31 6 5531 2408';
export const TEL = PHONE.replace(/\s/g, '');

export const STANDARDS = [
  { t: 'Brief first', lead: 'We start with constraints, timing, and decision rules , not opinions.', body: 'Before viewings or pricing debates, we document must-haves, dealbreakers, timeline pressure, and who decides. It saves weeks and prevents wasted motion.' },
  { t: 'Presentation direction', lead: 'Listings are product launches. Light, sequence, copy, and cadence , engineered to protect value.', body: 'Every listing gets narrative control: time-of-day planning, staging priorities, photo order, and copy that signals value. Fewer browsers. More qualified demand.' },
  { t: 'Negotiation discipline', lead: 'We reduce emotional drift. Offers are logged, terms stress-tested, decisions stay calm.', body: 'You receive each offer as a clear comparison: price, conditions, financing certainty, timeline, and risk , plus a recommended next move. No guesswork, no whiplash.' },
  { t: 'Handover hygiene', lead: 'Closing is a transfer. Documents, utilities, keys, and inspection notes stay tidy so nothing re-opens.', body: 'We run a handover checklist: meter readings, key inventory, utilities, notary alignment, and a clean archive. Loose ends cause disputes , we avoid them.' },
];

export const REPRESENTATION = [
  { title: 'Canal District Apartment', meta: 'Amsterdam · Demand control', body: 'Daylight photography direction, copy that protects value, and a viewing cadence designed to reduce "tourist traffic".' },
  { title: 'Family Home (Corner Lot)', meta: 'Haarlem · Clean negotiation', body: 'Pre-screened viewings, calm counter posture, and a handover pack that prevents last-minute stalls.' },
  { title: 'New Build Unit', meta: 'Utrecht · Paperwork clarity', body: 'Builder documentation mapped early, snag planning, and a timeline that keeps bank, notary, and buyer aligned.' },
];

export const NEXT_STEPS = [
  'A short call to understand your situation, timing, and decision rules.',
  'One clear next step in writing , pricing posture or shortlist, not a brochure.',
  "If it's a fit, we open the desk and run it like one. Calm by design.",
];

export const LANES = [
  { value: 'Sell', label: 'Selling' },
  { value: 'Buy', label: 'Buying' },
  { value: 'Invest', label: 'Investing' },
];
export const TYPES = ['Apartment', 'Family home', 'Townhouse', 'Canal house', 'New build', 'Commercial unit'];