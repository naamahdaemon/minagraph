// Keep this recovery control independent of application initialization and
// version its URL so it still works when the main application script is stale.
(() => {
  let resetInProgress = false;

  async function resetApplicationCache() {
    if (resetInProgress) return;
    const button = document.getElementById('technical-reset-cache-button');
    const status = document.getElementById('technical-info-status');
    const feedback = (message, label) => {
      if (status) status.textContent = message;
      if (button && label) button.textContent = label;
    };
    if (navigator.onLine === false) {
      feedback('Connect to the internet before resetting the application cache.', 'Offline — try again');
      return;
    }
    resetInProgress = true;
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
    feedback('Refreshing application files. Settings and favorites will be kept.', 'Resetting cache…');
    const controller = new AbortController();
    let timeout;
    const deadline = new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error('Cache reset timed out after 30 seconds. Please try again.'));
      }, 30000);
    });
    try {
      await Promise.race([(async () => {
        const pageUrl = new URL(window.location.href);
        const htmlUrl = new URL('index.html', document.baseURI);
        const options = { cache: 'reload', signal: controller.signal };
        const response = await fetch(htmlUrl.href, options);
        if (!response.ok) throw new Error(`Application download failed (${response.status}).`);
        const page = new DOMParser().parseFromString(await response.text(), 'text/html');
        const assets = new Set();
        page.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach(element => {
          const url = new URL(element.getAttribute('src') || element.getAttribute('href'), htmlUrl);
          if (url.origin === pageUrl.origin) assets.add(url.href);
        });
        let downloaded = 0;
        await Promise.all([...assets].map(async url => {
          const asset = await fetch(url, options);
          if (!asset.ok) throw new Error(`Application file download failed (${asset.status}).`);
          await asset.arrayBuffer();
          if (controller.signal.aborted) return;
          downloaded++;
          feedback(`Refreshing files: ${downloaded}/${assets.size}.`, `Resetting cache… ${downloaded}/${assets.size}`);
        }));
        if (controller.signal.aborted) throw new Error('Download timed out.');
        if ('caches' in window) {
          feedback('Removing old application resource caches...', 'Clearing cache…');
          const keys = await window.caches.keys();
          if (controller.signal.aborted) throw new Error('Cache reset timed out.');
          await Promise.all(keys.filter(key => key.startsWith('mina-graph-explorer-'))
            .map(key => window.caches.delete(key)));
        }
        if (controller.signal.aborted) throw new Error('Cache reset timed out.');
        // Preserve worker registration/push subscriptions, localStorage and IDB.
        pageUrl.searchParams.set('_cache_reset', String(Date.now()));
        feedback('Cache reset completed. Reloading application...', 'Reloading…');
        window.location.replace(pageUrl.href);
      })(), deadline]);
    } catch (error) {
      controller.abort();
      const reason = error.name === 'AbortError' ? 'Download timed out after 30 seconds. Please try again.' : error.message;
      feedback(`Cache reset failed: ${reason}`, 'Retry cache reset');
      console.error('[Cache reset]', error);
    } finally {
      clearTimeout(timeout);
      resetInProgress = false;
      if (button) {
        button.disabled = false;
        button.setAttribute('aria-busy', 'false');
      }
    }
  }

  // Capture before any stale application handler to avoid two competing resets
  // when HTML and application JavaScript come from different cached versions.
  document.addEventListener('click', async event => {
    if (!event.target.closest?.('#technical-reset-cache-button')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    await resetApplicationCache();
  }, true);
})();
