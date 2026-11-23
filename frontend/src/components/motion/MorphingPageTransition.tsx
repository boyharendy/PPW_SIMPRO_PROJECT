'use client';

import React, { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import { getViewportAnimationProfile } from '@/lib/animation-scope';
import { useAnimationScope } from '@/components/motion/AnimationScopeContext';

export interface MorphingPageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive enter-morph transition for route-level content switching in scoped modules.
 */
export function MorphingPageTransition({
  children,
  className = '',
}: MorphingPageTransitionProps) {
  const pathname = usePathname() || '';
  const scope = useAnimationScope();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [initialPathname] = useState(pathname);
  const [hasNavigated, setHasNavigated] = useState(false);

  if (!hasNavigated && pathname !== initialPathname) {
    setHasNavigated(true);
  }

  if (!scope.enabled) {
    return <>{children}</>;
  }

  const profile = getViewportAnimationProfile({
    isDesktop: scope.isDesktop,
    canHover: scope.canHover,
    reducedMotion: scope.reducedMotion,
  });

  if (!profile.pageMorph.enabled) {
    return <>{children}</>;
  }

  const { duration, yOffset, scaleFrom, blurPx } = profile.pageMorph;

  return (
    <motion.div
      key={pathname}
      ref={wrapperRef}
      className={className || undefined}
      initial={
        hasNavigated
          ? {
              opacity: 0,
              y: yOffset,
              scale: scaleFrom,
              filter: blurPx > 0 ? `blur(${blurPx}px)` : 'blur(0px)',
            }
          : false
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration,
          ease: [0.22, 1, 0.36, 1],
        },
        transitionEnd: {
          filter: 'none',
          transform: 'none',
        },
      }}
      onAnimationComplete={() => {
        if (wrapperRef.current) {
          wrapperRef.current.style.removeProperty('transform');
          wrapperRef.current.style.removeProperty('filter');
        }
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            gsap.registerPlugin(ScrollTrigger);
            ScrollTrigger.refresh();
          });
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export default MorphingPageTransition;
