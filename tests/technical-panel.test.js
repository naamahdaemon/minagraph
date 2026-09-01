const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

[
  'technical-info-button',
  'technical-info-modal',
  'technical-info-content',
  'technical-refresh-button',
  'technical-update-button',
  'technical-activate-update-button',
  'technical-copy-button'
].forEach(id => assert.match(html, new RegExp(`id=["']${id}["']`), `Missing #${id}`));

assert.doesNotMatch(html, /<footer\b/i, 'Credits should no longer consume application layout space');
assert.match(html, /class="technical-info-credits"/, 'Technical information should contain application credits');
assert.match(html, /mina\.naamahdaemon\.eu/);
assert.match(html, /minataur\.net\/api\/restful/);

assert.match(script, /function collectTechnicalDiagnostics\(/);
assert.match(script, /type: 'get-technical-diagnostics'/);
assert.match(script, /function activateApplicationUpdate\(/);
assert.match(script, /addEventListener\('controllerchange'/);
assert.match(worker, /event\.data\?\.type !== 'get-technical-diagnostics'/);
assert.match(worker, /event\.data\?\.type === 'activate-update'/);
assert.match(worker, /self\.skipWaiting\(\)/);
assert.match(worker, /cacheName: CACHE_NAME/);
assert.match(worker, /buildDate: APP_BUILD_DATE/);
assert.match(worker, /mina-graph-explorer-v69/);
assert.match(worker, /FORCE_ACTIVATE_FROM_CACHE = 'mina-graph-explorer-v37'/);
assert.match(worker, /url\.origin === self\.location\.origin/);
assert.match(worker, /networkFirst\(request, request\.mode === 'navigate'\)/);

console.log('Technical panel tests passed');
