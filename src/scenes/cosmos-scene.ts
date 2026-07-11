/**
 * cosmos-scene.ts , persistent full-viewport WebGL backdrop for website9 (ORBITAL ARCHIVE).
 *
 * Concept: a private observatory. A slowly rotating spiral galaxy of particles (graded
 * cyan → violet → pink from core to rim) over a deep starfield, with a glowing core lifted
 * by UnrealBloom. Mouse parallax orbits the view; scroll dives the camera inward and tilts
 * the disk toward edge-on. Island-scoped, guarded by the caller, disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  /** R3 "Night Watch": korte helderheids-flare bij een ontdekking. */
  flare: () => void;
  dispose: () => void;
  setScroll: (p: number) => void;
}

export function initCosmosScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.75, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x050515, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050515, 0.07);
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
  camera.position.set(0, 3.6, 7.6);

  const root = new THREE.Group();
  root.position.set(1.4, -0.3, 0); // offset so the left-aligned hero text sits over darker space
  scene.add(root);

  // ---- Galaxy ----
  const COUNT = w < 760 ? 4000 : 8000;
  const RADIUS = 5.2;
  const BRANCHES = 4;
  const SPIN = 1.05;
  const RANDOMNESS = 0.42;
  const RAND_POW = 2.6;
  const cInside = new THREE.Color(0x6fc8ff);
  const cMid = new THREE.Color(0xb46bff);
  const cOutside = new THREE.Color(0xff5ea8);

  const gPos = new Float32Array(COUNT * 3);
  const gCol = new Float32Array(COUNT * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    const r = Math.pow(Math.random(), 1.6) * RADIUS;
    const branch = (i % BRANCHES) / BRANCHES * Math.PI * 2;
    const spin = r * SPIN;
    const rx = Math.pow(Math.random(), RAND_POW) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * r;
    const ry = Math.pow(Math.random(), RAND_POW) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * r * 0.4;
    const rz = Math.pow(Math.random(), RAND_POW) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * r;
    gPos[i * 3] = Math.cos(branch + spin) * r + rx;
    gPos[i * 3 + 1] = ry;
    gPos[i * 3 + 2] = Math.sin(branch + spin) * r + rz;

    const t = r / RADIUS;
    if (t < 0.5) tmp.copy(cInside).lerp(cMid, t * 2);
    else tmp.copy(cMid).lerp(cOutside, (t - 0.5) * 2);
    gCol[i * 3] = tmp.r; gCol[i * 3 + 1] = tmp.g; gCol[i * 3 + 2] = tmp.b;
  }
  const galaxyGeo = new THREE.BufferGeometry();
  galaxyGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  galaxyGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  const galaxyMat = new THREE.PointsMaterial({ size: 0.028, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, transparent: true, opacity: 0.72 });
  const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
  root.add(galaxy);

  // ---- Glowing core ----
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x9fe8ff }),
  );
  root.add(core);

  // ---- Distant starfield ----
  const STARS = 1400;
  const sPos = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    const r = 16 + Math.random() * 26;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    sPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    sPos[i * 3 + 2] = r * Math.cos(ph);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbcd0ff, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(stars);

  // ---- Post ----
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.55, 0.22);
  composer.addPass(bloom);

  let tmx = 0, tmy = 0, mx = 0, my = 0;
  const onPointer = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  const onResize = () => {
    w = window.innerWidth; h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); composer.setSize(w, h);
  };
  window.addEventListener('resize', onResize, { passive: true });

  let inView = true;
  const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(canvas);

  // R3 "Night Watch": flare-state
  let flareV = 0;
  const flare = () => { flareV = 1; };

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
    flareV = Math.max(0, flareV - dt * 1.2);
    bloom.strength = 0.5 + flareV * 0.55;
    scrollP += (targetScroll - scrollP) * 0.05;
    mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;

    galaxy.rotation.y = t * 0.06;
    stars.rotation.y = t * 0.01;
    core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.08);

    // camera dives inward + tilts the disk toward edge-on as you scroll
    const radius = 7.6 - scrollP * 3.6;
    const height = 3.6 - scrollP * 3.0;
    camera.position.x = Math.sin(t * 0.05 + mx * 0.8) * radius;
    camera.position.z = Math.cos(t * 0.05 + mx * 0.8) * radius;
    camera.position.y = height - my * 0.8;
    camera.lookAt(0, 0, 0);
    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    galaxyGeo.dispose(); galaxyMat.dispose();
    core.geometry.dispose(); (core.material as THREE.Material).dispose();
    starGeo.dispose(); (stars.material as THREE.Material).dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, flare };
}