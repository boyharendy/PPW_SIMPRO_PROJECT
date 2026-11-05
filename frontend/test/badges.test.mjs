import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_ITEMS } from '../src/lib/navigation.ts';

// Helper function to resolve dynamic badge based on storage data and active route
export function resolveDynamicBadge({
  itemHref,
  activePath,
  trips = [],
  complaints = [],
  rpsSubmissions = [],
  publications = [],
  visitedHrefs = new Set(),
}) {
  // If user is currently viewing this exact page, badge must disappear (0)
  if (itemHref === activePath) return 0;

  // If user has visited/opened this page during the current session, badge is dismissed
  if (visitedHrefs.has(itemHref)) return 0;

  if (itemHref === '/dashboard/perjalanan-dinas/persetujuan') {
    return trips.filter((t) => t.status === 'DIAJUKAN').length;
  }

  if (itemHref === '/dashboard/kelola/aduan') {
    return complaints.filter((c) => !c.is_sensitif && c.status === 'DITERIMA').length;
  }

  if (itemHref === '/dashboard/kelola/aduan/sensitif') {
    return complaints.filter((c) => c.is_sensitif && (c.status === 'DITERIMA' || c.status === 'DIVERIFIKASI')).length;
  }

  if (itemHref === '/dashboard/rps/review-saya') {
    return rpsSubmissions.filter((r) => r.status === 'DIAJUKAN' || r.status === 'DIREVIEW').length;
  }

  if (itemHref === '/dashboard/publikasi/verifikasi') {
    return publications.filter((p) => p.status_verifikasi === 'MENUNGGU').length;
  }

  return 0;
}

test('NAV_ITEMS contains NO hardcoded static dummy badges', () => {
  const itemsWithBadge = NAV_ITEMS.filter((item) => typeof item.badge === 'number');
  assert.equal(
    itemsWithBadge.length,
    0,
    `Found hardcoded dummy badges in NAV_ITEMS: ${itemsWithBadge.map((i) => `${i.title} (${i.badge})`).join(', ')}`
  );
});

test('resolveDynamicBadge returns 0 when the user opens the page (active route)', () => {
  const trips = [{ id: 't1', status: 'DIAJUKAN' }];
  
  // When user is NOT on the page, badge is 1
  const badgeInactive = resolveDynamicBadge({
    itemHref: '/dashboard/perjalanan-dinas/persetujuan',
    activePath: '/dashboard',
    trips,
  });
  assert.equal(badgeInactive, 1);

  // When user opens the page, badge must be 0
  const badgeActive = resolveDynamicBadge({
    itemHref: '/dashboard/perjalanan-dinas/persetujuan',
    activePath: '/dashboard/perjalanan-dinas/persetujuan',
    trips,
  });
  assert.equal(badgeActive, 0);
});

test('resolveDynamicBadge returns 0 when user has already visited/dismissed the page', () => {
  const complaints = [{ id: 'c1', is_sensitif: false, status: 'DITERIMA' }];
  const visitedHrefs = new Set(['/dashboard/kelola/aduan']);

  const badge = resolveDynamicBadge({
    itemHref: '/dashboard/kelola/aduan',
    activePath: '/dashboard/kepuasan-mitra',
    complaints,
    visitedHrefs,
  });
  assert.equal(badge, 0);
});

test('resolveDynamicBadge accurately counts real pending tasks', () => {
  const complaints = [
    { id: 'c1', is_sensitif: false, status: 'DITERIMA' },
    { id: 'c2', is_sensitif: false, status: 'DITINDAKLANJUTI' },
    { id: 'c3', is_sensitif: true, status: 'DITERIMA' },
    { id: 'c4', is_sensitif: true, status: 'DIVERIFIKASI' },
    { id: 'c5', is_sensitif: true, status: 'SELESAI' },
  ];

  // Antrean Aduan (non-sensitif pending)
  assert.equal(
    resolveDynamicBadge({
      itemHref: '/dashboard/kelola/aduan',
      activePath: '/dashboard',
      complaints,
    }),
    1
  );

  // Aduan Sensitif Satgas (sensitif DIAJUKAN / DIVERIFIKASI)
  assert.equal(
    resolveDynamicBadge({
      itemHref: '/dashboard/kelola/aduan/sensitif',
      activePath: '/dashboard',
      complaints,
    }),
    2
  );
});
