/**
 * aurelia-scene.ts , persistent full-viewport WebGL backdrop for website4 (AURELIA SKYPORT).
 *
 * Concept: a private-aviation dawn. A single analytic fragment shader renders a champagne
 * sky with a glowing horizon sun + stars, and a perspective grid runway rushing toward the
 * camera (approach/takeoff). Scrolling accelerates the runway and lifts the sun. UnrealBloom
 * lifts the sun and grid. Island-scoped, guarded by the caller, disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** R3 "Wheels-Up": 0 = vertrek ver weg (koele vroege dageraad), 1 = imminent (gouden zonsopkomst). */
  setDeparture: (p: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uMouse;
  uniform vec3 uZenith, uHorizon, uGround, uGrid, uSun;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }

  void main(){
    vec2 uv = vUv;
    float horizon = 0.40 + uScroll * 0.05;
    float sunX = 0.5 + uMouse * 0.04;
    vec3 col;

    if (uv.y > horizon) {
      float sky = smoothstep(horizon, 1.0, uv.y);
      col = mix(uHorizon, uZenith, pow(sky, 0.7));
      // sun
      float d = distance(vec2((uv.x - sunX) * uAspect, uv.y - (horizon + 0.015)), vec2(0.0));
      col += uSun * exp(-d * 11.0) * 0.95;
      col += uSun * exp(-d * 3.0) * 0.24;
      // stars (upper sky)
      vec2 cell = floor(uv * vec2(170.0, 118.0));
      float st = hash(cell);
      if (st > 0.988 && uv.y > horizon + 0.08) {
        col += vec3(0.8, 0.84, 1.0) * ((st - 0.988) / 0.012) * (0.3 + 0.5 * sin(uTime * 3.0 + st * 90.0)) * 0.7;
      }
    } else {
      float depth = 0.22 / (horizon - uv.y + 0.0016);
      float speed = uTime * (0.5 + uScroll * 1.6);
      float gx = (uv.x - 0.5) * depth * uAspect * 1.15;
      float gz = depth + speed;
      float lineX = smoothstep(0.05, 0.0, 0.5 - abs(fract(gx) - 0.5));
      float lineZ = smoothstep(0.05, 0.0, 0.5 - abs(fract(gz) - 0.5));
      float g = max(lineX, lineZ);
      float fade = exp(-depth * 0.16);
      col = mix(uGround, uGrid, g * fade);
      col = mix(col, uHorizon, smoothstep(horizon - 0.14, horizon, uv.y));
      // sun reflection on the runway
      float gd = distance(vec2((uv.x - sunX) * uAspect, uv.y - horizon), vec2(0.0));
      col += uSun * exp(-gd * 5.0) * 0.22;
    }

    vec2 c = uv - 0.5;
    col *= smoothstep(1.2, 0.4, length(vec2(c.x * uAspect, c.y)) * 1.08);
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.022;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initAureliaScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.75, window.devicePixelRatio || 1);

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
      uMouse: { value: 0 },
      uZenith: { value: new THREE.Color(0x05060d) },
      uHorizon: { value: new THREE.Color(0x8a6a38) },
      uGround: { value: new THREE.Color(0x070608) },
      uGrid: { value: new THREE.Color(0xc8a86b) },
      uSun: { value: new THREE.Color(0xffd29a) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.6, 0.62);
  composer.addPass(bloom);

  let tmouse = 0, mouse = 0;
  const onPointer = (e: PointerEvent) => { tmouse = (e.clientX / window.innerWidth - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  // R3 "Wheels-Up": de dageraad vordert naarmate het vertrek nadert (p 0=ver, 1=imminent).
  const DAWN_FAR = { zenith: new THREE.Color(0x05060d), horizon: new THREE.Color(0x8a6a38), sun: new THREE.Color(0xffd29a), grid: new THREE.Color(0xc8a86b), bloom: 0.5 };
  const DAWN_NEAR = { zenith: new THREE.Color(0x1a1430), horizon: new THREE.Color(0xd98a3c), sun: new THREE.Color(0xffe9b8), grid: new THREE.Color(0xe8c47a), bloom: 0.72 };
  const depTarget = { zenith: DAWN_FAR.zenith.clone(), horizon: DAWN_FAR.horizon.clone(), sun: DAWN_FAR.sun.clone(), grid: DAWN_FAR.grid.clone(), bloom: DAWN_FAR.bloom };
  const setDeparture = (p: number) => {
    const k = Math.max(0, Math.min(1, p));
    depTarget.zenith.copy(DAWN_FAR.zenith).lerp(DAWN_NEAR.zenith, k);
    depTarget.horizon.copy(DAWN_FAR.horizon).lerp(DAWN_NEAR.horizon, k);
    depTarget.sun.copy(DAWN_FAR.sun).lerp(DAWN_NEAR.sun, k);
    depTarget.grid.copy(DAWN_FAR.grid).lerp(DAWN_NEAR.grid, k);
    depTarget.bloom = DAWN_FAR.bloom + (DAWN_NEAR.bloom - DAWN_FAR.bloom) * k;
  };

  const onResize = () => {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    mat.uniforms.uAspect.value = w / h;
  };
  window.addEventListener('resize', onResize, { passive: true });

  let inView = true;
  const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(canvas);

  // performance.now i.p.v. THREE.Clock (deprecated sinds r183) , pack-conventie.
  const t0 = performance.now();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) return;
    const t = (performance.now() - t0) / 1000;
    scrollP += (targetScroll - scrollP) * 0.06;
    mouse += (tmouse - mouse) * 0.04;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uScroll.value = scrollP;
    mat.uniforms.uMouse.value = mouse;
    // R3: dageraad lerpt naar het vertrek-doel
    (mat.uniforms.uZenith.value as THREE.Color).lerp(depTarget.zenith, 0.03);
    (mat.uniforms.uHorizon.value as THREE.Color).lerp(depTarget.horizon, 0.03);
    (mat.uniforms.uSun.value as THREE.Color).lerp(depTarget.sun, 0.03);
    (mat.uniforms.uGrid.value as THREE.Color).lerp(depTarget.grid, 0.03);
    bloom.strength += (depTarget.bloom - bloom.strength) * 0.03;
    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    plane.geometry.dispose(); mat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, setDeparture };
}