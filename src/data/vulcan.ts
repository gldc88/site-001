/**
 * VULCANIC ATELIER , shared data (website15, round 2).
 * Single source of truth for the strata (offerings) + forge specs: imported by VulcanLayout (heat that
 * feeds the magma) and the pages (cards / detail).
 */
export interface Strata {
  key: string;
  name: string;
  heat: number;     // 0..100, feeds the magma intensity on select
  stat: string;
  desc: string;
  long: string;
  includes: string[];
}

export const STRATA: Strata[] = [
  { key: 'basalt', name: 'Basalt Suites', heat: 34, stat: 'Eight suites only', desc: 'Stone baths, blackout drape, vented warmth, zero glare.', long: 'Eight rooms, never a ninth. Each is cut around a stone bath and a vented warmth you set yourself, behind blackout drape that kills every stray photon. The quietest stratum , heat you can sink into rather than perform in.', includes: ['Heated stone bath', 'Blackout drape', 'Vented, room-tuned warmth', 'Zero-glare lighting'] },
  { key: 'afterglow', name: 'Afterglow Service', heat: 24, stat: 'Concierge on-call', desc: 'Off-floor concierge. Present the instant you need it, invisible otherwise.', long: 'A concierge that lives off the floor. Present the instant you need it and invisible the rest of the night , no hovering, no scripted check-ins. The coolest stratum by design, so it never competes with the room.', includes: ['Off-floor concierge', 'On-call, never hovering', 'Pre-arrival preferences', 'Silent by default'] },
  { key: 'ash', name: 'Ash Bar', heat: 52, stat: 'Capped seating', desc: 'A candlelight counter with a hard seat cap.', long: 'A candlelight counter with a hard seat cap , walk-ins close the moment the last stool fills, so the room never tips into noise. A short list, poured slowly, under a low warm glow that rises as the night settles.', includes: ['Hard seat cap', 'Candlelight only', 'Short, considered list', 'Closes when full'] },
  { key: 'obsidian', name: 'Obsidian Dining', heat: 64, stat: 'Reservation tasting', desc: 'A single seating tasting, paced deliberately.', long: 'One seating, one tasting. Allergies and avoidances are collected before you arrive so nothing breaks the pacing on the night. Hot plates land hot; the room is kept dark enough that the food is the only bright thing in it.', includes: ['Single nightly seating', 'Pre-collected dietary notes', 'Deliberate pacing', 'Hot plates, dark room'] },
  { key: 'thermal', name: 'Thermal Deck', heat: 84, stat: 'Hot–cold circuit', desc: 'A scheduled hot–cold circuit with rest pods.', long: 'The hottest stratum: a scheduled hot–cold circuit with rest pods and a towel rotation that runs like clockwork. Quiet hours are enforced, so the heat is the only thing that roars. Booked by the slot, never overfilled.', includes: ['Scheduled hot–cold circuit', 'Rest pods + towel rotation', 'Enforced quiet hours', 'Slot-booked, capped'] },
];

export const FORGE = [
  { k: 'Heat profile', v: 'Room-tuned' },
  { k: 'Sound floor', v: '≤ 28 dBA' },
  { k: 'Guest load', v: '24 / night' },
  { k: 'Routing', v: 'Split paths' },
];

export const PILLS = ['Reservation-only', 'Capped capacity', 'Quiet by design'];
export const DEFAULT_KEY = 'thermal';