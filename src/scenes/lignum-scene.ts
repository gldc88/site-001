/**
 * lignum-scene.ts , persistent full-viewport WebGL backdrop for website13 (LIGNUM ATELIER).
 *
 * Concept: a planed, finished hardwood surface seen under a raking studio light. A single
 * analytic fragment shader renders domain-warped growth rings, fine fibre, open pores, and
 * curly "figure" that shimmers (chatoyance) as a soft light rake sweeps across it , driven by
 * the pointer and by scroll. The whole surface can be re-tinted to a different timber species
 * and aged into a deep oiled patina; both transitions are lerped on the CPU so they feel like
 * the wood is actually changing, not snapping. UnrealBloom lifts the rake highlight and dust.
 *
 * Island-scoped, guarded by the caller (reduced-motion / no-WebGL fall back to a static layer),
 * DPR-capped, auto-paused offscreen, disposes cleanly. Same contract as the other pack scenes
 * plus three optional setters.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/** A timber species: three tones (deep latewood, mid field, light figure) + grain character. */
export interface Species {
  deep: number;
  mid: number;
  light: number;
  /** growth-ring frequency , higher = tighter grain */
  grainFreq: number;
  /** latewood line sharpness/contrast 0..1 */
  contrast: number;
}

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** Smoothly morph the whole surface to another species. */
  setSpecies: (s: Species) => void;
  /** 0 = fresh-cut, 1 = decades of oiled patina. */
  setAge: (a: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uReveal, uAge, uContrast, uGrainFreq;
  uniform vec2 uRake;
  uniform vec3 uDeep, uMid, uLight;

  float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }

  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = M * p; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    // Board space: aspect-correct, grain runs roughly vertical (a plank stood on end).
    vec2 gp = vec2(uv.x * uAspect, uv.y);

    // Domain warp -> cathedral / flame figure. A trace of motion keeps it quietly alive.
    float warp = fbm(gp * 2.1 + vec2(0.0, uTime * 0.012));
    float warp2 = fbm(gp * 1.1 - vec2(uScroll * 0.4, uTime * 0.006));
    vec2 wp = gp + vec2(warp * 0.33 + warp2 * 0.12, warp * 0.10);

    // Growth rings -> thin latewood lines.
    float rings = abs(sin((wp.x * uGrainFreq + warp * 3.4) * 3.14159));
    float grain = pow(1.0 - rings, mix(2.2, 6.5, uContrast));

    // Anisotropic fibre stretched along the grain, plus sparse open pores.
    float fibre = fbm(vec2(wp.x * 46.0, wp.y * 3.2));
    float pore = step(0.87, hash(floor(wp * vec2(118.0, 88.0)) + 3.0));

    // Base earlywood/latewood colour, then darken into the latewood lines.
    vec3 col = mix(uLight, uMid, smoothstep(0.0, 0.72, fbm(wp * 1.3)));
    col = mix(col, uDeep, grain * 0.85);
    col *= 1.0 - pore * 0.22;
    col *= 0.9 + fibre * 0.22;

    // Soft diagonal light rake following pointer/scroll.
    vec2 r = uv - uRake;
    float band = exp(-pow(r.x * 0.62 + r.y * 0.22, 2.0) * 11.0);

    // Chatoyance: curly figure rolls bright/dark as the rake moves , the signature of figured wood.
    float figure = 0.5 + 0.5 * sin(wp.y * mix(15.0, 26.0, uContrast) + warp * 4.0);
    float rakePhase = (uv.x - uRake.x) * 3.0 + (uv.y - uRake.y);
    float shimmer = figure * (0.5 + 0.5 * sin(rakePhase * 3.14159));
    col += uLight * (band * 0.12 + grain * band * 0.42 + shimmer * band * 0.30);

    // Drifting dust motes inside the light shaft: round, sparse, gently twinkling.
    vec2 mscale = vec2(44.0, 58.0);
    vec2 mp = vec2(uv.x * uAspect, uv.y - uTime * 0.012);
    vec2 mcell = floor(mp * mscale);
    float mrnd = hash(mcell);
    if (mrnd > 0.975) {
      vec2 mc = fract(mp * mscale) - 0.5;
      float soft = smoothstep(0.5, 0.0, length(mc));
      float tw = 0.35 + 0.65 * sin(uTime * 2.6 + mrnd * 50.0);
      col += vec3(1.0, 0.95, 0.82) * soft * tw * smoothstep(0.05, 0.72, uv.y) * band * 0.95;
    }

    // Patina: oiled woods deepen, warm and gain sheen with age.
    vec3 aged = col * vec3(0.9, 0.8, 0.62) * 1.06;
    col = mix(col, aged, uAge * 0.82);
    col += uLight * band * uAge * 0.05;

    // Vignette frames the lit board.
    vec2 c = uv - 0.5;
    col *= smoothstep(1.16, 0.34, length(vec2(c.x * uAspect, c.y)) * 1.05);

    // Reveal: the grain "develops" up the board on load.
    float rev = smoothstep(0.0, 1.0, uReveal);
    float wipe = smoothstep(uv.y - 0.18, uv.y + 0.02, rev * 1.2);
    col *= rev * (0.35 + 0.65 * wipe);

    // Ordered-ish dither defeats gradient banding on dark tones.
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.018;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initLignumScene(canvas: HTMLCanvasElement, initial: Species): SceneHandle {
  // Measure from the canvas's own layout box (CSS-sized to the viewport) with safe fallbacks,
  // so the scene is never stuck at 0x0 if scripts run before the viewport is sized.
  const measure = () => ({
    cw: canvas.clientWidth || window.innerWidth || 1280,
    ch: canvas.clientHeight || window.innerHeight || 720,
  });
  let { cw: w, ch: h } = measure();
  const DPR = Math.min(1.5, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAspect: { value: w / h },
      uReveal: { value: 0 },
      uAge: { value: 0 },
      uContrast: { value: initial.contrast },
      uGrainFreq: { value: initial.grainFreq },
      uRake: { value: new THREE.Vector2(0.5, 0.62) },
      uDeep: { value: new THREE.Color(initial.deep) },
      uMid: { value: new THREE.Color(initial.mid) },
      uLight: { value: new THREE.Color(initial.light) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.36, 0.7, 0.72);
  composer.addPass(bloom);

  // --- Lerp targets (smooth species / age / pointer transitions) ---
  const cur = {
    deep: new THREE.Color(initial.deep),
    mid: new THREE.Color(initial.mid),
    light: new THREE.Color(initial.light),
    grainFreq: initial.grainFreq,
    contrast: initial.contrast,
    age: 0,
    rakeX: 0.5,
    rakeY: 0.62,
  };
  const tgt = {
    deep: new THREE.Color(initial.deep),
    mid: new THREE.Color(initial.mid),
    light: new THREE.Color(initial.light),
    grainFreq: initial.grainFreq,
    contrast: initial.contrast,
    age: 0,
    rakeX: 0.5,
    rakeY: 0.62,
  };

  const setSpecies = (s: Species) => {
    tgt.deep.set(s.deep); tgt.mid.set(s.mid); tgt.light.set(s.light);
    tgt.grainFreq = s.grainFreq; tgt.contrast = s.contrast;
  };
  const setAge = (a: number) => { tgt.age = Math.max(0, Math.min(1, a)); };

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  const onPointer = (e: PointerEvent) => {
    tgt.rakeX = e.clientX / window.innerWidth;
    tgt.rakeY = 1.0 - e.clientY / window.innerHeight;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  // Reconcile the drawing-buffer size with the canvas's display size. Called on resize and once
  // per frame (cheap early-out), so the scene self-corrects against missed resizes or 0x0 starts.
  const syncSize = () => {
    const { cw, ch } = measure();
    const dw = Math.floor(cw * DPR), dh = Math.floor(ch * DPR);
    if (renderer.domElement.width === dw && renderer.domElement.height === dh) return;
    w = cw; h = ch;
    renderer.setSize(cw, ch, false);
    composer.setSize(cw, ch);
    mat.uniforms.uAspect.value = cw / Math.max(1, ch);
  };
  window.addEventListener('resize', syncSize, { passive: true });

  let inView = true;
  const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(canvas);

  syncSize();
  let raf = 0;
  let elapsed = 0;
  let last = performance.now();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) { last = performance.now(); return; }
    syncSize();
    const now = performance.now();
    elapsed += Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = elapsed;
    const k = 0.05; // colour/character easing
    cur.deep.lerp(tgt.deep, k); cur.mid.lerp(tgt.mid, k); cur.light.lerp(tgt.light, k);
    cur.grainFreq += (tgt.grainFreq - cur.grainFreq) * k;
    cur.contrast += (tgt.contrast - cur.contrast) * k;
    cur.age += (tgt.age - cur.age) * 0.06;
    cur.rakeX += (tgt.rakeX - cur.rakeX) * 0.06;
    cur.rakeY += (tgt.rakeY - cur.rakeY) * 0.06;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = t;
    u.uScroll.value = scrollP;
    (u.uDeep.value as THREE.Color).copy(cur.deep);
    (u.uMid.value as THREE.Color).copy(cur.mid);
    (u.uLight.value as THREE.Color).copy(cur.light);
    u.uGrainFreq.value = cur.grainFreq;
    u.uContrast.value = cur.contrast;
    u.uAge.value = cur.age;
    // Scroll nudges the rake down the board so the highlight travels as you read.
    (u.uRake.value as THREE.Vector2).set(cur.rakeX, cur.rakeY - scrollP * 0.25);
    if (u.uReveal.value < 1) u.uReveal.value = Math.min(1, u.uReveal.value + 0.012);

    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', syncSize);
    io.disconnect();
    plane.geometry.dispose(); mat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, setSpecies, setAge };
}