export const ANIMATED_DASHBOARD_EXACT_PATHS = ['/dashboard'] as const;

export const ANIMATED_MODULE_PREFIXES = [
  '/dashboard/kepuasan-mitra',
  '/dashboard/publikasi',
  '/dashboard/perjalanan-dinas',
  '/dashboard/rka',
  '/dashboard/pengaturan',
  '/dashboard/rps',
  '/dashboard/evaluasi-perkuliahan',
  '/dashboard/aduan',
  '/dashboard/kelola/aduan',
  '/mitra/isi',
  '/aduan/lacak',
] as const;

export const EXCLUDED_MODULE_PREFIXES = [
  '/dashboard/perwalian',
  '/dashboard/beasiswa',
  '/dashboard/pelanggaran',
  '/dashboard/ukm',
  '/dashboard/himpunan',
  '/dashboard/sertifikat',
] as const;

export interface ViewportAnimationInput {
  isDesktop: boolean;
  canHover: boolean;
  reducedMotion: boolean;
}

export interface ViewportAnimationProfile {
  lenis: {
    enabled: boolean;
    smoothWheel: boolean;
    syncTouch: boolean;
    lerp: number;
    duration: number;
    wheelMultiplier: number;
    touchMultiplier: number;
  };
  heading: {
    enabled: boolean;
    yOffset: number;
    duration: number;
    stagger: number;
    ease: string;
    start: string;
  };
  card: {
    initialY: number;
    duration: number;
    staggerStep: number;
    maxDelay: number;
    viewportAmount: 'some';
    hover?: { y: number; scale: number };
    tap?: { scale: number };
  };
  tabMorph: {
    pillSpring:
      | {
          type: 'spring';
          stiffness: number;
          damping: number;
          mass: number;
        }
      | {
          duration: number;
        };
    contentDuration: number;
    exitDuration: number;
    slideOffset: number;
    blurPx: number;
    scaleFrom: number;
  };
  pageMorph: {
    enabled: boolean;
    duration: number;
    yOffset: number;
    scaleFrom: number;
    blurPx: number;
  };
}

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/)[0] || '';
  if (withoutQuery.length > 1) {
    return withoutQuery.replace(/\/+$/, '');
  }
  return withoutQuery;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Menentukan apakah rute termasuk cakupan animasi UX (Dashboard Utama + Modul 7–13).
 * Modul 1–6 dikecualikan secara eksplisit agar tidak tersentuh di runtime maupun UI.
 */
export function isAnimatedScopePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = normalizePathname(pathname);
  if (!normalized) return false;

  if (EXCLUDED_MODULE_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix))) {
    return false;
  }

  if ((ANIMATED_DASHBOARD_EXACT_PATHS as readonly string[]).includes(normalized)) {
    return true;
  }

  return ANIMATED_MODULE_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
}

/**
 * Memecah judul menjadi token per kata untuk animasi reveal GSAP ScrollTrigger.
 */
export function splitHeadingWords(text: string): string[] {
  if (!text) return [];
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Menghasilkan profil parameter animasi yang selaras untuk desktop, mobile, dan reduced-motion.
 */
export function getViewportAnimationProfile({
  isDesktop,
  canHover,
  reducedMotion,
}: ViewportAnimationInput): ViewportAnimationProfile {
  if (reducedMotion) {
    return {
      lenis: {
        enabled: false,
        smoothWheel: false,
        syncTouch: false,
        lerp: 1,
        duration: 0,
        wheelMultiplier: 1,
        touchMultiplier: 1,
      },
      heading: {
        enabled: false,
        yOffset: 0,
        duration: 0,
        stagger: 0,
        ease: 'none',
        start: 'top 95%',
      },
      card: {
        initialY: 0,
        duration: 0.01,
        staggerStep: 0,
        maxDelay: 0,
        viewportAmount: 'some',
        hover: undefined,
        tap: undefined,
      },
      tabMorph: {
        pillSpring: { duration: 0.01 },
        contentDuration: 0.01,
        exitDuration: 0.01,
        slideOffset: 0,
        blurPx: 0,
        scaleFrom: 1,
      },
      pageMorph: {
        enabled: false,
        duration: 0.01,
        yOffset: 0,
        scaleFrom: 1,
        blurPx: 0,
      },
    };
  }

  if (isDesktop) {
    return {
      lenis: {
        enabled: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.1,
        duration: 1.05,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.15,
      },
      heading: {
        enabled: true,
        yOffset: 18,
        duration: 0.58,
        stagger: 0.045,
        ease: 'power3.out',
        start: 'top 92%',
      },
      card: {
        initialY: 16,
        duration: 0.42,
        staggerStep: 0.045,
        maxDelay: 0.24,
        viewportAmount: 'some',
        hover: canHover ? { y: -3, scale: 1.008 } : undefined,
        tap: { scale: 0.988 },
      },
      tabMorph: {
        pillSpring: {
          type: 'spring',
          stiffness: 420,
          damping: 34,
          mass: 0.9,
        },
        contentDuration: 0.26,
        exitDuration: 0.13,
        slideOffset: 22,
        blurPx: 3,
        scaleFrom: 0.992,
      },
      pageMorph: {
        enabled: true,
        duration: 0.28,
        yOffset: 10,
        scaleFrom: 0.992,
        blurPx: 3,
      },
    };
  }

  return {
    lenis: {
      enabled: true,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.12,
      duration: 0.9,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.15,
    },
    heading: {
      enabled: true,
      yOffset: 12,
      duration: 0.45,
      stagger: 0.032,
      ease: 'power3.out',
      start: 'top 95%',
    },
    card: {
      initialY: 10,
      duration: 0.34,
      staggerStep: 0.03,
      maxDelay: 0.2,
      viewportAmount: 'some',
      hover: canHover ? { y: -2, scale: 1.005 } : undefined,
      tap: { scale: 0.988 },
    },
    tabMorph: {
      pillSpring: {
        type: 'spring',
        stiffness: 460,
        damping: 36,
        mass: 0.85,
      },
      contentDuration: 0.2,
      exitDuration: 0.1,
      slideOffset: 14,
      blurPx: 2,
      scaleFrom: 0.995,
    },
    pageMorph: {
      enabled: true,
      duration: 0.22,
      yOffset: 7,
      scaleFrom: 0.995,
      blurPx: 2,
    },
  };
}

/**
 * Menghitung jeda stagger terbatasi agar daftar kartu panjang tidak menunggu terlalu lama.
 */
export function getStaggerDelay(index: number, step: number, maxDelay: number): number {
  return Math.min(Math.max(0, index) * step, maxDelay);
}

/**
 * Menentukan arah geser perpindahan tab/filter berdasarkan urutan opsi.
 */
export function getTabSwitchDirection<T>(
  orderedKeys: readonly T[],
  prevKey: T,
  nextKey: T
): -1 | 0 | 1 {
  if (prevKey === nextKey) return 0;
  const prevIdx = orderedKeys.indexOf(prevKey);
  const nextIdx = orderedKeys.indexOf(nextKey);
  if (prevIdx === -1 || nextIdx === -1) return 0;
  return nextIdx > prevIdx ? 1 : -1;
}
