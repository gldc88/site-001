/**
 * FIELD STUDIO , shared data (website16, round 2).
 * Single source of truth for seasons (which retune the 2D flow field + theme), specimens, and the
 * field trail. Imported by FieldLayout (field + theme) and the pages (cards / detail).
 */
export interface Season {
  key: 'dawn' | 'canopy' | 'dusk';
  label: string;
  note: string;
  accent: string;
  bg: string;
  density: string;
}
export const SEASONS: Season[] = [
  { key: 'dawn', label: 'Dawn', note: 'Mist lift · pollen rise · slow drift', accent: '#FFBE3C', bg: '#080600', density: '1.8k' },
  { key: 'canopy', label: 'Canopy', note: 'Green density · spore traffic · active air', accent: '#9BE27D', bg: '#040a07', density: '2.6k' },
  { key: 'dusk', label: 'Dusk', note: 'Blue falloff · cold pockets · fast flow', accent: '#3CC8FF', bg: '#02030a', density: '3.1k' },
];

export interface Specimen {
  id: string;
  title: string;
  kind: string;
  line: string;
  long: string;
  logged: string;
}
export const SPECIMENS: Specimen[] = [
  { id: 'FIG.01', title: 'Canopy Resin', kind: 'resin', line: 'Archival sap cast from a summer canopy survey.', long: 'A clear resin cast taken from a single summer canopy, holding a season of pollen and micro-debris in suspension. Read as a slice of air made solid , what was drifting, frozen exactly where it drifted.', logged: 'Canopy · 41m up' },
  { id: 'FIG.02', title: 'River Glass', kind: 'glass', line: 'Tumbled fragments logged from a floodplain transect.', long: 'Tumbled glass fragments logged along a floodplain transect, each edge softened by a known number of flood seasons. We date them by wear, not by maker , time as the only tool that touched them.', logged: 'Floodplain · transect 3' },
  { id: 'FIG.03', title: 'Pollen Drift', kind: 'pollen', line: 'Airborne sample notes , movement traced, not forced.', long: 'Airborne pollen sampled passively over a week, its movement traced rather than forced. The record is of a system breathing , direction first, volume second, exactly how we design.', logged: 'Open air · 7-day' },
  { id: 'FIG.04', title: 'Root Map', kind: 'root', line: 'Subsurface structure from ground-penetration passes.', long: 'A subsurface root structure resolved from repeated ground-penetration passes. What looks like chaos above ground reads as deliberate routing below it , a living network optimised over decades.', logged: 'Subsurface · 2.4m' },
  { id: 'FIG.05', title: 'Frost Lattice', kind: 'frost', line: 'Overnight crystal growth logged frame by frame.', long: 'Overnight frost growth captured frame by frame on a fixed surface, then collapsed into a single lattice. Cold as a slow draughtsman , the same rules every night, a different drawing each time.', logged: 'Surface · −4°C' },
  { id: 'FIG.06', title: 'Spore Cloud', kind: 'spore', line: 'A single release, traced across the active air.', long: 'A single spore release traced across active air, the cloud mapped as it dispersed. The most alive of the specimens , a system that exists only while it is moving, archived at the moment it stopped.', logged: 'Canopy · release 09' },
];

export interface Trail { type: 'wind' | 'water' | 'light'; title: string; line: string; long: string; }
export const TRAIL: Trail[] = [
  { type: 'wind', title: 'Wind', line: 'Microclimate first. We design for direction, not volume.', long: 'We read the microclimate before anything else. Direction tells you more than volume , where a system wants to move, and what it costs to move it elsewhere. Most of our work is removing the obstacles a thing is already trying to flow around.' },
  { type: 'water', title: 'Water', line: 'Time is a tool. Flow, filtration, and patience shape the work.', long: 'Water taught us patience as a method. Flow, filtration, and the slow shaping that only time can do , we design for the work to keep improving after we leave, the way a riverbed does. Nothing here is finished; it is released.' },
  { type: 'light', title: 'Light', line: 'Contrast with restraint. Reveal only what needs to be seen.', long: 'Light is the editor. Contrast with restraint, reveal only what needs to be seen, and let the rest stay in shadow where it belongs. A field at dusk shows you less and means more , that is the standard we hold the work to.' },
];

export const DEFAULT_SEASON = 'canopy';