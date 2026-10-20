const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const helperSource = source.match(/const SETTINGS_BACKUP_FORMAT[\s\S]*?function restoreExportableLocalStorage\(settings, storage = localStorage\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(helperSource, 'Settings backup helpers should be available');

const context = {};
vm.runInNewContext(`${helperSource}; api = { isExportableMinagraphStorageKey, collectExportableLocalStorage, normalizeImportedSettingsBackup, restoreExportableLocalStorage };`, context);
const { api } = context;

function createStorage(initial) {
  const data = new Map(Object.entries(initial));
  return {
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] ?? null; },
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(key); },
    entries() { return [...data.entries()]; },
  };
}

assert.equal(api.isExportableMinagraphStorageKey('minagraph-adaptive-viewport-settings'), true);
assert.equal(api.isExportableMinagraphStorageKey('start-key-mina'), true);
assert.equal(api.isExportableMinagraphStorageKey('favorites'), true);
assert.equal(api.isExportableMinagraphStorageKey('apiTokens'), true);
assert.equal(api.isExportableMinagraphStorageKey('mge_user_id'), false);
assert.equal(api.isExportableMinagraphStorageKey('wc@2:client:0.3//session'), false);

const sourceStorage = createStorage({
  'minagraph-adaptive-viewport-enabled': 'true',
  'minagraph-date-playback-settings': '{"cadence":0.5}',
  'start-key-mina': 'B62qtest',
  favorites: '[{"address":"B62qtest"}]',
  apiTokens: '{"mina":"secret"}',
  mge_user_id: 'installation-id',
  'wc@2:client': 'third-party-state',
});
const exported = api.collectExportableLocalStorage(sourceStorage);
assert.deepEqual(Object.keys(exported).sort(), [
  'apiTokens',
  'favorites',
  'minagraph-adaptive-viewport-enabled',
  'minagraph-date-playback-settings',
  'start-key-mina',
].sort());
assert.equal(exported['minagraph-date-playback-settings'], '{"cadence":0.5}', 'raw values must round-trip unchanged');

const versioned = api.normalizeImportedSettingsBackup({
  format: 'minagraph-settings',
  version: 1,
  exportedAt: '2026-10-20T00:00:00.000Z',
  settings: exported,
});
assert.equal(versioned.apiTokens, '{"mina":"secret"}');

const legacy = api.normalizeImportedSettingsBackup({
  favorites: [{ address: 'legacy' }],
  'param-depth': 4,
  mge_user_id: 'must-not-import',
});
assert.equal(legacy.favorites, '[{"address":"legacy"}]');
assert.equal(legacy['param-depth'], '4');
assert.equal(Object.hasOwn(legacy, 'mge_user_id'), false);

const targetStorage = createStorage({
  favorites: 'old',
  'minagraph-obsolete-setting': 'old',
  mge_user_id: 'keep-me',
  'wc@2:client': 'keep-third-party',
});
api.restoreExportableLocalStorage(versioned, targetStorage);
assert.equal(targetStorage.getItem('favorites'), '[{"address":"B62qtest"}]');
assert.equal(targetStorage.getItem('minagraph-obsolete-setting'), null);
assert.equal(targetStorage.getItem('mge_user_id'), 'keep-me');
assert.equal(targetStorage.getItem('wc@2:client'), 'keep-third-party');

assert.throws(() => api.normalizeImportedSettingsBackup({
  format: 'minagraph-settings',
  version: 99,
  settings: {},
}), /Unsupported or invalid/);

console.log('Settings backup tests passed');
