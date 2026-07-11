/**
 * unform-scene.ts , persistent WebGL backdrop for website10 (UNFORM / 010, anti-template OS).
 *
 * Concept: a desktop that admits it's just fragments. The background is a field of floating
 * wireframe "windows" (rectangular frames) drifting in blue/violet space with depth fog ,
 * the raw structure of an interface, exposed. No scroll on this page; the scene is time- and
 * pointer-reactive only. Subtle UnrealBloom on the edges. Island-scoped; disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
}

export function initUnformScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.7, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x050508, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.055);
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
  camera.position.set(0, 0, 14);

  const root = new THREE.Group();
  scene.add(root);

  // ---- Floating wireframe "windows" ----
  const BLUE = new THREE.Color(0x3b82f6);
  const VIOLET = new THREE.Color(0xa855f7);
  const CYAN = new THREE.Color(0x22d3ee);
  const palette = [BLUE, VIOLET, CYAN];

  const frames: { mesh: THREE.LineSegments; vx: number; vy: number; rot: number }[] = [];
  const COUNT = w < 760 ? 26 : 46;
  for (let i = 0; i < COUNT; i++) {
    const fw = 1.2 + Math.random() * 2.6;
    const fh = fw * (0.5 + Math.random() * 0.5); // window-ish aspect
    const geo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(fw, fh));
    const col = palette[(Math.random() * palette.length) | 0];
    const mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.14 + Math.random() * 0.4 });
    const seg = new THREE.LineSegments(geo, mat);
    seg.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 18 - 4);
    seg.rotation.z = (Math.random() - 0.5) * 0.3;
    seg.rotation.x = (Math.random() - 0.5) * 0.4;
    seg.rotation.y = (Math.random() - 0.5) * 0.4;
    root.add(seg);
    frames.push({ mesh: seg, vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.08, rot: (Math.random() - 0.5) * 0.04 });
  }

  // A faint title-bar dot on a few frames (three traffic-light dots) for the "window" read
  const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
  frames.slice(0, 14).forEach((f) => {
    const m = f.mesh;
    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3(); box.getSize(size);
    for (let d = 0; d < 3; d++) {
      const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: [0xef4444, 0xeab308, 0x22c55e][d] }));
      dot.position.set(-size.x / 2 + 0.18 + d * 0.16, size.y / 2 - 0.16, 0);
      (m as THREE.Object3D).add(dot);
    }
  });

  // ---- Post ----
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.6, 0.1);
  composer.addPass(bloom);

  let tmx = 0, tmy = 0, mx = 0, my = 0;
  const onPointer = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

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
    mx += (tmx - mx) * 0.03; my += (tmy - my) * 0.03;

    for (const f of frames) {
      const m = f.mesh;
      m.position.x += f.vx * dt;
      m.position.y += f.vy * dt;
      m.rotation.z += f.rot * dt;
      if (m.position.x > 14) m.position.x = -14;
      if (m.position.x < -14) m.position.x = 14;
      if (m.position.y > 9) m.position.y = -9;
      if (m.position.y < -9) m.position.y = 9;
    }
    root.rotation.y = Math.sin(t * 0.05) * 0.08 + mx * 0.25;
    root.rotation.x = Math.cos(t * 0.04) * 0.05 - my * 0.18;
    camera.position.x += (mx * 1.2 - camera.position.x) * 0.03;
    camera.position.y += (-my * 0.8 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    dotGeo.dispose();
    root.traverse((o) => {
      const any = o as any;
      if (any.geometry && any.geometry !== dotGeo) any.geometry.dispose?.();
      if (any.material) { const m = any.material; Array.isArray(m) ? m.forEach((x: any) => x.dispose?.()) : m.dispose?.(); }
    });
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose };
}