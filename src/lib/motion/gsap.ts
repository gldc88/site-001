import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

export function registerGsapPlugins() {
  if (typeof window === 'undefined' || registered) return;

  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

registerGsapPlugins();

export { gsap, ScrollTrigger };
