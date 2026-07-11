/**
 * library-scene.ts , persistent full-viewport WebGL backdrop for website8 (VELLUM & OAK).
 *
 * Concept: an independent bookstore at golden hour. A warm fragment shader paints a deep
 * sepia room with a soft diagonal window-light shaft and the faintest vertical shelf rhythm,
 * and gold dust motes drift up through the beam. Gentle UnrealBloom on the light. Scroll
 * lets the light settle warmer. Island-scoped, guarded by the caller, disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  /** R3 "The Stack": 0..1 , de leeslamp gloeit warmer naarmate je stapel groeit. */
  setStack: (v: number) => void;
  dispose: () => void;
  setScroll: (p: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect;
  uniform vec3 uFloor, uCeil, uLamp;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.04; a*=0.5; } return v; }

  void main(){
    vec2 uv = vUv;
    float t = uTime * 0.03;

    // warm room gradient
    vec3 col = mix(uFloor, uCeil, smoothstep(-0.1, 1.05, uv.y));

    // faint vertical shelf rhythm (books on shelves), broken up so it isn't a hard grid
    float bands = 0.5 + 0.5 * sin(uv.x * 46.0 + fbm(vec2(uv.x * 8.0, uv.y * 2.0)) * 3.0);
    bands = smoothstep(0.35, 0.85, bands);
    col *= 0.93 + 0.09 * bands * smoothstep(0.0, 0.5, uv.y);

    // soft diagonal window-light shaft from the upper-right
    float ang = 0.62;
    float s = (uv.x - 0.74) * cos(ang) - (uv.y - 1.0) * sin(ang);
    float shaft = exp(-(s * s) / 0.05);
    shaft *= smoothstep(-0.15, 0.65, uv.y);
    shaft *= 0.55 + 0.45 * fbm(vec2(uv.x * 3.0 + t, uv.y * 3.0 - t * 1.5));
    col += uLamp * shaft * (0.45 + uScroll * 0.15);

    // warm glow source near the window
    float gd = distance(vec2((uv.x - 0.8) * uAspect, uv.y - 0.95), vec2(0.0));
    col += uLamp * exp(-gd * 2.2) * 0.4;

    // gentle dapple + vignette + grain
    col *= 0.9 + 0.18 * fbm(vec2(uv.x * 4.0 - t * 0.3, uv.y * 4.0));
    vec2 c = uv - 0.5;
    col *= smoothstep(1.2, 0.42, length(vec2(c.x * uAspect, c.y)) * 1.06);
    col += (hash(uv * 780.0 + t) - 0.5) * 0.02;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initLibraryScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.75, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
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
      uFloor: { value: new THREE.Color(0x140f0c) },
      uCeil: { value: new THREE.Color(0x241b14) },
      uLamp: { value: new THREE.Color(0xdcb45c) },
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

  // Gold dust motes rising through the beam
  const N = w < 760 ? 130 : 260;
  const motes: { x: number; y: number; z: number; spd: number; sway: number; swaySpd: number }[] = [];
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const palette = [new THREE.Color(0xd4af37), new THREE.Color(0xe7d8a8), new THREE.Color(0xc79a4e)];
  for (let i = 0; i < N; i++) {
    motes.push({ x: (Math.random() - 0.5) * 28, y: Math.random() * 24 - 12, z: (Math.random() - 0.5) * 10 - 1, spd: Math.random() * 0.5 + 0.15, sway: Math.random() * 6.28, swaySpd: Math.random() * 0.5 + 0.2 });
    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  moteGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const moteMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const motePts = new THREE.Points(moteGeo, moteMat);
  scene.add(motePts);

  function writeMotes(t: number) {
    const pos = moteGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const m = motes[i];
      pos.setXYZ(i, m.x + Math.sin(t * m.swaySpd + m.sway) * 0.6, m.y, m.z);
    }
    pos.needsUpdate = true;
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.7, 0.6);
  composer.addPass(bloom);

  let tmx = 0, mx = 0;
  const onPointer = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let scrollP = 0, targetScroll = 0;
  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };

  // R3 "The Stack"
  let stackTarget = 0;
  const setStack = (v: number) => { stackTarget = Math.max(0, Math.min(1, v)); };
  let stackNow = 0;

  const onResize = () => {
    w = window.innerWidth; h = window.innerHeight;
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
    if (!inView || document.hidden) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (performance.now() - t0) / 1000;
    scrollP += (targetScroll - scrollP) * 0.06;
    mx += (tmx - mx) * 0.04;

    bgMat.uniforms.uTime.value = t;
    bgMat.uniforms.uScroll.value = scrollP;
    stackNow += (stackTarget - stackNow) * 0.04;
    (bgMat.uniforms.uLamp.value as THREE.Color).setRGB(0.95 + stackNow * 0.05, 0.78 + stackNow * 0.1, 0.5 + stackNow * 0.14);

    for (let i = 0; i < N; i++) {
      const m = motes[i];
      m.y += m.spd * dt;
      if (m.y > 13) { m.y = -13 - Math.random() * 4; m.x = (Math.random() - 0.5) * 28; }
    }
    writeMotes(t);
    motePts.rotation.z = mx * 0.03;

    camera.position.x += (mx * 0.6 - camera.position.x) * 0.04;
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
    moteGeo.dispose(); moteMat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, setStack };
}