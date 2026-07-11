/**
 * GROUNDSPEC , shared data (website25, round 2). Paving & fencing. Imported by the layout, the Estimator
 * component, and the pages.
 */
export const BRAND = 'GROUNDSPEC.';
export const PHONE = '+31 6 2048 7712';
export const TEL = PHONE.replace(/\s/g, '');
export const EMAIL = 'quotes@groundspec.example';
export const AREA = 'AMS / HRL / UTR / NH';
export const SHEET = { id: 'GS-CAD-025', rev: 'FINAL-V1.17' };

export const TEXTURES = [
  { value: 'brickPattern', rate: 85, label: 'Concrete Pavers' },
  { value: 'slabPattern', rate: 130, label: 'Porcelain Slabs' },
  { value: 'herringPattern', rate: 110, label: 'Herringbone' },
];

export const PAVING_STD = [
  { n: '01', t: 'Base & drainage', d: 'We excavate to a stable depth, separate where needed, and build a compacted sub-base that drains. No soft spots, no future dips.' },
  { n: '02', t: 'Edge restraint', d: 'We lock the perimeter with concrete haunching or steel edging so the pattern stays tight through traffic, weather, and time.' },
  { n: '03', t: 'Falls & jointing', d: 'Correct falls for run-off, layered compaction, then joints finished properly so units stay flat, quiet, and clean.' },
];

export const FENCING_STD = [
  { n: '01', t: 'Footings that hold', d: 'Posts set deep with concrete matched to the ground. Gate posts get extra mass so they do not twist, lean, or sag.' },
  { n: '02', t: 'Straight lines', d: 'String lines, levels, and laser checks, then rails and panels tensioned so the fence stays true across the full run.' },
  { n: '03', t: 'Materials & fixings', d: 'Treated timber, composite, or galvanised steel with the right fixings. Clean caps, clean corners, hardware that does not rust out.' },
];

export const WORK = [
  { title: 'Patios & Terraces', tag: 'PAVING', line: 'Porcelain, concrete, or natural stone laid on a proper base with clean falls , a flat, quiet surface that survives Dutch weather.' },
  { title: 'Driveways', tag: 'PAVING', line: 'Block paving and slabs built to take a car: deeper base, locked edges, and drainage that keeps water off the house.' },
  { title: 'Paths & Steps', tag: 'PAVING', line: 'Connecting routes and level changes set out square, with grip and falls thought through so they stay safe year-round.' },
  { title: 'Garden Fencing', tag: 'FENCING', line: 'Timber, composite, or steel runs with footings that hold and lines that stay true , privacy and boundary, built once.' },
];