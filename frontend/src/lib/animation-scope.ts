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
  };
}

/**
 * Menghitung jeda stagger terbatasi agar daftar kartu panjang tidak menunggu terlalu lama.
 */
export function getStaggerDelay(index: number, step: number, maxDelay: number): number {
  return Math.min(Math.max(0, index) * step, maxDelay);
}
