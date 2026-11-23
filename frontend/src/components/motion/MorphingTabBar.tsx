'use client';

import React, { useId } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { getViewportAnimationProfile } from '@/lib/animation-scope';
import { useAnimationScope } from '@/components/motion/AnimationScopeContext';

export interface MorphingTabOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  activePillClassName?: string;
  activeTextClassName?: string;
  buttonClassName?: string;
}

export interface MorphingTabBarProps<T extends string = string> {
  options: readonly MorphingTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  containerClassName?: string;
  buttonClassName?: string;
  activePillClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  ariaLabel?: string;
}

/**
 * Segmented tab/filter bar with a shared-layout morphing active pill powered by Motion.
 */
export function MorphingTabBar<T extends string = string>({
  options,
  value,
  onChange,
  layoutId,
  containerClassName = 'inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50',
  buttonClassName = 'px-3 py-1.5 text-xs font-medium rounded-md',
  activePillClassName = 'bg-blue-600 shadow-xs rounded-md',
  activeTextClassName = 'text-white',
  inactiveTextClassName = 'text-slate-600 hover:text-slate-900',
  ariaLabel,
}: MorphingTabBarProps<T>) {
  const scope = useAnimationScope();
  const reactId = useId();
  const groupId = layoutId ? `${layoutId}-${reactId}` : reactId;
  const pillId = `${groupId}-pill`;

  if (!scope.enabled) {
    return (
      <div role="tablist" aria-label={ariaLabel} className={containerClassName}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          const btnClass = opt.buttonClassName ?? buttonClassName;
          const pillClass = opt.activePillClassName ?? activePillClassName;
          const actTextClass = opt.activeTextClassName ?? activeTextClassName;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.value)}
              className={`cursor-pointer transition-colors ${btnClass} ${
                isActive ? `${pillClass} ${actTextClass}` : inactiveTextClassName
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  const profile = getViewportAnimationProfile({
    isDesktop: scope.isDesktop,
    canHover: scope.canHover,
    reducedMotion: scope.reducedMotion,
  });

  return (
    <LayoutGroup id={groupId}>
      <div role="tablist" aria-label={ariaLabel} className={containerClassName}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          const btnClass = opt.buttonClassName ?? buttonClassName;
          const pillClass = opt.activePillClassName ?? activePillClassName;
          const actTextClass = opt.activeTextClassName ?? activeTextClassName;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(opt.value)}
              className={`relative isolate cursor-pointer transition-colors duration-150 ${btnClass} ${
                isActive ? actTextClass : inactiveTextClassName
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={pillId}
                  aria-hidden="true"
                  className={`absolute inset-0 z-0 pointer-events-none transition-colors duration-200 ${pillClass}`}
                  transition={profile.tabMorph.pillSpring}
                />
              )}
              <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export default MorphingTabBar;
