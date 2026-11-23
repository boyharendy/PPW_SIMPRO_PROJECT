'use client';

import React, { createContext, useContext, useSyncExternalStore } from 'react';

export interface AnimationScopeValue {
  enabled: boolean;
  scrollMode: 'container' | 'window';
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  isDesktop: boolean;
  canHover: boolean;
  reducedMotion: boolean;
}

const fallbackRef: React.RefObject<HTMLElement | null> = { current: null };

export const AnimationScopeContext = createContext<AnimationScopeValue>({
  enabled: false,
  scrollMode: 'container',
  scrollContainerRef: fallbackRef,
  isDesktop: true,
  canHover: true,
  reducedMotion: false,
});

export function useAnimationScope(): AnimationScopeValue {
  return useContext(AnimationScopeContext);
}

/**
 * Berlangganan media query secara aman tanpa memanggil setState sinkron di useEffect.
 */
export function useMediaQuery(query: string, serverDefault: boolean): boolean {
  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return () => {};
    }
    const mq = window.matchMedia(query);
    mq.addEventListener('change', onStoreChange);
    return () => mq.removeEventListener('change', onStoreChange);
  };

  const getSnapshot = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return serverDefault;
    }
    return window.matchMedia(query).matches;
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => serverDefault);
}
