/**
 * CALIBER STUDIO , shared data (website29, round 2). Bespoke mechanical watches. Imported by the layout,
 * the Configurator component, and the pages. Options carry price, ref-code, and SVG visual values.
 */
export const BRAND = 'CALIBER STUDIO';
export const FULL = 'CALIBER STUDIO , BESPOKE MECHANICAL WATCHES';
export const TAGLINE = 'Mechanical precision. Personal commissions. Built to be kept.';
export const SUBLINE = 'We design and assemble custom mechanical watches in Amsterdam. From movement selection to dial finishing , every choice is made for balance, legibility, and longevity.';
export const AREA = 'Amsterdam · Worldwide Delivery · Private Consultations';
export const EMAIL = 'commissions@caliberstudio.example';
export const PHONE = '+31 6 4728 1190';
export const TEL = PHONE.replace(/\s/g, '');
export const BASE_PRICE = 1450;

export interface Opt { v: string; label: string; price: number; code: string; vis: Record<string, string>; }

export const OPTIONS: Record<string, { title: string; opts: Opt[] }> = {
  case: { title: 'Case Material', opts: [
    { v: '316L Steel', label: '316L Steel (Brushed/Polished)', price: 0, code: 'STL', vis: { '--case-fill': '#c2ccd6', '--case-edge': '#9aa6b2' } },
    { v: 'Titanium', label: 'Titanium (Grade 5)', price: 200, code: 'TI', vis: { '--case-fill': '#9aa1a8', '--case-edge': '#767d84' } },
    { v: 'Bronze', label: 'Bronze (CuSn8)', price: 150, code: 'BRZ', vis: { '--case-fill': '#bb8a4e', '--case-edge': '#8c6535' } },
    { v: 'DLC Black', label: 'DLC Black (Stealth)', price: 100, code: 'DLC', vis: { '--case-fill': '#26292e', '--case-edge': '#15171b' } },
  ] },
  dial: { title: 'Dial Type', opts: [
    { v: 'Matte Black', label: 'Matte Black (Tool)', price: 0, code: 'BLK', vis: { '--dial-fill': '#0c0e12', '--marker-fill': 'rgba(238,242,246,0.85)', '--sun-op': '0', '--avn-op': '0' } },
    { v: 'Enamel White', label: 'Enamel White (Gloss)', price: 150, code: 'WHT', vis: { '--dial-fill': '#eef1f4', '--marker-fill': '#23262b', '--sun-op': '0', '--avn-op': '0' } },
    { v: 'Sunburst Blue', label: 'Sunburst Blue (Radial)', price: 50, code: 'BLU', vis: { '--dial-fill': '#1f4f86', '--marker-fill': 'rgba(255,255,255,0.92)', '--sun-op': '1', '--avn-op': '0' } },
    { v: 'Aventurine', label: 'Aventurine (Night Sky)', price: 250, code: 'AVN', vis: { '--dial-fill': '#0b1b3a', '--marker-fill': 'rgba(207,224,255,0.92)', '--sun-op': '0', '--avn-op': '1' } },
  ] },
  hands: { title: 'Hand Finish', opts: [
    { v: 'Polished', label: 'Polished (Diamond-cut)', price: 0, code: 'POL', vis: { '--hand-fill': '#e8edf2' } },
    { v: 'Heat Blued', label: 'Heat Blued', price: 80, code: 'HBL', vis: { '--hand-fill': '#3b6fd6' } },
    { v: 'Rose Gold', label: 'Rose Gold', price: 50, code: 'GLD', vis: { '--hand-fill': '#d9a17a' } },
    { v: 'Skeleton', label: 'Skeletonized', price: 50, code: 'SKL', vis: { '--hand-fill': '#aeb7c0' } },
  ] },
  strap: { title: 'Strap System', opts: [
    { v: 'NATO Nylon', label: 'NATO Nylon (Daily)', price: 0, code: 'NATO', vis: { '--strap-fill': '#3a4654', '--strap-tex': 'rgba(255,255,255,0.22)' } },
    { v: 'Leather', label: 'Horween Leather', price: 80, code: 'LTH', vis: { '--strap-fill': '#6b4a2f', '--strap-tex': 'rgba(0,0,0,0.35)' } },
    { v: 'Steel Bracelet', label: 'Steel Bracelet', price: 150, code: 'BRC', vis: { '--strap-fill': '#aab4bd', '--strap-tex': 'rgba(0,0,0,0.3)' } },
    { v: 'Rubber', label: 'FKM Rubber', price: 50, code: 'RUB', vis: { '--strap-fill': '#15171b', '--strap-tex': 'rgba(255,255,255,0.12)' } },
  ] },
};

export const PLATFORMS = [
  { id: '01', title: 'Field Command', sub: 'Daily Utility Platform', specs: { Diameter: '38mm', 'Lug-to-Lug': '46mm', Caliber: 'SW200-1', Crystal: 'Sapphire' } },
  { id: '02', title: 'Deep Gauge', sub: 'Dive Specification Platform', specs: { Diameter: '42mm', 'Lug-to-Lug': '50mm', Caliber: 'SW200-1', Bezel: 'Ceramic' } },
  { id: '03', title: 'Aero Navigator', sub: 'Pilot Specification Platform', specs: { Diameter: '40mm', 'Lug-to-Lug': '48mm', Caliber: 'Miyota 90S5', Cage: 'Soft Iron' } },
  { id: '04', title: 'Grand Caliber', sub: 'Dress / Formal Platform', specs: { Diameter: '39mm', 'Lug-to-Lug': '45mm', Caliber: 'ETA 7001 (Manual)', Finish: 'High Polish' } },
];

export const CRAFT = [
  { k: 'Design', t: 'A coherent system, not a parts bin', body: 'We do not stack parts , we design a coherent system. You choose case profile (36mm–42mm), material, and dial finish. Hands are heat-blued or diamond-polished in-house for clean edges and controlled reflection.' },
  { k: 'Movement', t: 'Regulated in-house, in multiple positions', body: 'Movements are demagnetised, oiled, and regulated across positions to hold a steady daily rate. We document the timing trace before the dial ever goes on, and again before delivery.' },
  { k: 'Assembly', t: 'Stacked, sealed, and pressure-tested', body: 'Bezel, crystal, dial, and caseback are assembled in a controlled order, gaskets seated, and the case pressure-tested. Nothing leaves the bench until functions and seals are verified.' },
];