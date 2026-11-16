'use client';

import React from 'react';
import { useAnimeDropdown, UseAnimeDropdownOptions } from '@/lib/hooks/useAnimeDropdown';

export interface AnimatedDropdownProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  animateItems?: boolean;
  itemSelector?: string;
  duration?: number;
  exitDuration?: number;
  closeOnEsc?: boolean;
  closeOnClickOutside?: boolean;
}

export function AnimatedDropdown({
  open,
  onClose,
  triggerRef,
  children,
  align = 'right',
  className = '',
  animateItems = true,
  itemSelector = '.anime-dropdown-item',
  duration = 240,
  exitDuration = 150,
  closeOnEsc = true,
  closeOnClickOutside = true,
}: AnimatedDropdownProps) {
  const { mounted, menuRef } = useAnimeDropdown({
    open,
    onClose,
    triggerRef,
    animateItems,
    itemSelector,
    duration,
    exitDuration,
    closeOnEsc,
    closeOnClickOutside,
  });

  if (!mounted) return null;

  const alignClass =
    align === 'right'
      ? 'right-0 origin-top-right'
      : align === 'left'
      ? 'left-0 origin-top-left'
      : 'left-1/2 -translate-x-1/2 origin-top';

  return (
    <div
      ref={menuRef}
      className={`absolute mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl will-change-transform ${alignClass} ${className}`}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>
  );
}

export { useAnimeDropdown };
export type { UseAnimeDropdownOptions };
export default AnimatedDropdown;

