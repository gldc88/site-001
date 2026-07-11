/**
 * NIGHTWATCH , shared data (website24, round 2). 24/7 locksmith dispatch. Imported by the layout, the
 * LockPick component, and the pages.
 */
export const BRAND = 'NIGHTWATCH';
export const PHONE = '+31 6 4029 1187';
export const TEL = PHONE.replace(/\s/g, '');
export const EMAIL = 'dispatch@nightwatch.example';
export const SERVICE_AREA = 'Amsterdam · Haarlem · Utrecht';

export const ICONS: Record<string, string> = {
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  wifi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
};

export const SERVICES = [
  { title: 'Emergency Lockout Entry', code: '01', line: 'Fast entry, minimal damage , drilling is the last resort.', icon: 'bolt', detail: 'We start non-destructive: picking, bypass, and tensioning. If a lock genuinely cannot be opened without drilling, you hear it from us before any tool touches the cylinder, and you decide.' },
  { title: 'Lock Cylinder Replacement', code: '02', line: 'Regain key control instantly , new cylinder, fresh keys.', icon: 'refresh', detail: 'Lost keys, an ex with a copy, or a worn cylinder , we swap in an SKG-rated anti-snap cylinder and cut a fresh set, so old keys become useless the moment we leave.' },
  { title: 'Break-In Damage Repair', code: '03', line: 'Secure the door, reinforce the frame, upgrade weak points.', icon: 'shield', detail: 'After a forced entry we secure the opening fast, realign or rebuild the frame, and upgrade the hardware so the same weak point cannot simply be reused next week.' },
  { title: 'Smart Lock Installation', code: '04', line: 'Install and configure digital access , codes, app setup.', icon: 'wifi', detail: 'Keypad, fob, or app-based access fitted and configured properly , codes set, backups in place, and a walkthrough so you actually trust the thing.' },
  { title: 'Key Cutting & Duplication', code: '05', line: 'On-site key cutting for common door and cylinder types.', icon: 'key', detail: 'A mobile cutting kit means common door and cylinder keys are duplicated on the spot , no trip to a shop, no waiting on a back-order.' },
];

export const INCIDENTS = [
  { key: 'LOCKED_OUT', label: 'Locked Out', title: 'Lockout Entry', line: 'We start with picking and bypass methods. If drilling is required, you know before it happens.', prep: ['Bring photo ID', 'Proof of address or tenancy', 'Do not force the handle'], includes: ['ETA 20–40 min', 'Non-destructive first', 'Price confirmed before work'] },
  { key: 'KEY_SNAPPED', label: 'Broken Key', title: 'Key Extraction', line: 'We remove the broken piece cleanly and test the cylinder. If it is salvageable, you keep costs down.', prep: ['Stop forcing the key', 'Keep the broken piece', 'No glue or tools in the keyway'], includes: ['Extraction kit', 'Cylinder function test', 'Replacement key if possible'] },
  { key: 'LOST_KEYS', label: 'Lost Keys', title: 'Security Reset', line: 'Old keys become useless immediately. We replace the cylinder or rekey, then cut new keys.', prep: ['Proof of ownership', 'Count doors needing keys', 'Tell us about shared entrances'], includes: ['Cylinder removal', 'New SKG cylinder install', '3× new keys included'] },
  { key: 'BURGLARY', label: 'Break-In', title: 'Secure & Reinforce', line: 'We secure the entry fast, repair alignment, and upgrade hardware so the same weak point cannot be reused.', prep: ['Do not touch evidence', 'Photos for insurance', 'Check if the frame is split'], includes: ['Temporary securing', 'Frame alignment', 'Anti-snap hardware upgrade'] },
];

export const LOADOUT = [
  { item: 'Non-Destructive Entry Tools', spec: 'Pick and bypass before drilling', status: 'Standard' },
  { item: 'SKG Anti-Snap Cylinders', spec: 'Anti-pull, anti-drill protection', status: 'In stock' },
  { item: 'Mobile Key Cutting Kit', spec: 'Cut and duplicate keys on-site', status: 'Deployed' },
  { item: 'Door Frame Repair Kit', spec: 'Reinforce and realign frames', status: 'Heavy duty' },
];