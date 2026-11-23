'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionConfig } from 'motion/react';
import {
  getViewportAnimationProfile,
  isAnimatedScopePath,
} from '@/lib/animation-scope';
import {
  AnimationScopeContext,
  useMediaQuery,
} from '@/components/motion/AnimationScopeContext';

export interface SmoothScrollProviderProps {
  mode: 'container' | 'window';
  className?: string;
  children: React.ReactNode;
}

function createPreventHandler(boundaryEl: HTMLElement | null) {
  return (node: HTMLElement): boolean => {
    if (!node || typeof node.closest !== 'function') return false;
    if (
      node.closest(
        '[data-lenis-prevent], [data-lenis-prevent-wheel], [role="dialog"], [role="menu"], textarea, select'
      )
    ) {
      return true;
    }
    let current: HTMLElement | null = node;
    while (
      current &&
      current !== boundaryEl &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      const { overflowY } = window.getComputedStyle(current);
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        current.scrollHeight > current.clientHeight + 1
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };
}

export function SmoothScrollProvider({
  mode,
  className,
  children,
}: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const enabled = isAnimatedScopePath(pathname);

  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)', true);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', false);

  const containerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    const profile = getViewportAnimationProfile({
      isDesktop,
      canHover,
      reducedMotion,
    });
    if (!profile.lenis.enabled) return;

    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis;
    let observedTarget: HTMLElement | null = null;

    if (mode === 'container') {
      const wrapperEl = containerRef.current;
      const contentEl = contentRef.current;
      if (!wrapperEl || !contentEl) return;

      lenis = new Lenis({
        wrapper: wrapperEl,
        content: contentEl,
        autoRaf: false,
        smoothWheel: profile.lenis.smoothWheel,
        syncTouch: profile.lenis.syncTouch,
        lerp: profile.lenis.lerp,
        duration: profile.lenis.duration,
        wheelMultiplier: profile.lenis.wheelMultiplier,
        touchMultiplier: profile.lenis.touchMultiplier,
        prevent: createPreventHandler(wrapperEl),
      });

      ScrollTrigger.scrollerProxy(wrapperEl, {
        scrollTop(value?: number) {
          if (arguments.length && typeof value === 'number') {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return wrapperEl.getBoundingClientRect();
        },
      });

      observedTarget = contentEl;
    } else {
      lenis = new Lenis({
        autoRaf: false,
        smoothWheel: profile.lenis.smoothWheel,
        syncTouch: profile.lenis.syncTouch,
        lerp: profile.lenis.lerp,
        duration: profile.lenis.duration,
        wheelMultiplier: profile.lenis.wheelMultiplier,
        touchMultiplier: profile.lenis.touchMultiplier,
        prevent: createPreventHandler(null),
      });
      observedTarget = document.body;
    }

    lenisRef.current = lenis;

    const onLenisScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onLenisScroll);

    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    let resizeRafId = 0;
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && observedTarget
        ? new ResizeObserver(() => {
            if (resizeRafId) window.cancelAnimationFrame(resizeRafId);
            resizeRafId = window.requestAnimationFrame(() => {
              lenis.resize();
              ScrollTrigger.refresh();
            });
          })
        : null;

    if (resizeObserver && observedTarget) {
      resizeObserver.observe(observedTarget);
    }

    const initialRefreshRafId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(initialRefreshRafId);
      if (resizeRafId) window.cancelAnimationFrame(resizeRafId);
      resizeObserver?.disconnect();
      gsap.ticker.remove(onTick);
      lenis.off('scroll', onLenisScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled, mode, isDesktop, canHover, reducedMotion]);

  useEffect(() => {
    if (!enabled) return;
    lenisRef.current?.scrollTo(0, { immediate: true });
    if (mode === 'container' && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const rafId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [pathname, enabled, mode]);

  const contextValue = useMemo(
    () => ({
      enabled,
      scrollMode: mode,
      scrollContainerRef: containerRef,
      isDesktop,
      canHover,
      reducedMotion,
    }),
    [enabled, mode, isDesktop, canHover, reducedMotion]
  );

  const scopedContent = enabled ? (
    <MotionConfig reducedMotion="user">
      <AnimationScopeContext.Provider value={contextValue}>
        {children}
      </AnimationScopeContext.Provider>
    </MotionConfig>
  ) : (
    <AnimationScopeContext.Provider value={contextValue}>
      {children}
    </AnimationScopeContext.Provider>
  );

  if (mode === 'container') {
    if (!enabled) {
      return <main className={className}>{scopedContent}</main>;
    }
    return (
      <main
        ref={containerRef}
        className={className}
        data-lenis-wrapper="true"
      >
        <div ref={contentRef} className="min-h-full">
          {scopedContent}
        </div>
      </main>
    );
  }

  return <>{scopedContent}</>;
}

export default SmoothScrollProvider;
