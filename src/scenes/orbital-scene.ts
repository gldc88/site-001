/**
 * orbital-scene.ts , persistent full-viewport WebGL backdrop for website6 (ORBITAL CRYPTO).
 *
 * Concept: institutional crypto infrastructure. A glowing core inside a rotating wireframe
 * "network sphere", wrapped by inclined orbital rings carrying node points, over a starfield.
 * Indigo/cyan, lifted by UnrealBloom. Mouse parallax + scroll spin. Island-scoped, guarded
 * by the caller, disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  /** R3 "Test Settlement": vuurt een zichtbare schokgolf door het netwerk (core -> shell). */
  pulse: () => void;
  dispose: () => void;
  setScroll: (p: number) => void;
}

export function initOrbitalScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.75, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x040610, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040610, 0.05);
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0, 9);

  const CYAN = new THREE.Color(0x35f1ff);
  const BLUE = new THREE.Color(0xa77bff);

  const root = new THREE.Group();
  scene.add(root);

  // Core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshStandardMaterial({ color: 0x0a1430, emissive: CYAN, emissiveIntensity: 1.6, metalness: 0.6, roughness: 0.3, flatShading: true }),
  );
  root.add(core);

  // Network sphere (wireframe)
  const shellGeo = new THREE.IcosahedronGeometry(2.4, 2);
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(shellGeo),
    new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.14 }),
  );
  root.add(shell);
  shellGeo.dispose();

  // Node points on the shell
  const NODE_N = 220;
  const nodePos = new Float32Array(NODE_N * 3);
  for (let i = 0; i < NODE_N; i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
    const r = 2.4;
    nodePos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    nodePos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    nodePos[i * 3 + 2] = r * Math.cos(phi);
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({ color: CYAN, size: 0.05, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  root.add(nodes);

  // Orbital rings
  const rings: THREE.Group[] = [];
  const ringDefs = [
    { r: 3.0, tilt: [0.5, 0.2, 0.0], color: CYAN, speed: 0.25 },
    { r: 3.5, tilt: [-0.7, 0.6, 0.3], color: BLUE, speed: -0.18 },
    { r: 4.0, tilt: [0.3, -0.5, 0.6], color: CYAN, speed: 0.14 },
  ];
  ringDefs.forEach((def) => {
    const g = new THREE.Group();
    g.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(def.r, 0.006, 8, 160),
      new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.4 }),
    );
    g.add(torus);
    // node beads on the ring
    const beadN = 5;
    for (let i = 0; i < beadN; i++) {
      const a = (i / beadN) * Math.PI * 2 + Math.random();
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: def.color }));
      bead.position.set(Math.cos(a) * def.r, Math.sin(a) * def.r, 0);
      g.add(bead);
    }
    g.userData.speed = def.speed;
    root.add(g);
    rings.push(g);
  });

  // Starfield
  const STAR_N = 900;
  const starPos = new Float32Array(STAR_N * 3);
  for (let i = 0; i < STAR_N; i++) {
    const r = 14 + Math.random() * 20;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(p) * Math.cos(t);
    starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    starPos[i * 3 + 2] = r * Math.cos(p);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9fb3d9, size: 0.06, transparent: true, opacity: 0.6, depthWrite: false }));
  scene.add(stars);

  // Lights (for the core's standard material)
  scene.add(new THREE.AmbientLight(0x223055, 0.8));
  const p1 = new THREE.PointLight(0x5ad7ff, 40, 30); p1.position.set(4, 3, 5); scene.add(p1);
  const p2 = new THREE.PointLight(0x7c9cff, 24, 30); p2.position.set(-5, -2, 3); scene.add(p2);

  // Post
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.85, 0.6, 0.2);
  composer.addPass(bloom);

  let tmx = 0, tmy = 0, mx = 0, my = 0;
  const onPointer = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  // R3 "Test Settlement": expanderende wireframe-schokgolven + core-flash.
  const pulses: { mesh: THREE.LineSegments; born: number }[] = [];
  const pulseGeo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 1));
  let coreFlash = 0;
  const pulse = () => {
    const mat = new THREE.LineBasicMaterial({ color: 0x35f1ff, transparent: true, opacity: 0.55 });
    const mesh = new THREE.LineSegments(pulseGeo, mat);
    mesh.scale.setScalar(0.62);
    root.add(mesh);
    pulses.push({ mesh, born: performance.now() });
    coreFlash = 1;
  };

  const onResize = () => {
    w = window.innerWidth; h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); composer.setSize(w, h);
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

    root.rotation.y = t * 0.12 + scrollP * Math.PI + mx * 0.5;
    root.rotation.x = -my * 0.4 + Math.sin(t * 0.2) * 0.05;
    shell.rotation.y = t * 0.05;
    nodes.rotation.y = -t * 0.04;
    core.rotation.x = t * 0.3; core.rotation.y = t * 0.4;
    rings.forEach((g) => { g.rotation.z += g.userData.speed * dt; });
    stars.rotation.y = t * 0.01;

    camera.position.z = 9 - scrollP * 2.2;
    camera.lookAt(0, 0, 0);

    // R3: schokgolven uitbreiden + core-flash laten uitdoven
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pu = pulses[i];
      const age = (now - pu.born) / 900; // 0..1 over 0.9s
      if (age >= 1) {
        root.remove(pu.mesh);
        (pu.mesh.material as THREE.Material).dispose();
        pulses.splice(i, 1);
        continue;
      }
      const eased = 1 - Math.pow(1 - age, 3);
      pu.mesh.scale.setScalar(0.62 + eased * 2.1);
      (pu.mesh.material as THREE.LineBasicMaterial).opacity = 0.55 * (1 - age);
    }
    coreFlash = Math.max(0, coreFlash - dt * 1.6);
    (core.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6 + coreFlash * 1.8;
    bloom.strength = 0.85 + coreFlash * 0.35;

    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    scene.traverse((o) => {
      const any = o as any;
      if (any.geometry) any.geometry.dispose?.();
      if (any.material) { const m = any.material; Array.isArray(m) ? m.forEach((x: any) => x.dispose?.()) : m.dispose?.(); }
    });
    pulseGeo.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, pulse };
}