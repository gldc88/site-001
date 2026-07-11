/**
 * AURUM THERMAL HOUSE , shared data (website18, round 2).
 * Single source of truth: rooms (a canal-house section top->bottom; heat feeds the caustics),
 * rituals, membership tiers. Imported by AurumLayout (heat) and the pages (section / cards).
 */
export interface Room {
  id: string;
  floor: string;
  name: string;
  temp: string;
  heat: number;     // 0 cool .. 1 sauna; feeds the caustics scene
  blurb: string;
  long: string;
  bullets: string[];
}
// top -> bottom in the section
export const ROOMS: Room[] = [
  { id: 'tea', floor: 'Attic', name: 'Tea Lounge', temp: 'Warm', heat: 0.5, blurb: 'A finishing room under the gable , slow tea, hydration, soft seating.', long: 'The room you end in, tucked under the canal-house gable. Slow tea, a hydration station, and soft seating where the heat of the circuit settles out of you. Phones stay quiet here by request, and most people stay longer than they planned.', bullets: ['Seasonal infusions', 'Hydration station', 'Small-batch pastries'] },
  { id: 'float', floor: 'Third', name: 'Float Room', temp: 'Body-neutral', heat: 0.38, blurb: 'Weightless calm in a body-temperature pool, near-silent circulation.', long: 'A body-temperature pool in near-silence, with circulation you cannot hear and light you barely notice. Booked in private session windows so the room is yours , the closest the house comes to switching the world off entirely.', bullets: ['Private session windows', 'Sound-dampened ceiling', 'Light discipline'] },
  { id: 'sauna', floor: 'Second', name: 'Sauna Line', temp: '80–95°C', heat: 1.0, blurb: 'A sequence of dry-heat rooms tuned for recovery and calm focus.', long: 'A sequence of dry-heat rooms, each a few degrees apart, tuned for recovery and a calm, narrow focus. The silent rule is enforced, not suggested. Herbal infusions run to a schedule posted at the door, and a salt-wall dry room anchors the line.', bullets: ['Herbal infusion schedule', 'Salt-wall dry room', 'Silent rule enforced'] },
  { id: 'steam', floor: 'First', name: 'Steam Gallery', temp: 'Hammam', heat: 0.82, blurb: 'Warm stone and soft steam in timed cycles.', long: 'Warm marble and soft steam, run in timed cycles of eucalyptus and pine. A guided rinse sequence is available on request, and a cold rinse lane runs alongside for contrast. The most social room in the house, and the warmest underfoot.', bullets: ['Marble slab wash zone', 'Eucalyptus & pine cycles', 'Cold rinse lane'] },
  { id: 'mineral', floor: 'Ground', name: 'Mineral Bath Hall', temp: '38°C', heat: 0.62, blurb: 'Mineral water held at a constant temperature, low light, quiet acoustics.', long: 'The heart of the house: mineral water held at a constant thirty-eight degrees in low light, with acoustics kept deliberately quiet and a slow circulation you sink into. Alcove seating bays let you disappear; towels are exchanged on request, never on a schedule.', bullets: ['Alcove seating bays', 'Mineral rinse & showers', 'Towel exchange on request'] },
  { id: 'ice', floor: 'Cellar', name: 'Ice Atelier', temp: '6°C', heat: 0.08, blurb: 'A contrast-therapy cellar for controlled recovery and a nervous-system downshift.', long: 'A contrast-therapy cellar at six degrees, for the controlled cold that downshifts the nervous system after the heat above it. Timing guidance is posted and an attendant is nearby; heated reset benches and a warm robe handoff wait the moment you step out.', bullets: ['Contrast timing guidance', 'Heated reset benches', 'Warm robe handoff'] },
];
export const DEFAULT_ID = 'mineral';

export const RITUALS = [
  { name: 'Thermal Circuit', dur: '2h 15m', note: 'Full atlas access + tea lounge. Attendant-guided flow optional.' },
  { name: 'Deep Steam', dur: '75m', note: 'Hammam cycle + rinse sequence. Add a scrub on request.' },
  { name: 'Contrast Reset', dur: '60m', note: 'Sauna line + ice atelier timing. Built for recovery.' },
  { name: 'Float Silence', dur: '45m', note: 'Private float session. Low light, minimal sound.' },
  { name: 'Massage Suite', dur: '60m', note: 'Bodywork in a private room. Best after the circuit.' },
];

export const TIERS = [
  { tier: 'Day Pass', line: 'A complete visit, timed entry.', bullets: ['Thermal atlas access', 'Robe + towel service', 'Tea lounge included'] },
  { tier: 'Resident', line: 'Priority booking, quieter windows.', bullets: ['Early access windows', 'Guest credits', 'Private storage'] },
  { tier: 'House Key', line: 'After-hours access + suite privileges.', bullets: ['After-hours entry', 'Suite priority', 'Concierge handling'] },
];