'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  getViewportAnimationProfile,
  splitHeadingWords,
} from '@/lib/animation-scope';
import { useAnimationScope } from '@/components/motion/AnimationScopeContext';

export interface WordRevealHeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  text: string;
  className?: string;
  once?: boolean;
}

export function WordRevealHeading({
  as = 'h1',
  text,
  className = '',
  once = true,
}: WordRevealHeadingProps) {
  const scope = useAnimationScope();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const words = splitHeadingWords(text);

  useEffect(() => {
    if (!scope.enabled || !headingRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const profile = getViewportAnimationProfile({
      isDesktop: scope.isDesktop,
      canHover: scope.canHover,
      reducedMotion: scope.reducedMotion,
    });

    const el = headingRef.current;
    let rafId = 0;

    const ctx = gsap.context(() => {
      const wordNodes = el.querySelectorAll('[data-word-reveal]');
      if (wordNodes.length === 0) return;

      if (!profile.heading.enabled) {
        gsap.set(wordNodes, { yPercent: 0, y: 0, opacity: 1 });
        return;
      }

      gsap.set(wordNodes, {
        yPercent: 105,
        y: profile.heading.yOffset,
        opacity: 0,
      });

      rafId = window.requestAnimationFrame(() => {
        ctx.add(() => {
          const scroller =
            scope.scrollMode === 'container'
              ? (scope.scrollContainerRef.current ?? undefined)
              : undefined;

          gsap.fromTo(
            wordNodes,
            {
              yPercent: 105,
              y: profile.heading.yOffset,
              opacity: 0,
            },
            {
              yPercent: 0,
              y: 0,
              opacity: 1,
              duration: profile.heading.duration,
              stagger: profile.heading.stagger,
              ease: profile.heading.ease,
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: el,
                scroller,
                start: profile.heading.start,
                once,
                invalidateOnRefresh: true,
              },
            }
          );

          ScrollTrigger.refresh();
        });
      });
    }, headingRef);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, [
    text,
    scope.enabled,
    scope.scrollMode,
    scope.scrollContainerRef,
    scope.isDesktop,
    scope.canHover,
    scope.reducedMotion,
    once,
  ]);

  const Tag = as;

  if (!scope.enabled || words.length === 0) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag ref={headingRef} className={className} aria-label={text}>
      {words.map((word, idx) => (
        <React.Fragment key={`${word}-${idx}`}>
          <span className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
            <span data-word-reveal className="inline-block" aria-hidden="true">
              {word}
            </span>
          </span>
          {idx < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

export default WordRevealHeading;
