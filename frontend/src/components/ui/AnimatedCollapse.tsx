'use client';

import React, { useRef, useEffect, useState } from 'react';
import { animate, remove, stagger } from 'animejs';

export interface AnimatedCollapseProps {
  open: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
  animateItems?: boolean;
}

export function AnimatedCollapse({
  open,
  children,
  duration = 240,
  className = '',
  animateItems = true,
}: AnimatedCollapseProps) {
  const [mounted, setMounted] = useState<boolean>(open);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const el = containerRef.current;
    if (!el) {
      if (open) setMounted(true);
      return;
    }

    if (open) {
      setMounted(true);
      remove(el);

      el.style.display = 'block';
      el.style.height = '0px';
      el.style.opacity = '0';
      el.style.overflow = 'hidden';
      const targetHeight = el.scrollHeight;

      animate(el, {
        height: [0, targetHeight],
        opacity: [0, 1],
        duration,
        ease: 'outCubic',
        onComplete: () => {
          if (el) {
            el.style.height = 'auto';
            el.style.overflow = 'visible';
          }
        },
      });

      if (animateItems) {
        const items = el.querySelectorAll('.anime-collapse-item');
        if (items.length > 0) {
          remove(items);
          items.forEach((item) => {
            (item as HTMLElement).style.opacity = '0';
            (item as HTMLElement).style.transform = 'translateY(-4px)';
          });
          animate(items, {
            opacity: [0, 1],
            translateY: [-4, 0],
            delay: stagger(15, { start: 25 }),
            duration: 180,
            ease: 'outCubic',
          });
        }
      }
    } else {
      remove(el);
      const currentHeight = el.scrollHeight;
      el.style.height = `${currentHeight}px`;
      el.style.overflow = 'hidden';

      animate(el, {
        height: [currentHeight, 0],
        opacity: [1, 0],
        duration: Math.round(duration * 0.75),
        ease: 'outQuad',
        onComplete: () => {
          setMounted(false);
        },
      });
    }
  }, [open, duration, animateItems]);

  if (!mounted && !open) return null;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={!open && !mounted ? { display: 'none' } : undefined}
    >
      {children}
    </div>
  );
}

export default AnimatedCollapse;

