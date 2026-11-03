import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for node environment
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

globalThis.window = {};
globalThis.localStorage = storageMock;

// Import storageSync dynamically or test logic directly
test('STORAGE_KEYS contains all keys for Modul 7-13', async () => {
  const { STORAGE_KEYS } = await import('../src/lib/storage-sync.ts');
  assert.equal(STORAGE_KEYS.SURVEYS, 'simpro_surveys');
  assert.equal(STORAGE_KEYS.SURVEY_INVITATIONS, 'simpro_survey_invitations');
  assert.equal(STORAGE_KEYS.PUBLICATIONS, 'simpro_publications');
  assert.equal(STORAGE_KEYS.TRIPS, 'simpro_trips');
  assert.equal(STORAGE_KEYS.RKA_DOCUMENTS, 'simpro_rka_documents');
  assert.equal(STORAGE_KEYS.RKA_REALIZATIONS, 'simpro_rka_realizations');
  assert.equal(STORAGE_KEYS.RPS_SUBMISSIONS, 'simpro_rps_submissions');
  assert.equal(STORAGE_KEYS.EVALUATIONS, 'simpro_evaluations');
  assert.equal(STORAGE_KEYS.COMPLAINTS, 'simpro_complaints');
});

test('storageSync get returns fallback if key does not exist', async () => {
  const { storageSync } = await import('../src/lib/storage-sync.ts');
  storageMock.clear();
  const res = storageSync.get('non_existent', [{ id: '1', title: 'test' }]);
  assert.deepEqual(res, [{ id: '1', title: 'test' }]);
});

test('storageSync set and get persists data', async () => {
  const { storageSync } = await import('../src/lib/storage-sync.ts');
  storageMock.clear();
  const sample = [{ id: 's1', nama: 'Survey Kepuasan Industri' }];
  storageSync.set('test_surveys', sample);
  const retrieved = storageSync.get('test_surveys', []);
  assert.deepEqual(retrieved, sample);
});

test('storageSync prepend adds item to front and prevents duplicate IDs', async () => {
  const { storageSync } = await import('../src/lib/storage-sync.ts');
  storageMock.clear();
  storageSync.set('items', [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }]);
  
  const newItem = { id: '3', name: 'Item 3' };
  const updated = storageSync.prepend('items', newItem);
  assert.equal(updated.length, 3);
  assert.equal(updated[0].id, '3');

  // Prepending existing ID should replace/move to front without duplicating
  const duplicate = { id: '2', name: 'Item 2 Modified' };
  const prependedDup = storageSync.prepend('items', duplicate);
  assert.equal(prependedDup.length, 3);
  assert.equal(prependedDup[0].id, '2');
  assert.equal(prependedDup[0].name, 'Item 2 Modified');
});

test('storageSync update modifies specific item by id', async () => {
  const { storageSync } = await import('../src/lib/storage-sync.ts');
  storageMock.clear();
  storageSync.set('items', [{ id: '1', status: 'DRAF' }, { id: '2', status: 'DRAF' }]);
  
  const updated = storageSync.update('items', '1', { status: 'AKTIF' });
  assert.equal(updated.find((i) => i.id === '1')?.status, 'AKTIF');
  assert.equal(updated.find((i) => i.id === '2')?.status, 'DRAF');
});

test('storageSync remove deletes specific item by id', async () => {
  const { storageSync } = await import('../src/lib/storage-sync.ts');
  storageMock.clear();
  storageSync.set('items', [{ id: '1' }, { id: '2' }]);
  
  const updated = storageSync.remove('items', '1');
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, '2');
});
