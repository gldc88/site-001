import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { prefersReducedMotion } from './reduced-motion';

declare global {
  interface Window {
    __astroFactoryLenis?: Lenis;
    __astroFactoryLenisTicker?: (time: number) => void;
  }
}

export function initSmoothScroll() {
  if (typeof window === 'undefined') return null;
  if (prefersReducedMotion()) {
    document.documentElement.dataset.motionScroll = 'native-reduced';
    return null;
  }

  if (window.__astroFactoryLenis) {
    document.documentElement.dataset.motionScroll = 'lenis';
    return window.__astroFactoryLenis;
  }

  const lenis = new Lenis({
    lerp: 0.1,
    autoRaf: false,
    anchors: true,
    syncTouch: false,
  });

  window.__astroFactoryLenis = lenis;
  document.documentElement.dataset.motionScroll = 'lenis';

  lenis.on('scroll', ScrollTrigger.update);

  const ticker = (time: number) => {
    lenis.raf(time * 1000);
  };

  window.__astroFactoryLenisTicker = ticker;
  gsap.ticker.add(ticker);
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis() {
  if (typeof window === 'undefined') return null;
  return window.__astroFactoryLenis ?? null;
}

export function destroySmoothScroll() {
  if (typeof window === 'undefined') return;

  if (window.__astroFactoryLenisTicker) {
    gsap.ticker.remove(window.__astroFactoryLenisTicker);
    window.__astroFactoryLenisTicker = undefined;
  }

  window.__astroFactoryLenis?.destroy();
  window.__astroFactoryLenis = undefined;
  document.documentElement.dataset.motionScroll = 'native';
}
