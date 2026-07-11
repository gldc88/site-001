/**
 * forest-scene.ts , persistent full-viewport WebGL backdrop for website7 (GREENLINE TREE SURGERY).
 *
 * Concept: a calm forest at golden hour. A deep-green canopy shader with warm god-rays
 * filtering from the top and dappled shadow, plus leaves drifting and swaying down. Soft
 * bloom on the light. Scroll deepens the light. Island-scoped, guarded by the caller.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  /** R3 "Test the wind": 0..1 windkracht , bladerdak buigt, vlekken jagen, licht koelt. */
  setWind: (v: number) => void;
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
  uniform float uTime, uScroll, uAspect, uWind;
  uniform vec3 uDeep, uCanopy, uSun;

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
    float t = uTime * 0.04;
    // R3 "Test the wind": storm schuift/verscheurt het bladerdak zijwaarts.
    float gust = uWind * (0.6 + 0.4 * sin(uTime * 7.0 + uv.y * 9.0));
    uv.x += gust * 0.06 * smoothstep(0.15, 1.0, uv.y);

    // vertical canopy gradient (deep green floor -> lit canopy top)
    vec3 col = mix(uDeep, uCanopy, smoothstep(0.0, 1.0, uv.y));

    // warm sun pool, top-left, settling lower as you scroll
    vec2 sun = vec2(0.32, 0.95 - uScroll * 0.18);
    float sd = distance(vec2((uv.x - sun.x) * uAspect, uv.y - sun.y), vec2(0.0));
    col += uSun * exp(-sd * 2.0) * 0.55;

    // god-rays from the top-left, broken up by canopy
    float beam = 0.5 + 0.5 * sin((uv.x * 4.0 - uv.y * 1.2) * 3.0 + t * 2.0);
    beam = pow(beam, 3.0);
    beam *= fbm(vec2(uv.x * 3.0 + t, uv.y * 1.6 - t * 0.6));
    beam *= smoothstep(0.05, 0.95, uv.y);
    col += uSun * beam * 0.2;

    // dappled canopy shadow , de storm jaagt de vlekken op
    float dapSpeed = t * 0.4 + uWind * uTime * 1.1;
    float dap = fbm(vec2(uv.x * 5.0 - dapSpeed, uv.y * 5.0 + t * 0.2));
    col *= 0.82 + 0.32 * dap;
    // storm dimt de zon en koelt het beeld licht af
    col = mix(col, col * vec3(0.82, 0.88, 0.9), uWind * 0.5);

    // vignette + grain
    vec2 c = uv - 0.5;
    col *= smoothstep(1.2, 0.4, length(vec2(c.x * uAspect, c.y)) * 1.05);
    col += (hash(uv * 800.0 + t) - 0.5) * 0.022;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initForestScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
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
      uWind: { value: 0 },
      uDeep: { value: new THREE.Color(0x06100a) },
      uCanopy: { value: new THREE.Color(0x1a2c16) },
      uSun: { value: new THREE.Color(0xcdb46a) },
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

  // Drifting leaves
  const N = w < 760 ? 120 : 240;
  const leaves: { x: number; y: number; z: number; spd: number; sway: number; swaySpd: number }[] = [];
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const palette = [new THREE.Color(0x6fb585), new THREE.Color(0xd4a373), new THREE.Color(0xff7b42), new THREE.Color(0x9ec27a)];
  for (let i = 0; i < N; i++) {
    leaves.push({ x: (Math.random() - 0.5) * 30, y: Math.random() * 24 - 12, z: (Math.random() - 0.5) * 12 - 1, spd: Math.random() * 1.2 + 0.5, sway: Math.random() * 6.28, swaySpd: Math.random() * 0.8 + 0.4 });
    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  leafGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const leafMat = new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true });
  const leafPts = new THREE.Points(leafGeo, leafMat);
  scene.add(leafPts);

  function writeLeaves(t: number) {
    const pos = leafGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const l = leaves[i];
      pos.setXYZ(i, l.x + Math.sin(t * l.swaySpd + l.sway) * 0.8, l.y, l.z);
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

  // R3 "Test the wind"
  let windTarget = 0;
  const setWind = (v: number) => { windTarget = Math.max(0, Math.min(1, v)); };

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
    if (!inView || document.hidden) { prev = performance.now(); return; }
    const now = performance.now();
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (now - t0) / 1000;
    scrollP += (targetScroll - scrollP) * 0.06;
    mx += (tmx - mx) * 0.04;

    bgMat.uniforms.uTime.value = t;
    bgMat.uniforms.uScroll.value = scrollP;
    bgMat.uniforms.uWind.value += (windTarget - bgMat.uniforms.uWind.value) * 0.06;

    for (let i = 0; i < N; i++) {
      const l = leaves[i];
      l.y -= l.spd * dt;
      if (l.y < -13) { l.y = 13 + Math.random() * 4; l.x = (Math.random() - 0.5) * 30; }
    }
    writeLeaves(t);
    leafPts.rotation.z = mx * 0.05;

    camera.position.x += (mx * 0.8 - camera.position.x) * 0.04;
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
    leafGeo.dispose(); leafMat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, setWind };
}