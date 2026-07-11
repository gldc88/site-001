/**
 * atlas-scene.ts , subtle persistent WebGL depth for website11 (ATLAS INTERFACE).
 *
 * The foreground is a rich interactive SVG node-map, so this background stays quiet: a deep
 * domain-warped nebula (cyan/violet/magenta) with drifting motes and gentle bloom, mouse-
 * parallax only (the page pans, it doesn't scroll). Island-scoped; disposes cleanly.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle { dispose: () => void; }

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uAspect;
  uniform vec3 uDeep, uA, uB, uC;
  float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.04; a*=0.5; } return v; }
  void main(){
    vec2 uv = vUv; vec2 p = vec2(uv.x*uAspect, uv.y); float t = uTime*0.025;
    vec2 q = vec2(fbm(p*1.8 + vec2(0.0,t)), fbm(p*1.8 + vec2(4.2,-t)));
    float f = fbm(p*1.8 + 1.6*q);
    vec3 col = uDeep;
    col = mix(col, uA, smoothstep(0.45,1.0,f)*0.5);
    col = mix(col, uB, smoothstep(0.6,1.05,length(q))*0.4);
    col += uC * smoothstep(0.7,0.0,abs(uv.y-0.35)) * f * 0.05;
    vec2 c = uv-0.5; col *= smoothstep(1.25,0.35, length(vec2(c.x*uAspect,c.y))*1.1);
    col += (hash(uv*900.0+t)-0.5)*0.02;
    gl_FragColor = vec4(max(col,0.0),1.0);
  }
`;

export function initAtlasScene(canvas: HTMLCanvasElement): SceneHandle {
  let w = window.innerWidth, h = window.innerHeight;
  const DPR = Math.min(1.7, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 0, 12);

  const bgMat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, depthWrite: false, depthTest: false,
    uniforms: {
      uTime: { value: 0 }, uAspect: { value: w / h },
      uDeep: { value: new THREE.Color(0x07080d) },
      uA: { value: new THREE.Color(0x123040) },
      uB: { value: new THREE.Color(0x271640) },
      uC: { value: new THREE.Color(0x3a1030) },
    },
  });
  const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  const bgDepth = -40;
  function fitBg() { const d = camera.position.z - bgDepth; const vH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * d; bgPlane.scale.set((vH * (w / h)) / 2 + 1, vH / 2 + 1, 1); }
  bgPlane.position.z = bgDepth; fitBg(); scene.add(bgPlane);

  // drifting motes (cyan/violet/magenta)
  const N = w < 760 ? 140 : 280;
  const motes: { x: number; y: number; z: number; vx: number; vy: number }[] = [];
  const pos = new Float32Array(N * 3);
  const colArr = new Float32Array(N * 3);
  const pal = [new THREE.Color(0x6ef3ff), new THREE.Color(0xb57bff), new THREE.Color(0xff5bd6)];
  for (let i = 0; i < N; i++) {
    motes.push({ x: (Math.random() - 0.5) * 26, y: (Math.random() - 0.5) * 16, z: (Math.random() - 0.5) * 12 - 2, vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.08 });
    const c = pal[(Math.random() * pal.length) | 0];
    colArr[i * 3] = c.r; colArr[i * 3 + 1] = c.g; colArr[i * 3 + 2] = c.b;
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  mGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  const mMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const motePts = new THREE.Points(mGeo, mMat);
  scene.add(motePts);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR); composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.6, 0.15);
  composer.addPass(bloom);

  let tmx = 0, tmy = 0, mx = 0, my = 0;
  const onPointer = (e: PointerEvent) => { tmx = (e.clientX / window.innerWidth - 0.5) * 2; tmy = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const onResize = () => { w = window.innerWidth; h = window.innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); composer.setSize(w, h); bgMat.uniforms.uAspect.value = w / h; fitBg(); };
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
    bgMat.uniforms.uTime.value = t;
    const p = mGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const m = motes[i]; m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x > 13) m.x = -13; if (m.x < -13) m.x = 13; if (m.y > 8) m.y = -8; if (m.y < -8) m.y = 8;
      p.setXYZ(i, m.x, m.y, m.z);
    }
    p.needsUpdate = true;
    motePts.rotation.z = mx * 0.02;
    camera.position.x += (mx * 0.7 - camera.position.x) * 0.03;
    camera.position.y += (-my * 0.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    io.disconnect();
    bgPlane.geometry.dispose(); bgMat.dispose(); mGeo.dispose(); mMat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };
  return { dispose };
}