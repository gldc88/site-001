/**
 * candle-scene.ts , persistent full-viewport WebGL backdrop for website17 (ATELIER PRIVATE CATERING).
 *
 * Concept: a dark, candlelit private dining room. Deliberately SOFT and slow to contrast the pack's
 * energetic scenes , layered defocused bokeh orbs drift upward through warm haze, a central hearth
 * glow breathes, and a faint flicker plays across everything. UnrealBloom melts the highlights.
 * Choosing a menu direction warms the room (setWarmth); scroll deepens it; the pointer parallaxes
 * the bokeh layers. Same pack contract + one extra setter.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** 0 = cool & restrained, 1 = warm & glowing (menu direction). */
  setWarmth: (v: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uWarmth, uReveal;
  uniform vec2 uPointer;
  uniform vec3 uDeep, uAmber, uGold;

  float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }
  vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }

  // One layer of soft defocused orbs drifting upward.
  float bokeh(vec2 uv, float scale, float seed, float soft){
    vec2 g = uv * scale;
    vec2 cell = floor(g);
    float acc = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 c = cell + vec2(float(i), float(j));
      vec2 o = hash2(c + seed);
      float yoff = fract(o.y - uTime * (0.012 + o.x * 0.02));
      vec2 pos = c + vec2(o.x, yoff);
      float d = length(g - pos);
      float r = 0.14 + o.x * 0.26;
      float flick = 0.82 + 0.18 * sin(uTime * (1.0 + o.y * 3.0) + o.x * 30.0);
      acc += smoothstep(r, r * soft, d) * (0.25 + 0.75 * o.y) * flick;
    }
    return acc;
  }

  void main(){
    vec2 uv = vUv;
    vec2 par = uPointer * 0.012;

    // Base: deep room, slightly warmer toward the bottom (table level).
    float base = smoothstep(1.0, 0.1, uv.y);
    vec3 col = mix(uDeep * 0.5, uDeep, base);

    // Rising warm haze.
    float haze = fbm(vec2(uv.x * 2.0 + par.x * 4.0, uv.y * 2.4 - uTime * 0.05));
    col += uAmber * pow(haze, 2.2) * (0.10 + uWarmth * 0.16);

    // Central hearth glow that breathes (low, like a candle cluster on the table).
    vec2 hp = vec2(0.5 + uPointer.x * 0.04, 0.34 - uScroll * 0.06);
    float gd = distance(vec2((uv.x - hp.x) * uAspect, uv.y - hp.y), vec2(0.0));
    float breathe = 0.86 + 0.14 * sin(uTime * 0.9);
    col += uGold * exp(-gd * 2.4) * (0.18 + uWarmth * 0.5) * breathe;
    col += uAmber * exp(-gd * 1.1) * (0.06 + uWarmth * 0.12);

    // Three bokeh layers for depth (far→near).
    float b1 = bokeh(vec2((uv.x + par.x) * uAspect, uv.y) + 3.0, 6.0, 11.0, 0.05);
    float b2 = bokeh(vec2((uv.x + par.x * 1.8) * uAspect, uv.y) + 7.0, 3.6, 23.0, 0.04);
    float b3 = bokeh(vec2((uv.x + par.x * 2.6) * uAspect, uv.y) + 1.0, 2.2, 41.0, 0.03);
    col += uAmber * b1 * 0.05;
    col += mix(uAmber, uGold, 0.5) * b2 * 0.08 * (0.7 + uWarmth * 0.6);
    col += uGold * b3 * 0.11 * (0.7 + uWarmth * 0.7);

    // Vignette frames the candlelight.
    vec2 c = uv - 0.5;
    col *= smoothstep(1.2, 0.32, length(vec2(c.x * uAspect, c.y)) * 1.04);

    // Reveal + gentle film grain.
    col *= smoothstep(0.0, 1.0, uReveal);
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.016;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initCandleScene(canvas: HTMLCanvasElement): SceneHandle {
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
  renderer.toneMappingExposure = 1.06;
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
      uWarmth: { value: 0.35 },
      uReveal: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uDeep: { value: new THREE.Color(0x0a0807) },
      uAmber: { value: new THREE.Color(0xc28e5b) },
      uGold: { value: new THREE.Color(0xffce8a) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.85, 0.4);
  composer.addPass(bloom);

  let curWarmth = 0.35, tgtWarmth = 0.35;
  let curPx = 0, curPy = 0, tgtPx = 0, tgtPy = 0;
  let scrollP = 0, targetScroll = 0;

  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };
  const setWarmth = (v: number) => { tgtWarmth = Math.max(0, Math.min(1, v)); };

  const onPointer = (e: PointerEvent) => {
    tgtPx = (e.clientX / window.innerWidth - 0.5) * 2;
    tgtPy = (1 - e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

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
  let raf = 0, elapsed = 0, last = performance.now();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) { last = performance.now(); return; }
    syncSize();
    const now = performance.now();
    elapsed += Math.min(0.05, (now - last) / 1000);
    last = now;

    curWarmth += (tgtWarmth - curWarmth) * 0.05;
    curPx += (tgtPx - curPx) * 0.04;
    curPy += (tgtPy - curPy) * 0.04;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = scrollP;
    u.uWarmth.value = curWarmth;
    (u.uPointer.value as THREE.Vector2).set(curPx, curPy);
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

  return { dispose, setScroll, setWarmth };
}