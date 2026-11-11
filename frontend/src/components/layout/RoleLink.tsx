'use client';

import React from 'react';
import Link, { type LinkProps } from 'next/link';
import { useUser } from '@/lib/context';
import { canAccess } from '@/lib/navigation';
import type { Role } from '@/lib/types';

interface RoleLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  target?: string;
  requiredRole?: Role | Role[];
  title?: string;
}

export default function RoleLink({
  href,
  children,
  requiredRole,
  ...props
}: RoleLinkProps) {
  const { currentRole } = useUser();

  const hrefString = typeof href === 'string' ? href : href.pathname || '';

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(currentRole)) return null;
  }

  if (hrefString && !canAccess(hrefString, currentRole)) {
    return null;
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

