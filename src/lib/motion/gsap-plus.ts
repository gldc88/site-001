/**
 * gsap-plus.ts , opt-in registration of the full (now-free, GSAP 3.13+) plugin set.
 *
 * The baseline motion runtime (`gsap.ts`) only ships gsap + ScrollTrigger so every
 * page stays lean. Pages that need advanced choreography import from here instead,
 * which reuses the same gsap instance and registers the extra plugins once.
 *
 *   import { gsap, ScrollTrigger, SplitText } from '../lib/motion/gsap-plus';
 *
 * Plugins: SplitText (per-char/word/line text), Flip (state-based layout morphs),
 * Observer (unified wheel/touch/pointer), DrawSVG (stroke draw-on), MorphSVG (path
 * morphing), MotionPath (move along a path), ScrollTo.
 */
import { gsap, ScrollTrigger } from './gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Observer } from 'gsap/Observer';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

let registered = false;

export function registerGsapPlus() {
  if (typeof window === 'undefined' || registered) return;
  gsap.registerPlugin(
    ScrollToPlugin,
    Observer,
    Flip,
    SplitText,
    DrawSVGPlugin,
    MotionPathPlugin,
    MorphSVGPlugin,
  );
  registered = true;
}

registerGsapPlus();

export {
  gsap,
  ScrollTrigger,
  ScrollToPlugin,
  Observer,
  Flip,
  SplitText,
  DrawSVGPlugin,
  MotionPathPlugin,
  MorphSVGPlugin,
};