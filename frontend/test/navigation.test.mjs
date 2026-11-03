import test from 'node:test';
import assert from 'node:assert/strict';

// Helper to determine the single active nav item href
function getActiveNavItemHref(items, currentPath) {
  // 1. Exact match has absolute priority
  const exact = items.find(item => item.href === currentPath);
  if (exact) return exact.href;

  // 2. Otherwise find the longest matching prefix (avoiding /dashboard false positive)
  const prefixMatches = items.filter(item => {
    if (item.href === '/dashboard') {
      return currentPath === '/dashboard';
    }
    return currentPath.startsWith(item.href + '/');
  });

  if (prefixMatches.length > 0) {
    prefixMatches.sort((a, b) => b.href.length - a.href.length);
    return prefixMatches[0].href;
  }

  return null;
}

function groupNavItemsByCategory(items, role) {
  const visible = items.filter(i => i.roles.includes(role));
  const categories = Array.from(new Set(visible.map(i => i.category || 'Lainnya')));
  return {
    categories,
    itemsByCategory: categories.reduce((acc, cat) => {
      acc[cat] = visible.filter(i => (i.category || 'Lainnya') === cat);
      return acc;
    }, {})
  };
}

test('getActiveNavItemHref selects exactly one item when child path shares prefix with parent', () => {
  const rpsItems = [
    { title: 'Pengajuan & Review RPS', href: '/dashboard/rps' },
    { title: 'Review RPS Saya', href: '/dashboard/rps/review-saya' },
    { title: 'Rekap Status RPS', href: '/dashboard/rps/rekap' },
  ];

  // When on /dashboard/rps/review-saya, ONLY 'Review RPS Saya' must be active, NOT 'Pengajuan & Review RPS'
  const active1 = getActiveNavItemHref(rpsItems, '/dashboard/rps/review-saya');
  assert.equal(active1, '/dashboard/rps/review-saya');

  // When on /dashboard/rps, ONLY 'Pengajuan & Review RPS' must be active
  const active2 = getActiveNavItemHref(rpsItems, '/dashboard/rps');
  assert.equal(active2, '/dashboard/rps');

  // When on a deep subroute like /dashboard/rps/detail/1, longest prefix '/dashboard/rps' wins
  const active3 = getActiveNavItemHref(rpsItems, '/dashboard/rps/detail/1');
  assert.equal(active3, '/dashboard/rps');
});

test('getActiveNavItemHref handles nested items under Kepuasan Mitra correctly', () => {
  const mitraItems = [
    { title: 'Rekap Kepuasan Mitra', href: '/dashboard/kepuasan-mitra' },
    { title: 'Instrumen Kuesioner', href: '/dashboard/kepuasan-mitra/instrumen' },
    { title: 'Pengiriman & Input Mitra', href: '/dashboard/kepuasan-mitra/pengiriman' },
  ];

  const active = getActiveNavItemHref(mitraItems, '/dashboard/kepuasan-mitra/instrumen');
  assert.equal(active, '/dashboard/kepuasan-mitra/instrumen');
  assert.notEqual(active, '/dashboard/kepuasan-mitra');
});

test('groupNavItemsByCategory groups items and filters by role', () => {
  const sampleItems = [
    { title: 'Dashboard Utama', href: '/dashboard', category: 'Utama', roles: ['KAPRODI', 'DOSEN'] },
    { title: 'Rekap Kepuasan Mitra', href: '/dashboard/kepuasan-mitra', category: 'Kepuasan Mitra', roles: ['KAPRODI'] },
    { title: 'Instrumen Kuesioner', href: '/dashboard/kepuasan-mitra/instrumen', category: 'Kepuasan Mitra', roles: ['KAPRODI'] },
    { title: 'Daftar Publikasi', href: '/dashboard/publikasi', category: 'Publikasi', roles: ['DOSEN'] },
  ];

  const kaprodiNav = groupNavItemsByCategory(sampleItems, 'KAPRODI');
  assert.deepEqual(kaprodiNav.categories, ['Utama', 'Kepuasan Mitra']);
  assert.equal(kaprodiNav.itemsByCategory['Kepuasan Mitra'].length, 2);

  const dosenNav = groupNavItemsByCategory(sampleItems, 'DOSEN');
  assert.deepEqual(dosenNav.categories, ['Utama', 'Publikasi']);
  assert.equal(dosenNav.itemsByCategory['Publikasi'].length, 1);
});
