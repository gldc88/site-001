/**
 * NEON DISTRICT , shared data (website14, round 2).
 * Single source of truth for channels + district nodes: imported by NeonLayout (to tint the WebGL
 * city) and by the pages (to render tiles / detail / map).
 */
export interface Channel {
  key: string;
  code: string;
  name: string;
  accent: string;  // hex
  desc: string;
  long: string;
  caps: string[];
}
export interface Node {
  id: string;
  x: number;
  y: number;
  c: 'cyan' | 'mag' | 'lime' | 'vio';
  latency: string;
  load: string;
  role: string;
}

export const CHANNELS: Channel[] = [
  { key: 'identity', code: 'IDN', name: 'Identity', accent: '#2ffcff', desc: 'Shadow IDs, short-lived tokens, consent-first logs. Nobody walks in without a trace you can read.', long: 'Every actor on the surface carries a shadow ID and a session key that burns within minutes. Access is scoped on the way in and logged on the way out, so the question is never "who could have done this" but "who did, and when".', caps: ['Short-lived session keys', 'Consent-first audit logs', 'Scoped, least-privilege access', 'Readable identity trails'] },
  { key: 'ops', code: 'OPS', name: 'Ops Layer', accent: '#b7ff3c', desc: 'Automation with guardrails. Rollback-ready, idempotent, and audited. No dashboard theatre.', long: 'Automation that assumes it will be wrong sometimes. Every action is idempotent and rollback-ready, so shipping after dark is a keystroke, not a held breath. The ops layer is the part of the surface you stop thinking about.', caps: ['Idempotent actions', 'One-keystroke rollback', 'Audited automation', 'No dashboard theatre'] },
  { key: 'security', code: 'SEC', name: 'Security', accent: '#ff2bd6', desc: 'Zero-trust by default. Least privilege, every edge watched, every key short-lived.', long: 'Zero-trust is not a slogan here; it is the default that costs you nothing. Every edge is watched, every key is short-lived, and privilege is granted in the smallest increment that still gets the job done.', caps: ['Zero-trust by default', 'Every edge watched', 'Short-lived keys', 'Least privilege, always'] },
  { key: 'telemetry', code: 'TLM', name: 'Telemetry', accent: '#7a5cff', desc: 'Pulse, drift, anomalies , signals you can actually act on, not a wall of green lights.', long: 'A wall of green lights tells you nothing. Telemetry surfaces pulse, drift, and anomalies as signals you can act on , fewer numbers, more meaning, and an alert tone you tune to your own shift.', caps: ['Pulse + drift + anomalies', 'Actionable, not noisy', 'Tunable alert tone', 'Signal over dashboards'] },
];

export const NODES: Node[] = [
  { id: 'DOCK-09', x: 13, y: 72, c: 'cyan', latency: '12ms', load: '34%', role: 'Ingress / edge intake' },
  { id: 'RELAY', x: 31, y: 34, c: 'cyan', latency: '17ms', load: '23%', role: 'Routing / fan-out' },
  { id: 'CORE', x: 49, y: 50, c: 'mag', latency: '04ms', load: '71%', role: 'Compute / runtime' },
  { id: 'VAULT', x: 68, y: 66, c: 'mag', latency: '06ms', load: '88%', role: 'Custody / secrets' },
  { id: 'GATE', x: 86, y: 28, c: 'lime', latency: '09ms', load: '52%', role: 'Egress / delivery' },
];
export const EDGES: [string, string][] = [['DOCK-09', 'RELAY'], ['RELAY', 'CORE'], ['CORE', 'VAULT'], ['CORE', 'GATE'], ['VAULT', 'GATE']];

export const ACCESS = [
  { t: 'Handshake', d: 'Authenticate, scope access, burn a fresh session key. One identity, one trail.' },
  { t: 'Calibration', d: 'Set the thresholds: noise floor, alert tone, route priority. Tune it to your shift.' },
  { t: 'Deployment', d: 'Ship the surface, watch the pulse, iterate after dark. Rollback is one keystroke.' },
];

export const DEFAULT_KEY = 'identity';