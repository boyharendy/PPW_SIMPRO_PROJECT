import test from 'node:test';
import assert from 'node:assert/strict';

// Helper tests
function formatRupiah(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function calculateAbsorptionPercentage(realization, budget) {
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((realization / budget) * 100));
}

function generateTicketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ADU-${segment(4)}-${segment(4)}-${segment(4)}`;
}

test('formatRupiah formats IDR correctly', () => {
  const res = formatRupiah(1500000);
  assert.match(res, /1\.500\.000/);
});

test('calculateAbsorptionPercentage handles zero and valid cases', () => {
  assert.equal(calculateAbsorptionPercentage(50, 100), 50);
  assert.equal(calculateAbsorptionPercentage(0, 100), 0);
  assert.equal(calculateAbsorptionPercentage(50, 0), 0);
  assert.equal(calculateAbsorptionPercentage(150, 100), 100);
});

test('generateTicketCode produces valid format', () => {
  const code = generateTicketCode();
  assert.match(code, /^ADU-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

// Complaints filtering & SLA helpers
function filterComplaints(complaints, { isSensitive, status, category }) {
  return complaints.filter((c) => {
    if (isSensitive !== undefined && c.is_sensitif !== isSensitive) return false;
    if (status && status !== 'SEMUA' && c.status !== status) return false;
    if (category && category !== 'SEMUA' && c.kategori !== category) return false;
    return true;
  });
}

function isDispositionOverdue(deadlineDate, completedDate) {
  if (completedDate) return false;
  const now = new Date('2025-10-15T00:00:00Z');
  const d = new Date(deadlineDate);
  return d < now;
}

test('filterComplaints separates sensitive and non-sensitive complaints', () => {
  const items = [
    { id: 1, is_sensitif: false, status: 'DITERIMA', kategori: 'FASILITAS' },
    { id: 2, is_sensitif: true, status: 'DITINDAKLANJUTI', kategori: 'PERUNDUNGAN_KEKERASAN' },
    { id: 3, is_sensitif: false, status: 'SELESAI', kategori: 'AKADEMIK' },
  ];
  const regular = filterComplaints(items, { isSensitive: false });
  assert.equal(regular.length, 2);
  assert.equal(regular.every((c) => !c.is_sensitif), true);

  const sensitive = filterComplaints(items, { isSensitive: true });
  assert.equal(sensitive.length, 1);
  assert.equal(sensitive[0].id, 2);
});

test('isDispositionOverdue identifies late dispositions correctly', () => {
  assert.equal(isDispositionOverdue('2025-10-10', null), true); // Past deadline
  assert.equal(isDispositionOverdue('2025-10-20', null), false); // Future deadline
  assert.equal(isDispositionOverdue('2025-10-10', '2025-10-09'), false); // Already completed
});

