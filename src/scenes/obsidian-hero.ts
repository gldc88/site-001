/**
 * obsidian-hero.ts , WebGL hero scene for website1 (THE OBSIDIAN).
 *
 * A faceted obsidian crystal (near-black, glossy) lit by a gold image-based
 * environment, with drifting gold motes, mouse parallax, scroll rotation and
 * bloom. Island-scoped: only this page bundles three.js. Caller is responsible
 * for the WebGL/reduced-motion guard, but we re-check defensively and return a
 * disposer so the page can clean up.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface ObsidianHandle {
  dispose: () => void;
  ready: Promise<void>;
}

export function initObsidianHero(canvas: HTMLCanvasElement): ObsidianHandle {
  const host = canvas.parentElement ?? document.body;
  const sizeOf = () => ({ w: host.clientWidth || window.innerWidth, h: host.clientHeight || window.innerHeight });
  let { w, h } = sizeOf();
  const DPR = Math.min(1.8, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Frame the crystal so it fits both axes (avoids a giant close-up on portrait).
  const FIT_R = 1.8;
  function fitCamera() {
    camera.aspect = w / h;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const distH = FIT_R / Math.tan(vfov / 2);
    const distW = FIT_R / (Math.tan(vfov / 2) * camera.aspect);
    camera.position.z = Math.max(distH, distW) * 1.15;
    camera.updateProjectionMatrix();
  }
  fitCamera();

  /* ---- Gold image-based environment (drives the reflections) ---- */
  const env = buildGoldEnvironment(renderer);
  scene.environment = env;

  /* ---- Obsidian crystal ---- */
  const geo = new THREE.IcosahedronGeometry(1.5, 0);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x080808),
    metalness: 0.92,
    roughness: 0.22,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.28,
    flatShading: true,
  });
  const crystal = new THREE.Mesh(geo, mat);
  crystal.scale.set(1, 1.22, 1);
  scene.add(crystal);

  // Thin gold wire echo for extra facet definition
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.12 }),
  );
  wire.scale.copy(crystal.scale);
  crystal.add(wire);

  /* ---- Lights (env does most of the work; these add moving specular) ---- */
  const key = new THREE.PointLight(0xffe6a8, 60, 40);
  key.position.set(4, 5, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xc9912f, 30, 40);
  rim.position.set(-6, -2, 2);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x221a0c, 0.6));

  /* ---- Gold motes ---- */
  const COUNT = w < 760 ? 220 : 460;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const spd = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 11;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    spd[i] = Math.random() * 0.5 + 0.2;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xd4af37,
    size: 0.035,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.Points(pGeo, pMat);
  scene.add(motes);

  /* ---- Post: bloom ---- */
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.72, 0.55, 0.82);
  composer.addPass(bloom);

  /* ---- Interaction state ---- */
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  const onPointer = (e: PointerEvent) => {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollProg = 0;
  const onScroll = () => {
    const hh = host.clientHeight || window.innerHeight;
    scrollProg = Math.min(1.4, window.scrollY / hh);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Resize ---- */
  const onResize = () => {
    const s = sizeOf();
    w = s.w; h = s.h;
    fitCamera();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
  };
  window.addEventListener('resize', onResize, { passive: true });

  /* ---- Visibility / in-view pause ---- */
  let inView = true;
  const io = new IntersectionObserver((ents) => { inView = ents[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(host);

  /* ---- Loop ---- */
  let raf = 0;
  let running = true;
  // performance.now i.p.v. THREE.Clock (deprecated sinds r183) , pack-conventie.
  const t0 = performance.now();
  let resolveReady: () => void;
  const ready = new Promise<void>((r) => (resolveReady = r));
  let firstFrame = true;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!running || (!inView && !firstFrame) || document.hidden) return;
    const t = (performance.now() - t0) / 1000;

    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;

    crystal.rotation.y = t * 0.18 + scrollProg * Math.PI * 0.9 + mx * 0.4;
    crystal.rotation.x = Math.sin(t * 0.25) * 0.12 - my * 0.3 + scrollProg * 0.5;
    crystal.position.y = Math.sin(t * 0.6) * 0.08 - scrollProg * 0.6;
    crystal.scale.setScalar(1 - scrollProg * 0.12);
    crystal.scale.y *= 1.22;

    camera.position.x += (mx * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (-my * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    const p = motes.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = p.getY(i) + spd[i] * 0.01;
      if (y > 5.5) y = -5.5;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    motes.rotation.y = t * 0.02;

    key.position.x = Math.sin(t * 0.5) * 5;
    key.position.z = Math.cos(t * 0.5) * 5;

    // R3 afdaling: het licht sterft mee met de descent + de pull-cord dim-stand.
    const lightsLow = document.documentElement.classList.contains('lights-low');
    renderer.toneMappingExposure = Math.max(0.4, (1.08 - scrollProg * 0.4) * (lightsLow ? 0.78 : 1));

    composer.render();
    if (firstFrame) { firstFrame = false; resolveReady(); }
  };
  tick();

  /* ---- Dispose ---- */
  const dispose = () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    geo.dispose();
    mat.dispose();
    (wire.geometry as THREE.BufferGeometry).dispose();
    (wire.material as THREE.Material).dispose();
    pGeo.dispose();
    pMat.dispose();
    env.dispose();
    bloom.dispose();
    composer.dispose();
    renderer.dispose();
  };

  return { dispose, ready };
}

/** Procedural gold environment: dark field with warm radial glows → gold reflections. */
function buildGoldEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#241a08');
  base.addColorStop(0.4, '#0a0805');
  base.addColorStop(1, '#050505');
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 256);

  const blob = (x: number, y: number, r: number, col: string) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 256);
  };
  blob(130, 70, 130, 'rgba(231,205,134,0.95)');
  blob(380, 46, 100, 'rgba(212,175,55,0.7)');
  blob(300, 200, 150, 'rgba(120,90,30,0.5)');
  blob(60, 180, 90, 'rgba(150,110,40,0.4)');

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return rt.texture;
}