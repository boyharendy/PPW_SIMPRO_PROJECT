'use client';

import React, { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  action?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({
  title,
  description,
  subtitle,
  action,
  actions,
  badge,
}: PageHeaderProps) {
  const descText = subtitle || description;
  const actionContent = actions || action;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {descText && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            {descText}
          </p>
        )}
      </div>

      {actionContent && (
        <div className="shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {actionContent}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
