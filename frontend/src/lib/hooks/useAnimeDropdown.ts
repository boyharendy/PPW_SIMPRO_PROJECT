'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { animate, remove, stagger } from 'animejs';

export interface UseAnimeDropdownOptions {
  open: boolean;
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  animateItems?: boolean;
  itemSelector?: string;
  duration?: number;
  exitDuration?: number;
  closeOnEsc?: boolean;
  closeOnClickOutside?: boolean;
  ease?: string;
  exitEase?: string;
}

export function useAnimeDropdown({
  open,
  onClose,
  triggerRef,
  animateItems = true,
  itemSelector = '.anime-dropdown-item',
  duration = 240,
  exitDuration = 150,
  closeOnEsc = true,
  closeOnClickOutside = true,
  ease = 'outBack(1.2)',
  exitEase = 'outQuad',
}: UseAnimeDropdownOptions) {
  const [mounted, setMounted] = useState<boolean>(open);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isExitingRef = useRef<boolean>(false);
  const prevOpenRef = useRef<boolean>(open);

  // Sync mounted state when open changes
  useEffect(() => {
    if (open) {
      isExitingRef.current = false;
      setMounted(true);
    } else if (prevOpenRef.current && !open && mounted) {
      // Transitioning from open to closed -> trigger exit animation
      if (menuRef.current) {
        isExitingRef.current = true;
        remove(menuRef.current);

        const anim = animate(menuRef.current, {
          opacity: [1, 0],
          scale: [1, 0.96],
          translateY: [0, -6],
          duration: exitDuration,
          ease: exitEase,
          onComplete: () => {
            isExitingRef.current = false;
            setMounted(false);
          },
        });

        // Fallback safety timeout if onComplete is delayed
        const timer = setTimeout(() => {
          if (isExitingRef.current) {
            isExitingRef.current = false;
            setMounted(false);
          }
        }, exitDuration + 60);

        return () => clearTimeout(timer);
      } else {
        setMounted(false);
      }
    }
    prevOpenRef.current = open;
  }, [open, exitDuration, exitEase, mounted]);

  // Run enter animation whenever mounted becomes true and open is true
  useEffect(() => {
    if (mounted && open && !isExitingRef.current && menuRef.current) {
      const el = menuRef.current;
      remove(el);

      // Reset initial styles and animate container
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px) scale(0.95)';

      animate(el, {
        opacity: [0, 1],
        scale: [0.95, 1],
        translateY: [-8, 0],
        duration,
        ease,
      });

      // Stagger items if enabled
      if (animateItems) {
        const items = el.querySelectorAll(itemSelector);
        if (items.length > 0) {
          remove(items);
          items.forEach((item) => {
            (item as HTMLElement).style.opacity = '0';
            (item as HTMLElement).style.transform = 'translateY(-4px)';
          });

          animate(items, {
            opacity: [0, 1],
            translateY: [-4, 0],
            delay: stagger(18, { start: 30 }),
            duration: 200,
            ease: 'outCubic',
          });
        }
      }
    }
  }, [mounted, open, animateItems, itemSelector, duration, ease]);

  // Click outside and ESC key handlers
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (!closeOnClickOutside) return;
      const target = e.target as Node;

      // Ignore click if it originated from the trigger element
      if (triggerRef?.current && triggerRef.current.contains(target)) {
        return;
      }

      // If clicked outside the dropdown menu container, close it
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose?.();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (closeOnEsc && e.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, triggerRef, closeOnClickOutside, closeOnEsc]);

  return {
    mounted,
    menuRef,
    isExiting: isExitingRef.current,
  };
}

