/**
 * ATELIER PRIVATE CATERING , shared data (website17, round 2).
 * Single source of truth: menus (each warms the candle room), durations, pairings, guests, plus
 * philosophy + sourcing. Imported by AtelierLayout (warmth) and the pages (cards / compose).
 */
export interface Menu {
  key: string;
  title: string;
  line: string;
  warmth: number;   // 0..1, feeds the candle scene
  desc: string;
  courses: string[];
}
export const MENUS: Menu[] = [
  { key: 'botanical', title: 'Botanical', line: 'Vegetable-first, knife-edge balance.', warmth: 0.34, desc: 'Built around acidity, smoke, and texture. Proteins appear sparingly , supporting roles, never the loudest voice. The coolest, most precise of the three directions.', courses: ['Wild Allium Tart', 'Smoked Beetroot', 'Mushroom Consommé', 'Pine Nut Glace'] },
  { key: 'coastal', title: 'Coastal', line: 'Cold-water clarity, bright finish.', warmth: 0.56, desc: 'Raw and lightly cooked seafood with citrus, herb oils, and gentle heat. Day-boat supply, adjusted daily to the landings , what is best that morning sets the table that night.', courses: ['Scallop Crudo', 'Oyster Emulsion', 'Line-Caught Cod', 'Sea Buckthorn'] },
  { key: 'terroir', title: 'Terroir', line: 'Deep land, fermentation, smoke.', warmth: 0.9, desc: 'Roots, game, and preservation , balanced with sharp pickling and clean broths. Rich and controlled, with a long finish. The warmest direction, for the longest evenings.', courses: ['Venison Tartare', 'Roasted Salsify', 'Aged Duck Breast', 'Blackberry & Smoke'] },
];

export const DURATIONS = [
  { key: '3h', label: '3 hours', sub: 'Standard dinner' },
  { key: '4h', label: '4 hours', sub: 'Extended courses' },
  { key: '5h', label: '5 hours', sub: 'Full evening' },
];
export const PAIRINGS = [
  { key: 'none', label: 'Food only' },
  { key: 'wine', label: 'Wine, sommelier-led' },
  { key: 'house', label: 'Juice & tea, house-made' },
  { key: 'mixed', label: 'Mixed pairing' },
];
export const GUESTS = [
  { key: 'intimate', label: '2 · Intimate' },
  { key: 'small', label: '4–6 · Small group' },
  { key: 'party', label: '8–12 · Dinner party' },
  { key: 'event', label: '12+ · Event' },
];

export const PHILOSOPHY = [
  { k: 'Silence', v: 'Early load-in, a tight footprint, and no disruption to the room. The best service is the one you never notice running.' },
  { k: 'Pacing', v: 'Courses timed to the conversation, the speeches, the table , not to the kitchen. We read the room and hold plates until it is ready.' },
  { k: 'Sourcing', v: 'Season-led, from farms, day-boats, and small makers. We build the menu around what is best that week, not the other way round.' },
  { k: 'Closeout', v: 'Surfaces, bins, the dish zone , the kitchen left back at zero. You wake to a home that shows no sign we were there.' },
];
export const SOURCING = [
  { id: '01', item: 'Hand-Dived Scallops', origin: 'Isle of Skye, Scotland', type: 'Day-boat · hand-dived', note: 'Landed and shucked the same day, never dredged. Sweetness intact, sand gone.' },
  { id: '02', item: 'Périgord Black Truffle', origin: 'Dordogne, France', type: 'Seasonal forage', note: 'Bought by the nose, in season only. Shaved at the table while it is still warm.' },
  { id: '03', item: 'Heritage Micro-Herbs', origin: 'Atelier garden, local', type: 'Hyper-local cultivation', note: 'Cut hours before service from our own beds , the shortest supply chain we have.' },
];

export const DEFAULT_KEY = 'coastal';