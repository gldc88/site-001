/**
 * drive-scene.ts , persistent full-viewport WebGL backdrop for website19 (MONARCH CHAUFFEUR).
 *
 * Concept: the view from a moving car at night. An analytic fragment shader streaks warm/cool
 * light trails outward from a vanishing point (headlights, streetlights smearing past), motion-
 * blurred by their radial profile. The page idles at a slow cruise; confirming a dispatch surges
 * the speed (the car departs) before easing back. UnrealBloom melts the trails. Pointer shifts the
 * vanishing point; scroll adds a little pace. Same pack contract + one extra setter.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** 0 = parked idle, 1 = full cruise. Pass >1 momentarily to surge on dispatch. */
  setSpeed: (v: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uSpeed, uReveal;
  uniform vec2 uPointer;
  uniform vec3 uWarm, uCool, uDeep;

  #define TAU 6.28318530718
  #define PI 3.14159265359

  float hash(float n){ return fract(sin(n) * 43758.5453123); }
  float hash2(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }

  void main(){
    vec2 uv = vUv;
    vec2 vp = vec2(0.5 + uPointer.x * 0.06, 0.5 + uPointer.y * 0.04);
    vec2 c = (uv - vp) * vec2(uAspect, 1.0);
    float r = length(c) + 0.0008;
    float ang = atan(c.y, c.x);

    float lanes = 64.0;
    float laneF = (ang / TAU + 0.5) * lanes;
    float li = floor(laneF);

    vec3 col = uDeep * (0.5 + 0.5 * smoothstep(1.0, 0.0, r));

    // Two neighbouring lanes so streaks don't pop at lane borders.
    for (int k = 0; k <= 1; k++){
      float id = li + float(k);
      float h = hash(id * 1.37);
      float h2 = hash(id * 3.11 + 5.0);
      float sp = (0.25 + h * 0.8) * (0.35 + uSpeed * 1.9);
      float phase = fract(r * (1.1 + h2 * 0.6) - uTime * sp + h * 7.0);
      // bright at the outer end → a trail smearing outward
      float dash = pow(phase, 9.0);
      // confine to this lane's angular center
      float laneCenter = (id + 0.5) / lanes * TAU - PI;
      float da = abs(mod(ang - laneCenter + PI, TAU) - PI);
      float laneW = smoothstep(0.045, 0.0, da);
      float fadeCenter = smoothstep(0.0, 0.22, r) * smoothstep(1.35, 0.5, r);
      vec3 tint = mix(uCool, uWarm, step(0.5, h2));
      col += tint * dash * laneW * fadeCenter * (0.5 + uSpeed * 0.9);
    }

    // Faint ground reflection band low in frame.
    float ground = smoothstep(0.0, 0.28, vp.y - uv.y) * smoothstep(0.5, 0.0, abs(c.x));
    col += uWarm * ground * 0.04 * (0.4 + uSpeed);

    // Vignette + reveal + grain.
    vec2 v = uv - 0.5;
    col *= smoothstep(1.25, 0.3, length(vec2(v.x * uAspect, v.y)) * 1.04);
    col *= smoothstep(0.0, 1.0, uReveal);
    col += (hash2(uv * 900.0 + uTime) - 0.5) * 0.016;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initDriveScene(canvas: HTMLCanvasElement): SceneHandle {
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
      uSpeed: { value: 0.35 },
      uReveal: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uWarm: { value: new THREE.Color(0xe6d2a8) },
      uCool: { value: new THREE.Color(0xbfc7d3) },
      uDeep: { value: new THREE.Color(0x06070b) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.8, 0.5);
  composer.addPass(bloom);

  let curSpeed = 0.35, tgtSpeed = 0.35, surge = 0;
  let curPx = 0, curPy = 0, tgtPx = 0, tgtPy = 0;
  let scrollP = 0, targetScroll = 0;

  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };
  const setSpeed = (v: number) => {
    if (v > 1) { surge = Math.min(1.4, v - 1 + 0.9); } // momentary surge on dispatch
    else { tgtSpeed = Math.max(0, Math.min(1, v)); }
  };

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
    const dt = Math.min(0.05, (now - last) / 1000);
    elapsed += dt; last = now;

    surge *= 0.96; // decay the dispatch surge
    curSpeed += (tgtSpeed + scrollP * 0.2 + surge - curSpeed) * 0.08;
    curPx += (tgtPx - curPx) * 0.04;
    curPy += (tgtPy - curPy) * 0.04;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = scrollP;
    u.uSpeed.value = curSpeed;
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

  return { dispose, setScroll, setSpeed };
}