/**
 * webgl.ts , small, dependency-free helpers shared by every 3D scene.
 *
 * Keeps the "should we even start a WebGL scene?" decision and the RAF/visibility
 * bookkeeping in one place so individual scenes stay focused on their visuals.
 */

export function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True only when WebGL is available AND the user has not asked for reduced motion. */
export function shouldRender3D(): boolean {
  return supportsWebGL() && !prefersReducedMotion();
}

export interface LoopHandle {
  start: () => void;
  stop: () => void;
  dispose: () => void;
}

/**
 * RAF loop that auto-pauses when the host element is offscreen or the tab is
 * hidden. `onFrame` receives elapsed and delta seconds.
 */
export function createLoop(
  host: Element,
  onFrame: (elapsed: number, delta: number) => void,
): LoopHandle {
  let raf = 0;
  let running = false;
  let inView = true;
  let last = 0;
  let elapsed = 0;

  const io = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0 });
  io.observe(host);

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!inView || document.hidden) {
      last = now;
      return;
    }
    const delta = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    elapsed += delta;
    onFrame(elapsed, delta);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  const dispose = () => {
    stop();
    io.disconnect();
  };

  return { start, stop, dispose };
}