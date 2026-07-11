/**
 * HEARTH & GROVE , shared data (website21, round 2).
 * Services, process, specimen library, and the scroll-season palette (stone -> forest).
 * Imported by HearthLayout (season + scene) and the pages (cards / grove).
 */
export const SERVICES = [
  { title: 'Garden Design', line: 'Planting plans, levels, layout, and material selection.' },
  { title: 'Planting & Soil', line: 'Soil correction, structure planting, and perennial composition.' },
  { title: 'Hardscaping', line: 'Patios, paths, edging, and clean transitions.' },
  { title: 'Drainage & Irrigation', line: "Water movement solved quietly. Systems that don't fail." },
  { title: 'Lighting', line: 'Subtle, functional illumination , paths, terraces, focal points.' },
  { title: 'Maintenance', line: 'Pruning, seasonal resets, and consistent site discipline.' },
];

export const PROCESS = [
  { step: 'Site Walk', line: 'We measure, observe light and water, and map constraints across a full visit.' },
  { step: 'Definition', line: 'A defined scope: layout, materials, planting, and the order they happen in.' },
  { step: 'Construction', line: 'Groundworks, surfaces, planting , executed in a controlled, sequenced order.' },
  { step: 'Cultivation', line: 'A seasonal plan and optional maintenance to keep the garden stable as it matures.' },
];

export interface Specimen { latin: string; common: string; age: string; height: string; char: string; light: 'full-sun' | 'part-shade' | 'shade'; }
export const SPECIMENS: Specimen[] = [
  { latin: "Pinus sylvestris 'Watereri'", common: 'Scots Pine', age: '35yr', height: '4.5m', char: 'Structural evergreen', light: 'full-sun' },
  { latin: 'Amelanchier lamarckii', common: 'Snowy Mespilus', age: '18yr', height: '3.5m', char: 'Multi-stem · blossom', light: 'part-shade' },
  { latin: 'Taxus baccata', common: 'English Yew', age: '60yr', height: '2.0m', char: 'Cloud-pruned · ancient', light: 'shade' },
  { latin: 'Parrotia persica', common: 'Persian Ironwood', age: '25yr', height: '5.0m', char: 'Autumn colour · architecture', light: 'full-sun' },
  { latin: "Acer palmatum 'Osakazuki'", common: 'Japanese Maple', age: '22yr', height: '3.0m', char: 'Fiery autumn · fine canopy', light: 'part-shade' },
  { latin: "Betula utilis 'Jacquemontii'", common: 'Himalayan Birch', age: '20yr', height: '6.0m', char: 'White-stem · grove tree', light: 'full-sun' },
];

// scroll-season palette (cool stone -> forest emerald)
export const SEASON = {
  start: { bg: [10, 10, 10], text: [214, 211, 209], muted: [120, 113, 108], accent: [16, 185, 129] },
  end: { bg: [6, 18, 13], text: [236, 253, 245], muted: [110, 200, 165], accent: [52, 211, 153] },
};