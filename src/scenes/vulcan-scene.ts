/**
 * vulcan-scene.ts , persistent full-viewport WebGL backdrop for website15 (VULCANIC ATELIER).
 *
 * Concept: cooling basalt crust over a slow river of magma. An analytic fragment shader draws
 * animated Voronoi plates with molten cracks glowing between them, an underglow that flows, heat
 * shimmer, and embers rising off the surface. Scrolling descends toward the heat (crust thins,
 * magma brightens); the heat slider raises the whole circuit; the pointer is the hot spot.
 * UnrealBloom lifts the magma. Same pack contract + one extra setter.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** 0..1 , heat of the thermal circuit (crack glow + ember rate). */
  setIntensity: (v: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uIntensity, uReveal;
  uniform vec2 uPointer;
  uniform vec3 uMagma0, uMagma1, uMagma2, uBasalt;

  float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }
  vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }

  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * vnoise(p); p *= 2.02; a *= 0.5; } return v; }

  // Voronoi: returns (border distance, cell-id hash). Two 3x3 passes (iq).
  vec2 voronoi(vec2 x, float t){
    vec2 n = floor(x), f = fract(x);
    vec2 mg, mr; float md = 8.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.45 * sin(t + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md){ md = d; mr = r; mg = g; }
    }
    float cellId = hash(n + mg + 1.0);
    md = 8.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 g = mg + vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.45 * sin(t + 6.2831 * o);
      vec2 r = g + o - f;
      if (dot(mr - r, mr - r) > 0.0001)
        md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
    }
    return vec2(md, cellId);
  }

  void main(){
    vec2 uv = vUv;
    float heat = uIntensity;
    float descend = uScroll;

    // Heat shimmer: a little rising distortion, stronger with heat.
    vec2 sh = uv;
    sh.x += (fbm(vec2(uv.x * 6.0, uv.y * 4.0 - uTime * 0.5)) - 0.5) * (0.012 + heat * 0.02);

    // Basalt plates flowing slowly; pointer/scroll nudge the field.
    vec2 p = vec2(sh.x * uAspect, sh.y) * 3.4;
    p += vec2(uPointer.x * 0.3, -uTime * 0.05 - descend * 1.5);
    vec2 vo = voronoi(p, uTime * 0.25);
    float border = vo.x;
    float cellId = vo.y;

    // Magma in the cracks; brighter with heat + scroll + near pointer.
    float crack = smoothstep(0.16, 0.0, border);
    float flow = fbm(p * 0.7 + vec2(0.0, uTime * 0.12));
    vec3 magma = mix(uMagma0, uMagma2, flow);
    magma = mix(magma, uMagma1, 0.5);

    // Cooling basalt plate, tinted per cell.
    vec3 basalt = uBasalt * (0.55 + 0.5 * cellId);
    basalt += uMagma0 * smoothstep(0.5, 0.0, border) * 0.05; // faint edge heat

    float hotSpot = exp(-distance(vec2((uv.x - (uPointer.x * 0.5 + 0.5)) * uAspect, uv.y - (uPointer.y * 0.5 + 0.5)), vec2(0.0)) * 1.6);
    float crackHeat = crack * (0.55 + heat * 0.9 + descend * 0.5 + hotSpot * 0.6);

    vec3 col = mix(basalt, magma, clamp(crackHeat, 0.0, 1.3));
    // Underglow bleeding up through thin crust.
    col += magma * pow(flow, 2.0) * (0.06 + heat * 0.12 + descend * 0.1);

    // Rising embers in the lower-to-mid field.
    vec2 ep = vec2(uv.x * uAspect, uv.y + uTime * (0.04 + heat * 0.05));
    vec2 ecell = floor(ep * vec2(46.0, 60.0));
    float ernd = hash(ecell);
    if (ernd > 0.986 - heat * 0.006) {
      vec2 ec = fract(ep * vec2(46.0, 60.0)) - 0.5;
      float soft = smoothstep(0.5, 0.0, length(ec));
      float tw = 0.4 + 0.6 * sin(uTime * 3.0 + ernd * 60.0);
      col += mix(uMagma1, uMagma2, ernd) * soft * tw * 0.9;
    }

    // Vignette + reveal + dither.
    vec2 c = uv - 0.5;
    col *= smoothstep(1.25, 0.32, length(vec2(c.x * uAspect, c.y)) * 1.04);
    col *= smoothstep(0.0, 1.0, uReveal);
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.02;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initVulcanScene(canvas: HTMLCanvasElement): SceneHandle {
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
  renderer.toneMappingExposure = 1.08;
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
      uIntensity: { value: 0.5 },
      uReveal: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uMagma0: { value: new THREE.Color(0xff3a1a) },
      uMagma1: { value: new THREE.Color(0xff7a18) },
      uMagma2: { value: new THREE.Color(0xffbf2a) },
      uBasalt: { value: new THREE.Color(0x14110f) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.62, 0.75, 0.5);
  composer.addPass(bloom);

  let curIntensity = 0.5, tgtIntensity = 0.5;
  let curPx = 0, curPy = 0, tgtPx = 0, tgtPy = 0;
  let scrollP = 0, targetScroll = 0;

  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };
  const setIntensity = (v: number) => { tgtIntensity = Math.max(0, Math.min(1, v)); };

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

    curIntensity += (tgtIntensity - curIntensity) * 0.06;
    curPx += (tgtPx - curPx) * 0.05;
    curPy += (tgtPy - curPy) * 0.05;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = scrollP;
    u.uIntensity.value = curIntensity;
    (u.uPointer.value as THREE.Vector2).set(curPx, curPy);
    if (u.uReveal.value < 1) u.uReveal.value = Math.min(1, u.uReveal.value + 0.014);

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

  return { dispose, setScroll, setIntensity };
}