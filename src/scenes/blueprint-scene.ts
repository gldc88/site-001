/**
 * blueprint-scene.ts , persistent full-viewport WebGL backdrop for website20 (NORTHRIDGE).
 *
 * Concept: an architect's drafting table. An analytic fragment shader draws a blueprint grid
 * (fine + coarse), a horizontal SURVEY-SCAN sweep that ignites the lines as it passes, faint
 * dimension ticks at intersections, and dust drifting in a skylight beam. Cyan-white linework on
 * deep blue-black with a faint emerald accent (matching the page's "Booking Open" cue). Subtle and
 * precise, unlike the pack's other scenes. UnrealBloom lifts the scan. Same contract + setScan.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uReveal;
  uniform vec2 uPointer;
  uniform vec3 uLine, uAccent, uDeep;

  float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }

  // Anti-aliased grid lines at a given cell size; returns line intensity.
  float grid(vec2 uv, float cells){
    vec2 g = uv * cells;
    vec2 f = abs(fract(g) - 0.5);
    vec2 w = fwidth(g) * 1.2;
    vec2 lines = smoothstep(w, vec2(0.0), 0.5 - f);
    return max(lines.x, lines.y);
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y) + uPointer * 0.015 + vec2(0.0, -uScroll * 0.15);

    vec3 col = uDeep * (0.7 + 0.3 * smoothstep(1.0, 0.0, length(uv - 0.5)));

    float fine = grid(p, 40.0) * 0.10;
    float coarse = grid(p, 8.0) * 0.22;
    col += uLine * (fine + coarse);

    // Dimension ticks: small accent crosses on a sparse subset of coarse intersections.
    vec2 cg = p * 8.0;
    vec2 cell = floor(cg);
    if (hash(cell) > 0.82) {
      vec2 f = abs(fract(cg) - 0.5);
      float cross = smoothstep(0.06, 0.0, f.x) + smoothstep(0.06, 0.0, f.y);
      col += uAccent * cross * 0.10;
    }

    // Survey scan sweep: a soft vertical bar travelling left→right, igniting nearby lines.
    float scanX = fract(uTime * 0.06);
    float d = abs(uv.x - scanX);
    float scan = smoothstep(0.06, 0.0, d);
    col += uAccent * scan * (fine * 4.0 + coarse * 3.0 + 0.04);
    col += uLine * scan * 0.05;

    // Dust in a soft skylight beam (upper area).
    vec2 dp = vec2(uv.x * uAspect, uv.y - uTime * 0.012);
    vec2 dc = floor(dp * vec2(50.0, 64.0));
    float dr = hash(dc);
    if (dr > 0.99) {
      vec2 dl = fract(dp * vec2(50.0, 64.0)) - 0.5;
      float soft = smoothstep(0.5, 0.0, length(dl));
      col += uLine * soft * smoothstep(0.1, 0.8, uv.y) * 0.6;
    }

    // Vignette + reveal + grain.
    vec2 v = uv - 0.5;
    col *= smoothstep(1.25, 0.34, length(vec2(v.x * uAspect, v.y)) * 1.02);
    col *= smoothstep(0.0, 1.0, uReveal);
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.012;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initBlueprintScene(canvas: HTMLCanvasElement): SceneHandle {
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
  renderer.toneMappingExposure = 1.05;
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
      uPointer: { value: new THREE.Vector2(0, 0) },
      uLine: { value: new THREE.Color(0xaecadf) },
      uAccent: { value: new THREE.Color(0x4fd6a0) },
      uDeep: { value: new THREE.Color(0x05080c) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.42, 0.7, 0.7);
  composer.addPass(bloom);

  let curPx = 0, curPy = 0, tgtPx = 0, tgtPy = 0;
  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

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

    curPx += (tgtPx - curPx) * 0.04;
    curPy += (tgtPy - curPy) * 0.04;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = scrollP;
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

  return { dispose, setScroll };
}