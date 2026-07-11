/**
 * neon-district-scene.ts , persistent full-viewport WebGL backdrop for website14 (NEON DISTRICT).
 *
 * Concept: a rain-slick neon city seen from a low operator's-eye angle. An analytic fragment
 * shader draws a perspective street grid that scrolls forward, with traffic pulses flowing down
 * the lanes, glowing intersection nodes, depth fog, and fine rain. UnrealBloom blooms the neon.
 * The page's control surface drives it: the signal-gain slider sets traffic intensity, and the
 * channel toggles re-tint the traffic accent. Pointer parallaxes the view. Reduced-motion / no
 * WebGL fall back to a static layer. Same pack contract + two extra setters.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** 0..1 , traffic density + brightness (signal-gain slider). */
  setIntensity: (v: number) => void;
  /** Tint the traffic pulses to the active channel colour (hex int). */
  setAccent: (hex: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uIntensity, uReveal;
  uniform vec2 uPointer;
  uniform vec3 uCyan, uMag, uLime, uAccent, uHaze;

  float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }

  void main(){
    vec2 uv = vUv;
    float hor = 0.56 + uPointer.y * 0.015;
    vec3 col;

    if (uv.y < hor) {
      // --- Ground: perspective street grid ---
      float fy = hor - uv.y;
      float depth = 0.26 / (fy + 0.0026);
      float camZ = uScroll * 7.0 + uTime * 0.32;
      float gx = (uv.x - 0.5 + uPointer.x * 0.09) * depth * uAspect * 1.15;
      float gz = depth + camZ;

      float dX = 0.5 - abs(fract(gx) - 0.5);
      float dZ = 0.5 - abs(fract(gz) - 0.5);
      float glowX = smoothstep(0.05, 0.0, dX);
      float glowZ = smoothstep(0.05, 0.0, dZ);
      float grid = max(glowX, glowZ);
      float node = glowX * glowZ;

      // Traffic: sharp bright pulses running down each lane.
      float trafZ = pow(fract(gz - uTime * 0.85), 22.0);
      float trafX = pow(fract(gx * 1.0 - uTime * 0.55 + 0.5), 22.0);
      float cars = trafZ * glowX + trafX * glowZ;

      // Per-block neon colour so the district reads as many signs, not one.
      float blk = hash(floor(vec2(gx, gz)) + 1.0);
      vec3 neon = mix(uCyan, uMag, step(0.34, blk));
      neon = mix(neon, uLime, step(0.67, blk));

      float fog = exp(-depth * 0.105);
      col = vec3(0.015, 0.022, 0.05);
      col += neon * grid * 0.42 * fog;
      col += neon * node * 1.25 * fog;
      col += uAccent * cars * (1.1 + uIntensity * 1.6) * fog;
      // Wet asphalt reflection sheen near the camera.
      col += uAccent * grid * 0.10 * smoothstep(0.0, 0.16, fy);
      col = mix(col, uHaze, smoothstep(hor - 0.14, hor, uv.y));
    } else {
      // --- Sky: haze, horizon glow, distant window glints ---
      float sky = (uv.y - hor) / (1.0 - hor);
      col = mix(uHaze, vec3(0.012, 0.02, 0.045), pow(sky, 0.55));
      col += uAccent * exp(-sky * 4.2) * 0.5;
      vec2 cell = floor(vec2(uv.x * uAspect * 60.0, uv.y * 80.0));
      float wn = hash(cell);
      if (wn > 0.991 && sky < 0.5) {
        vec3 wc = mix(uCyan, uMag, hash(cell + 5.0));
        col += wc * ((wn - 0.991) / 0.009) * (0.4 + 0.6 * sin(uTime * 2.0 + wn * 60.0)) * 0.5;
      }
    }

    // --- Rain over the whole frame ---
    vec2 rp = vec2(uv.x * uAspect, uv.y);
    float colId = floor(rp.x * 150.0);
    float streak = fract(rp.y * 16.0 + uTime * 1.7 + hash(vec2(colId, 1.0)) * 9.0);
    float rain = smoothstep(0.5, 0.49, abs(fract(rp.x * 150.0) - 0.5)) * smoothstep(0.0, 0.15, streak) * smoothstep(0.55, 0.2, streak);
    col += vec3(0.6, 0.72, 0.85) * rain * 0.06;

    // Scanline tint + vignette + reveal + dither.
    col *= 0.92 + 0.08 * sin(uv.y * 1400.0);
    vec2 c = uv - 0.5;
    col *= smoothstep(1.25, 0.32, length(vec2(c.x * uAspect, c.y)) * 1.02);
    float rev = smoothstep(0.0, 1.0, uReveal);
    col *= rev;
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.02;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initNeonDistrictScene(canvas: HTMLCanvasElement): SceneHandle {
  const measure = () => ({
    cw: canvas.clientWidth || window.innerWidth || 1280,
    ch: canvas.clientHeight || window.innerHeight || 720,
  });
  let { cw: w, ch: h } = measure();
  const DPR = Math.min(1.5, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAspect: { value: w / h },
      uIntensity: { value: 0.45 },
      uReveal: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCyan: { value: new THREE.Color(0x2ffcff) },
      uMag: { value: new THREE.Color(0xff2bd6) },
      uLime: { value: new THREE.Color(0xb7ff3c) },
      uAccent: { value: new THREE.Color(0x2ffcff) },
      uHaze: { value: new THREE.Color(0x0a1430) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.8, 0.55);
  composer.addPass(bloom);

  // Lerp targets for smooth control response.
  const curAccent = new THREE.Color(0x2ffcff);
  const tgtAccent = new THREE.Color(0x2ffcff);
  let curIntensity = 0.45, tgtIntensity = 0.45;
  let curPx = 0, curPy = 0, tgtPx = 0, tgtPy = 0;
  let scrollP = 0, targetScroll = 0;

  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };
  const setIntensity = (v: number) => { tgtIntensity = Math.max(0, Math.min(1, v)); };
  const setAccent = (hex: number) => { tgtAccent.set(hex); };

  const onPointer = (e: PointerEvent) => {
    tgtPx = (e.clientX / window.innerWidth - 0.5) * 2;
    tgtPy = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const syncSize = () => {
    const { cw, ch } = measure();
    const dw = Math.floor(cw * DPR), dh = Math.floor(ch * DPR);
    if (renderer.domElement.width === dw && renderer.domElement.height === dh) return;
    w = cw; h = ch;
    renderer.setSize(cw, ch, false);
    composer.setSize(cw, ch);
    mat.uniforms.uAspect.value = cw / Math.max(1, ch);
  };
  window.addEventListener('resize', syncSize, { passive: true });

  let inView = true;
  const io = new IntersectionObserver((e) => { inView = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(canvas);

  syncSize();
  let raf = 0, elapsed = 0, last = performance.now();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) { last = performance.now(); return; }
    syncSize();
    const now = performance.now();
    elapsed += Math.min(0.05, (now - last) / 1000);
    last = now;

    curAccent.lerp(tgtAccent, 0.06);
    curIntensity += (tgtIntensity - curIntensity) * 0.06;
    curPx += (tgtPx - curPx) * 0.05;
    curPy += (tgtPy - curPy) * 0.05;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = scrollP;
    u.uIntensity.value = curIntensity;
    (u.uAccent.value as THREE.Color).copy(curAccent);
    (u.uPointer.value as THREE.Vector2).set(curPx, curPy);
    if (u.uReveal.value < 1) u.uReveal.value = Math.min(1, u.uReveal.value + 0.014);

    composer.render();
  };
  tick();

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', syncSize);
    io.disconnect();
    plane.geometry.dispose(); mat.dispose();
    bloom.dispose(); composer.dispose(); renderer.dispose();
  };

  return { dispose, setScroll, setIntensity, setAccent };
}