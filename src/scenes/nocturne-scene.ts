/**
 * nocturne-scene.ts , persistent full-viewport WebGL backdrop for website2 (NOCTURNE HOTEL).
 *
 * Concept: "Neon outside, hush within." A single fixed canvas the whole page scrolls over:
 *   - a domain-warped fbm cloud shader (neon Tokyo night glow)
 *   - falling neon rain (additive line segments) with UnrealBloom
 *   - scroll shifts the mood from cool neon (top) toward a warmer hush (deep)
 * Island-scoped, WebGL/reduced-motion guarded by the caller, disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export type NightPhase = 'dusk' | 'night' | 'deep' | 'dawn';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** R3 Night Clock: retune de hele scene-stemming per JST-fase (lerp ~1.5s). */
  setPhase: (phase: NightPhase, instant?: boolean) => void;
}

/* R3: fase-paletten voor de Night Clock. */
const PHASES: Record<NightPhase, { neonA: number; neonB: number; deep: number; rainMul: number; rainOp: number; bloom: number }> = {
  dusk:  { neonA: 0x8a3d16, neonB: 0xd44fa3, deep: 0x0a0710, rainMul: 0.6,  rainOp: 0.55, bloom: 0.75 },
  night: { neonA: 0x3a1d6e, neonB: 0x10b3c9, deep: 0x06070f, rainMul: 1,    rainOp: 0.9,  bloom: 0.9 },
  deep:  { neonA: 0x1c1450, neonB: 0x5a3bd6, deep: 0x040309, rainMul: 0.45, rainOp: 0.5,  bloom: 0.7 },
  dawn:  { neonA: 0x4a3550, neonB: 0xc9899a, deep: 0x0b0d12, rainMul: 0.25, rainOp: 0.3,  bloom: 0.5 },
};

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;
  uniform vec3 uDeep;
  uniform vec3 uNeonA;
  uniform vec3 uNeonB;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float t = uTime * 0.06;

    // domain warp for soft drifting clouds
    vec2 q = vec2(fbm(p * 2.2 + vec2(0.0, t)), fbm(p * 2.2 + vec2(5.2, 1.3 - t)));
    vec2 r = vec2(fbm(p * 2.2 + 1.6 * q + vec2(1.7, 9.2)), fbm(p * 2.2 + 1.6 * q + vec2(8.3, 2.8)));
    float f = fbm(p * 2.2 + 2.0 * r + vec2(0.0, uScroll * 0.6));

    // base night
    vec3 col = uDeep;
    // neon clouds
    col = mix(col, uNeonA, smoothstep(0.35, 0.95, f) * 0.9);
    col = mix(col, uNeonB, smoothstep(0.55, 1.05, length(r)) * 0.7);

    // lower city glow (brighter toward bottom), cools as you scroll into the "hush"
    float glow = smoothstep(0.55, -0.1, uv.y);
    col += uNeonB * glow * (0.18 + 0.12 * sin(t * 2.0 + uv.x * 6.0)) * (1.0 - uScroll * 0.5);

    // deeper scroll warms + darkens (hush within)
    vec3 warm = vec3(0.10, 0.07, 0.05);
    col = mix(col, col * 0.55 + warm, clamp(uScroll, 0.0, 1.0) * 0.6);

    // vignette
    vec2 c = uv - 0.5;
    col *= smoothstep(1.15, 0.35, length(vec2(c.x * uAspect, c.y)) * 1.25);

    // grain
    col += (hash(uv * 900.0 + t) - 0.5) * 0.035;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initNocturneScene(canvas: HTMLCanvasElement): SceneHandle {
  const sizeOf = () => ({ w: window.innerWidth, h: window.innerHeight });
  let { w, h } = sizeOf();
  const DPR = Math.min(1.75, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
  camera.position.set(0, 0, 12);

  // --- Background cloud plane (sits far back, always behind) ---
  const bgMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAspect: { value: w / h },
      uDeep: { value: new THREE.Color(0x06070f) },
      uNeonA: { value: new THREE.Color(0x3a1d6e) }, // indigo/violet
      uNeonB: { value: new THREE.Color(0x10b3c9) }, // cyan
    },
  });
  const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  const bgDepth = -40;
  function fitBg() {
    const dist = camera.position.z - bgDepth;
    const vH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist;
    bgPlane.scale.set((vH * (w / h)) / 2 + 1, vH / 2 + 1, 1);
  }
  bgPlane.position.z = bgDepth;
  fitBg();
  scene.add(bgPlane);

  // --- Neon rain ---
  const N = w < 760 ? 220 : 460;
  const drops: { x: number; y: number; z: number; len: number; spd: number }[] = [];
  const positions = new Float32Array(N * 2 * 3);
  const colors = new Float32Array(N * 2 * 3);
  const palette = [new THREE.Color(0x19e6ff), new THREE.Color(0xff3df0), new THREE.Color(0x7c6bff)];
  for (let i = 0; i < N; i++) {
    const d = { x: (Math.random() - 0.5) * 34, y: Math.random() * 24 - 12, z: (Math.random() - 0.5) * 14 - 2, len: Math.random() * 1.1 + 0.5, spd: Math.random() * 9 + 6 };
    drops.push(d);
    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 6] = c.r; colors[i * 6 + 1] = c.g; colors[i * 6 + 2] = c.b;
    colors[i * 6 + 3] = c.r * 0.1; colors[i * 6 + 4] = c.g * 0.1; colors[i * 6 + 5] = c.b * 0.1;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  rainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const rainMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  scene.add(rain);

  function writeRain() {
    const pos = rainGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const d = drops[i];
      pos.setXYZ(i * 2, d.x, d.y, d.z);
      pos.setXYZ(i * 2 + 1, d.x, d.y - d.len, d.z);
    }
    pos.needsUpdate = true;
  }
  writeRain();

  // --- Post: bloom (neon glow) ---
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.9, 0.7, 0.62);
  composer.addPass(bloom);

  // --- Interaction ---
  let tmx = 0, tmy = 0, mx = 0, my = 0;
  const onPointer = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  // R3 Night Clock: doelwaarden + lerp-state
  const phaseTarget = { neonA: new THREE.Color(0x3a1d6e), neonB: new THREE.Color(0x10b3c9), deep: new THREE.Color(0x06070f), rainMul: 1, rainOp: 0.9, bloom: 0.9 };
  let rainMul = 1;
  const setPhase = (phase: NightPhase, instant = false) => {
    const p = PHASES[phase] ?? PHASES.night;
    phaseTarget.neonA.setHex(p.neonA);
    phaseTarget.neonB.setHex(p.neonB);
    phaseTarget.deep.setHex(p.deep);
    phaseTarget.rainMul = p.rainMul; phaseTarget.rainOp = p.rainOp; phaseTarget.bloom = p.bloom;
    if (instant) {
      (bgMat.uniforms.uNeonA.value as THREE.Color).copy(phaseTarget.neonA);
      (bgMat.uniforms.uNeonB.value as THREE.Color).copy(phaseTarget.neonB);
      (bgMat.uniforms.uDeep.value as THREE.Color).copy(phaseTarget.deep);
      rainMul = p.rainMul; rainMat.opacity = p.rainOp; bloom.strength = p.bloom;
    }
  };

  const onResize = () => {
    const s = sizeOf(); w = s.w; h = s.h;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); composer.setSize(w, h);
    bgMat.uniforms.uAspect.value = w / h; fitBg();
  };
  window.addEventListener('resize', onResize, { passive: true });

  let inView = true;
  const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(canvas);

  // performance.now i.p.v. THREE.Clock (deprecated sinds r183) , pack-conventie.
  const t0 = performance.now();
  let prev = t0;
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) { prev = performance.now(); return; }
    const now = performance.now();
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (now - t0) / 1000;

    scrollP += (targetScroll - scrollP) * 0.06;
    mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;

    bgMat.uniforms.uTime.value = t;
    bgMat.uniforms.uScroll.value = scrollP;

    // R3 Night Clock: lerp naar het fase-doel (~1.5s gevoel bij 0.035/frame)
    (bgMat.uniforms.uNeonA.value as THREE.Color).lerp(phaseTarget.neonA, 0.035);
    (bgMat.uniforms.uNeonB.value as THREE.Color).lerp(phaseTarget.neonB, 0.035);
    (bgMat.uniforms.uDeep.value as THREE.Color).lerp(phaseTarget.deep, 0.035);
    rainMul += (phaseTarget.rainMul - rainMul) * 0.035;
    rainMat.opacity += (phaseTarget.rainOp - rainMat.opacity) * 0.035;
    bloom.strength += (phaseTarget.bloom - bloom.strength) * 0.035;

    for (let i = 0; i < N; i++) {
      const d = drops[i];
      d.y -= d.spd * rainMul * dt;
      if (d.y < -13) { d.y = 13 + Math.random() * 4; d.x = (Math.random() - 0.5) * 34; }
    }
    writeRain();
    rain.rotation.z = mx * 0.04;
    rain.position.x = -mx * 1.2;

    camera.position.x += (mx * 1.4 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.9 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    bgPlane.geometry.dispose(); bgMat.dispose();
    rainGeo.dispose(); rainMat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, setPhase };
}