/**
 * VELLUM WEDDING BUREAU , shared data (website27, round 2). Named -bureau to avoid colliding with
 * website8's VELLUM & OAK assets. Imported by the layout, the InviteComposer, and the pages.
 */
export const BRAND = 'VELLUM WEDDING BUREAU';
export const SHORT = 'VELLUM';
export const TAGLINE = 'Design-led planning. Discreet execution.';
export const AREA = 'Netherlands · Europe destinations (on request)';
export const EMAIL = 'studio@vellumweddings.example';
export const PHONE = '+31 6 4481 9032';
export const TEL = PHONE.replace(/\s/g, '');

export const DOSSIER = [
  { n: '01', title: 'Full-Service Production', body: 'End-to-end management with a single master plan. We create a complete run-of-show with timings, cue sheets, and responsibilities , so execution is seamless and you never have to "manage the day".' },
  { n: '02', title: 'Vendor Atelier', body: 'We curate the right specialists for your aesthetic and budget, then brief them properly. Clear scope, access notes, timing, and handoff rules , so every supplier delivers their best work without friction.' },
  { n: '03', title: 'Design & Spatial Flow', body: 'We design how it feels and how it moves. Layout, guest flow, placement notes, lighting intent, and strike order , so transitions happen naturally from ceremony to dinner to dancing.' },
  { n: '04', title: 'Contingency & Calm', body: 'Weather shifts, delays, and surprises are normal. We build realistic Plan B options in advance, then handle changes quietly on the day , protecting the experience without announcements or stress.' },
];

export const LEDGER = [
  { dt: 'Venue & contracting', dd: 'Shortlists, site logic, contract review, deposit timing, and decision notes that keep everything clean and confident.' },
  { dt: 'Vendor curation + direction', dd: 'Sourcing, briefing, alignment calls, and a shared run-of-show so every supplier works as one coordinated system.' },
  { dt: 'Guest experience & flow', dd: 'Arrivals, comfort, signage, transport, and the small choices that prevent bottlenecks and awkward pauses.' },
  { dt: 'Design → buildable plan', dd: 'We translate taste into instructions: what gets ordered, built, placed, lit, and removed , in sequence.' },
  { dt: 'Budget control', dd: 'Spend categories, payment schedule, change control, and clarity on what improves the experience , and what does not.' },
  { dt: 'Run-of-show + on-site execution', dd: 'Timing cues, vendor handoffs, and quiet contingency planning. If something shifts, the day stays stable.' },
];

export const SCOPES = ['Full Service', 'Partial Support', 'Wedding Day', 'Design Studio', 'Consultation'];