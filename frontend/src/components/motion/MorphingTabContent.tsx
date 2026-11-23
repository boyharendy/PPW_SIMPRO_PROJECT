'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatePresence, motion } from 'motion/react';
import {
  getTabSwitchDirection,
  getViewportAnimationProfile,
} from '@/lib/animation-scope';
import { useAnimationScope } from '@/components/motion/AnimationScopeContext';

export interface MorphingTabContentProps {
  activeKey: string;
  orderedKeys?: readonly string[];
  direction?: -1 | 0 | 1;
  className?: string;
  children: React.ReactNode;
}

/**
 * Directional morphing content wrapper for tab/filter transitions with smooth height morphing.
 */
export function MorphingTabContent({
  activeKey,
  orderedKeys,
  direction,
  className = '',
  children,
}: MorphingTabContentProps) {
  const scope = useAnimationScope();
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [navState, setNavState] = useState<{
    prevKey: string;
    derivedDir: -1 | 0 | 1;
  }>({ prevKey: activeKey, derivedDir: 0 });
  const [heightState, setHeightState] = useState<{
    height: number | null;
    animating: boolean;
  }>({ height: null, animating: false });

  if (navState.prevKey !== activeKey) {
    const nextDir = orderedKeys
      ? getTabSwitchDirection(orderedKeys, navState.prevKey, activeKey)
      : 0;
    setNavState({ prevKey: activeKey, derivedDir: nextDir });
  }

  const effectiveDir = direction !== undefined ? direction : navState.derivedDir;

  useEffect(() => {
    if (!scope.enabled || scope.reducedMotion) return;
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextHeight = Math.ceil(entry.contentRect.height);
        setHeightState((prev) => {
          if (prev.height === nextHeight) return prev;
          return {
            height: nextHeight,
            animating: prev.height !== null,
          };
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [scope.enabled, scope.reducedMotion]);

  if (!scope.enabled || scope.reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const profile = getViewportAnimationProfile({
    isDesktop: scope.isDesktop,
    canHover: scope.canHover,
    reducedMotion: scope.reducedMotion,
  });

  const { contentDuration, exitDuration, slideOffset, blurPx, scaleFrom } =
    profile.tabMorph;

  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir * slideOffset,
      y: dir === 0 ? 6 : 0,
      scale: scaleFrom,
      filter: blurPx > 0 ? `blur(${blurPx}px)` : 'blur(0px)',
    }),
    center: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: contentDuration,
        ease: [0.22, 1, 0.36, 1] as const,
      },
      transitionEnd: {
        filter: 'none',
        transform: 'none',
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir * -Math.round(slideOffset * 0.65),
      y: dir === 0 ? -4 : 0,
      scale: scaleFrom,
      filter:
        blurPx > 0 ? `blur(${Math.max(1, blurPx - 1)}px)` : 'blur(0px)',
      transition: {
        duration: exitDuration,
        ease: [0.4, 0, 1, 1] as const,
      },
    }),
  };

  return (
    <motion.div
      initial={false}
      animate={heightState.height !== null ? { height: heightState.height } : undefined}
      transition={{
        duration: contentDuration,
        ease: [0.22, 1, 0.36, 1],
      }}
      onAnimationComplete={() => {
        setHeightState((prev) =>
          prev.animating ? { ...prev, animating: false } : prev
        );
      }}
      className={`relative ${
        heightState.animating ? 'overflow-hidden' : 'overflow-x-clip'
      } ${className}`}
    >
      <div ref={measureRef}>
        <AnimatePresence mode="wait" initial={false} custom={effectiveDir}>
          <motion.div
            key={activeKey}
            custom={effectiveDir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            onAnimationComplete={(definition) => {
              if (definition === 'center' && typeof window !== 'undefined') {
                window.requestAnimationFrame(() => {
                  gsap.registerPlugin(ScrollTrigger);
                  ScrollTrigger.refresh();
                });
              }
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default MorphingTabContent;
