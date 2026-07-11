/**
 * MONARCH PRIVATE CHAUFFEUR , shared data (website19, round 2).
 * Single source of truth: arrival windows, service classes, fleet. Imported by the layout + pages.
 * The drive scene idles at a cruise and surges on dispatch; the dispatch DRAFT (window/service/fleet)
 * is persisted across pages so the console remembers.
 */
export const WINDOWS = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
export const BUSY = ['08:00', '16:00'];

export interface Service {
  key: string;
  name: string;
  line: string;
  long: string;
  includes: string[];
}
export const SERVICES: Service[] = [
  { key: 'meet', name: 'Airport Meet & Greet', line: 'Live tracking + kerbside meet. Bags handled, no waiting hall.', long: 'Your chauffeur tracks the flight, not the schedule , so a delay just moves the meet, never costs you a fare. They are kerbside as you land, bags are theirs from the carousel, and you never set foot in a waiting hall.', includes: ['Live flight tracking', 'Kerbside meet & greet', 'Baggage handled', 'Free wait on delays'] },
  { key: 'city', name: 'Private City Transfer', line: 'Door to door, scheduled to the minute, routed for calm.', long: 'Point to point across the city, scheduled to the minute and routed for calm rather than the fastest line on a map. The same chauffeur each time once we know you, and a cabin kept quiet enough to take the call you were dreading.', includes: ['Door-to-door, to the minute', 'Calm-routed, not just fast', 'Consistent chauffeur', 'Quiet, private cabin'] },
  { key: 'long', name: 'Long-Haul Executive', line: 'Whisper-quiet cabin, steady pace, fully private for hours.', long: 'For the journeys that used to mean a flight or a lost day. A whisper-quiet cabin held at a steady pace, fully private for hours, with a chauffeur who understands that the point is to arrive unhurried and ready, not merely on time.', includes: ['Whisper-quiet cabin', 'Steady, unhurried pace', 'Hours of full privacy', 'Refreshment on board'] },
];

export interface Fleet {
  key: string;
  name: string;
  meta: string;
  long: string;
  specs: { k: string; v: string }[];
}
export const FLEET: Fleet[] = [
  { key: 'shadow', name: 'Shadow Class', meta: 'Saloon · privacy glass · whisper-quiet', long: 'The standard that needs no asterisk. A full-size saloon with privacy glass, a cabin tuned for silence, and a low, anonymous profile that draws no second look at the kerb. Most journeys begin and end here.', specs: [{ k: 'Format', v: 'Executive saloon' }, { k: 'Seats', v: '3 passengers' }, { k: 'Glass', v: 'Full privacy' }, { k: 'Noise', v: 'Whisper-tuned cabin' }] },
  { key: 'obsidian', name: 'Obsidian Class', meta: 'Long wheelbase · rear suite · low profile', long: 'A long-wheelbase car built around the rear seat as a suite , space to stretch, work, or close your eyes, behind glass no one sees through. The low profile stays discreet while the inside stops feeling like a car at all.', specs: [{ k: 'Format', v: 'Long-wheelbase' }, { k: 'Seats', v: '2 in a rear suite' }, { k: 'Glass', v: 'Full privacy' }, { k: 'Extras', v: 'Worktable · power' }] },
  { key: 'nightfall', name: 'Nightfall Class', meta: 'VIP van · lounge seating · discreet boarding', long: 'A VIP van with lounge seating for a small group that wants to travel together without giving up the quiet. Discreet boarding, room to face one another, and the same silent cabin scaled up for the people who matter.', specs: [{ k: 'Format', v: 'VIP van' }, { k: 'Seats', v: '6 · lounge layout' }, { k: 'Glass', v: 'Full privacy' }, { k: 'Boarding', v: 'Discreet, side-door' }] },
];

export const DEFAULT_SERVICE = 'city';
export const DEFAULT_FLEET = 'shadow';