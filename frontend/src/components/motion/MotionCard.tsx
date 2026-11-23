'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  getStaggerDelay,
  getViewportAnimationProfile,
} from '@/lib/animation-scope';
import { useAnimationScope } from '@/components/motion/AnimationScopeContext';

export interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
  onClick?: React.MouseEventHandler<HTMLElement>;
}

const HOVER_SHADOW =
  '0 12px 28px -10px rgba(37, 99, 235, 0.16), 0 4px 12px -4px rgba(15, 23, 42, 0.08)';

export function MotionCard({
  children,
  className = '',
  index = 0,
  interactive = false,
  as = 'div',
  onClick,
}: MotionCardProps) {
  const scope = useAnimationScope();

  if (!scope.enabled) {
    const PlainTag = as;
    return (
      <PlainTag className={className} onClick={onClick}>
        {children}
      </PlainTag>
    );
  }

  const profile = getViewportAnimationProfile({
    isDesktop: scope.isDesktop,
    canHover: scope.canHover,
    reducedMotion: scope.reducedMotion,
  });

  const delay = getStaggerDelay(
    index,
    profile.card.staggerStep,
    profile.card.maxDelay
  );

  const viewport =
    scope.scrollMode === 'container'
      ? {
          once: true,
          amount: profile.card.viewportAmount,
          root: scope.scrollContainerRef,
        }
      : {
          once: true,
          amount: profile.card.viewportAmount,
        };

  const whileHover =
    interactive && profile.card.hover
      ? { ...profile.card.hover, boxShadow: HOVER_SHADOW }
      : undefined;

  const whileTap =
    interactive && profile.card.tap ? profile.card.tap : undefined;

  const MotionTag =
    as === 'section'
      ? motion.section
      : as === 'article'
      ? motion.article
      : motion.div;

  return (
    <MotionTag
      className={className}
      onClick={onClick}
      initial={
        scope.reducedMotion
          ? false
          : { opacity: 0, y: profile.card.initialY }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{
        duration: profile.card.duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={whileHover}
      whileTap={whileTap}
    >
      {children}
    </MotionTag>
  );
}

export default MotionCard;
