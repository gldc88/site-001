/**
 * field-flow-scene.ts , ambient flow-field backdrop for website16 (FIELD STUDIO).
 *
 * Deliberately NOT a fragment shader (the pack's other scenes are): this is a 2D-canvas curl-noise
 * flow field , thousands of motes advected along a slowly-evolving divergence-free field, leaving
 * soft additive trails. It reads as wind, spores, a living system. The season dial retunes speed /
 * turbulence / wind / scale / colour; the field-trail (wind/water/light) overlays a temporary mood;
 * the pointer adds a gentle swirl. Trails fade to black under the page's `mix-blend-mode: screen`.
 *
 * Caller guards reduced-motion (don't init). Visibility-paused, DPR-capped, clean dispose.
 */

export type SeasonKey = 'dawn' | 'canopy' | 'dusk';
export type FlowState = 'wind' | 'water' | 'light' | null;

export interface FieldHandle {
  dispose: () => void;
  setSeason: (s: SeasonKey) => void;
  setFlowState: (s: FlowState) => void;
}

interface Tune { speed: number; turb: number; wind: number; scale: number; color: [number, number, number]; }

const SEASONS: Record<SeasonKey, Tune> = {
  dawn:   { speed: 0.55, turb: 0.30, wind: 0.04, scale: 0.0016, color: [255, 190, 92] },
  canopy: { speed: 0.95, turb: 0.50, wind: 0.10, scale: 0.0022, color: [155, 226, 125] },
  dusk:   { speed: 1.55, turb: 0.85, wind: 0.30, scale: 0.0030, color: [92, 200, 255] },
};

// Hashed value noise (smooth), cheap enough for ~4 samples per mote per frame.
function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
function smooth(t: number): number { return t * t * (3 - 2 * t); }
function vnoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  const ux = smooth(fx), uy = smooth(fy);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

export function initFieldFlow(canvas: HTMLCanvasElement): FieldHandle {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { dispose: () => {}, setSeason: () => {}, setFlowState: () => {} };

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let w = 0, h = 0;

  const resize = () => {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.floor(w * DPR); canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const COUNT = Math.min(2800, Math.max(820, Math.floor((w * h) / 780)));
  const px = new Float32Array(COUNT);
  const py = new Float32Array(COUNT);
  const pl = new Float32Array(COUNT); // life
  const pa = new Float32Array(COUNT); // base alpha
  const ps = new Float32Array(COUNT); // size
  for (let i = 0; i < COUNT; i++) {
    px[i] = Math.random() * w; py[i] = Math.random() * h;
    pl[i] = Math.random() * 200; pa[i] = 0.2 + Math.random() * 0.6; ps[i] = 0.5 + Math.random() * 1.6;
  }

  // Lerped tune (season) + transient flow overlay.
  const cur: Tune = { ...SEASONS.canopy, color: [...SEASONS.canopy.color] as [number, number, number] };
  const tgt: Tune = { ...SEASONS.canopy, color: [...SEASONS.canopy.color] as [number, number, number] };
  let flow: FlowState = null;

  const setSeason = (s: SeasonKey) => {
    const t = SEASONS[s];
    tgt.speed = t.speed; tgt.turb = t.turb; tgt.wind = t.wind; tgt.scale = t.scale;
    tgt.color = [...t.color] as [number, number, number];
  };
  const setFlowState = (s: FlowState) => { flow = s; };

  let mx = w / 2, my = h / 2, hasMouse = false;
  const onMove = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; hasMouse = true; };
  window.addEventListener('pointermove', onMove, { passive: true });

  let inView = true;
  const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(canvas);

  let raf = 0, t = 0, last = performance.now();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) { last = performance.now(); return; }
    const now = performance.now();
    const dt = Math.min(40, now - last); last = now;
    t += dt * 0.001;

    // Ease season values.
    cur.speed += (tgt.speed - cur.speed) * 0.04;
    cur.turb += (tgt.turb - cur.turb) * 0.04;
    cur.wind += (tgt.wind - cur.wind) * 0.04;
    cur.scale += (tgt.scale - cur.scale) * 0.04;
    for (let k = 0; k < 3; k++) cur.color[k] += (tgt.color[k] - cur.color[k]) * 0.04;

    // Flow overlay modifiers.
    let speed = cur.speed, wind = cur.wind, size = 1, alpha = 1;
    let r = cur.color[0], g = cur.color[1], b = cur.color[2];
    if (flow === 'wind') { speed *= 1.8; wind *= 3.2; r = 235; g = 240; b = 245; alpha = 0.85; }
    else if (flow === 'water') { speed *= 0.6; wind *= 0.4; r = cur.color[0] * 0.7; g = cur.color[1]; b = Math.min(255, cur.color[2] + 60); }
    else if (flow === 'light') { size = 1.5; alpha = 1.2; r = 255; g = 250; b = 220; }

    // Fade previous frame (trails); page mix-blend:screen hides the black.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';
    const sc = cur.scale;
    const e = 1.2;
    for (let i = 0; i < COUNT; i++) {
      const nx = px[i] * sc, ny = py[i] * sc + t * 0.08;
      // Curl of a scalar value-noise potential → divergence-free velocity.
      const n1 = vnoise(nx, ny + e * sc), n2 = vnoise(nx, ny - e * sc);
      const n3 = vnoise(nx + e * sc, ny), n4 = vnoise(nx - e * sc, ny);
      let vx = (n1 - n2) * 240 * cur.turb;
      let vy = -(n3 - n4) * 240 * cur.turb;

      // Pointer swirl.
      if (hasMouse) {
        const dx = px[i] - mx, dy = py[i] - my, d2 = dx * dx + dy * dy;
        if (d2 < 26000) { const f = (1 - d2 / 26000) * 0.6; vx += -dy * f; vy += dx * f; }
      }

      px[i] += (vx + wind * 18) * speed * 0.06 + 0.6 * speed;
      py[i] += (vy + 0.4) * speed * 0.06 + 0.4 * speed;

      pl[i] -= dt * 0.04;
      if (pl[i] <= 0 || px[i] > w + 12 || px[i] < -12 || py[i] > h + 12 || py[i] < -12) {
        px[i] = Math.random() * w; py[i] = Math.random() * h; pl[i] = 120 + Math.random() * 160;
      }

      const a = pa[i] * alpha * Math.min(1, pl[i] / 60);
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`;
      ctx.beginPath();
      ctx.arc(px[i], py[i], ps[i] * size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    io.disconnect();
  };

  return { dispose, setSeason, setFlowState };
}