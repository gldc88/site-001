/**
 * RIDGELINE ROOFING , shared data (website23, round 2). Imported by the layout, the RoofDiagnostic
 * component, and the pages so the diagnostic, services, roof types, and process stay in sync.
 */
export const BRAND = 'RIDGELINE ROOFING';
export const TAGLINE = 'Diagnose. Repair. Seal. Verify.';
export const EMAIL = 'estimates@ridgeline.example';
export const PHONE = '+31 6 3184 7720';
export const TEL = PHONE.replace(/\s/g, '');
export const SERVICE_AREA = 'Amsterdam · Haarlem · Utrecht';

/** Critical zones on the roof section (x/y in % of the diagram panel). */
export const ZONES = [
  { id: 'ridge', name: 'Ridge & Hip', x: 50, y: 14, risk: 'Cap lift under wind uplift.', fix: 'Re-bed and mechanically fix the ridge caps.' },
  { id: 'chimney', name: 'Chimney Flashing', x: 30, y: 33, risk: 'Step / counter-flashing failure.', fix: 'Rebuild the step + counter-flashing set in lead.' },
  { id: 'skylight', name: 'Skylight Kerb', x: 70, y: 40, risk: 'Perished seals, kerb ingress.', fix: 'Re-flash the kerb, renew seals and apron.' },
  { id: 'valley', name: 'Valley', x: 50, y: 50, risk: 'Debris damming, concentrated flow.', fix: 'Re-line the valley, widen the waterway.' },
  { id: 'eave', name: 'Eave & Gutter', x: 50, y: 78, risk: 'Edge uplift, overflow to fascia.', fix: 'Re-terminate the edge, realign gutter falls.' },
];

export const SERVICES = [
  { title: 'Roof Repair · Leak Response', bullets: ['Leak tracing and entry-point isolation', 'Tile, slate, shingle replacement and refit', 'Underlayment repair where required', 'Temporary seal + a documented follow-up scope'] },
  { title: 'Roof Replacement · Full System', bullets: ['Tear-off and deck inspection', 'New underlayment, ventilation, and fixings', 'Flashing rebuilt at penetrations and edges', 'Clean finish lines, written scope on handover'] },
  { title: 'Flashing & Detail Work', bullets: ['Chimneys, skylights, valleys, walls, dormers', 'Step flashing and counter-flashing sets', 'Leadwork, pipe boots, vent stacks', 'Detail-first work that stops recurring leaks'] },
  { title: 'Flat Roofs · EPDM / TPO / Bitumen', bullets: ['Seam reinforcement and edge termination', 'Drain and scupper clearing, flow fixes', 'Puncture repair and ponding mitigation', 'Upstands and penetrations as the priority'] },
  { title: 'Gutters & Drainage', bullets: ['Re-align and secure gutters and brackets', 'Downspout routing, clog prevention', 'Joint leaks addressed at the source', 'Water control to protect fascias and walls'] },
  { title: 'Storm & Wind Damage', bullets: ['Uplift checks, missing sections located fast', 'Temporary protection when needed', 'Photo-documented damage scope', 'Compromised areas rebuilt, not patched'] },
];

export const ROOF_TYPES = [
  { name: 'Tile & Slate', note: 'Matching, handling, and correct flashing make or break repairs.' },
  { name: 'Asphalt Shingles', note: 'Layering, nailing, and ventilation decide performance and lifespan.' },
  { name: 'Metal Roofing', note: 'Fasteners, laps, and penetrations need precision or it fails early.' },
  { name: 'Flat Membrane', note: 'Seams, drains, edges, and upstands decide whether it stays watertight.' },
];

export const PROCESS = [
  { step: 'Inspect', line: 'Roof type, pitch, penetrations, valleys, edges, drainage paths.' },
  { step: 'Diagnose', line: 'Leak route and failure point identified, photos included.' },
  { step: 'Scope', line: 'Clear scope in writing: what we repair, what we replace, why.' },
  { step: 'Execute', line: 'Details first , flashing, seams, edges , then surface work.' },
  { step: 'Verify', line: 'Walk-through, closeout notes, and care guidance.' },
];