/**
 * OBSIDIAN MOTORS , shared data (website30, round 2). Private car showroom. Vehicles render as self-
 * contained SVG studio shots (carSvg) , no external photography. Imported by the layout and pages.
 */
export const BRAND = 'OBSIDIAN MOTORS';
export const FULL = 'OBSIDIAN MOTORS , PRIVATE SHOWROOM';
export const TAGLINE = 'Acquire by intent. Not by pressure.';
export const EMAIL = 'desk@obsidianmotors.example';
export const PHONE = '+31 6 5582 4410';
export const TEL = PHONE.replace(/\s/g, '');
export const AREA = 'Amsterdam · Private viewings by appointment';

export interface Vehicle { id: string; name: string; price: number; body: string; power: string; stock: string; shape: string; paint: string; note: string; }

export const PRODUCTS: Vehicle[] = [
  { id: 'model-01-gt', name: 'Model 01 , Night Spec', price: 89500, body: 'Coupe', power: 'V8', stock: 'Showroom', shape: 'coupe', paint: '#1b1d24', note: 'Matte black, carbon pack, fully inspected. Immediate handover , documentation ready at the desk.' },
  { id: 'model-02-suv', name: 'Model 02 , Range Authority', price: 112000, body: 'SUV', power: 'Hybrid', stock: 'Inbound', shape: 'suv', paint: '#dde3ea', note: 'Glacier white, winter package, family configuration. ETA confirmed , reserved viewings available.' },
  { id: 'model-03-sport', name: 'Model 03 , Apex Carbon', price: 145000, body: 'Coupe', power: 'V8', stock: 'Showroom', shape: 'coupe', paint: '#2c3a55', note: 'Carbon exterior set, ceramic brakes, low-mileage demonstrator. Delivered with fresh service and tyre report.' },
  { id: 'model-04-sedan', name: 'Model 04 , Executive', price: 68000, body: 'Sedan', power: 'Electric', stock: 'Order', shape: 'sedan', paint: '#21242c', note: 'Long wheelbase. Silent cabin. Driver-assist ready, configured to your commute.' },
  { id: 'model-05-classic', name: 'Model 05 , Heritage Manual', price: 54000, body: 'Coupe', power: 'Classic', stock: 'Showroom', shape: 'coupe', paint: '#9c2727', note: 'Restored chassis, manual gearbox, period-correct details. An analogue drive with modern reliability checks.' },
  { id: 'model-06-interior', name: 'Model 06 , Quiet Lounge', price: 92000, body: 'Sedan', power: 'Hybrid', stock: 'Order', shape: 'sedan', paint: '#9aa3ad', note: 'Hand-stitched leather, walnut trim, acoustic glass. Build-to-order with a private spec session.' },
  { id: 'model-07-concept', name: 'Model 07 , Vision Allocation', price: 210000, body: 'Coupe', power: 'Electric', stock: 'Inbound', shape: 'coupe', paint: '#34406b', note: 'Active aero, launch control, limited allocation. Pre-approval recommended before reservation.' },
];

export const ANSWERS = [
  { id: 'finance', title: 'Financing & Lease', body: 'Clear structures, no theatre. We arrange finance, lease, and balloon options via partner banks , with a written quote you can actually compare.' },
  { id: 'tradein', title: 'Trade-in value', body: 'Send VIN + mileage + photos. We return a same-day valuation and a firm trade offer for most premium brands.' },
  { id: 'warranty', title: 'Warranty & Service', body: 'Every handover includes an inspection summary and service posture. 4-year coverage on Stock/Order vehicles. 2-year heritage coverage on Classics (mechanicals).' },
];

export const ACQUISITION = [
  { n: '01', t: 'Intent', d: 'We start from what you actually want the car to do , not what we need to move. A short brief sets body, drivetrain, budget, and timing.' },
  { n: '02', t: 'Inspection', d: 'Every vehicle is inspected and documented before it reaches the floor: mechanical report, tyre and brake status, and an honest condition note.' },
  { n: '03', t: 'Private viewing', d: 'You view by appointment, without a floor full of pressure. Reserve a shortlist and we prepare exactly those cars for your slot.' },
  { n: '04', t: 'Handover', d: 'Documentation ready at the desk, service posture explained, and coverage confirmed. You leave with the paperwork done, not promised.' },
];

/** Self-contained SVG car studio shot (silhouette by shape, body colour by paint). Pure string → renders
 *  server-side in Astro and is copied client-side into the focus viewer. */
export function carSvg(shape: string, paint: string, uid = 'x'): string {
  uid = uid.replace(/[^a-z0-9]/gi, '');
  const bodies: Record<string, string> = {
    coupe: 'M44 180 L44 162 C44 156 50 152 60 150 L118 144 C140 122 168 110 205 110 C245 110 280 124 300 144 L348 152 C356 154 358 160 358 168 L358 180 Z',
    sedan: 'M44 180 L44 160 C44 154 50 150 62 149 L120 146 C130 130 145 122 165 121 L235 121 C260 122 275 132 288 146 L348 152 C356 154 358 160 358 168 L358 180 Z',
    suv: 'M42 180 L42 158 C42 150 48 146 60 145 L116 143 C124 116 140 106 162 106 L300 106 C322 106 334 120 340 144 L352 150 C358 152 360 158 360 168 L360 180 Z',
  };
  const glass: Record<string, string> = {
    coupe: 'M132 142 L162 120 Q205 110 248 120 L284 142 Z',
    sedan: 'M134 145 L168 125 L232 125 L286 145 Z',
    suv: 'M128 143 L164 111 L298 111 L336 143 Z',
  };
  const d = bodies[shape] || bodies.coupe;
  const g = glass[shape] || glass.coupe;
  const wheel = (cx: number) => `<circle cx="${cx}" cy="180" r="31" fill="#06070a"/><circle cx="${cx}" cy="180" r="27" fill="#0c0d10" stroke="#23262d" stroke-width="2"/><circle cx="${cx}" cy="180" r="12" fill="#4a505a"/><circle cx="${cx}" cy="180" r="4" fill="#1a1c20"/>`;
  return `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">`
    + `<defs><linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,0.30)"/><stop offset="0.45" stop-color="rgba(255,255,255,0)"/><stop offset="1" stop-color="rgba(0,0,0,0.42)"/></linearGradient>`
    + `<radialGradient id="sp${uid}" cx="50%" cy="100%" r="72%"><stop offset="0" stop-color="rgba(77,121,255,0.16)"/><stop offset="1" stop-color="rgba(77,121,255,0)"/></radialGradient></defs>`
    + `<rect width="400" height="240" fill="#0a0b0e"/><rect width="400" height="240" fill="url(#sp${uid})"/>`
    + `<ellipse cx="200" cy="206" rx="150" ry="14" fill="#000" opacity="0.55"/>`
    + `<g transform="translate(0,360) scale(1,-1)" opacity="0.10"><path d="${d}" fill="${paint}"/></g>`
    + `<path d="${d}" fill="${paint}"/><path d="${d}" fill="url(#bg${uid})"/>`
    + `<path d="${g}" fill="rgba(180,205,245,0.22)" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>`
    + `<path d="M205 117 L205 142" stroke="rgba(0,0,0,0.22)" stroke-width="1"/>`
    + `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1.2"/>`
    + wheel(110) + wheel(300)
    + `<path d="M46 158 L66 156 L66 165 L47 166 Z" fill="#eaf2ff" opacity="0.9"/>`
    + `<path d="M340 157 L357 156 L357 165 L340 166 Z" fill="#ff4d4d" opacity="0.85"/>`
    + `</svg>`;
}