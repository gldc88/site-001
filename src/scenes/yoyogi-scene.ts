/**
 * yoyogi-scene.ts , persistent full-viewport WebGL backdrop for website3 (YOYOGI).
 *
 * Concept: "Thermal Quiet" , an urban bathhouse. A warm heat-haze field (domain-warped
 * fbm rising like steam) with an ember glow at the base and slow-rising sparks, lifted by
 * UnrealBloom. Scroll descends "deeper into the heat": the ember glow climbs and warms.
 * Island-scoped, WebGL/reduced-motion guarded by the caller, disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** R3 "Breathe With The House": 0..1 ademwaarde , haze en ember ademen mee. */
  setBreath: (v: number) => void;
  /** R3: settled-state (na 3 volledige cycli) , ember warmt blijvend +10%. */
  setSettled: (on: boolean) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;
  uniform float uBreath;
  uniform float uSettled;
  uniform vec3 uDeep;
  uniform vec3 uAmber;
  uniform vec3 uEmber;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.04; a*=0.5; } return v; }

  void main(){
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float t = uTime * 0.05;

    // steam rises: shift the field upward over time
    vec2 q = vec2(fbm(p * 2.6 + vec2(0.0, -t * 1.6)), fbm(p * 2.6 + vec2(3.1, 1.7 - t)));
    vec2 r = vec2(fbm(p * 2.6 + 1.5 * q + vec2(2.2, 9.1 - t)), fbm(p * 2.6 + 1.5 * q + vec2(7.4, 2.3)));
    float f = fbm(p * 2.6 + 1.9 * r);

    vec3 col = uDeep;
    // R3: inademen tilt de haze op en verdicht hem licht , het huis ademt mee.
    col = mix(col, uAmber, smoothstep(0.42 - uBreath * 0.06, 1.0, f) * (0.55 + uBreath * 0.12));

    // ember glow climbs from the floor as you scroll into the heat
    float floorLevel = -0.18 + uScroll * 0.55 + uBreath * 0.05;
    float glow = smoothstep(floorLevel + 0.7, floorLevel, uv.y);
    float flicker = clamp(0.6 + 0.4 * sin(t * 3.0 + uv.x * 7.0), 0.0, 1.0);
    col += uEmber * glow * (0.5 + 0.5 * uScroll) * flicker * (1.0 + uSettled * 0.1 + uBreath * 0.18);

    // subtle warm haze bloom in the mid
    col += uAmber * smoothstep(0.9, 0.2, abs(uv.y - 0.5)) * f * 0.06;

    // vignette
    vec2 c = uv - 0.5;
    col *= smoothstep(1.12, 0.36, length(vec2(c.x * uAspect, c.y)) * 1.22);

    // grain
    col += (hash(uv * 850.0 + t) - 0.5) * 0.03;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initYoyogiScene(canvas: HTMLCanvasElement): SceneHandle {
  const sizeOf = () => ({ w: window.innerWidth, h: window.innerHeight });
  let { w, h } = sizeOf();
  const DPR = Math.min(1.75, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
  camera.position.set(0, 0, 12);

  const bgMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAspect: { value: w / h },
      uBreath: { value: 0 },
      uSettled: { value: 0 },
      uDeep: { value: new THREE.Color(0x100c0a) },
      uAmber: { value: new THREE.Color(0x8a6038) },
      uEmber: { value: new THREE.Color(0xb2402a) },
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

  // --- Rising embers ---
  const N = w < 760 ? 160 : 320;
  const sparks: { x: number; y: number; z: number; spd: number; sway: number }[] = [];
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const palette = [new THREE.Color(0xff7a2a), new THREE.Color(0xffb347), new THREE.Color(0xd9542f), new THREE.Color(0xbfa890)];
  for (let i = 0; i < N; i++) {
    sparks.push({ x: (Math.random() - 0.5) * 30, y: Math.random() * 24 - 12, z: (Math.random() - 0.5) * 12 - 1, spd: Math.random() * 1.6 + 0.6, sway: Math.random() * 6.28 });
    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sparkMat = new THREE.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const embers = new THREE.Points(sparkGeo, sparkMat);
  scene.add(embers);

  function writeSparks(t: number) {
    const pos = sparkGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const s = sparks[i];
      pos.setXYZ(i, s.x + Math.sin(t * 0.6 + s.sway) * 0.5, s.y, s.z);
    }
    pos.needsUpdate = true;
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.85, 0.75, 0.5);
  composer.addPass(bloom);

  let tmx = 0, tmy = 0, mx = 0, my = 0;
  const onPointer = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  // R3 "Breathe With The House"
  let breathTarget = 0;
  const setBreath = (v: number) => { breathTarget = Math.max(0, Math.min(1, v)); };
  const setSettled = (on: boolean) => { bgMat.uniforms.uSettled.value = on ? 1 : 0; };

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
    // adem volgt het doel zacht (de driver levert al een ease-curve)
    bgMat.uniforms.uBreath.value += (breathTarget - bgMat.uniforms.uBreath.value) * 0.12;
    const breathNow = bgMat.uniforms.uBreath.value;

    for (let i = 0; i < N; i++) {
      const s = sparks[i];
      s.y += s.spd * (1 + breathNow * 0.35) * dt;
      if (s.y > 13) { s.y = -13 - Math.random() * 4; s.x = (Math.random() - 0.5) * 30; }
    }
    writeSparks(t);
    embers.position.x = -mx * 0.8;

    camera.position.x += (mx * 1.1 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.7 - camera.position.y) * 0.04;
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
    sparkGeo.dispose(); sparkMat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, setBreath, setSettled };
}