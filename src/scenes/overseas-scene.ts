/**
 * overseas-scene.ts , persistent full-viewport WebGL backdrop for website5 (OVERSEAS LINE).
 *
 * Concept: an all-suite liner crossing at night. An analytic fragment shader: a deep night
 * sky with a gold moon + stars above a dark, rolling sea, with a shimmering gold moon-path
 * reflection rushing toward the viewer. Scroll drifts the crossing forward. UnrealBloom.
 * Island-scoped, guarded by the caller, disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** R3 "Crossing Log": 0..1 overtocht-voortgang , de gouden maanbaan verbreedt richting landfall. */
  setCrossing: (p: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uMouse, uCrossing;
  uniform vec3 uSky, uHorizon, uSeaDeep, uSeaLight, uMoon;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.05; a*=0.5; } return v; }

  void main(){
    vec2 uv = vUv;
    float horizon = 0.52;
    float moonX = 0.5 + uMouse * 0.03;
    float drift = uTime * 0.5 + uScroll * 6.0;
    vec3 col;

    if (uv.y > horizon) {
      float sky = smoothstep(horizon, 1.0, uv.y);
      col = mix(uHorizon, uSky, pow(sky, 0.8));
      vec2 mp = vec2((uv.x - moonX) * uAspect, uv.y - (horizon + 0.17));
      float md = length(mp);
      col += uMoon * smoothstep(0.055, 0.0, md);          // disc
      col += uMoon * exp(-md * 4.5) * 0.28;               // halo
      vec2 cell = floor(uv * vec2(180.0, 120.0));
      float st = hash(cell);
      if (st > 0.99 && uv.y > horizon + 0.05) {
        col += vec3(0.85, 0.9, 1.0) * ((st - 0.99) / 0.01) * (0.4 + 0.6 * sin(uTime * 2.0 + st * 80.0));
      }
    } else {
      float depth = horizon - uv.y;
      float persp = 1.0 / (depth + 0.045);
      float w = fbm(vec2((uv.x - 0.5) * uAspect * 3.0, persp * 0.6 + drift));
      w += 0.5 * fbm(vec2((uv.x - 0.5) * uAspect * 7.0, persp * 1.4 - drift * 1.4));
      vec3 sea = mix(uSeaDeep, uSeaLight, clamp(w * 0.6, 0.0, 1.0));
      // gold moon-path: widens with depth, broken by shimmer.
      // R3 "Crossing Log": de baan verbreedt en verguldt richting landfall (uCrossing 0..1).
      float width = (0.05 + depth * 1.5) * (1.0 + uCrossing * 0.7);
      float colMp = exp(-pow(((uv.x - moonX) * uAspect) / width, 2.0));
      colMp *= 0.4 + 0.6 * fbm(vec2(uv.x * 30.0, persp * 2.0 - uTime * 2.5));
      sea += uMoon * colMp * (0.7 + uCrossing * 0.35) * smoothstep(0.0, 0.22, depth + 0.04);
      sea = mix(sea, uHorizon, smoothstep(horizon - 0.08, horizon, uv.y));
      col = sea;
    }

    vec2 c = uv - 0.5;
    col *= smoothstep(1.2, 0.4, length(vec2(c.x * uAspect, c.y)) * 1.05);
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.02;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initOverseasScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.75, window.devicePixelRatio || 1);

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
      uMouse: { value: 0 },
      uCrossing: { value: 0 },
      uSky: { value: new THREE.Color(0x04060e) },
      uHorizon: { value: new THREE.Color(0x141d2e) },
      uSeaDeep: { value: new THREE.Color(0x02040a) },
      uSeaLight: { value: new THREE.Color(0x0a1626) },
      uMoon: { value: new THREE.Color(0xe6cf9e) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.6, 0.7, 0.55);
  composer.addPass(bloom);

  let tmouse = 0, mouse = 0;
  const onPointer = (e: PointerEvent) => { tmouse = (e.clientX / window.innerWidth - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  // R3 "Crossing Log": voortgang van de overtocht (0..1) , maanbaan groeit mee.
  let crossingTarget = 0;
  const setCrossing = (p: number) => { crossingTarget = Math.max(0, Math.min(1, p)); };

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
    scrollP += (targetScroll - scrollP) * 0.05;
    mouse += (tmouse - mouse) * 0.04;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uScroll.value = scrollP;
    mat.uniforms.uMouse.value = mouse;
    mat.uniforms.uCrossing.value += (crossingTarget - mat.uniforms.uCrossing.value) * 0.02;
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

  return { dispose, setScroll, setCrossing };
}