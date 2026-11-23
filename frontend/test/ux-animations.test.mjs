import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendSrcDir = path.resolve(__dirname, '../src');
const appDashboardDir = path.resolve(frontendSrcDir, 'app/dashboard');

function readResetTargetPages() {
  const src = fs.readFileSync(path.join(__dirname, 'reset-pages.test.mjs'), 'utf8');
  return Array.from(src.matchAll(/relPath:\s*'([^']+)'/g), (m) => ({ relPath: m[1] }));
}

const RESET_TARGET_PAGES = readResetTargetPages();

function pageRelPathToRoute(relPath) {
  const withoutPage = relPath.replace(/\/page\.tsx$/, '').replace(/^page\.tsx$/, '');
  const concrete = withoutPage
    .replaceAll('[tahun]', '2025')
    .replaceAll('[nomor]', '1')
    .replaceAll('[kelasId]', 'kls-01')
    .replaceAll('[id]', '123');
  return concrete ? `/dashboard/${concrete}` : '/dashboard';
}

function collectFilesRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursive(full));
    } else if (entry.isFile() && /\.(tsx?|mjs|js)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

test('GSAP, ScrollTrigger, Motion, and Lenis packages resolve with expected APIs', async () => {
  const gsapModule = await import('gsap');
  const gsap = gsapModule.default || gsapModule.gsap;
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  const motionReact = await import('motion/react');
  const lenisModule = await import('lenis');
  const Lenis = lenisModule.default || lenisModule.Lenis;

  assert.equal(typeof gsap?.fromTo, 'function', 'gsap.fromTo must be a function');
  assert.equal(typeof gsap?.registerPlugin, 'function', 'gsap.registerPlugin must be a function');
  assert.ok(ScrollTrigger, 'ScrollTrigger must be exported from gsap/ScrollTrigger');
  assert.doesNotThrow(() => gsap.registerPlugin(ScrollTrigger), 'gsap.registerPlugin(ScrollTrigger) should succeed');

  assert.ok(motionReact.motion, 'motion must be exported from motion/react');
  assert.equal(typeof motionReact.MotionConfig, 'function', 'MotionConfig must be exported from motion/react');
  assert.equal(typeof motionReact.useReducedMotion, 'function', 'useReducedMotion must be exported from motion/react');

  assert.equal(typeof Lenis, 'function', 'Lenis default export must be a constructor function');
});

test('isAnimatedScopePath enables Dashboard Utama + Modul 7-13 and strictly excludes Modul 1-6', async () => {
  const { isAnimatedScopePath } = await import('../src/lib/animation-scope.ts');

  // Dashboard Utama
  assert.equal(isAnimatedScopePath('/dashboard'), true);
  assert.equal(isAnimatedScopePath('/dashboard/'), true);
  assert.equal(isAnimatedScopePath('/dashboard?role=KAPRODI'), true);

  // All 39 Modul 7-13 target routes + 2 public portals
  assert.equal(RESET_TARGET_PAGES.length, 39, 'Expected 39 target pages in reset-pages.test.mjs');
  for (const page of RESET_TARGET_PAGES) {
    const route = pageRelPathToRoute(page.relPath);
    assert.equal(isAnimatedScopePath(route), true, `Expected Modul 7-13 route ${route} to be animated`);
  }
  assert.equal(isAnimatedScopePath('/mitra/isi/tok-telkom-2025'), true);
  assert.equal(isAnimatedScopePath('/aduan/lacak'), true);

  // All Modul 1-6 routes MUST be excluded
  const modul1To6Routes = [
    '/dashboard/perwalian',
    '/dashboard/perwalian/rekap',
    '/dashboard/beasiswa',
    '/dashboard/beasiswa/jam-karya',
    '/dashboard/beasiswa/verifikasi',
    '/dashboard/beasiswa/rekap',
    '/dashboard/pelanggaran',
    '/dashboard/pelanggaran/sanksi-saya',
    '/dashboard/pelanggaran/verifikasi',
    '/dashboard/pelanggaran/retensi',
    '/dashboard/ukm',
    '/dashboard/ukm/keanggotaan',
    '/dashboard/ukm/rekap',
    '/dashboard/himpunan',
    '/dashboard/himpunan/proker',
    '/dashboard/himpunan/proposal',
    '/dashboard/himpunan/lpj',
    '/dashboard/himpunan/verifikasi',
    '/dashboard/himpunan/analisis',
    '/dashboard/sertifikat',
    '/dashboard/sertifikat/verifikasi',
    '/dashboard/sertifikat/rekap',
  ];

  for (const route of modul1To6Routes) {
    assert.equal(isAnimatedScopePath(route), false, `Modul 1-6 route ${route} MUST NOT be animated`);
  }

  // Non-target / unknown routes
  assert.equal(isAnimatedScopePath('/'), false);
  assert.equal(isAnimatedScopePath(''), false);
  assert.equal(isAnimatedScopePath(null), false);
  assert.equal(isAnimatedScopePath(undefined), false);
  assert.equal(isAnimatedScopePath('/dashboard/unknown'), false);
});

test('splitHeadingWords tokenizes headings per word cleanly', async () => {
  const { splitHeadingWords } = await import('../src/lib/animation-scope.ts');

  assert.deepEqual(
    splitHeadingWords('Selamat Datang, Dr. Ahmad!'),
    ['Selamat', 'Datang,', 'Dr.', 'Ahmad!']
  );
  assert.deepEqual(
    splitHeadingWords('  Rekap  &   Evaluasi\nCPMK '),
    ['Rekap', '&', 'Evaluasi', 'CPMK']
  );
  assert.deepEqual(splitHeadingWords('   '), []);
  assert.deepEqual(splitHeadingWords(''), []);
});

test('getViewportAnimationProfile harmonizes desktop, mobile, and reduced-motion behaviors', async () => {
  const { getViewportAnimationProfile, getStaggerDelay } = await import('../src/lib/animation-scope.ts');

  const desktop = getViewportAnimationProfile({
    isDesktop: true,
    canHover: true,
    reducedMotion: false,
  });
  const mobile = getViewportAnimationProfile({
    isDesktop: false,
    canHover: false,
    reducedMotion: false,
  });
  const reduced = getViewportAnimationProfile({
    isDesktop: true,
    canHover: true,
    reducedMotion: true,
  });

  // Desktop profile
  assert.equal(desktop.lenis.enabled, true);
  assert.equal(desktop.lenis.smoothWheel, true);
  assert.equal(desktop.lenis.syncTouch, false);
  assert.equal(desktop.heading.enabled, true);
  assert.ok(desktop.heading.yOffset > 0);
  assert.ok(desktop.card.hover && desktop.card.hover.y < 0, 'Desktop pointer devices should get subtle hover lift');
  assert.ok(desktop.card.tap);
  assert.equal(desktop.card.viewportAmount, 'some');

  // Mobile profile (lighter amplitude, faster settle, no sticky hover on touch)
  assert.equal(mobile.lenis.enabled, true);
  assert.equal(mobile.lenis.syncTouch, false);
  assert.equal(mobile.heading.enabled, true);
  assert.ok(mobile.heading.yOffset < desktop.heading.yOffset, 'Mobile yOffset should be gentler than desktop');
  assert.ok(mobile.heading.duration < desktop.heading.duration, 'Mobile duration should be snappier than desktop');
  assert.equal(mobile.card.hover, undefined, 'Touch mobile must disable hover lift to prevent sticky hover');
  assert.ok(mobile.card.tap);
  assert.equal(mobile.card.viewportAmount, 'some');

  // Reduced motion profile
  assert.equal(reduced.lenis.enabled, false);
  assert.equal(reduced.heading.enabled, false);
  assert.equal(reduced.card.initialY, 0);
  assert.equal(reduced.card.hover, undefined);
  assert.equal(reduced.card.tap, undefined);

  // Stagger delay helper clamping
  assert.equal(getStaggerDelay(0, 0.045, 0.24), 0);
  assert.equal(getStaggerDelay(-2, 0.045, 0.24), 0);
  assert.equal(getStaggerDelay(10, 0.045, 0.24), 0.24);
});

test('Shared layouts/headers/cards integrate SmoothScrollProvider, WordRevealHeading, MotionCard, and Modul 1-6 remain untouched', () => {
  const dashboardLayout = fs.readFileSync(path.join(appDashboardDir, 'layout.tsx'), 'utf8');
  const dashboardMain = fs.readFileSync(path.join(appDashboardDir, 'page.tsx'), 'utf8');
  const pageHeader = fs.readFileSync(path.join(frontendSrcDir, 'components/ui/PageHeader.tsx'), 'utf8');
  const statCard = fs.readFileSync(path.join(frontendSrcDir, 'components/ui/StatCard.tsx'), 'utf8');
  const publicShell = fs.readFileSync(path.join(frontendSrcDir, 'components/layout/PublicShell.tsx'), 'utf8');

  assert.ok(dashboardLayout.includes('SmoothScrollProvider'), 'DashboardLayout must wire SmoothScrollProvider');
  assert.ok(publicShell.includes('SmoothScrollProvider'), 'PublicShell must wire SmoothScrollProvider');
  assert.ok(pageHeader.includes('WordRevealHeading'), 'PageHeader must render title via WordRevealHeading');
  assert.ok(statCard.includes('MotionCard'), 'StatCard must wrap card with MotionCard');
  assert.ok(dashboardMain.includes('WordRevealHeading'), 'Dashboard Utama must use WordRevealHeading');
  assert.ok(dashboardMain.includes('MotionCard'), 'Dashboard Utama must use MotionCard');

  const excludedModules = ['perwalian', 'beasiswa', 'pelanggaran', 'ukm', 'himpunan', 'sertifikat'];
  const forbiddenTokens = [
    'gsap',
    'ScrollTrigger',
    'motion/react',
    'lenis',
    'WordRevealHeading',
    'MotionCard',
    'SmoothScrollProvider',
  ];

  for (const modDir of excludedModules) {
    const files = collectFilesRecursive(path.join(appDashboardDir, modDir));
    assert.ok(files.length > 0, `Expected Modul 1-6 folder ${modDir} to exist`);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const token of forbiddenTokens) {
        assert.equal(
          content.includes(token),
          false,
          `Modul 1-6 file ${path.relative(frontendSrcDir, file)} must NOT reference ${token}`
        );
      }
    }
  }
});
