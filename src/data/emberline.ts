/**
 * EMBERLINE GAS & HEATING , shared data (website26, round 2). Imported by the layout, the tool
 * components, and the pages.
 */
export const BRAND = 'EMBERLINE GAS & HEATING';
export const SHORT = 'EMBERLINE';
export const TAGLINE = 'Boiler service. Breakdown repair. Gas safety checks.';
export const PHONE = '+31 6 4810 2239';
export const TEL = PHONE.replace(/\s/g, '');
export const EMAIL = 'service@emberline.example';
export const AREA = 'Amsterdam · Haarlem · Utrecht · Region';
export const HOURS = 'Breakdowns when capacity allows · Planned visits by appointment';

export const SERVICES = [
  { title: 'Boiler Service', desc: 'Seasonal maintenance for safer combustion and steadier heat. We test under load and flag wear before it becomes a winter failure.' },
  { title: 'Breakdown Repair', desc: 'Ignition faults, no hot water, pressure drops, circulation issues. We diagnose properly, then fix the cause, not just the symptom.' },
  { title: 'Heating Balance', desc: 'Cold radiators, noisy pipes, uneven rooms. We balance the system, check flow, and tune settings for stable comfort.' },
  { title: 'Controls Setup', desc: 'Thermostats, zoning, schedules, smart controls. We configure it cleanly and hand over a setup you actually understand.' },
  { title: 'Gas Safety Inspection', desc: 'Documented safety checks: flue flow, spillage, and combustion readings, logged so you have a record that stands up.' },
  { title: 'Boiler Upgrade', desc: 'Right-sized replacement advice with no oversell , the correct output and boiler type for your home, installed and commissioned cleanly.' },
];

export const SAFETY = [
  'Ventilate if it is safe to do so.',
  'Do not switch electrical devices on or off.',
  'Shut off the gas supply only if you know exactly how and it is safe.',
  'If someone feels unwell, move to fresh air and contact emergency services.',
];

export const CERT_ROWS = [
  { label: 'Flue flow test', pass: true },
  { label: 'Spillage check', pass: true },
  { label: 'Combustion reading', pass: true },
];

export const JOBS = ['Annual boiler service', 'Breakdown / no heat', 'No hot water', 'Controls / thermostat', 'Boiler upgrade quote', 'Gas safety inspection'];

/** Fault-triage decision tree. Each node is either a question (with options -> next id) or a result. */
export const TRIAGE: Record<string, any> = {
  step1: { q: 'Do you smell gas?', opts: [{ label: 'Yes', next: 'resEmergency', tone: 'danger' }, { label: 'No', next: 'step2' }] },
  step2: { q: 'Is the boiler display or pilot light ON?', opts: [{ label: 'Yes', next: 'step3' }, { label: 'No', next: 'resBook' }] },
  step3: { q: 'Is there an error code (F1, E1, Low) or flashing red light?', opts: [{ label: 'Yes', next: 'resPressure' }, { label: 'No', next: 'step4' }] },
  step4: { q: 'Is the issue Heating, Hot Water, or Both?', opts: [{ label: 'Heating only', next: 'step5' }, { label: 'Hot water only', next: 'resBook' }, { label: 'Both', next: 'resBook' }] },
  step5: { q: 'Have you checked thermostat batteries and settings?', opts: [{ label: 'Yes, they are fine', next: 'resThermostat' }, { label: 'No, let me check', next: 'resBattery' }] },
  resEmergency: { result: true, tone: 'danger', title: 'Emergency action', body: 'Do not use electrical switches. Ventilate if safe, leave immediately, and contact the gas emergency line.', cta: 'call' },
  resBook: { result: true, tone: 'heat', title: 'Professional repair needed', body: 'Likely a component failure (fan, pump, or diverter valve). Book a diagnostic visit for a safe resolution.', cta: 'book' },
  resPressure: { result: true, tone: 'blue', title: 'Likely low pressure', body: 'Check your pressure gauge. If it is below 1.0 bar, the system needs topping up to fire correctly.', cta: 'call' },
  resThermostat: { result: true, tone: 'emerald', title: 'Check zone control', body: 'If the boiler is on but there is no heat, a zone valve or pump may be stuck. We can diagnose this quickly.', cta: 'call' },
  resBattery: { result: true, tone: 'zinc', title: 'Check controls first', body: 'Many "faults" are just dead batteries or a clock that reset after a power cut. Check these before booking.', cta: 'reset' },
};