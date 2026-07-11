/**
 * crystal-slider-scene.ts , 3D draggable slider for website12 (AETHER CRYSTALWORKS).
 *
 * A horizontal carousel of three faceted optical-glass crystals (real refraction via
 * MeshPhysicalMaterial transmission + dispersion for the "spectral edge"), lit by a cold
 * image-based environment and refracting a subtle backdrop. Drag or use prev/next to move
 * between pieces; the active index drives the page content via onChange. UnrealBloom on the
 * sparkle. Island-scoped; disposes cleanly. (Implements the user's "3D slider" technique.)
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SliderHandle {
  dispose: () => void;
  next: () => void;
  prev: () => void;
  go: (i: number) => void;
  onChange: (cb: (i: number) => void) => void;
}

export function initCrystalSlider(canvas: HTMLCanvasElement, count = 3): SliderHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.5, window.devicePixelRatio || 1);
  const SPACING = 3.4;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x05060a, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.06);
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Cold environment for reflections + refraction tint
  const env = buildIceEnv(renderer);
  scene.environment = env;

  // Backdrop the crystals refract/distort
  const backTex = buildBackdrop();
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 24),
    new THREE.MeshBasicMaterial({ map: backTex }),
  );
  backdrop.position.z = -7;
  scene.add(backdrop);

  // Lights for specular sparkle
  scene.add(new THREE.AmbientLight(0x223344, 0.5));
  const key = new THREE.DirectionalLight(0xdff3ff, 2.2); key.position.set(5, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7dd3fc, 1.2); rim.position.set(-6, -3, 4); scene.add(rim);

  const geoms: THREE.BufferGeometry[] = [
    new THREE.IcosahedronGeometry(1.25, 0),                 // gem stone
    new THREE.OctahedronGeometry(1.45, 0),                  // sharp prism
    new THREE.DodecahedronGeometry(1.3, 0),                 // faceted stone
  ];
  const tints = [0xdff1ff, 0xeaf6ff, 0xd6ecff];

  const carousel = new THREE.Group();
  scene.add(carousel);
  const crystals: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tints[i % tints.length]),
      metalness: 0,
      roughness: 0.03,
      transmission: 1,
      ior: 1.7,
      thickness: 2.2,
      envMapIntensity: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      flatShading: true,
      // @ts-ignore , dispersion exists in three 0.184 (chromatic "spectral edge")
      dispersion: 2.2,
    });
    const m = new THREE.Mesh(geoms[i % geoms.length], mat);
    m.scale.setScalar(i === 1 ? 0.92 : 1); // octahedron reads larger
    carousel.add(m);
    crystals.push(m);
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.55, 0.62);
  composer.addPass(bloom);

  // ---- Slider state ----
  let current = 0;     // smooth position
  let target = 0;      // snapped target
  let active = -1;
  let cb: ((i: number) => void) | null = null;
  const onChange = (fn: (i: number) => void) => { cb = fn; };
  const clampI = (i: number) => Math.max(0, Math.min(count - 1, i));
  const go = (i: number) => { target = clampI(i); };
  const next = () => go(Math.round(target) + 1);
  const prev = () => go(Math.round(target) - 1);

  // Drag
  let dragging = false, startX = 0, startTarget = 0, moved = false;
  const onDown = (e: PointerEvent) => { dragging = true; moved = false; startX = e.clientX; startTarget = target; canvas.setPointerCapture?.(e.pointerId); };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    target = startTarget - dx / (window.innerWidth * 0.32);
  };
  const onUp = () => { if (!dragging) return; dragging = false; target = clampI(Math.round(target)); };
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);

  // pointer parallax tilt (separate, subtle)
  let tmx = 0, tmy = 0, mx = 0, my = 0;
  const onParallax = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onParallax, { passive: true });

  const onResize = () => { w = window.innerWidth; h = window.innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); composer.setSize(w, h); };
  window.addEventListener('resize', onResize, { passive: true });

  let inView = true;
  const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(canvas);

  // performance.now i.p.v. THREE.Clock (deprecated sinds r183) , pack-conventie.
  const t0 = performance.now();
  let prevFrame = t0;
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) { prevFrame = performance.now(); return; }
    const now = performance.now();
    const t = (now - t0) / 1000;
    current += (target - current) * 0.12;
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;

    crystals.forEach((m, i) => {
      const d = i - current;                  // distance from center slot
      m.position.x = d * SPACING;
      m.position.z = -Math.abs(d) * 1.6;       // sides recede (fog dims them)
      m.position.y = Math.sin(t * 0.6 + i) * 0.08;
      const s = (i === 1 ? 0.92 : 1) * (1 - Math.min(0.45, Math.abs(d) * 0.28));
      m.scale.setScalar(s);
      m.rotation.y = t * 0.25 + i + mx * 0.3;
      m.rotation.x = Math.sin(t * 0.3 + i) * 0.12 - my * 0.2;
    });

    const a = clampI(Math.round(current));
    if (a !== active) { active = a; cb && cb(active); }

    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointermove', onParallax);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    geoms.forEach((g) => g.dispose());
    crystals.forEach((m) => (m.material as THREE.Material).dispose());
    backdrop.geometry.dispose(); (backdrop.material as THREE.MeshBasicMaterial).map?.dispose(); (backdrop.material as THREE.Material).dispose();
    env.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, next, prev, go, onChange };
}

function buildIceEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1a2740');
  grad.addColorStop(0.5, '#070a12');
  grad.addColorStop(1, '#04060a');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  const blob = (x: number, y: number, r: number, col: string) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 512, 256); };
  blob(120, 60, 120, 'rgba(223,243,255,0.95)');
  blob(380, 50, 90, 'rgba(125,211,252,0.6)');
  blob(300, 210, 130, 'rgba(60,120,180,0.4)');
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose(); pmrem.dispose();
  return rt.texture;
}

function buildBackdrop(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(512, 320, 40, 512, 320, 620);
  grad.addColorStop(0, '#0e1828');
  grad.addColorStop(0.5, '#070a12');
  grad.addColorStop(1, '#04060a');
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 640);
  // faint cold streaks for refraction to distort
  g.globalAlpha = 0.10; g.strokeStyle = '#7dd3fc'; g.lineWidth = 2;
  for (let i = 0; i < 22; i++) { g.beginPath(); const x = (i / 22) * 1024; g.moveTo(x, 0); g.lineTo(x + 60, 640); g.stroke(); }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}