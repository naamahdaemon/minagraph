const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../scripts/cache-reset.js'), 'utf8');
const worker = fs.readFileSync(path.join(__dirname, '../service-worker.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const helper = source;
assert.match(html, /id="technical-reset-cache-button"/);
assert.match(html, /scripts\/cache-reset\.js\?v=237/);
assert.match(source, /event\.stopImmediatePropagation\(\)/);
assert.doesNotMatch(helper, /unregister|localStorage\.(clear|removeItem)|indexedDB\.deleteDatabase/);

async function run({ online = true, failedUrl = '', cacheStorage = true, holdNetwork = false } = {}) {
  const status = {};
  const button = { disabled: false, textContent: 'Reset cache and reload', setAttribute(name, value) { this[name] = value; } };
  let clickHandler, deadline, release;
  const gate = holdNetwork ? new Promise(resolve => { release = resolve; }) : Promise.resolve();
  const deleted = [], requests = [], navigations = [];
  class Parser {
    parseFromString() {
      return { querySelectorAll: () => ['./scripts/script.js', './style/style.css', './style/style.css', 'https://cdn.example.com/library.js'].map(url => ({
        getAttribute: key => key === 'src' ? url : null
      })) };
    }
  }
  const context = {
    console: { error() {} }, URL, Date, DOMParser: Parser, AbortController,
    setTimeout: callback => { deadline = callback; return 1; }, clearTimeout() {},
    navigator: { onLine: online },
    document: { baseURI: 'https://example.com/mina-graph/', getElementById: id => id === 'technical-info-status' ? status : button, addEventListener: (name, handler, capture) => { assert.equal(capture, true); clickHandler = handler; } },
    window: { location: { href: 'https://example.com/mina-graph/?chain=ethereum#graph', replace: url => navigations.push(url) } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      await gate;
      if (url.includes(failedUrl) && failedUrl) throw new Error('Network error');
      return { ok: true, text: async () => '<html></html>', arrayBuffer: async () => new ArrayBuffer(0) };
    }
  };
  if (cacheStorage) context.window.caches = {
    keys: async () => ['mina-graph-explorer-v234', 'mina-graph-explorer-v236', 'unrelated-app'],
    delete: async key => { deleted.push(key); return true; }
  };
  vm.runInNewContext(helper, context);
  const event = { target: { closest: () => button }, preventDefault() {}, stopImmediatePropagation() {} };
  const action = clickHandler(event);
  if (!holdNetwork) await action;
  return { status, button, deleted, requests, navigations, action, release, expire: () => deadline(), click: () => clickHandler(event) };
}

(async () => {
  const pending = await run({ holdNetwork: true });
  assert.equal(pending.button.textContent, 'Resetting cache…');
  assert.equal(pending.button.disabled, true);
  assert.equal(pending.button['aria-busy'], 'true');
  await pending.click();
  assert.equal(pending.requests.length, 1, 'Ignore double taps');
  pending.release();
  await pending.action;
  assert.equal(pending.navigations.length, 1);
  const timeout = await run({ holdNetwork: true });
  timeout.expire();
  await timeout.action;
  assert.match(timeout.status.textContent, /30 seconds/);
  assert.equal(timeout.button.textContent, 'Retry cache reset');
  assert.equal(timeout.button.disabled, false);
  assert.equal(timeout.deleted.length, 0);
  timeout.release();
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
