/**
 * LIGNUM ATELIER , shared timber data (website13, round 2).
 * Single source of truth for the species library: imported by LignumLayout (to tint the WebGL
 * wood surface + fallback gradient) and by the pages (to render cards / readouts). Keeps the
 * displayed copy and the scene tints from drifting apart.
 */
export interface Timber {
  key: string;
  name: string;
  origin: string;
  janka: number;      // side hardness, lbf
  deep: string;       // hex
  mid: string;        // hex
  light: string;      // hex
  grainFreq: number;  // growth-ring frequency (tighter = higher)
  contrast: number;   // latewood line sharpness 0..1
  note: string;
}

export const SPECIES: Timber[] = [
  { key: 'oak', name: 'European Oak', origin: 'Slavonia, Croatia', janka: 1360, deep: '#3a2a17', mid: '#6e5226', light: '#bd9a5e', grainFreq: 5.6, contrast: 0.56, note: 'Open cathedral grain. The studio default for fitted interiors , it earns a honeyed amber as it ages.' },
  { key: 'walnut', name: 'American Black Walnut', origin: 'Missouri, USA', janka: 1010, deep: '#1f1209', mid: '#4a3120', light: '#8a6446', grainFreq: 4.2, contrast: 0.50, note: 'Deep chocolate field with violet undertones. Carves clean, polishes to a soft chatoyant sheen.' },
  { key: 'ebony', name: 'Macassar Ebony', origin: 'Sulawesi, Indonesia', janka: 3220, deep: '#120c08', mid: '#2c2018', light: '#7a5a38', grainFreq: 7.6, contrast: 0.82, note: 'Striped, near-black, exceptionally dense. Reserved for handles, inlay, and statement faces.' },
  { key: 'cherry', name: 'Wild Cherry', origin: 'Jura, France', janka: 950, deep: '#3a1c10', mid: '#6e3320', light: '#c07a4e', grainFreq: 4.9, contrast: 0.46, note: 'Warm and rose-toned when cut; darkens to a glowing russet under light within a single season.' },
  { key: 'ash', name: 'Olive Ash', origin: 'Tuscany, Italy', janka: 1320, deep: '#2e2415', mid: '#6a5836', light: '#cdb784', grainFreq: 6.2, contrast: 0.60, note: 'Pale gold streaked with smoke. Bright, springy, and alive with figure across the board.' },
];

export const MAX_JANKA = 3220;
export const DEFAULT_KEY = 'walnut';

/** CSS multi-gradient that mimics the grain , used for swatches + the no-WebGL fallback. */
export const grad = (s: Pick<Timber, 'deep' | 'mid' | 'light'>) =>
  `linear-gradient(95deg, ${s.deep}, ${s.mid} 35%, ${s.light} 50%, ${s.mid} 65%, ${s.deep}), repeating-linear-gradient(92deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 7px), repeating-linear-gradient(92deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 5px)`;

/** Numeric Species payload the WebGL scene expects. */
export const toSceneSpecies = (s: Timber) => ({
  deep: parseInt(s.deep.slice(1), 16),
  mid: parseInt(s.mid.slice(1), 16),
  light: parseInt(s.light.slice(1), 16),
  grainFreq: s.grainFreq,
  contrast: s.contrast,
});