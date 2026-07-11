import { gsap, ScrollTrigger } from './gsap';
import { prefersReducedMotion } from './reduced-motion';

const TRIGGER_NAMESPACE = 'astro-factory';

export function initScrollAnimations(root: ParentNode = document) {
  if (typeof window === 'undefined') return () => {};

  killScrollAnimations();

  if (prefersReducedMotion()) {
    applyReducedMotionState(root);
    document.documentElement.dataset.motionReveal = 'reduced';
    return () => {};
  }

  const mm = gsap.matchMedia();

  initReveals(root);
  initStaggers(root);

  mm.add('(min-width: 768px)', () => {
    initParallax(root);
    initPins(root);
  });

  ScrollTrigger.refresh();
  document.documentElement.dataset.motionReveal = 'active';

  return () => {
    mm.revert();
    killScrollAnimations();
  };
}

export function killScrollAnimations() {
  ScrollTrigger.getAll()
    .filter((trigger) => trigger.vars.id?.startsWith(TRIGGER_NAMESPACE))
    .forEach((trigger) => trigger.kill());
}

function initReveals(root: ParentNode) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));

  elements.forEach((element, index) => {
    const mode = element.dataset.reveal || 'up';
    const fromVars = getRevealFromVars(mode);

    gsap.fromTo(
      element,
      fromVars,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          id: `${TRIGGER_NAMESPACE}-reveal-${index}`,
          trigger: element,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });
}

function initStaggers(root: ParentNode) {
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-stagger]'));

  groups.forEach((group, index) => {
    const children = Array.from(group.children).filter((child): child is HTMLElement => {
      return child instanceof HTMLElement;
    });

    if (children.length === 0) return;

    gsap.fromTo(
      children,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: Number(group.dataset.stagger) || 0.08,
        scrollTrigger: {
          id: `${TRIGGER_NAMESPACE}-stagger-${index}`,
          trigger: group,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });
}

function initParallax(root: ParentNode) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));

  elements.forEach((element, index) => {
    const amount = Number(element.dataset.parallax) || 0.15;

    gsap.to(element, {
      yPercent: amount * -100,
      ease: 'none',
      scrollTrigger: {
        id: `${TRIGGER_NAMESPACE}-parallax-${index}`,
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}

function initPins(root: ParentNode) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-pin]'));

  elements.forEach((element, index) => {
    const end = element.dataset.pinEnd || '+=100%';

    ScrollTrigger.create({
      id: `${TRIGGER_NAMESPACE}-pin-${index}`,
      trigger: element,
      start: 'top top',
      end,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
    });
  });
}

function applyReducedMotionState(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-reveal], [data-stagger] > *').forEach((element) => {
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.transform = 'none';
  });
}

function getRevealFromVars(mode: string) {
  switch (mode) {
    case 'fade':
      return { autoAlpha: 0 };
    case 'scale':
      return { autoAlpha: 0, scale: 0.96 };
    case 'left':
      return { autoAlpha: 0, x: -28 };
    case 'right':
      return { autoAlpha: 0, x: 28 };
    case 'up':
    default:
      return { autoAlpha: 0, y: 28 };
  }
}
