/**
 * topo-scene.ts , persistent full-viewport WebGL backdrop for website21 (HEARTH & GROVE).
 *
 * Concept: a living topographic survey. An analytic fragment shader draws iso-contour lines over a
 * slowly drifting domain-warped height field , major and minor lines, faint elevation shading, and
 * dust in light. The palette eases from cool stone to forest emerald as `setSeason` rises (driven
 * by the page's scroll colour-shift), so the whole site "greens" as you read down it. On-concept
 * for landscape architecture and distinct from the pack's other scenes. UnrealBloom lifts contours.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** 0 = stone / dormant, 1 = forest / emerald. */
  setSeason: (v: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uSeason, uReveal;
  uniform vec2 uPointer;
  uniform vec3 uStone, uEmerald, uDeep;

  float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = p * 2.02 + 1.7; a *= 0.5; } return v; }

  void main(){
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y) * 2.6 + uPointer * 0.06;
    // Domain warp + slow drift makes the survey feel alive.
    float warp = fbm(p * 0.6 + vec2(0.0, uTime * 0.02));
    float hgt = fbm(p + warp * 0.6 + vec2(uTime * 0.01, -uScroll * 0.4));

    vec3 accent = mix(uStone, uEmerald, smoothstep(0.0, 1.0, uSeason));

    // Iso-contours via screen-space derivative AA.
    float N = 11.0;
    float hf = hgt * N;
    float fr = fract(hf);
    float dist = min(fr, 1.0 - fr);
    float w = fwidth(hf) * 1.5 + 1e-4;
    float minor = smoothstep(w, 0.0, dist) * 0.5;
    // Major contours: a separate, coarser iso-set (1/5 the frequency).
    float hfM = hgt * (N / 5.0);
    float distM = min(fract(hfM), 1.0 - fract(hfM));
    float wM = fwidth(hfM) * 1.5 + 1e-4;
    float major = smoothstep(wM, 0.0, distM);

    vec3 col = uDeep * (0.55 + 0.45 * smoothstep(0.0, 1.0, hgt));
    col += accent * minor;
    col += accent * major * 0.9;

    // Soft elevation glow on the high ground.
    col += accent * smoothstep(0.7, 1.05, hgt) * (0.12 + uSeason * 0.16);

    // Dust in light.
    vec2 dp = vec2(uv.x * uAspect, uv.y - uTime * 0.012);
    vec2 dc = floor(dp * vec2(48.0, 62.0));
    if (hash(dc) > 0.992) {
      vec2 dl = fract(dp * vec2(48.0, 62.0)) - 0.5;
      col += accent * smoothstep(0.5, 0.0, length(dl)) * 0.5;
    }

    // Vignette + reveal + grain.
    vec2 v = uv - 0.5;
    col *= smoothstep(1.25, 0.32, length(vec2(v.x * uAspect, v.y)) * 1.02);
    col *= smoothstep(0.0, 1.0, uReveal);
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.012;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initTopoScene(canvas: HTMLCanvasElement): SceneHandle {
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
      uSeason: { value: 0 },
      uReveal: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uStone: { value: new THREE.Color(0x8a857e) },
      uEmerald: { value: new THREE.Color(0x4fd99a) },
      uDeep: { value: new THREE.Color(0x070a09) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.75, 0.6);
  composer.addPass(bloom);

  let curSeason = 0, tgtSeason = 0;
  let curPx = 0, curPy = 0, tgtPx = 0, tgtPy = 0;
  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };
  const setSeason = (v: number) => { tgtSeason = Math.max(0, Math.min(1, v)); };

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

    curSeason += (tgtSeason - curSeason) * 0.06;
    curPx += (tgtPx - curPx) * 0.04;
    curPy += (tgtPy - curPy) * 0.04;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = scrollP;
    u.uSeason.value = curSeason;
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

  return { dispose, setScroll, setSeason };
}