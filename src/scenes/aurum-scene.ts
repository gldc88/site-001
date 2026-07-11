/**
 * aurum-scene.ts , persistent full-viewport WebGL backdrop for website18 (AURUM THERMAL HOUSE).
 *
 * Concept: light refracting through moving thermal water. An analytic fragment shader renders
 * rippling caustic filaments (the classic looping caustic field) tinted from cool teal to warm
 * gold, with rising steam haze and a soft warm key light. Choosing a room on the canal-house
 * section sets the heat (setHeat) , caustics speed up and warm, steam thickens; scroll drifts the
 * field. UnrealBloom lifts the bright filaments. Same pack contract + one extra setter.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface SceneHandle {
  dispose: () => void;
  setScroll: (p: number) => void;
  /** 0 = cool plunge (teal, slow), 1 = sauna (gold, fast, steamy). */
  setHeat: (v: number) => void;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uScroll, uAspect, uHeat, uReveal;
  uniform vec2 uPointer;
  uniform vec3 uCool, uWarm, uDeep;

  #define TAU 6.28318530718

  float hash(vec2 p){ p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }

  // Classic looping caustic field.
  float caustic(vec2 uv, float t){
    vec2 p = mod(uv * TAU, TAU) - 250.0;
    vec2 i = p;
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < 5; n++){
      float tn = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tn - i.x) + sin(tn + i.y), sin(tn - i.y) + cos(tn + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tn) / inten), p.y / (cos(i.y + tn) / inten)));
    }
    c /= 5.0;
    c = 1.17 - pow(c, 1.4);
    return clamp(pow(abs(c), 8.0), 0.0, 2.0);
  }

  void main(){
    vec2 uv = vUv;
    float speed = 0.18 + uHeat * 0.5;
    vec2 cuv = vec2((uv.x + uPointer.x * 0.03) * uAspect, uv.y - uScroll * 0.4) * 1.6;

    float c = caustic(cuv, uTime * speed + 12.0);

    // Cool→warm tint with heat; deepen toward the top (water surface above, floor below).
    vec3 waterCol = mix(uCool, uWarm, smoothstep(0.12, 0.92, uHeat));
    float floorFade = smoothstep(1.05, 0.1, uv.y);
    vec3 col = uDeep * (0.6 + 0.4 * floorFade);
    col += waterCol * c * (0.82 + uHeat * 0.5);

    // Soft key light from upper area (the gilded ceiling) , only really glows when warm.
    float gd = distance(vec2((uv.x - (0.5 + uPointer.x * 0.05)) * uAspect, uv.y - 0.86), vec2(0.0));
    col += mix(uCool, uWarm, uHeat) * exp(-gd * 1.8) * (0.04 + uHeat * 0.22);

    // Rising steam, thicker when hot.
    float steam = fbm(vec2(uv.x * 2.2 + uPointer.x * 2.0, uv.y * 2.6 - uTime * 0.06));
    col = mix(col, mix(col, vec3(0.9, 0.86, 0.82), 0.5), pow(steam, 2.4) * (0.10 + uHeat * 0.22) * smoothstep(0.0, 1.0, uv.y));

    // Vignette + reveal + grain.
    vec2 v = uv - 0.5;
    col *= smoothstep(1.22, 0.3, length(vec2(v.x * uAspect, v.y)) * 1.03);
    col *= smoothstep(0.0, 1.0, uReveal);
    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.016;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export function initAurumScene(canvas: HTMLCanvasElement): SceneHandle {
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
  renderer.toneMappingExposure = 1.05;
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
      uHeat: { value: 0.5 },
      uReveal: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCool: { value: new THREE.Color(0x2f9c8e) },
      uWarm: { value: new THREE.Color(0xe6b070) },
      uDeep: { value: new THREE.Color(0x0a0a0d) },
    },
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  scene.add(plane);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.75, 0.5);
  composer.addPass(bloom);

  let curHeat = 0.5, tgtHeat = 0.5;
  let curPx = 0, curPy = 0, tgtPx = 0, tgtPy = 0;
  let scrollP = 0, targetScroll = 0;

  const setScroll = (p: number) => { targetScroll = Math.max(0, Math.min(1, p)); };
  const setHeat = (v: number) => { tgtHeat = Math.max(0, Math.min(1, v)); };

  const onPointer = (e: PointerEvent) => {
    tgtPx = (e.clientX / window.innerWidth - 0.5) * 2;
    tgtPy = (1 - e.clientY / window.innerHeight - 0.5) * 2;
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

    curHeat += (tgtHeat - curHeat) * 0.045;
    curPx += (tgtPx - curPx) * 0.04;
    curPy += (tgtPy - curPy) * 0.04;
    scrollP += (targetScroll - scrollP) * 0.06;

    const u = mat.uniforms;
    u.uTime.value = elapsed;
    u.uScroll.value = scrollP;
    u.uHeat.value = curHeat;
    (u.uPointer.value as THREE.Vector2).set(curPx, curPy);
    if (u.uReveal.value < 1) u.uReveal.value = Math.min(1, u.uReveal.value + 0.012);

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

  return { dispose, setScroll, setHeat };
}