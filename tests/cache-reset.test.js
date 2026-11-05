const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../scripts/script.js'), 'utf8');
const worker = fs.readFileSync(path.join(__dirname, '../service-worker.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const helper = source.match(/async function resetApplicationCache\(\) \{[\s\S]*?\n\}/)[0];
assert.match(html, /id="technical-reset-cache-button"/);
assert.match(source, /addEventListener\('click', resetApplicationCache\)/);
assert.doesNotMatch(helper, /unregister|localStorage\.(clear|removeItem)|indexedDB\.deleteDatabase/);

async function run({ online = true, failedUrl = '', cacheStorage = true } = {}) {
  const status = {};
  const button = { disabled: false };
  const deleted = [], requests = [], navigations = [];
  class Parser {
    parseFromString() {
      return { querySelectorAll: () => ['./scripts/script.js', './style/style.css', './style/style.css', 'https://cdn.example.com/library.js'].map(url => ({
        getAttribute: key => key === 'src' ? url : null
      })) };
    }
  }
  const context = {
    console: { error() {} }, URL, Date, DOMParser: Parser,
    navigator: { onLine: online },
    document: { baseURI: 'https://example.com/mina-graph/', getElementById: id => id === 'technical-info-status' ? status : button },
    window: { location: { href: 'https://example.com/mina-graph/?chain=ethereum#graph', replace: url => navigations.push(url) } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (url.includes(failedUrl) && failedUrl) throw new Error('Network error');
      return { ok: true, text: async () => '<html></html>', arrayBuffer: async () => new ArrayBuffer(0) };
    }
  };
  if (cacheStorage) context.window.caches = {
    keys: async () => ['mina-graph-explorer-v234', 'mina-graph-explorer-v236', 'unrelated-app'],
    delete: async key => { deleted.push(key); return true; }
  };
  vm.runInNewContext(`${helper}; this.reset = resetApplicationCache;`, context);
  await context.reset();
  return { status, button, deleted, requests, navigations };
}

(async () => {
  const success = await run();
  assert.deepEqual(success.deleted, ['mina-graph-explorer-v234', 'mina-graph-explorer-v236']);
  assert.equal(success.requests.length, 3, 'Refresh HTML and each unique local script/style, not third-party libraries');
  assert.ok(success.requests.every(({ options }) => options.cache === 'reload'));
  const destination = new URL(success.navigations[0]);
  assert.equal(destination.searchParams.get('chain'), 'ethereum');
  assert.equal(destination.hash, '#graph');
  assert.ok(destination.searchParams.has('_cache_reset'));
  assert.equal(success.button.disabled, false);
  const offline = await run({ online: false });
  assert.equal(offline.requests.length, 0);
  assert.equal(offline.deleted.length, 0);
  assert.equal(offline.navigations.length, 0);
  for (const failedUrl of ['index.html', 'style.css']) {
    const failed = await run({ failedUrl });
    assert.equal(failed.deleted.length, 0, 'Preserve offline resources if downloading fresh files fails');
    assert.equal(failed.navigations.length, 0);
    assert.equal(failed.button.disabled, false);
    assert.match(failed.status.textContent, /Cache reset failed/);
  }
  assert.equal((await run({ cacheStorage: false })).navigations.length, 1, 'HTTP refresh works without CacheStorage');
  const networkFirst = worker.match(/async function networkFirst\(request, navigationFallback = false\) \{[\s\S]*?\n\}/)[0];
  let fallbackReads = 0;
  const context = { fetch: async () => { throw new Error('offline'); }, caches: { match: async () => { fallbackReads++; return {}; } } };
  vm.runInNewContext(`${networkFirst}; this.networkFirst = networkFirst;`, context);
  await assert.rejects(context.networkFirst({ cache: 'reload' }), /offline/);
  assert.equal(fallbackReads, 0, 'A reset must never silently reuse stale offline CSS');
  await context.networkFirst({ cache: 'default' });
  assert.equal(fallbackReads, 1, 'Normal offline fallback still works');
  console.log('Application cache reset tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
