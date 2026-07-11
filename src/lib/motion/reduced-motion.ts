export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function watchReducedMotion(callback: (matches: boolean) => void) {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  const listener = (event: MediaQueryListEvent) => callback(event.matches);

  mediaQuery.addEventListener('change', listener);
  return () => mediaQuery.removeEventListener('change', listener);
}
