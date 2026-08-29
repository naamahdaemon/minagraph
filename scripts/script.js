const { Graph } = graphology;
let currentTheme = "dark"; // 👈 Declare it globally so reducers and other functions can use it
let API_TOKEN = "minataur-token:your_minataur_token_here";
let BASE_KEY = "";
let LIMIT = 10;
let FIRST_ITERATION_LIMIT = 10;
let DEPTH = 2;
let FETCH_START_TIMESTAMP = null;
let FETCH_END_TIMESTAMP = null;
const fetchBlockRangeCache = new Map();
const WIDTH = 2000;
const HEIGHT = 2000;
const visitedKeys = new Set();
let visitedKeysByChain = new Map();
const nameColorMap = new Map();
let transactionsByNeighbor = {};

function dateInputToUtcTimestamp(value, endOfDay = false) {
  if (!value) return null;
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const timestamp = Date.parse(`${value}${suffix}`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function syncFetchDateRangeFromInputs() {
  const startValue = document.getElementById("param-start-date")?.value || "";
  const endValue = document.getElementById("param-end-date")?.value || "";
  const start = dateInputToUtcTimestamp(startValue, false);
  const end = dateInputToUtcTimestamp(endValue, true);
  if (start !== null && end !== null && start > end) {
    showErrorPopup("Fetch start date must be before or equal to end date.");
    return false;
  }
  FETCH_START_TIMESTAMP = start;
  FETCH_END_TIMESTAMP = end;
  return true;
}

function getTransactionTimestampMs(transaction) {
  const value = transaction?.timestamp ?? transaction?.blockTime ?? transaction?.timeStamp;
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && !/^\d+(\.\d+)?$/.test(value)) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric < 1e12 ? numeric * 1000 : numeric;
}

function isTransactionInFetchDateRange(transaction) {
  if (FETCH_START_TIMESTAMP === null && FETCH_END_TIMESTAMP === null) return true;
  const timestamp = getTransactionTimestampMs(transaction);
  if (timestamp === null) return false;
  return (FETCH_START_TIMESTAMP === null || timestamp >= FETCH_START_TIMESTAMP) &&
    (FETCH_END_TIMESTAMP === null || timestamp <= FETCH_END_TIMESTAMP);
}

function filterTransactionsByFetchDateRange(transactions) {
  return (transactions || []).filter(isTransactionInFetchDateRange);
}

let totalSteps = 0;
let currentStep = 0;
let pause = false;
let graph, renderer;

let hoveredNode = null;
let searchQuery = "";
let selectedNode = null;
let showNodeTransactionsChronologically = false;

//let commandTypeFilter = null;
const commandTypeFilter = new Set(); // allows multiple command types
const chainFilter = new Set();

let showAllLabels = true;
let selectedBlockchain = "mina"; // 👈 default value

const delayByBlockchain = {
  mina: 0,
  ethereum: 300,
  zksync: 300,
  optimism: 300,
  arbitrum: 300,
  polygon: 300,
  bsc: 300,
  solana: 300,
  cronos: 500,
  tezos: 300,
  base: 300,
};

let cancelRequested = false;
let isLayoutRunning = false;
let layoutWorker;
let currentLayout = null;  // the one currently running
let previousLayout = null;
const LAYOUT_STORAGE_KEY = "layoutSettings";
const FILTER_PANEL_VISIBILITY_KEY = "minagraphFilterPanelVisible";
let isFilterPanelVisible = true;

// Opt-in bridge for browser automation. Sigma renders nodes on canvases, so
// Playwright cannot locate them through the DOM. Getters are used because both
// objects can be replaced when the graph is reloaded.
if (new URLSearchParams(window.location.search).get("e2e") === "1") {
  Object.defineProperty(window, "__MINAGRAPH_TEST__", {
    configurable: true,
    value: Object.freeze({
      get graph() {
        return graph;
      },
      get renderer() {
        return renderer;
      },
    }),
  });
}

const commandTypeAliases = {
  payment: ["payment", "transfer"],
  zkapp: ["zkapp", "contract_call","contract_creation"],
  delegation: ["delegation","stake","delegate"],
  token_transfer: ["token_transfer", "nft_transfer"],
};  
// Reverse map: actual command types → legend alias(es)
const expandedCommandTypeFilter = () => {
  const expanded = new Set();
  commandTypeFilter.forEach(alias => {
    const realTypes = commandTypeAliases[alias] || [alias];
    realTypes.forEach(t => expanded.add(t));
  });
  return expanded;
};

function transactionMatchesActiveLegendFilters(transaction) {
  const visibleTypes = expandedCommandTypeFilter();
  const command = transaction?.command_type || transaction?.label;
  const typeMatch = visibleTypes.size === 0 || visibleTypes.has(command);
  const chainMatch = chainFilter.size === 0 || chainFilter.has(transaction?.blockchain);
  return typeMatch && chainMatch;
}

function refreshLegendFilteredViews() {
  if (typeof renderer !== "undefined" && renderer?.refresh) renderer.refresh();
  if (selectedNode && graph?.hasNode(selectedNode)) showNodePanel(selectedNode, false);
}
const MINATAUR_API_ADDRESS = "B62qk3SwELMgRYALi8fiQvpqfBs48m3cqCd7o4d5dJUqEQ6mW9gEySm";
const DONATION_ADDRESS = "B62qrZNc5YzuBzSaCPSNRASCkPjKosaj3zYZELM6X5nCsha6rEh6s8F";

/*
const WALLETCONNECT_PROJECT_ID = "e7c987c4886cb9b77abbda154818712e"; // à créer sur https://cloud.walletconnect.com/
const EVM_DONATION_ADDRESS = "0x52356a419879331172c1326909316bb8205071e0"; // replace with your address

const ERC20_ADDRESSES = {
  USDT: {
    polygon: "0x3813e82e6f7098b9583FC0F33a962D02018B6803",
    ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    bsc: "0x55d398326f99059fF775485246999027B3197955"
  },
  USDC: {
    polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", //0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
    ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    bsc: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"
  }
};

const CHAIN_NAMES = {
  1: "ethereum",
  56: "bsc",
  137: "polygon"
};

const ERC20_ABI = [
  "function transfer(address to, uint256 value) public returns (bool)",
  "function decimals() public view returns (uint8)"
];
*/
let allTimestamps = [];  // 🔁 collected from edges
let currentRange = [0, 0];
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const DATE_WINDOW_PANEL_STORAGE_KEY = "minagraph-date-window-panel-open";
let dateWindowShiftState = null;
let updatingRangeFromWindowShift = false;
let histogramChart;
let isFullscreen = false;
let sidebar;
let details;
let tooltip;
let panel;
let apiTokenInput;
let blockchainSelect;
let tokenInput;
let chain;
let toggleBtn;
let searchDiv;
let searchInput;
let algorithmSelect;
let faSettings;
let ordSettings;
let themeToggleBtn;
let appContainer;
let inputs;
const SIDEBAR_STATE_STORAGE_KEY = "minagraph-left-sidebar-open";

function setLeftSidebarOpen(open, { persist = false, restoreFocus = false } = {}) {
  const sidebarElement = sidebar || document.getElementById("left-sidebar");
  const appElement = appContainer || document.getElementById("app-container");
  const menuButton = document.getElementById("menu-toggle");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!sidebarElement || !appElement) return;

  const isOpen = Boolean(open);
  const isDesktop = window.innerWidth >= 769;
  sidebarElement.classList.toggle("open", isOpen);
  sidebarElement.setAttribute("aria-hidden", String(!isOpen));
  appElement.classList.toggle("sidebar-open", isOpen && isDesktop);
  document.body.classList.toggle("left-sidebar-open", isOpen);
  menuButton?.setAttribute("aria-expanded", String(isOpen));
  menuButton?.setAttribute("aria-label", isOpen ? "Close settings" : "Open settings");
  menuButton?.setAttribute("title", isOpen ? "Close settings (S)" : "Open settings (S)");
  if (backdrop) {
    backdrop.hidden = !isOpen || isDesktop;
    backdrop.classList.toggle("visible", isOpen && !isDesktop);
  }
  if (persist && isDesktop) localStorage.setItem(SIDEBAR_STATE_STORAGE_KEY, String(isOpen));
  if (restoreFocus && !isOpen) menuButton?.focus({ preventScroll: true });
  updateLegendOffset();
}

function toggleLeftSidebar() {
  const sidebarElement = sidebar || document.getElementById("left-sidebar");
  setLeftSidebarOpen(!sidebarElement?.classList.contains("open"), { persist: true });
}

function setNodePanelOpen(open, { restoreFocus = false } = {}) {
  const nodePanel = document.getElementById("side-panel");
  const dateSlicer = document.getElementById("date-slicer-container");
  if (!nodePanel) return;
  const isOpen = Boolean(open);
  const isDesktop = window.innerWidth >= 769;
  nodePanel.style.removeProperty("display");
  nodePanel.classList.toggle("open", isOpen);
  nodePanel.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("node-panel-open", isOpen);
  dateSlicer?.classList.toggle("on-left", isOpen && isDesktop);
  if (restoreFocus && !isOpen) {
    document.getElementById("sigma-container")?.focus({ preventScroll: true });
  }
}

function initializeNodePanelResize() {
  const nodePanel = document.getElementById("side-panel");
  const resizeHandle = document.getElementById("node-panel-resize-handle");
  if (!nodePanel || !resizeHandle) return;

  const clampWidth = width => Math.min(Math.max(width, 360), Math.max(360, window.innerWidth - 240));
  const applyWidth = width => {
    if (window.innerWidth <= 768) {
      nodePanel.style.removeProperty("width");
      return;
    }
    nodePanel.style.width = `${clampWidth(width)}px`;
  };

  resizeHandle.addEventListener("pointerdown", event => {
    if (window.innerWidth <= 768) return;
    event.preventDefault();
    resizeHandle.setPointerCapture(event.pointerId);
    document.body.classList.add("node-panel-resizing");
  });

  resizeHandle.addEventListener("pointermove", event => {
    if (!resizeHandle.hasPointerCapture(event.pointerId)) return;
    applyWidth(window.innerWidth - event.clientX);
  });

  const finishResize = event => {
    if (resizeHandle.hasPointerCapture(event.pointerId)) resizeHandle.releasePointerCapture(event.pointerId);
    document.body.classList.remove("node-panel-resizing");
  };
  resizeHandle.addEventListener("pointerup", finishResize);
  resizeHandle.addEventListener("pointercancel", finishResize);
  resizeHandle.addEventListener("dblclick", () => nodePanel.style.removeProperty("width"));
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 768) nodePanel.style.removeProperty("width");
    else if (nodePanel.style.width) applyWidth(nodePanel.getBoundingClientRect().width);
  });
}

async function copyNodeKey(key, button) {
  try {
    await navigator.clipboard.writeText(key);
  } catch (_error) {
    const input = document.createElement("textarea");
    input.value = key;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  if (!button) return;
  const originalLabel = button.getAttribute("aria-label") || "Copy address";
  button.classList.add("copied");
  button.setAttribute("aria-label", "Address copied");
  button.setAttribute("title", "Address copied");
  const status = button.querySelector("span");
  if (status) status.textContent = "Copied";
  setTimeout(() => {
    if (!button.isConnected) return;
    button.classList.remove("copied");
    button.setAttribute("aria-label", originalLabel);
    button.setAttribute("title", originalLabel);
    if (status) status.textContent = "Copy";
  }, 1600);
}
let layoutBtn;
let toggleTokenBtn;
let arrow;
let tokenSection;
let sigmaContainer;
let controls;
let footer;
let fullscreenBtn;
let donateBtn;
let exitFullscreenBtn;
let slicer;
let extraTokens = {}; // New loaded tokens
let auroProvider = null;
let zoomSlider;    // no const/var inside DOMContentLoaded
let rotateSlider;
let cameraControlsBound = false;
let recenterAfterLayout = false;
const NODE_TRANSACTION_SORT_STORAGE_KEY = "minagraph-node-transaction-sort";
let nodeTransactionSort = loadNodeTransactionSort();
let lastTechnicalDiagnostics = null;
let reloadAfterServiceWorkerActivation = false;
let sigmaWebGlContextLosses = 0;
let sigmaWebGlLossIncidents = 0;
let sigmaWebGlRecoveries = 0;
let sigmaRecoveryTimer = null;
let sigmaRecoveryInProgress = false;

function positionRotateSlider() {
  if (!rotateSlider || !sigmaContainer) return;

  const graphBounds = sigmaContainer.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const visibleLeft = Math.max(0, graphBounds.left);
  const visibleRight = Math.min(viewportWidth, graphBounds.right);
  const visibleTop = Math.max(0, graphBounds.top);
  const visibleBottom = Math.min(viewportHeight, graphBounds.bottom);
  const visibleWidth = Math.max(0, visibleRight - visibleLeft);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  if (!visibleWidth || !visibleHeight) return;

  const edgeOffset = Math.min(40, Math.max(18, visibleHeight * 0.045));
  const width = Math.min(240, Math.max(140, visibleWidth * 0.42));
  const sliderCenterX = visibleLeft + visibleWidth / 2;
  let sliderCenterY = visibleBottom - edgeOffset;
  const dateSlicer = document.getElementById("date-slicer-container");

  if (dateSlicer && getComputedStyle(dateSlicer).display !== "none") {
    const slicerBounds = dateSlicer.getBoundingClientRect();
    const overlapsHorizontally =
      sliderCenterX + width / 2 > slicerBounds.left &&
      sliderCenterX - width / 2 < slicerBounds.right;

    if (overlapsHorizontally && slicerBounds.bottom < visibleBottom) {
      const sliderHandleRadius = 9;
      const slicerGap = 14;
      sliderCenterY = Math.max(
        sliderCenterY,
        Math.min(visibleBottom - sliderHandleRadius, slicerBounds.bottom + slicerGap + sliderHandleRadius)
      );
    }
  }

  const bottom = Math.max(0, viewportHeight - sliderCenterY);

  rotateSlider.style.left = `${sliderCenterX}px`;
  rotateSlider.style.bottom = `${bottom}px`;
  rotateSlider.style.width = `${width}px`;
}
let sigmaRecoveryIncidentActive = false;
let sigmaRecoverySnapshot = null;
let sigmaRecoveryLastError = 'None';
const sigmaLostCanvases = new Set();

function rebuildSigmaRendererAfterContextLoss() {
  sigmaRecoveryTimer = null;
  if (sigmaRecoveryInProgress || (!renderer && !sigmaRecoverySnapshot) || !graph) return;

  if (renderer) {
    const contexts = Object.values(renderer.webGLContexts || {});
    if (contexts.some(context => context?.isContextLost?.())) {
      waitForSigmaWebGlRestoration();
      return;
    }
  }
  sigmaRecoveryInProgress = true;

  if (renderer) {
    const failedRenderer = renderer;
    sigmaRecoverySnapshot = {
      container: failedRenderer.getContainer(),
      settings: failedRenderer.getSettings(),
      cameraState: failedRenderer.getCamera().getState(),
      customBBox: failedRenderer.getCustomBBox()
    };

    try {
      // Sigma 2.4 explicitly invokes WEBGL_lose_context from killLayer. During
      // recovery that would reset the GPU again just before creating the new
      // renderer. The restored contexts can be released normally instead.
      failedRenderer.webGLContexts = {};
      failedRenderer.kill();
    } catch (error) {
      console.warn('[Sigma] Failed renderer could not be fully released:', error);
    }
    renderer = null;
  }

  const { container, settings, cameraState, customBBox } = sigmaRecoverySnapshot;

  try {
    container.replaceChildren();
    renderer = new Sigma(graph, container, settings);
    if (customBBox) renderer.setCustomBBox(customBBox);
    renderer.getCamera().setState(cameraState);
    bindSigmaRenderingRecovery();
    setupInteractions();
    syncCameraControlsToRenderer();
    renderer.getCamera().setState(cameraState);
    renderer.refresh();
    sigmaWebGlRecoveries += 1;
    sigmaRecoveryIncidentActive = false;
    sigmaRecoverySnapshot = null;
    sigmaRecoveryLastError = 'None';
    sigmaLostCanvases.clear();
    console.info('[Sigma] Renderer and WebGL resources rebuilt successfully.');
  } catch (error) {
    renderer = null;
    sigmaRecoveryLastError = error?.stack || error?.message || String(error);
    console.error('[Sigma] Unable to rebuild renderer after WebGL context loss:', error);
    clearTimeout(sigmaRecoveryTimer);
    sigmaRecoveryTimer = setTimeout(rebuildSigmaRendererAfterContextLoss, 1500);
  } finally {
    sigmaRecoveryInProgress = false;
  }
}

function scheduleSigmaRendererRecovery(delay = 100) {
  if (sigmaRecoveryInProgress) return;
  clearTimeout(sigmaRecoveryTimer);
  sigmaRecoveryTimer = setTimeout(rebuildSigmaRendererAfterContextLoss, delay);
}

function waitForSigmaWebGlRestoration() {
  if (sigmaRecoveryInProgress) return;
  clearTimeout(sigmaRecoveryTimer);
  sigmaRecoveryTimer = setTimeout(() => {
    sigmaRecoveryTimer = null;
    const contexts = Object.values(renderer?.webGLContexts || {});
    if (contexts.length && contexts.every(context => !context?.isContextLost?.())) {
      scheduleSigmaRendererRecovery();
    } else {
      waitForSigmaWebGlRestoration();
    }
  }, 500);
}

function bindSigmaRenderingRecovery() {
  if (!renderer?.getCanvases) return;
  Object.values(renderer.getCanvases()).forEach(canvas => {
    if (canvas.dataset.minagraphWebglRecoveryBound === 'true') return;
    canvas.dataset.minagraphWebglRecoveryBound = 'true';
    canvas.addEventListener('webglcontextlost', event => {
      if (sigmaRecoveryInProgress) return;
      event.preventDefault();
      sigmaWebGlContextLosses += 1;
      sigmaLostCanvases.add(canvas);
      if (!sigmaRecoveryIncidentActive) {
        sigmaRecoveryIncidentActive = true;
        sigmaWebGlLossIncidents += 1;
      }
      console.warn('[Sigma] WebGL context lost; waiting for all contexts to be restored.');
      waitForSigmaWebGlRestoration();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      if (sigmaRecoveryInProgress) return;
      sigmaLostCanvases.delete(canvas);
      console.info(`[Sigma] Browser restored a WebGL context; ${sigmaLostCanvases.size} still lost.`);
      if (sigmaLostCanvases.size === 0) scheduleSigmaRendererRecovery();
    });
  });
}

function collectSigmaRenderingDiagnostics() {
  const container = renderer?.getContainer?.() || document.getElementById('sigma-container');
  const canvases = renderer?.getCanvases?.() || {};
  const canvasBuffers = Object.entries(canvases).map(([name, canvas]) =>
    `${name}: ${canvas.width}x${canvas.height} px / ${canvas.clientWidth}x${canvas.clientHeight} CSS`
  );
  const gl = Object.values(renderer?.webGLContexts || {})[0] || null;
  const contextLost = gl?.isContextLost?.() === true;
  const webGlApi = gl
    ? typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
      ? 'WebGL2'
      : 'WebGL1 compatibility'
    : 'Unavailable';
  const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
  const webGlRenderer = contextLost
    ? 'Context lost'
    : debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : gl ? 'Available (renderer hidden)' : 'Unavailable';

  return {
    devicePixelRatio: window.devicePixelRatio || 1,
    visualViewport: window.visualViewport
      ? `${Math.round(window.visualViewport.width)}x${Math.round(window.visualViewport.height)}, scale ${window.visualViewport.scale}`
      : 'Unavailable',
    sigmaContainer: container
      ? `${container.clientWidth}x${container.clientHeight} CSS px`
      : 'Unavailable',
    sigmaPixelRatio: renderer?.pixelRatio ?? 'Renderer not initialized',
    sigmaPixelRatioLimit: /Android/i.test(navigator.userAgent) && /Chrome\/|Chromium\/|EdgA\//i.test(navigator.userAgent)
      ? '2 (Android Chromium compatibility)'
      : 'Native device ratio',
    sigmaCanvasBuffers: canvasBuffers.join(' | ') || 'Renderer not initialized',
    webGlApi,
    webGlRenderer,
    webGlLimits: gl && !contextLost
      ? `texture ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}, renderbuffer ${gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)}`
      : contextLost ? 'Context lost' : 'Unavailable',
    webGlContextLosses: sigmaWebGlContextLosses,
    webGlLossIncidents: sigmaWebGlLossIncidents,
    webGlRecoveries: sigmaWebGlRecoveries,
    webGlContextsAwaitingRestore: sigmaLostCanvases.size,
    webGlRecoveryError: sigmaRecoveryLastError
  };
}

navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (!reloadAfterServiceWorkerActivation) return;
  reloadAfterServiceWorkerActivation = false;
  window.location.reload();
});

function requestServiceWorkerDiagnostics(worker) {
  if (!worker) return Promise.resolve(null);

  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(null), 1500);
    channel.port1.onmessage = event => {
      clearTimeout(timeout);
      resolve(event.data || null);
    };
    worker.postMessage({ type: 'get-technical-diagnostics' }, [channel.port2]);
  });
}

async function collectTechnicalDiagnostics() {
  const supportsServiceWorker = 'serviceWorker' in navigator;
  const registration = supportsServiceWorker
    ? await navigator.serviceWorker.getRegistration().catch(() => null)
    : null;
  const worker = navigator.serviceWorker?.controller || registration?.active || null;
  const workerInfo = await requestServiceWorkerDiagnostics(worker);
  const waitingWorkerInfo = await requestServiceWorkerDiagnostics(registration?.waiting || null);
  const subscription = registration?.pushManager
    ? await registration.pushManager.getSubscription().catch(() => null)
    : null;
  const cacheNames = 'caches' in window ? await caches.keys().catch(() => []) : [];
  const maxActions = typeof Notification !== 'undefined' && Number.isInteger(Notification.maxActions)
    ? Notification.maxActions
    : null;
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  const sigmaDiagnostics = collectSigmaRenderingDiagnostics();

  return {
    appVersion: workerInfo?.cacheName || 'Unavailable',
    availableVersion: waitingWorkerInfo?.cacheName || 'None',
    buildDate: workerInfo?.buildDate || 'Unavailable',
    serviceWorker: !supportsServiceWorker
      ? 'Unsupported'
      : registration?.waiting
        ? 'Update waiting'
        : registration?.installing
          ? 'Installing'
          : registration?.active
            ? 'Active'
            : 'Not registered',
    controlledPage: navigator.serviceWorker?.controller ? 'Yes' : 'No',
    workerScope: registration?.scope || 'Unavailable',
    cachedVersion: workerInfo?.cacheName && cacheNames.includes(workerInfo.cacheName)
      ? 'Present'
      : cacheNames.length
        ? `Other cache: ${cacheNames.join(', ')}`
        : 'No application cache',
    notificationPermission: typeof Notification === 'undefined' ? 'Unsupported' : Notification.permission,
    pushSubscription: !registration?.pushManager ? 'Unsupported' : subscription ? 'Active' : 'Inactive',
    notificationButtons: maxActions === null
      ? 'Not reported by browser'
      : maxActions > 0
        ? `Supported (maximum ${maxActions})`
        : 'Not supported (maximum 0)',
    displayMode: standalone ? 'Installed PWA' : 'Browser tab',
    network: navigator.onLine ? 'Online' : 'Offline',
    ...sigmaDiagnostics,
    checkedAt: new Date().toLocaleString(),
    userAgent: navigator.userAgent,
    updateReady: Boolean(registration?.waiting)
  };
}

function renderTechnicalDiagnostics(diagnostics) {
  const container = document.getElementById('technical-info-content');
  if (!container) return;

  const rows = [
    ['Application version', diagnostics.appVersion],
    ['Available update', diagnostics.availableVersion],
    ['Build date', diagnostics.buildDate],
    ['Service worker', diagnostics.serviceWorker],
    ['Page controlled', diagnostics.controlledPage],
    ['Worker scope', diagnostics.workerScope],
    ['Offline cache', diagnostics.cachedVersion],
    ['Notification permission', diagnostics.notificationPermission],
    ['Push subscription', diagnostics.pushSubscription],
    ['Notification buttons', diagnostics.notificationButtons],
    ['Display mode', diagnostics.displayMode],
    ['Network', diagnostics.network],
    ['Device pixel ratio', diagnostics.devicePixelRatio],
    ['Visual viewport', diagnostics.visualViewport],
    ['Sigma container', diagnostics.sigmaContainer],
    ['Sigma pixel ratio', diagnostics.sigmaPixelRatio],
    ['Sigma pixel ratio limit', diagnostics.sigmaPixelRatioLimit],
    ['Sigma canvas buffers', diagnostics.sigmaCanvasBuffers],
    ['WebGL API', diagnostics.webGlApi],
    ['WebGL renderer', diagnostics.webGlRenderer],
    ['WebGL limits', diagnostics.webGlLimits],
    ['WebGL context losses', diagnostics.webGlContextLosses],
    ['WebGL loss incidents', diagnostics.webGlLossIncidents],
    ['WebGL renderer recoveries', diagnostics.webGlRecoveries],
    ['WebGL contexts awaiting restore', diagnostics.webGlContextsAwaitingRestore],
    ['WebGL recovery error', diagnostics.webGlRecoveryError],
    ['Checked at', diagnostics.checkedAt],
    ['Browser', diagnostics.userAgent]
  ];

  container.replaceChildren();
  rows.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    const normalized = String(value).toLowerCase();
    term.textContent = label;
    description.textContent = value;
    const isWarning = normalized.includes('inactive')
      || normalized.includes('unsupported')
      || normalized.includes('not ')
      || normalized.includes('unavailable')
      || normalized.includes('no application cache');
    const isHealthy = normalized.includes('active')
      || normalized.includes('supported')
      || value === 'Yes'
      || value === 'Online'
      || value === 'Present';
    description.className = isWarning
      ? 'technical-info-value-warning'
      : isHealthy
        ? 'technical-info-value-ok'
        : '';
    container.append(term, description);
  });
}

async function refreshTechnicalDiagnostics() {
  const status = document.getElementById('technical-info-status');
  if (status) status.textContent = 'Collecting diagnostics...';
  try {
    lastTechnicalDiagnostics = await collectTechnicalDiagnostics();
    renderTechnicalDiagnostics(lastTechnicalDiagnostics);
    const activateButton = document.getElementById('technical-activate-update-button');
    if (activateButton) activateButton.hidden = !lastTechnicalDiagnostics.updateReady;
    if (status) status.textContent = '';
  } catch (error) {
    console.error('[Diagnostics] Collection failed:', error);
    if (status) status.textContent = `Unable to collect diagnostics: ${error.message}`;
  }
}

async function openTechnicalInfoPanel() {
  const modal = document.getElementById('technical-info-modal');
  if (!modal) return;
  modal.hidden = false;
  await refreshTechnicalDiagnostics();
}

async function checkForApplicationUpdate() {
  const status = document.getElementById('technical-info-status');
  if (!('serviceWorker' in navigator)) {
    if (status) status.textContent = 'Service workers are not supported by this browser.';
    return;
  }

  if (status) status.textContent = 'Checking for an update...';
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      if (status) status.textContent = 'No service worker is registered.';
      return;
    }

    await registration.update();
    if (registration.installing) {
      registration.installing.addEventListener('statechange', event => {
        if (event.target.state === 'installed') refreshTechnicalDiagnostics();
      });
    }
    await refreshTechnicalDiagnostics();
    if (status) {
      status.textContent = registration.waiting
        ? 'An update is ready. Reload the application to activate it.'
        : registration.installing
          ? 'An update is currently installing.'
          : 'Update check completed.';
    }
  } catch (error) {
    console.error('[Diagnostics] Update check failed:', error);
    if (status) status.textContent = `Update check failed: ${error.message}`;
  }
}

async function activateApplicationUpdate() {
  const status = document.getElementById('technical-info-status');
  const registration = await navigator.serviceWorker?.getRegistration();
  if (!registration?.waiting) {
    if (status) status.textContent = 'No update is ready to activate.';
    await refreshTechnicalDiagnostics();
    return;
  }

  if (status) status.textContent = 'Activating update...';
  reloadAfterServiceWorkerActivation = true;
  registration.waiting.postMessage({ type: 'activate-update' });
}

async function copyTechnicalDiagnostics() {
  if (!lastTechnicalDiagnostics) await refreshTechnicalDiagnostics();
  const status = document.getElementById('technical-info-status');
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastTechnicalDiagnostics, null, 2));
    if (status) status.textContent = 'Diagnostics copied.';
  } catch (error) {
    if (status) status.textContent = 'Unable to copy diagnostics.';
  }
}


const knownTokens = {
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { name: "Tether USD", symbol: "USDT", decimals: 6 },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { name: "USD Coin", symbol: "USDC", decimals: 6 },
  "0x6b175474e89094c44da98b954eedeac495271d0f": { name: "Dai Stablecoin", symbol: "DAI", decimals: 18 },
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { name: "Wrapped Ether", symbol: "WETH", decimals: 18 },
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8 },
  "0x514910771af9ca656af840dff83e8264ecf986ca": { name: "ChainLink", symbol: "LINK", decimals: 18 },
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": { name: "Aave", symbol: "AAVE", decimals: 18 },
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": { name: "Uniswap", symbol: "UNI", decimals: 18 },
  "0xaf4dce16da2877f8c9e00544c93b62ac40631f16": { name: "Monetha", symbol: "MTH", decimals: 5 },
  "0x54318a379935d545eb8e474a191e11faac5a46e8": { name: "KKCOIN ", symbol: "KK", decimals: 8 },
  "0x58d0a58e4b165a27e4e1b8c2a3ef39c89b581180": { name: "ShowCoin  ", symbol: "Show", decimals: 18 },
  // Add more as needed
};
document.addEventListener("DOMContentLoaded", () => {
  panel = document.getElementById("side-panel");
  tooltip = document.getElementById("tooltip");
  details = document.getElementById("node-details");
  initializeNodePanelResize();
  apiTokenInput = document.getElementById("param-api-token");
  blockchainSelect = document.getElementById("blockchain-select");    
  tokenInput = document.getElementById("param-api-token");
  //chain = blockchainSelect.value;
  toggleBtn = document.getElementById("search-icon");
  searchDiv = document.getElementById("searchdiv");
  searchInput = document.getElementById("search-input");
  // The command bar must remain interactive even while Sigma is still loading
  // or recovering its renderer.
  setupSearch();
  algorithmSelect = document.getElementById("layout-algorithm");
  faSettings = document.getElementById("forceatlas-settings");
  ordSettings = document.getElementById("openord-settings");
  themeToggleBtn = document.getElementById("theme-toggle-btn");
  sidebar = document.getElementById("left-sidebar");
  appContainer = document.getElementById("app-container");
  // Select all inputs inside the sidebar
  inputs = sidebar.querySelectorAll("input, select, textarea");
  layoutBtn = document.getElementById("layout-toggle-btn");
  toggleTokenBtn = document.getElementById("toggle-token-section");
  arrow = document.getElementById("toggle-token-arrow");
  tokenSection = document.getElementById("minataur-token-section");
  sigmaContainer = document.getElementById("sigma-container");
  sigmaContainer.addEventListener("pointerdown", () => sigmaContainer.focus({ preventScroll: true }));
  controls = document.getElementById("controls");
  footer = document.querySelector("footer");
  fullscreenBtn = document.getElementById("fullscreen-toggle");
  donateBtn = document.getElementById("donate-btn");
  exitFullscreenBtn = document.getElementById("exit-fullscreen-btn");
  slicer = document.getElementById("date-slicer-container");

  const technicalModal = document.getElementById('technical-info-modal');
  try {
    isFilterPanelVisible = localStorage.getItem(FILTER_PANEL_VISIBILITY_KEY) !== "false";
  } catch (error) {
    console.warn("Could not restore filter visibility:", error);
  }
  setFilterPanelVisible(isFilterPanelVisible, { persist: false });
  document.getElementById('filter-toggle-btn')?.addEventListener('click', () => {
    setFilterPanelVisible(!isFilterPanelVisible);
  });
  document.getElementById('technical-info-button')?.addEventListener('click', openTechnicalInfoPanel);
  document.getElementById('technical-info-close')?.addEventListener('click', () => { technicalModal.hidden = true; });
  document.getElementById('technical-refresh-button')?.addEventListener('click', refreshTechnicalDiagnostics);
  document.getElementById('technical-update-button')?.addEventListener('click', checkForApplicationUpdate);
  document.getElementById('technical-activate-update-button')?.addEventListener('click', activateApplicationUpdate);
  document.getElementById('technical-copy-button')?.addEventListener('click', copyTechnicalDiagnostics);
  technicalModal?.addEventListener('click', event => {
    if (event.target === technicalModal) technicalModal.hidden = true;
  });
  const errorPopup = document.getElementById("error-popup");
  document.getElementById("error-popup-close")?.addEventListener("click", closeErrorPopup);
  errorPopup?.addEventListener("click", event => {
    if (event.target === errorPopup) closeErrorPopup();
  });

  const params = new URLSearchParams(window.location.search);
  const param_chain = params.get("chain");
  const param_address = params.get("address");
  const param_firstLimit = params.get("firstiterationlimit");
  const param_depth = params.get("depth");
  const param_limit = params.get("iterationlimit");
  const param_startDate = params.get("startdate");
  const param_endDate = params.get("enddate");
  
  // Load selected blockchain from localStorage
  const storedBlockchain = localStorage.getItem('selectedBlockchain');
  if (storedBlockchain) {
    blockchainSelect.value = storedBlockchain;
    apiTokenInput.value = getApiToken(storedBlockchain) || ''; // Si le token est manquant, réinitialiser à une valeur vide
    loadStartKeyForBlockchain(storedBlockchain); // Charger la clé de départ pour la blockchain sélectionnée
  } else {
    // Si aucune blockchain n'est stockée, définir la valeur par défaut
    blockchainSelect.value = "mina"; // Par exemple, Mina comme valeur par défaut
    apiTokenInput.value = getApiToken("mina") || ''; // Récupérer le token pour Mina
    loadStartKeyForBlockchain("mina"); // Charger la clé de départ pour Mina
  }

  blockchainSelect.addEventListener("change", () => {
    const chain = blockchainSelect.value;
    // Save selected blockchain to localStorage
    localStorage.setItem('selectedBlockchain', chain);
    apiTokenInput.value = getApiToken(chain);
    loadStartKeyForBlockchain(chain);
  });
  
  tokenInput.addEventListener("focus", () => {
    tokenInput.type = "text";
  });

  tokenInput.addEventListener("blur", () => {
    tokenInput.type = "password";
  });

  document.getElementById("layout-algorithm").addEventListener("change", (e) => {
    const algorithm = e.target.value;
    loadLayoutSettings(algorithm);
  });

  document.getElementById("layout-toggle-btn").addEventListener("click", () => {
    const algorithm = document.getElementById("layout-algorithm").value;
    saveLayoutSettings(algorithm);
  });
    
  document.getElementById("start-graph-btn").addEventListener("click", () => {
    // Read values from input fields
    LIMIT = parseInt(document.getElementById("param-limit").value, 10);
    FIRST_ITERATION_LIMIT = parseInt(document.getElementById("param-first-iteration").value, 10);
    DEPTH = parseInt(document.getElementById("param-depth").value, 10);
    BASE_KEY = document.getElementById("param-base-key").value.trim();
    API_TOKEN = document.getElementById("param-api-token").value.trim();
    if (!syncFetchDateRangeFromInputs()) return;

    // Get the wipe option
    const wipeGraph = document.getElementById("wipe-select").value === "yes";

    // Reset visited keys
    //visitedKeys.clear();

    // Launch the graph builder
    main(DEPTH, wipeGraph).catch(console.error);
    
    // 👉 Hide the sidebar after launching
    const sidebar = document.getElementById("left-sidebar");
    const appContainer = document.getElementById("app-container");
    setLeftSidebarOpen(false);
  });  

  document.getElementById("clear-token-button").addEventListener("click", () => {
    const chain = blockchainSelect.value;
    clearApiToken(chain);
    apiTokenInput.value = "";
  });

  // Load token when blockchain changes
  blockchainSelect.addEventListener("change", () => {
    const chain = blockchainSelect.value;
    apiTokenInput.value = getApiToken(chain);
    loadStartKeyForBlockchain(chain);
  });

  // Save token on change
  apiTokenInput.addEventListener("input", () => {
    const chain = blockchainSelect.value;
    saveApiToken(chain, apiTokenInput.value.trim());
  });

  document.getElementById("param-base-key").addEventListener("input", (e) => {
    const key = e.target.value;
    localStorage.setItem(`start-key-${selectedBlockchain}`, key);
  });
  
  if (param_chain && param_address) {
    document.getElementById("blockchain-select").value = param_chain;
    document.getElementById("param-base-key").value = param_address;

    if (param_firstLimit) {
      document.getElementById("param-first-iteration").value = param_firstLimit;
    }
    if (param_depth) {
      document.getElementById("param-depth").value = param_depth;
    }
    if (param_limit) {
      document.getElementById("param-limit").value = param_limit;
    }
    if (param_startDate) document.getElementById("param-start-date").value = param_startDate;
    if (param_endDate) document.getElementById("param-end-date").value = param_endDate;
    syncFetchDateRangeFromInputs();

    // Optionally trigger graph fetch automatically
    setTimeout(() => {
      // Safer version: call main() directly
      BASE_KEY = param_address;
      main(parseInt(param_depth || "2"), true, param_chain);
      history.replaceState(null, '', window.location.pathname);
    }, 600);
  } else {  
  loadFetchParams();
  }
  setupFetchParamListeners();

  apiTokenInput.value = getApiToken(chain);
  loadStartKeyForBlockchain(chain);  

  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.getAttribute('data-command-type');

      if (!type) {
        // Reset both filters
        commandTypeFilter.clear();
        chainFilter.clear();
        console.log("🔄 All filters reset");

        // Visually reset all items
        document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.legend-chain').forEach(el => el.classList.remove('active'));

        refreshLegendFilteredViews();
        return; // Exit early, no further processing needed for reset
      } else {
        const aliases = commandTypeAliases[type] || [type];
        const isActive = aliases.every(t => commandTypeFilter.has(t));

        if (isActive) {
          // Remove all aliases
          aliases.forEach(t => commandTypeFilter.delete(t));
          console.log("❌ Removed aliases:", aliases);
        } else {
          // Add all aliases
          aliases.forEach(t => commandTypeFilter.add(t));
          console.log("✅ Added aliases:", aliases);
        }
      }

      // Update visual state
      document.querySelectorAll('.legend-item').forEach(el => {
        const t = el.getAttribute('data-command-type');
        if (!t) {
          el.classList.remove('active');
          return;
        }

        const aliases = commandTypeAliases[t] || [t];
        const active = aliases.every(type => commandTypeFilter.has(type));
        el.classList.toggle('active', active);
      });

      console.log("🧪 Final filter set:", Array.from(commandTypeFilter));
      refreshLegendFilteredViews();
    });
  });
  
  document.querySelectorAll('.legend-chain').forEach(item => {
    item.addEventListener('click', () => {
      const chain = item.getAttribute('data-chain');

      if (!chain) return;

      const isActive = chainFilter.has(chain);
      if (isActive) {
        chainFilter.delete(chain);
        console.log(`❌ Removed chain filter: ${chain}`);
      } else {
        chainFilter.add(chain);
        console.log(`✅ Added chain filter: ${chain}`);
      }

      // Update visual state
      document.querySelectorAll('.legend-chain').forEach(el => {
        const ch = el.getAttribute('data-chain');
        el.classList.toggle('active', chainFilter.has(ch));
      });

      console.log(`🌐 Final chain filter set: ${Array.from(chainFilter)}`);
      refreshLegendFilteredViews();
    });
  });

  
  document.getElementById("import-json").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importJSON(file);
    }
  });  
  
  document.getElementById("toggle-labels").addEventListener("change", (e) => {
    showAllLabels = e.target.checked;
    renderer.refresh();
  });
  
  document.getElementById("stop-loading-btn").addEventListener("click", () => {
    cancelRequested = true;
    appendLoaderLog("⚠️ Loading cancelled by user.");
  });
  

  // Hide on outside click
  document.addEventListener("click", (e) => {
    if (!searchDiv.contains(e.target) && !toggleBtn.contains(e.target)) {
      searchDiv.style.display = "none";
    }
  });
  


  algorithmSelect.addEventListener("change", () => {
    const value = algorithmSelect.value;
    faSettings.style.display = value === "fa" ? "block" : "none";
    ordSettings.style.display = value === "ord" ? "block" : "none";
        });
        
  if (blockchainSelect) {
    // Ensure selectedBlockchain is synced with current value on page load
    selectedBlockchain = blockchainSelect.value;
    console.log("🌐 Initial selected blockchain:", selectedBlockchain);      
    blockchainSelect.addEventListener("change", (e) => {
      selectedBlockchain = e.target.value;
      console.log("🌐 Selected blockchain:", selectedBlockchain);
    });
  }  
 
  function applyTheme(theme) {
    currentTheme = theme;
    const isLight = theme === "light";
    document.body.dataset.theme = theme;

    // Update button text
    const iconContainer = document.getElementById("theme-icon");
    iconContainer.innerHTML = isLight
      ? `
        <!-- Sun -->
        <svg viewBox="0 0 24 24" width="24" height="24" style="fill:white;">
          <path fill="black" d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/>
        </svg>
      `
      : `
        <!-- Moon -->
        <svg viewBox="0 0 24 24" width="24" height="24" style="fill:white;">
          <path fill="white" d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
        </svg>
      `;

    const searchIconSvg = document.getElementById("search-icon-svg");
    if (searchIconSvg) {
      searchIconSvg.setAttribute("fill", isLight ? "black" : "white");
    }

    // Apply styles only if elements exist
    document.body.style.background = isLight ? "#f5f5f5" : "#000";

    const sidebar = document.getElementById("left-sidebar");
    if (sidebar) {
      sidebar.style.background = isLight ? "#EEECFE" : "#1e1e1e";
      sidebar.style.color = isLight ? "#111" : "#fff";
    }

    const legend = document.getElementById("legend");
    if (legend) {
      legend.style.background = isLight ? "#fff" : "#1e1e1e";
      legend.style.color = isLight ? "#111" : "#fff";
    }

    const searchDiv = document.getElementById("searchdiv");
    if (searchDiv) {
      searchDiv.style.background = isLight ? "#fff" : "#1e1e1e";
      searchDiv.style.color = isLight ? "#111" : "#fff";
    }

    document.querySelectorAll("#layout-toggle-btn, #layout-sidebar-toggle-btn, #start-graph-btn, #exportBtn, #importBtn, #exportPngBtn, #saveBtn, #loadBtn, #demoBtn").forEach(btn => {
      if (btn) {
        btn.style.background = isLight ? "#fff" : "#444";
        btn.style.color = isLight ? "#111" : "#fff";
        btn.style.border = isLight ? "1px solid #aaa" : "none";
      }
    });

    const controls = document.getElementById("controls");
    if (controls) {
      controls.style.background = isLight ? "#fff" : "#222";
      controls.style.border = isLight ? "1px solid #aaa" : "none";
      controls.style.color = isLight ? "#000" : "#fff";
    }

    const fillColor = isLight ? "black" : "white";
    controls.querySelectorAll("svg").forEach(svg => {
      // 1) override via CSS style (highest priority)
      svg.style.fill = fillColor;
      // 2) force any explicit fill-attrs on inner shapes
      svg.querySelectorAll("path, circle, rect, polygon, ellipse, line, polyline")
         .forEach(shape => shape.setAttribute("fill", fillColor));
    });

    const dateSlicer = document.getElementById("date-slicer-container");
    if (dateSlicer) {
        dateSlicer.style.background = isLight ? "#fff" : "#444";
        dateSlicer.style.color = isLight ? "#111" : "#fff";      
    }
    updateDateFilterTheme(isLight);

    const menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
        menuToggle.style.background = isLight ? "rgba(255,255,255,0)" : "rgba(68,68,68,0)";
        menuToggle.style.color = isLight ? "#111" : "#fff";      
    }

    const footer = document.getElementById("footer");
    if (footer) {
      footer.style.color = isLight ? "#333" : "#aaa";
      footer.style.borderTop = isLight ? "1px solid #aaa" : "1px solid #333";
    }

    const sigmaContainer = document.getElementById("sigma-container");
    if (sigmaContainer) {
      sigmaContainer.style.background = isLight ? "#FEECEE" : "#000";
    }

    document.querySelectorAll("#left-sidebar input, #left-sidebar select,#left-sidebar textarea, #controls input").forEach(input => {
      input.style.background = isLight ? "#FBFCFD" : "#222";
      input.style.color = isLight ? "#000" : "#fff";
    });

    document.querySelectorAll('.foldable-header').forEach(header => {
      header.style.removeProperty('background');
      header.style.removeProperty('border-radius');
    });
    // Apply to Sigma renderer
    if (typeof renderer !== "undefined") {
      //console.log("Inside applyTheme");
      renderer.setSetting("labelColor", {color: isLightTheme() ? "#000" : "#9999ff"});
      renderer.setSetting("labelBackground", {color: isLightTheme() ? "#fff" : "#000"});
      //console.log(isLight ? "Label Color switched to #000" : "Label Color switched to #fff");
      renderer.setSetting("defaultNodeColor", isLight ? "#444" : "#ccc");
      renderer.setSetting("defaultEdgeColor", isLight ? "#aaa" : "#555");
      renderer.refresh();
      renderer.render();
    }
    
    const sliderContainer = document.getElementById('zoom-slider');
    if (sliderContainer) {
      sliderContainer.style.background = isLight
        ? 'rgba(255, 255, 255, 0.5)'
        // dark mode: rgb(34,34,34) at 50%
        : 'rgba(34, 34, 34, 0.5)';
    }

    const rotateContainer = document.getElementById('rotate-slider');
    if (rotateContainer) {
      rotateContainer.style.background = isLight
        ? 'rgba(255, 255, 255, 0.5)'
        // dark mode: rgb(34,34,34) at 50%
        : 'rgba(34, 34, 34, 0.5)';
    }
    
  }

  themeToggleBtn?.addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
    setupReducers(); // 👈 Ajout essentiel
    renderer.refresh(); // 👈 Pour forcer le redraw après les nouveaux reducers
    renderer.render();
  });


  applyTheme("dark"); // init


  const savedSidebarState = localStorage.getItem(SIDEBAR_STATE_STORAGE_KEY);
  setLeftSidebarOpen(window.innerWidth >= 769 && savedSidebarState !== "false");
  
  inputs.forEach(input => {
    input.addEventListener("focus", () => {
      setLeftSidebarOpen(true);
    });
  });
  
  /*document.getElementById("menu-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("left-sidebar");
    sidebar.classList.toggle("open");
    const app = document.getElementById("app-container");
    if (window.innerWidth >= 769) {
      if (sidebar.classList.contains("open")) {
        app.classList.add("sidebar-open");
      } else {
        app.classList.remove("sidebar-open");
      }
    }     
  });*/

  updateSlicerView(); // ⬅️ initial call

  window.addEventListener("resize", updateSlicerView);
  window.addEventListener("DOMContentLoaded", updateSlicerView);   
  window.addEventListener("orientationchange", () => {
    setTimeout(updateSlicerView, 300);
  });


  const toggleCurrentLayout = () => {
    if (isLayoutRunning) {
      layoutController.stop({ remember: true });
    } else {
      runLayoutInWorker();
    }
  };
  layoutBtn.addEventListener("click", toggleCurrentLayout);
  document.getElementById("layout-sidebar-toggle-btn")?.addEventListener("click", toggleCurrentLayout);

  toggleTokenBtn?.addEventListener("click", () => {
    const isHidden = tokenSection.style.display === "none";
    tokenSection.style.display = isHidden ? "block" : "none";
    arrow.textContent = isHidden ? "▾" : "▸";
  });

  document.getElementById("connect-auro-btn")?.addEventListener("click", connectAuroAndSend);
  
  adjustSidebarState(); // Appel initial

  // Responsive: surveille resize
  // ✅ Resize Sigma on window resize
  window.addEventListener("resize", () => {
    adjustSidebarState();
    updateLegendOffset();
    positionRotateSlider();
    if (renderer) {
      renderer.resize();
      renderer.refresh();
    }
  });

  // ✅ Resize Sigma if #sigma-container itself is resized (e.g. flexbox, sidebar toggle, etc.)
  const resizeObserver = new ResizeObserver(() => {
    positionRotateSlider();
    if (renderer) {
      renderer.resize();
      renderer.refresh();
    }
  });

  if (sigmaContainer) {
    resizeObserver.observe(sigmaContainer);
  }
  window.visualViewport?.addEventListener("resize", positionRotateSlider);
  document.getElementById("app-container")?.addEventListener("transitionend", positionRotateSlider);

  /*document.getElementById("menu-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("left-sidebar");
    sidebar.classList.toggle("open");
    const app = document.getElementById("app-container");
    if (window.innerWidth >= 769) {
      if (sidebar.classList.contains("open")) {
        app.classList.add("sidebar-open");
      } else {
        app.classList.remove("sidebar-open");
      }
    }     
  });*/

  document.getElementById("menu-toggle").addEventListener("click", () => {
    toggleLeftSidebar();
    
    // Give layout time to settle before resizing Sigma
    setTimeout(() => {
      if (renderer) {
        renderer.resize();
        renderer.refresh();
      }
    }, 150);        
  });
  document.getElementById("sidebar-close")?.addEventListener("click", () => {
    setLeftSidebarOpen(false, { persist: true, restoreFocus: true });
  });
  document.getElementById("sidebar-backdrop")?.addEventListener("click", () => {
    setLeftSidebarOpen(false, { restoreFocus: true });
  });
  window.matchMedia("(min-width: 769px)").addEventListener("change", event => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_STORAGE_KEY);
    setLeftSidebarOpen(event.matches ? savedState !== "false" : false);
  });

  // Close side panel (right panel)
  document.getElementById("close-panel-btn").addEventListener("click", () => {
    hideNodePanel({ restoreFocus: true });
  });
  window.matchMedia("(min-width: 769px)").addEventListener("change", () => {
    if (document.getElementById("side-panel")?.classList.contains("open")) setNodePanelOpen(true);
  });
  
  donateBtn.addEventListener("click", () => sendDonation());
  //document.getElementById("donate-btn-evm").addEventListener("click", sendEVMDonation);


  fullscreenBtn.addEventListener("click", () => toggleFullscreen());
  exitFullscreenBtn.addEventListener("click", () => toggleFullscreen(true));
  document.addEventListener("fullscreenchange", () => {
    setFullscreenMode(Boolean(document.fullscreenElement));
  });
  window.dispatchEvent(new Event("resize"));  

  const legend = document.getElementById("legend");
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  if (!legend) return;

  legend.style.cursor = "move";
  legend.style.userSelect = "none"; // prevent text selection
  legend.style.touchAction = "none"; // important for touch dragging

  const startDrag = (e) => {
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    offsetX = clientX - legend.offsetLeft;
    offsetY = clientY - legend.offsetTop;
    legend.style.transition = "none";
  };

  const onDrag = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    legend.style.left = `${clientX - offsetX}px`;
    legend.style.top = `${clientY - offsetY}px`;
    if (e.cancelable) e.preventDefault(); // avoid scrolling on touch
  };

  const stopDrag = () => {
    isDragging = false;
    legend.style.transition = "";
  };

  // Mouse events
  legend.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);

  // Touch events
  legend.addEventListener("touchstart", startDrag, { passive: false });
  document.addEventListener("touchmove", onDrag, { passive: false });
  document.addEventListener("touchend", stopDrag);
  
  document.querySelectorAll('.legend-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetSelector = toggle.getAttribute('data-target');
      const target = document.querySelector(targetSelector);
      if (!target) return;

      const isVisible = target.style.display !== 'none';
      target.style.display = isVisible ? 'none' : 'block';

      // Update toggle icon (▶ or ▼)
      toggle.innerHTML = `<em>${isVisible ? '▶' : '▼'} ${toggle.textContent.slice(2)}</em>`;
    });
  });
  
  const status = document.getElementById('network-status');

  function updateNetworkStatus() {
    if (navigator.onLine) {
      status.style.display = 'none';
      console.log('[PWA] Online');
    } else {
      status.style.display = 'block';
      console.warn('[PWA] Offline mode – using cached data');
    }
  }

  updateNetworkStatus(); // initial

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);  
  
  if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
    window.launchQueue.setConsumer(launchParams => {
      const fileHandle = launchParams.files[0];
      if (fileHandle) {
        fileHandle.getFile().then(file => {
          importJSON(file);
        });
      }
    });
  }
  
  document.getElementById("search-input").addEventListener("input", e => {
    handleSearch(e.target.value);
  });
  
  // --- Listen to service worker push message
  navigator.serviceWorker?.addEventListener('message', event => {
    if (event.data?.type === 'notification-action') {
      const { payload, action } = event.data;

      // Exécuter selon l'action
      if (action === 'show_graph' && payload.chain && payload.address) {
        console.log('[UI] Triggering graph from notification action');
        handleNotificationActions(payload); // ou ta logique directe
      }
    }

    if (event.data?.type === 'push-received') {
      const notif = event.data.payload;
      if (!notif?.message_id) {
        console.warn('[UI] Ignored message with no ID');
        return;
      }

      saveNotificationToStorage(notif)
        .then(updateNotificationBadge)
        .catch(err => console.error('Failed to store notification:', err));

      //handleNotificationActions(notif); // Optionnel ici si déjà couvert plus haut
    }
  });

  const resetBtn = document.getElementById('reset-db-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const confirmed = confirm("Are you sure you want to delete all saved notifications?");
      if (confirmed) {
        indexedDB.deleteDatabase('notificationDB');
        alert("Notifications database deleted. Reload the page to reinitialize.");
        location.reload();
      }
    });
  }

  if (location.hostname !== 'localhost') {
    document.getElementById('reset-db-btn')?.remove();
  }

  
  document.getElementById('notification-button')?.addEventListener('click', () => {
    const panel = document.getElementById('notification-list');
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
    } else {
      showNotificationList();
    }
  });
  
  document.addEventListener('click', function (event) {
    const list = document.getElementById('notification-list');
    const button = document.getElementById('notification-button');
    if (!list.contains(event.target) && !button.contains(event.target)) {
      list.style.display = 'none';
    }
  });
  
  document.getElementById("favorites-btn").onclick = () => {
    showFavoritesAddressesModal();
  };

  document.getElementById("watched-btn").onclick = () => {
    showWatchedAddressesModal();
  };

  window.addEventListener("mina:announceProvider", (event) => {
    if (event.detail?.info?.slug === "aurowallet" ||
        event.detail?.provider?.isAuro) {
      auroProvider = event.detail.provider;
      console.log("✔️  Auro provider ready:", auroProvider);
    }
  });

  window.dispatchEvent(new Event("mina:requestProvider"));
  setTimeout(() => window.dispatchEvent(new Event("mina:requestProvider")), 1000);

  const importInput = document.getElementById('import-settings');
  importInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
          loadLocalStorageFromJsonFile(file);
      }
  });

  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log("✅ Push permission granted");
      } else {
        console.warn("⚠️ Push permission denied:", permission);
      }
    });
  }
  
  updateNotificationBadge();

  if (params.get("reset") === "true") {
    clearEverything();
  }  
  
  // 1) Initialize the noUiSlider
  zoomSlider = document.getElementById('zoom-slider');
  noUiSlider.create(zoomSlider, {
    orientation: 'vertical',
    start: [1],            // initial zoom ratio
    range: {
      min: [0.25],         // 25% zoom
      max: [5]             // 500% zoom
    },
    step: 0.01,
    connect: 'lower'
  });  
  
  // === Initialize the rotate slider ===
  rotateSlider = document.getElementById('rotate-slider');
  noUiSlider.create(rotateSlider, {
    orientation: 'horizontal',
    start: [0],            // degrees 0–360
    range: {
      min: [0],
      max: [360]
    },
    step: 1,
    connect: 'lower'
  });
  positionRotateSlider();
  bindCameraControls();
});

init();

function handleNotificationActions(notif) {
  if (!notif?.chain || !notif?.address) return;

  console.log('[UI] Triggering graph display from push:', notif.chain, notif.address);
  BASE_KEY = notif.address;
  document.getElementById("blockchain-select").value = notif.chain;
  document.getElementById("param-base-key").value = notif.address;
  main(2, true, notif.chain).catch(error => {
    console.error('Error triggering graph from notification:', error);
  });
}



async function init() {
  await loadExtraTokensFromCSV('./tokens/tokens.csv');
  // Ensuite tu peux continuer ton code ici
}

async function loadExtraTokensFromCSV(filePath) {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue; // skip empty or comment lines
      const [address, name, symbol, decimals] = line.split(',').map(v => v.trim());
      if (address && name && symbol && !isNaN(decimals)) {
        extraTokens[address.toLowerCase()] = {
          name,
          symbol,
          decimals: parseInt(decimals, 10)
        };
      }
    }
    console.log(`Loaded ${Object.keys(extraTokens).length} extra tokens.`);
  } catch (err) {
    console.error("Failed to load token CSV:", err);
  }
}

function getKnownTokenInfo(contractAddress) {
  if (!contractAddress) return null;
  const addr = contractAddress.toLowerCase();
  return knownTokens[addr] || extraTokens[addr] || null;
}

function updateLegendOffset() {
  const legend = document.getElementById("legend");
  const appContainer = document.getElementById("app-container");
  const isWideScreen = window.innerWidth >= 769;
  const sidebarOpen = appContainer.classList.contains("sidebar-open");
  const fullscreen = document.body.classList.contains("fullscreen-mode");

  if (isWideScreen && sidebarOpen && !fullscreen) {
    const sidebarWidth = document.getElementById("left-sidebar")?.getBoundingClientRect().width || 300;
    legend.style.left = `${sidebarWidth + 50}px`; // Sidebar visible
  } else {
    legend.style.left = "50px";  // Sidebar hidden or fullscreen
  }
}

function showOverlaySpinner(chain, nb=100) {
  document.getElementById("overlay-message").textContent = `Fetching ${nb} more from ${capitalize(chain)}...`;
  const spinner = document.getElementById("overlay-spinner");
  spinner.classList.remove("overlay-hidden");
  spinner.classList.add("overlay-visible");
}

function hideOverlaySpinner() {
  const spinner = document.getElementById("overlay-spinner");
  spinner.classList.remove("overlay-visible");
  spinner.classList.add("overlay-hidden");
}



function getContrastingLabelColor(bgColor) {
  if (!bgColor || typeof bgColor !== "string") return currentTheme === "light" ? "#000" : "#fff";

  // Ensure it's a valid 6-digit hex color
  if (!/^#[0-9a-fA-F]{6}$/.test(bgColor)) return currentTheme === "light" ? "#000" : "#fff";

  const r = parseInt(bgColor.substr(1, 2), 16);
  const g = parseInt(bgColor.substr(3, 2), 16);
  const b = parseInt(bgColor.substr(5, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#000" : "#fff";
}

function getDecimalsForBlockchain(chain) {
  switch (chain) {
    case "ethereum":
    case "polygon":
    case "bsc":
    case "zksync":
    case "optimism":
    case "arbitrum":
    case "cronos":
    case "base":
      return 18;
    case "solana":      
    case "mina":
      return 9;
    case "tezos": 
      return 6;
    default:
      return 18; // Default fallback
  }
}

function saveToFile(filename, content) {
  const blob = new Blob([content], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function formatAmount(amount, decimals = 9) {
  if (!amount) return "-";
  try {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(2);
  } catch (e) {
    return "-";
  }
}

function showLoader() {
  cancelRequested = false;
  document.getElementById("loader-modal").style.display = "flex";
  document.getElementById("loader-log").textContent = "";
}

function hideLoader() {
  document.getElementById("loader-modal").style.display = "none";
}

function appendLoaderLog(message) {
  const logEl = document.getElementById("loader-log");
  const lines = logEl.textContent.trim().split("\n");
  lines.push(message);
  if (lines.length > 10) lines.shift(); // Keep max 10 lines
  logEl.textContent = lines.join("\n");
}

function getColorByName(name) {
  if (!name || name === "noname") return "hsl(300, 100%, 65%)";
  if (!nameColorMap.has(name)) {
    const hue = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    nameColorMap.set(name, `hsl(${hue}, 100%, 60%)`);
  }
  return nameColorMap.get(name);
}

function getBrightColorByName(name) {
  if (!name || name === "noname") return "#F984EF";
  if (!nameColorMap.has(name)) {
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;

    // Convert HSL( hue, 100%, 65% ) to HEX:
    const hex = hslToHex(hue, 100, 65);
    nameColorMap.set(name, hex);
  }
  return nameColorMap.get(name);
}

function getColorByDegree(degree, minDeg, maxDeg, chain, chainCount = 1) {
  // 🎯 Special color for nodes shared across multiple chains
  if (chainCount > 1) return "#ff00ff"; // orange

  const chainBaseHSL = {
    ethereum: [230, 70, 60],
    polygon: [270, 60, 60],
    bsc: [45, 100, 50],
    solana: [280, 100, 70],
    zksync: [330, 100, 70],
    optimism: [20, 100, 60],
    arbitrum: [190, 70, 60],
    cronos: [0, 85, 50],
    tezos: [215, 100, 55],
    starknet: [260, 100, 55],
    mina: [180, 50, 45],
    base: [200, 100, 60]
  };

  const [baseHue, baseSat, baseLight] = chainBaseHSL[chain] || [300, 100, 50];

  if (maxDeg === minDeg) return hslToHex(baseHue, baseSat, baseLight);

  const ratio = (degree - minDeg) / (maxDeg - minDeg);
  const hue = baseHue;
  const saturation = baseSat - ratio * 20;
  const lightness = baseLight + ratio * 20;

  return hslToHex(hue, saturation, lightness);
}


// Converts HSL to HEX
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

  return `#${[f(0), f(8), f(4)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("")}`;
}




function updateLayoutProgressBar(percent) {
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");

  bar.max = 100;
  bar.value = percent;
  text.textContent = percent + "%";
}

function setLayoutUiState(state, message = "") {
  const button = document.getElementById("layout-toggle-btn");
  const sidebarButton = document.getElementById("layout-sidebar-toggle-btn");
  const progress = document.getElementById("layout-progress");
  const progressText = document.getElementById("layout-progress-text");
  const info = document.getElementById("layout-info");

  if (button) {
    const running = state === "running";
    button.classList.toggle("is-running", running);
    button.setAttribute("aria-pressed", String(running));
    button.setAttribute("aria-label", running ? "Stop current layout" : "Apply current layout");
    button.title = running ? "Stop current layout (L)" : "Apply current layout (L)";
  }
  if (sidebarButton) {
    sidebarButton.textContent = state === "running" ? "Stop Layout" : "Apply Layout (L)";
    sidebarButton.setAttribute("aria-pressed", String(state === "running"));
  }
  if (progressText && message) progressText.textContent = message;
  if (info && state === "error") info.textContent = `Layout error: ${message}`;
  if (progress && state === "stopped") progress.value = 0;
}

class LayoutController {
  constructor() {
    this.worker = null;
    this.runId = 0;
    this.algorithm = null;
    this.origin = null;
  }

  stop({ message = "Stopped", remember = false } = {}) {
    this.runId++;
    if (this.worker) this.worker.terminate();
    this.worker = null;
    layoutWorker = null;
    isLayoutRunning = false;
    if (remember && this.algorithm) previousLayout = this.algorithm;
    this.algorithm = null;
    this.origin = null;
    currentLayout = null;
    recenterAfterLayout = false;
    setLayoutUiState("stopped", message);
  }

  run({ iterationsOverride = null, origin = "manual" } = {}) {
    this.stop({ message: "0%" });

    // A custom bounding box is useful only while a node is actively dragged.
    // Never let a stale drag normalization constrain a new layout.
    renderer?.setCustomBBox(null);

    if (window.location.protocol === "file:") {
      const message = "Layouts require the local server: run `npm run dev`, then open http://127.0.0.1:8765";
      setLayoutUiState("error", message);
      showErrorPopup(message);
      return;
    }

    const requestedIterations = Math.max(1, iterationsOverride ?? (parseInt(document.getElementById("layout-iterations").value, 10) || 5000));
    const gravity = Math.max(0, parseFloat(document.getElementById("layout-gravity").value) || 0.01);
    const scale = Math.max(0.0001, parseFloat(document.getElementById("layout-scale").value) || 1000);
    const width = Math.max(1, parseInt(document.getElementById("layout-width").value, 10) || 2000);
    const height = Math.max(1, parseInt(document.getElementById("layout-height").value, 10) || 2000);
    const algorithm = document.getElementById("layout-algorithm").value;
    const nodeCount = graph.order;
    const iterations = requestedIterations;
    const runId = ++this.runId;

    let workerFile = "fruchtermanReingold.js";
    const settings = { iterations, gravity, scalingRatio: scale, width, height };

    if (algorithm === "fa") {
      workerFile = "forceAtlas.js";
      settings.linLogMode = document.getElementById("layout-linlog")?.checked || false;
      settings.outboundAttractionDistribution = document.getElementById("layout-outbound")?.checked || false;
      settings.strongGravityMode = document.getElementById("layout-strong-gravity")?.checked || false;
      settings.preventOverlap = document.getElementById("layout-prevent-overlap")?.checked ?? true;
    } else if (algorithm === "ord") {
      workerFile = "openOrd.js";
      settings.edgeWeightInfluence = parseFloat(document.getElementById("layout-ewi")?.value) || 0;
      settings.coolingFactor = parseFloat(document.getElementById("layout-cooling")?.value) || 0.95;
      settings.attractionMultiplier = parseFloat(document.getElementById("layout-attraction")?.value) || 0.1;
      settings.repulsionMultiplier = parseFloat(document.getElementById("layout-repulsion")?.value) || 1;
    }

    if (previousLayout === "ord" && algorithm !== "ord") {
      graph.forEachNode(id => {
        graph.setNodeAttribute(id, "x", Math.random() * width);
        graph.setNodeAttribute(id, "y", Math.random() * height);
      });
      renderer.refresh();
    }

    const worker = new Worker(`./scripts/${workerFile}`);
    this.worker = worker;
    layoutWorker = worker;
    this.algorithm = algorithm;
    this.origin = origin;
    currentLayout = algorithm;
    isLayoutRunning = true;
    setLayoutUiState("running", "0%");

    const layoutLabel = origin === "manual" ? "Manual" : "Automatic";
    document.getElementById("layout-info").textContent = `${layoutLabel} layout: ${iterations} iterations`;

    const nodes = graph.nodes().map(id => ({
      id,
      x: graph.getNodeAttribute(id, "x"),
      y: graph.getNodeAttribute(id, "y")
    }));
    const edges = graph.edges().map(id => ({
      source: graph.source(id),
      target: graph.target(id),
      weight: graph.getEdgeAttribute(id, "weight") ?? 1
    }));
    let lastRenderTime = 0;

    const applyPositions = (positions, packed = false) => {
      if (packed) {
        const positionCount = Math.min(nodes.length, Math.floor(positions.length / 2));
        for (let index = 0; index < positionCount; index++) {
          const id = nodes[index].id;
          const x = positions[index * 2];
          const y = positions[index * 2 + 1];
          if (!graph.hasNode(id) || !Number.isFinite(x) || !Number.isFinite(y)) continue;
          graph.setNodeAttribute(id, "x", x);
          graph.setNodeAttribute(id, "y", y);
        }
        return;
      }
      for (const id in positions) {
        if (!graph.hasNode(id)) continue;
        const { x, y } = positions[id];
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        graph.setNodeAttribute(id, "x", x);
        graph.setNodeAttribute(id, "y", y);
      }
    };

    worker.onmessage = event => {
      if (runId !== this.runId || worker !== this.worker) return;
      const { type, progress, positions, packed = false } = event.data;
      if (type === "progress") {
        const percent = Math.min(99, Math.round(progress * 100));
        document.getElementById("layout-progress").value = percent;
        setLayoutUiState("running", `${percent}%`);
        const now = performance.now();
        if (now - lastRenderTime > 300) {
          applyPositions(positions, packed);
          renderer.refresh();
          lastRenderTime = now;
        }
      } else if (type === "done") {
        applyPositions(positions, packed);
        renderer.refresh();
        document.getElementById("layout-progress").value = 100;
        previousLayout = algorithm;
        this.worker = null;
        layoutWorker = null;
        this.algorithm = null;
        this.origin = null;
        currentLayout = null;
        isLayoutRunning = false;
        worker.terminate();
        setLayoutUiState("completed", "100%");
        if (recenterAfterLayout) {
          recenterAfterLayout = false;
          requestAnimationFrame(() => centerGraphInViewport({ trackLayout: false }));
        }
      }
    };

    worker.onerror = event => {
      if (runId !== this.runId || worker !== this.worker) return;
      console.error("Layout worker failed", event);
      const message = event.message || "Worker failure";
      this.stop({ message });
      setLayoutUiState("error", message);
    };

    worker.postMessage({ nodes, edges, settings });
  }
}

function calculateNormalizedCenter(allPositions, visiblePositions) {
  const finite = position => Number.isFinite(position?.x) && Number.isFinite(position?.y);
  const all = allPositions.filter(finite);
  const visible = visiblePositions.filter(finite);
  if (all.length === 0 || visible.length === 0) return { x: 0.5, y: 0.5 };

  const extent = positions => positions.reduce((bounds, position) => ({
    minX: Math.min(bounds.minX, position.x),
    maxX: Math.max(bounds.maxX, position.x),
    minY: Math.min(bounds.minY, position.y),
    maxY: Math.max(bounds.maxY, position.y)
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  const allExtent = extent(all);
  const visibleExtent = extent(visible);
  const normalizationScale = Math.max(
    allExtent.maxX - allExtent.minX,
    allExtent.maxY - allExtent.minY,
    1
  );
  const allCenterX = (allExtent.minX + allExtent.maxX) / 2;
  const allCenterY = (allExtent.minY + allExtent.maxY) / 2;
  const visibleCenterX = (visibleExtent.minX + visibleExtent.maxX) / 2;
  const visibleCenterY = (visibleExtent.minY + visibleExtent.maxY) / 2;

  return {
    x: 0.5 + (visibleCenterX - allCenterX) / normalizationScale,
    y: 0.5 + (visibleCenterY - allCenterY) / normalizationScale
  };
}

function getRecenteringNodePositions() {
  const allPositions = [];
  const visiblePositions = [];
  const hasLegendFilters = commandTypeFilter.size > 0 || chainFilter.size > 0;

  graph.forEachNode((node, attributes) => {
    const position = { x: Number(attributes.x), y: Number(attributes.y) };
    allPositions.push(position);
    if (attributes.hidden === true) return;

    const matchesLegend = !hasLegendFilters || graph.edges(node).some(edge => {
      const edgeAttributes = graph.getEdgeAttributes(edge);
      return edgeAttributes.hidden !== true && transactionMatchesActiveLegendFilters(edgeAttributes);
    });
    if (matchesLegend) visiblePositions.push(position);
  });
  return { allPositions, visiblePositions: visiblePositions.length > 0 ? visiblePositions : allPositions };
}

function getSidePanelCoveredWidth(panelWidth, viewportWidth, compactViewport) {
  if (compactViewport || !Number.isFinite(panelWidth) || !Number.isFinite(viewportWidth)) return 0;
  if (panelWidth <= 0 || viewportWidth <= 0 || panelWidth >= viewportWidth * 0.8) return 0;
  return Math.min(panelWidth, viewportWidth);
}

function applyGraphRecentering() {
  if (!renderer || !graph?.order) return;
  const camera = renderer.getCamera();
  const { ratio, angle } = camera.getState();
  const { allPositions, visiblePositions } = getRecenteringNodePositions();
  const graphCenter = calculateNormalizedCenter(allPositions, visiblePositions);
  const dimensions = renderer.getDimensions();
  const sidePanel = document.getElementById("side-panel");
  const coveredWidth = sidePanel?.classList.contains("open")
    ? getSidePanelCoveredWidth(
        sidePanel.offsetWidth,
        dimensions.width,
        window.matchMedia("(max-width: 768px)").matches
      )
    : 0;
  const desiredViewportCenter = {
    x: Math.max(0, dimensions.width - coveredWidth) / 2,
    y: dimensions.height / 2
  };
  const centeredState = { ...graphCenter, ratio, angle };
  const pointAtDesiredCenter = renderer.viewportToFramedGraph(desiredViewportCenter, {
    cameraState: centeredState
  });

  camera.setState({
    x: graphCenter.x + graphCenter.x - pointAtDesiredCenter.x,
    y: graphCenter.y + graphCenter.y - pointAtDesiredCenter.y,
    ratio,
    angle
  });
}

function centerGraphInViewport({ trackLayout = true } = {}) {
  if (!renderer) return;
  if (trackLayout && isLayoutRunning) recenterAfterLayout = true;

  // Refresh Sigma's normalization before using the current graph coordinates,
  // then repeat once on the next frame in case the refresh was scheduled.
  renderer.refresh();
  applyGraphRecentering();
  requestAnimationFrame(applyGraphRecentering);
}

function bindCameraControls() {
  if (cameraControlsBound || !zoomSlider?.noUiSlider || !rotateSlider?.noUiSlider) return;
  cameraControlsBound = true;

  zoomSlider.noUiSlider.on('update', (values, handleIndex) => {
    if (!renderer) return;
    renderer.getCamera().setState({ ratio: parseFloat(values[handleIndex]) });
  });

  // `slide` is emitted after noUiSlider has calculated the new value. This
  // covers handle drags as well as clicks on the rail and keeps the panel
  // offset correct for the new zoom ratio.
  zoomSlider.noUiSlider.on('slide', () => centerGraphInViewport());
  zoomSlider.noUiSlider.on('change', () => centerGraphInViewport());

  rotateSlider.noUiSlider.on('update', (values, handleIndex) => {
    if (!renderer) return;
    const angle = parseFloat(values[handleIndex]) * Math.PI / 180;
    renderer.getCamera().setState({ angle });
  });
}

function syncCameraControlsToRenderer() {
  if (!renderer || !zoomSlider?.noUiSlider || !rotateSlider?.noUiSlider) return;
  const ratio = parseFloat(zoomSlider.noUiSlider.get());
  const angle = parseFloat(rotateSlider.noUiSlider.get()) * Math.PI / 180;
  renderer.getCamera().setState({ ratio, angle });
}

function getRotatedPanDelta(key, step, angle) {
  const screenDirections = {
    ArrowLeft: { x: step, y: 0 },
    ArrowRight: { x: -step, y: 0 },
    ArrowUp: { x: 0, y: -step },
    ArrowDown: { x: 0, y: step }
  };
  const direction = screenDirections[key];
  if (!direction) return null;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: direction.x * cos - direction.y * sin,
    y: direction.x * sin + direction.y * cos
  };
}

function handleGraphKeyboardNavigation(event) {
  if (!renderer || document.activeElement !== sigmaContainer) return false;

  if (event.key.toLowerCase() === "c") {
    centerGraphInViewport();
    event.preventDefault();
    return true;
  }

  if (!event.key.startsWith("Arrow")) return false;

  const camera = renderer.getCamera();
  const state = camera.getState();
  const panStep = 0.08 * state.ratio;
  const rotationStep = 5 * Math.PI / 180;
  let nextState;

  if (event.shiftKey) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      const angle = (state.angle + direction * rotationStep + 2 * Math.PI) % (2 * Math.PI);
      nextState = { angle };
      rotateSlider?.noUiSlider?.set(angle * 180 / Math.PI);
    } else {
      const factor = event.key === "ArrowUp" ? 0.85 : 1 / 0.85;
      const ratio = Math.min(5, Math.max(0.25, state.ratio * factor));
      nextState = { ratio };
      zoomSlider?.noUiSlider?.set(ratio);
    }
  } else {
    const delta = getRotatedPanDelta(event.key, panStep, state.angle);
    nextState = delta ? { x: state.x + delta.x, y: state.y + delta.y } : null;
  }

  if (nextState) camera.setState(nextState);
  event.preventDefault();
  return true;
}

const layoutController = new LayoutController();

function stopLayoutInWorker() {
  layoutController.stop({ remember: true });
}


function runLayoutInWorker() {
  layoutController.run({ origin: "manual" });
}


function updateProgress() {
  const bar = document.getElementById("progress-bar");
  bar.max = totalSteps;
  bar.value = currentStep;
}

let lastApiErrorPopup = { signature: "", timestamp: 0 };

function closeErrorPopup() {
  const popup = document.getElementById("error-popup");
  if (!popup) return;
  popup.hidden = true;
}

function showErrorPopup(message, { title = "Request failed", advice = "" } = {}) {
  const popup = document.getElementById("error-popup");
  const titleBox = document.getElementById("error-title");
  const msgBox = document.getElementById("error-message");
  const adviceBox = document.getElementById("error-advice");
  if (!popup || !msgBox) return;
  if (titleBox) titleBox.textContent = title;
  msgBox.textContent = message;
  if (adviceBox) {
    adviceBox.textContent = advice;
    adviceBox.hidden = !advice;
  }
  popup.hidden = false;
  document.getElementById("error-popup-close")?.focus({ preventScroll: true });
}

function getApiErrorStatus(error) {
  const directStatus = Number(error?.status);
  if (Number.isInteger(directStatus) && directStatus >= 400 && directStatus <= 599) return directStatus;
  const match = String(error?.message || error || "").match(/\b(4\d\d|5\d\d)\b/);
  return match ? Number(match[1]) : null;
}

function showApiError(error, provider = "API") {
  const status = getApiErrorStatus(error);
  const rawMessage = String(error?.message || error || "Unknown API error");
  const isRateLimited = status === 429;
  const title = isRateLimited ? "API rate limit reached" : `${provider} request failed`;
  const message = isRateLimited
    ? `${provider} returned HTTP 429 (too many requests).`
    : rawMessage;
  const advice = isRateLimited
    ? "Reduce the number of nodes or transactions requested, wait a few minutes, then try again."
    : "Check your connection and request parameters, then try again.";
  const signature = `${status || "unknown"}:${provider}:${message}`;
  const now = Date.now();
  if (now - lastApiErrorPopup.timestamp < 3000 ||
      (lastApiErrorPopup.signature === signature && now - lastApiErrorPopup.timestamp < 8000)) return;
  lastApiErrorPopup = { signature, timestamp: now };
  showErrorPopup(message, { title, advice });
}

async function createApiHttpError(response, provider = "API") {
  let responseMessage = "";
  try {
    const body = await response.text();
    if (body) {
      try {
        const json = JSON.parse(body);
        responseMessage = json?.error?.message || json?.message || json?.result || "";
      } catch {
        responseMessage = body.slice(0, 300);
      }
    }
  } catch {
    // The HTTP status is sufficient when the body cannot be read.
  }
  const suffix = responseMessage ? ` — ${responseMessage}` : "";
  const error = new Error(`${provider} error: ${response.status} ${response.statusText || ""}${suffix}`.trim());
  error.status = response.status;
  error.provider = provider;
  return error;
}

async function assertApiResponse(response, provider = "API") {
  if (!response.ok) throw await createApiHttpError(response, provider);
  return response;
}

async function log_api_call (bc) {
  const res = await fetch(`https://www.akirion.com:4664/proxy?url=https://webapp.minagraph.com/api/log.json?bc=${bc}`, {
      method: "GET",
      headers: {
          'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
          "Content-Type": "application/json"
      }
  });
  
  if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
} 


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getSolCommandType(tx) {
  const instructions = tx.transaction.message.instructions || [];

  for (const inst of instructions) {
    // Handle parsed instructions (system, token, etc.)
    if (inst.parsed?.type) {
      const type = inst.parsed.type.toLowerCase();

      if (inst.program === "system" && type === "transfer") return "transfer";
      if (inst.program === "spl-token" && type === "transfer") return "token_transfer";
      if (inst.program === "stake") return "stake";
      if (inst.program === "vote") return "vote";
      if (inst.program === "memo") return "memo";
    }

    // Handle raw programId-based logic
    const programId = inst.programId;
    if (programId === "11111111111111111111111111111111") return "transfer"; // system
    if (programId.startsWith("Tokenkeg")) return "token_transfer"; // SPL Token Program
    if (programId.startsWith("Stake111")) return "stake";
    if (programId.startsWith("Vote111")) return "vote";
    if (programId.startsWith("MemoSq4")) return "memo";
    if (programId.startsWith("BPFLoader")) return "contract_deploy";
    if (programId.startsWith("metaqb")) return "nft_mint";
    if (programId.startsWith("cmtDvXum")) return "nft_collection";
    if (programId.startsWith("9xQeW")) return "serum_order"; // Serum DEX
    if (programId.startsWith("RVKd61")) return "raydium_swap";
  }

  return "contract_call"; // fallback
}

function getTezosCommandType(op) {
  if (op.type === 'delegation') return { command_type: 'delegate', contract_call_entrypoint: null };
  if (op.type === 'reveal') return { command_type: 'reveal', contract_call_entrypoint: null };
  if (op.type === 'origination') return { command_type: 'contract_creation', contract_call_entrypoint: null };
  if (op.type === 'transaction') {
    if (!op.target) return { command_type: 'contract_call', contract_call_entrypoint: null };

    const entrypoint = op.parameter?.entrypoint;

    if (entrypoint) {
      // Handling contract calls (everything starting with "contract_call:")
      if (entrypoint.startsWith("contract_call:")) {
        return { command_type: 'contract_call', contract_call_entrypoint: entrypoint };
      }

      // For other known specific cases
      switch (entrypoint) {
        case 'transfer': return { command_type: 'token_transfer', contract_call_entrypoint: null };
        case 'mint': return { command_type: 'token_mint', contract_call_entrypoint: null };
        case 'burn': return { command_type: 'token_burn', contract_call_entrypoint: null };
        case 'update_operators': return { command_type: 'update_operators', contract_call_entrypoint: null };
        case 'set_delegate': return { command_type: 'set_delegate', contract_call_entrypoint: null };
        case 'withdraw': return { command_type: 'withdraw', contract_call_entrypoint: null };
        case 'deposit': return { command_type: 'deposit', contract_call_entrypoint: null };
        case 'default': return { command_type: 'contract_call', contract_call_entrypoint: null }; // Default case for contract calls
        default: return { command_type: 'contract_call', contract_call_entrypoint: entrypoint }; // fallback for unknown entrypoints
      }
    }

    // Simple native tez transfer
    return { command_type: 'transfer', contract_call_entrypoint: null };
  }

  return { command_type: 'unknown', contract_call_entrypoint: null };
}


// Analyse les changements de balances pour trouver sender et receiver token
function getTokenTransferInfo(tx) {
  const result = {
    sender_key: null,
    receiver_key: null,
    token_receiver: null,
    token_contract: null,
    token_amount: null,
    token_decimals: null,
    token_name: null,
  };

  if (!tx.meta?.postTokenBalances || !tx.meta?.preTokenBalances) return result;

  const preByIndex = Object.fromEntries(tx.meta.preTokenBalances.map(p => [p.accountIndex, p]));
  const postByIndex = Object.fromEntries(tx.meta.postTokenBalances.map(p => [p.accountIndex, p]));

  for (const index in postByIndex) {
    const post = postByIndex[index];
    const pre = preByIndex[index];
    const change =
      (parseFloat(post.uiTokenAmount?.uiAmount || "0") -
        parseFloat(pre?.uiTokenAmount?.uiAmount || "0"));

    const account = tx.transaction.message.accountKeys[post.accountIndex];
    const owner = post.owner;
    const mint = post.mint;

    result.token_contract = mint;
    result.token_decimals = post.uiTokenAmount?.decimals || null;

    // optionnel : nom du token
    const cached = getKnownTokenInfo?.(mint);
    if (cached?.symbol) {
      result.token_name = cached.symbol;
    }

    if (change > 0) {
      result.receiver_key = owner;
      result.token_receiver = account.pubkey;
      result.token_amount = change.toString();  // ✅ ici le delta réel
    } else if (change < 0) {
      result.sender_key = owner;
    }
  }

  return result;
}

async function fetchSolanaTransactions(publicKey, limit, baseUrl) {
  const headers = {
    'x-api-key': '2c57fa11-3463-47fa-802d-116c2dfff660',
    "Content-Type": "application/json"
  };
  
  const transactions = [];

  const hasDateRange = FETCH_START_TIMESTAMP !== null || FETCH_END_TIMESTAMP !== null;
  const signatures = [];
  let before;
  let pageCount = 0;

  do {
    const pageLimit = hasDateRange ? 1000 : limit;
    const options = { limit: pageLimit };
    if (before) options.before = before;
    const signaturesPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [publicKey, options]
    };
    const signaturesRes = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(signaturesPayload)
    });
    await assertApiResponse(signaturesRes, "Solana API");
    const signaturesJson = await signaturesRes.json();
    if (signaturesJson?.error) {
      const error = new Error(signaturesJson.error.message || "Solana API request failed");
      error.status = Number(signaturesJson.error.code) === 429 ? 429 : undefined;
      throw error;
    }
    if (!Array.isArray(signaturesJson?.result)) throw new Error("Invalid Solana signature response");
    const page = signaturesJson.result;
    signatures.push(...(hasDateRange ? page.filter(sig => isTransactionInFetchDateRange(sig)) : page));

    const oldestTimestamp = page.length ? getTransactionTimestampMs(page[page.length - 1]) : null;
    if (!hasDateRange || !page.length || page.length < pageLimit || signatures.length >= limit ||
        (FETCH_START_TIMESTAMP !== null && oldestTimestamp !== null && oldestTimestamp < FETCH_START_TIMESTAMP)) break;
    before = page[page.length - 1].signature;
    pageCount++;
  } while (!cancelRequested && pageCount < 200);

  if (pageCount >= 200) console.warn(`Solana date pagination stopped after 200 pages for ${publicKey}.`);

  for (const sig of signatures.slice(0, limit)) {
    const txPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [sig.signature, {
        encoding: "jsonParsed",
        commitment: "finalized",
        maxSupportedTransactionVersion: 0
      }]
    };

    let tx = null;
    try {
    const txRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(txPayload) });
    await assertApiResponse(txRes, "Solana API");
    const txJson = await txRes.json();
      if (txJson?.error) {
        const error = new Error(txJson.error.message || "Solana transaction request failed");
        error.status = Number(txJson.error.code) === 429 ? 429 : undefined;
        throw error;
      }
      tx = txJson?.result;
      if (!tx) throw new Error("No tx result");
    } catch (err) {
      if (getApiErrorStatus(err) === 429) throw err;
      console.warn(`⚠️ Failed to fetch Solana tx ${sig.signature}: ${err.message}`);
      continue; // skip this tx and continue with others
    }


    const accountKeys = tx.transaction.message.accountKeys || [];
    const fallbackSender = accountKeys?.[0]?.pubkey || null;
    const blockTime = tx.blockTime ? `${tx.blockTime * 1000}` : null;
    const command_type = getSolCommandType(tx);

    console.log("Detected command type:", command_type, "for tx:", tx.transaction.signatures[0], " sender:", fallbackSender);



    let hasTokenTransfer = false;
    let hasSolTransfer = false;
    let hasStakeTransaction = false;

    // === 1. SPL TOKEN TRANSFERS ===
    const preToken = tx.meta?.preTokenBalances || [];
    const postToken = tx.meta?.postTokenBalances || [];

    for (const post of postToken) {
      const pre = preToken.find(p => p.accountIndex === post.accountIndex);
      const preAmount = parseFloat(pre?.uiTokenAmount?.uiAmount || "0");
      const postAmount = parseFloat(post.uiTokenAmount?.uiAmount || "0");
      const delta = postAmount - preAmount;

      if (delta === 0) continue;

      const account = accountKeys[post.accountIndex];
      const tokenMint = post.mint;
      const tokenDecimals = post.uiTokenAmount?.decimals || null;
      const tokenName = getKnownTokenInfo?.(tokenMint)?.symbol || null;

      transactions.push({
        blockchain: 'solana',
        block_id: tx.slot,
        height: tx.slot,
        timestamp: blockTime,
        hash: tx.transaction.signatures[0],
        command_type: "token_transfer",
        label: "token_transfer",
        amount: "0",
        fee: tx.meta?.fee?.toString() || "0",
        memo: "",
        status: tx.meta?.err ? "failed" : "applied",
        failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
        sender_key: delta < 0 ? post.owner : fallbackSender,
        receiver_key: delta > 0 ? post.owner : null,
        sender_name: "noname",
        receiver_name: "noname",
        fee_payer_key: fallbackSender,
        chain_status: "canonical",
        block_hash: tx.slot,
        token_contract: tokenMint,
        token_receiver: delta > 0 ? account.pubkey : null,
        token_amount: Math.abs(delta).toString(),
        token_name: tokenName,
        token_decimals: tokenDecimals,
        r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
      });

      hasTokenTransfer = true;
    }

    // === 2. NATIVE SOL TRANSFERS ===
    const preSol = tx.meta?.preBalances || [];
    const postSol = tx.meta?.postBalances || [];
    const deltaSol = preSol.map((pre, i) => (postSol[i] || 0) - pre);
    const solTransfers = [];

    for (let i = 0; i < deltaSol.length; i++) {
      const delta = deltaSol[i];
      if (delta !== 0) {
        solTransfers.push({
          key: accountKeys[i]?.pubkey || `unknown_${i}`,
          delta,
          index: i
        });
      }
    }

    const senders = solTransfers.filter(d => d.delta < 0).sort((a, b) => a.delta - b.delta);
    const receivers = solTransfers.filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta);

    while (senders.length && receivers.length) {
      const sender = senders.shift();
      const receiver = receivers.shift();
      const amount = Math.min(Math.abs(sender.delta), receiver.delta);

      if (amount < 1) continue;
      if (command_type === "token_transfer") continue;

      transactions.push({
        blockchain: 'solana',
        block_id: tx.slot,
        height: tx.slot,
        timestamp: blockTime,
        hash: tx.transaction.signatures[0],
        command_type,
        label: command_type === "transfer" ? "payment" : command_type,
        amount: amount.toString(),
        fee: tx.meta?.fee?.toString() || "0",
        memo: "",
        status: tx.meta?.err ? "failed" : "applied",
        failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
        sender_key: sender.key,
        receiver_key: receiver.key,
        sender_name: "noname",
        receiver_name: "noname",
        fee_payer_key: fallbackSender,
        chain_status: "canonical",
        block_hash: tx.slot,
        token_contract: null,
        token_receiver: null,
        token_amount: null,
        token_name: null,
        token_decimals: null,
        r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
      });

      hasSolTransfer = true;

      const remainingSender = Math.abs(sender.delta) - amount;
      const remainingReceiver = receiver.delta - amount;

      if (remainingSender > 0) {
        senders.unshift({ ...sender, delta: -remainingSender });
      }

      if (remainingReceiver > 0) {
        receivers.unshift({ ...receiver, delta: remainingReceiver });
      }
    }

  // === 3. STAKE TRANSACTIONS ===
  if (command_type === "stake") {
    const stakeInstr = tx.transaction.message.instructions.find(
      inst => inst.program === "stake" && inst.parsed?.info?.voteAccount
    );
    const voteAccount = stakeInstr?.parsed?.info?.voteAccount || null;

    transactions.push({
      blockchain: 'solana',
      block_id: tx.slot,
      height: tx.slot,
      timestamp: blockTime,
      hash: tx.transaction.signatures[0],
      command_type: "stake",
      label: "stake",
      nonce: null,
      amount: "0",
      fee: tx.meta?.fee?.toString() || "0",
      memo: "",
      sequence_no: null,
      status: tx.meta?.err ? "failed" : "applied",
      failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
      confirm: null,
      sender_id: null,
      receiver_id: null,
      sender_key: fallbackSender,
      receiver_key: voteAccount,
      sender_name: "noname",
      receiver_name: "validator",
      fee_payer_id: null,
      fee_payer_key: fallbackSender,
      fee_payer_name: null,
      chain_status: "canonical",
      block_hash: tx.slot,
      r_thief: 0, s_thief: 0,
      r_scammer: 0, s_scammer: 0,
      r_spammer: 0, s_spammer: 0,
      token_contract: null,
      token_receiver: null,
      token_amount: null,
      token_name: null,
      token_decimals: null
    });
    
    hasStakeTransaction = true;
    
  }

    // === 3. CONTRACT / STAKE / MISC INTERACTIONS ===
    if (!hasTokenTransfer && !hasSolTransfer && !hasStakeTransaction) {
      transactions.push({
        blockchain: 'solana',
        block_id: tx.slot,
        height: tx.slot,
        timestamp: blockTime,
        hash: tx.transaction.signatures[0],
        command_type,
        label: command_type,
        amount: "0",
        fee: tx.meta?.fee?.toString() || "0",
        memo: "",
        status: tx.meta?.err ? "failed" : "applied",
        failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
        sender_key: fallbackSender,
        receiver_key: null,
        sender_name: "noname",
        receiver_name: "noname",
        fee_payer_key: fallbackSender,
        chain_status: "canonical",
        block_hash: tx.slot,
        token_contract: null,
        token_receiver: null,
        token_amount: null,
        token_name: null,
        token_decimals: null,
        r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
      });
    }
  }



  return transactions;
}

async function getCronosBlockRange(baseTargetUrl, headers) {
  if (FETCH_START_TIMESTAMP === null && FETCH_END_TIMESTAMP === null) {
    return { startblock: "0", endblock: "99999999" };
  }
  const cacheKey = `cronos:${FETCH_START_TIMESTAMP ?? "start"}:${FETCH_END_TIMESTAMP ?? "end"}`;
  if (fetchBlockRangeCache.has(cacheKey)) return fetchBlockRangeCache.get(cacheKey);

  const blockAt = async (timestamp, closest) => {
    const params = new URLSearchParams({
      module: "block",
      action: "getblocknobytime",
      timestamp: Math.floor(timestamp / 1000).toString(),
      closest
    });
    const target = encodeURIComponent(`${baseTargetUrl}?${params}`);
    const res = await fetch(`https://www.akirion.com:4664/proxy?url=${target}`, { headers });
    await assertApiResponse(res, "Cronos block lookup API");
    const json = await res.json();
    if (json.status === "0") throw new Error(json.message || "Cronos block lookup failed");
    const value = typeof json.result === "object" ? json.result.blockNumber : json.result;
    if (value === undefined || value === null) throw new Error("Invalid Cronos block lookup response");
    return value.toString();
  };

  const range = {
    startblock: FETCH_START_TIMESTAMP === null ? "0" : await blockAt(FETCH_START_TIMESTAMP, "after"),
    endblock: FETCH_END_TIMESTAMP === null ? "99999999" : await blockAt(FETCH_END_TIMESTAMP, "before")
  };
  fetchBlockRangeCache.set(cacheKey, range);
  return range;
}

async function fetchCronosTransactions(normalizedKey, limit = 10000, baseUrl) {
  const headers = {
    'x-api-key': '75e3206b-5dc8-493c-ad1e-72fe521b3a01'
  };

  // === 1. Extraire l'URL cible actuelle de l’URL proxy
  const currentEncodedTarget = new URL(baseUrl).searchParams.get("url");
  if (!currentEncodedTarget) throw new Error("Missing 'url' param in proxy URL");

  const baseTargetUrl = decodeURIComponent(currentEncodedTarget);
  const blockRange = await getCronosBlockRange(baseTargetUrl, headers);

  // === 2. Construire l'URL complète avec tous les paramètres
  const queryParams = new URLSearchParams({
    module: "account",
    action: "txlist",
    address: normalizedKey, // <- injecté depuis appel
    startblock: blockRange.startblock,
    endblock: blockRange.endblock,
    sort: "asc",
    page: "1",
    offset: limit.toString()
  });

  const fullTargetUrl = `${baseTargetUrl}?${queryParams.toString()}`;
  const encodedTargetUrl = encodeURIComponent(fullTargetUrl);

  // === 3. Reconstruire l'URL finale complète vers le proxy
  const finalUrl = `https://www.akirion.com:4664/proxy?url=${encodedTargetUrl}`;

  const res = await fetch(finalUrl, { headers });

  await assertApiResponse(res, "Cronos API");

  const json = await res.json();
  if (!json || !json.result) throw new Error("Unexpected response format from Cronos");

  if (json.status === "0" && json.message === "No transactions found") {
    return [];
  }

  const transactions = [];

  for (const tx of json.result) {
    const isContractCreation = !tx.to;
    const isTokenTransfer = tx.input && tx.input.startsWith("0xa9059cbb");

    let tokenReceiver = null;
    let tokenAmount = null;
    let tokenName = null;
    let tokenDecimals = null;

    if (isTokenTransfer && tx.input.length >= 138) {
      try {
        tokenReceiver = "0x" + tx.input.slice(34, 74);
        tokenAmount = BigInt("0x" + tx.input.slice(74, 138)).toString();
        const tokenInfo = getKnownTokenInfo?.(tx.to);
        if (tokenInfo) {
          tokenName = tokenInfo.symbol;
          tokenDecimals = tokenInfo.decimals;
        }
      } catch (err) {
        console.warn(`Failed to parse ERC20 input for tx ${tx.hash}`);
      }
    }

    const baseTx = {
      blockchain: 'cronos',
      block_id: parseInt(tx.blockNumber),
      height: parseInt(tx.blockNumber),
      timestamp: `${parseInt(tx.timeStamp) * 1000}`,
      hash: tx.hash,
      amount: tx.value,
      fee: (BigInt(tx.gasUsed || "0") * BigInt(tx.gasPrice || "0")).toString(),
      memo: "",
      status: tx.isError === "0" ? "applied" : "failed",
      failure_reason: tx.isError === "0" ? null : "execution_error",
      sender_key: tx.from.toLowerCase(),
      receiver_key: tx.to ? tx.to.toLowerCase() : null,
      sender_name: "noname",
      receiver_name: isContractCreation ? "contract_creation" : "noname",
      fee_payer_key: tx.from.toLowerCase(),
      chain_status: "canonical",
      block_hash: tx.blockHash,
      token_contract: isTokenTransfer ? tx.to?.toLowerCase() : null,
      token_receiver: tokenReceiver?.toLowerCase() || null,
      token_amount: tokenAmount,
      token_name: tokenName,
      token_decimals: tokenDecimals,
      r_thief: 0, s_thief: 0, r_scammer: 0, s_scammer: 0, r_spammer: 0, s_spammer: 0
    };

    // Token transfer = 2 lignes : appel contrat + transfert
    if (isTokenTransfer) {
      transactions.push({
        ...baseTx,
        command_type: "contract_call",
        label: "contract_call"
      });

      transactions.push({
        ...baseTx,
        command_type: "token_transfer",
        label: "token_transfer",
        amount: "0", // pas de CRO transféré
        receiver_key: tokenReceiver?.toLowerCase() || null,
        receiver_name: tokenReceiver
          ? tokenReceiver.toLowerCase().slice(0, 6) + "..." + tokenReceiver.toLowerCase().slice(-6)
          : "unknown"
      });
    } else {
      // Paiement CRO ou appel contractuel sans transfert explicite
      transactions.push({
        ...baseTx,
        command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
        label: tx.input && tx.input !== "0x" ? "contract_call" : "payment"
      });
    }
  }

  return transactions;
}

async function fetchTezosTransactions(tezosAddress, limit = 100) {
  const baseUrl = 'https://api.tzkt.io/v1';
  const headers = {
    'Accept': 'application/json'
  };

  const operations = [];
  const addDateFilters = params => {
    if (FETCH_START_TIMESTAMP !== null) params.set("timestamp.ge", new Date(FETCH_START_TIMESTAMP).toISOString());
    if (FETCH_END_TIMESTAMP !== null) params.set("timestamp.le", new Date(FETCH_END_TIMESTAMP).toISOString());
    return params;
  };

  // 1. Fetch transfers (simple + contract calls)
  const transactionParams = addDateFilters(new URLSearchParams({
    "anyof.sender.target": tezosAddress,
    limit: limit.toString(),
    "sort.desc": "id"
  }));
  const txRes = await fetch(`${baseUrl}/operations/transactions?${transactionParams}`, { headers });
  await assertApiResponse(txRes, "TzKT transactions API");
  const txs = await txRes.json();
  operations.push(...txs);

  // 2. Fetch delegations
  const delegationParams = addDateFilters(new URLSearchParams({
    "anyof.sender.newDelegate": tezosAddress,
    limit: limit.toString(),
    "sort.desc": "id"
  }));
  const delRes = await fetch(`${baseUrl}/operations/delegations?${delegationParams}`, { headers });
  await assertApiResponse(delRes, "TzKT delegations API");
  const dels = await delRes.json();
  operations.push(...dels);

  // 3. Sort by time descending
  operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const transactions = [];

  const tokenCache = new Map(); // Map of `${contract}_${tokenId}` → metadata

  for (const op of operations) {
    const { command_type, contract_call_entrypoint } = getTezosCommandType(op);  // Get both values

    const totalFee = (op.bakerFee || 0) + (op.storageFee || 0) + (op.allocationFee || 0);

    let sender_key = op.sender?.address || null;
    let receiver_key = op.target?.address || op.newDelegate?.address || null;
    let token_receiver = null;
    let token_amount = null;
    let token_id = null;
    let token_contract = op.target?.address || null;
    let token_name = null;
    let token_decimals = null;
    let token_symbol  = null;
    let token_thumbnail = null;

    // Token transfer detection
    if (op.parameter?.entrypoint === "transfer" && Array.isArray(op.parameter?.value)) {
      const transfers = op.parameter.value;
      if (transfers.length > 0 && transfers[0].txs?.length > 0) {
        const tx = transfers[0].txs[0];
        token_receiver = tx.to_;
        token_amount = tx.amount;
        token_id = tx.token_id;
        receiver_key = token_receiver;
      }
    }

    // Mint detection
    if (op.parameter?.entrypoint === "mint" && op.parameter.value) {
      token_receiver = op.parameter.value.address;
      token_amount = op.parameter.value.amount;
      token_id = op.parameter.value.token_id;
      receiver_key = token_receiver;
    }

    // Fetch token metadata (once per contract/token_id)
    if (token_contract && token_id !== null) {
      const tokenKey = `${token_contract}_${token_id}`;
      if (!tokenCache.has(tokenKey)) {
        try {
          const res = await fetch(`https://api.tzkt.io/v1/tokens?contract=${token_contract}&tokenId=${token_id}`);
          const meta = await res.json();
          if (meta.length > 0) {
            tokenCache.set(tokenKey, {
              name: meta[0].metadata?.name || null,
              symbol: meta[0].metadata?.symbol || null,
              decimals: meta[0].metadata?.decimals || null,
              thumbnail: meta[0].metadata?.thumbnailUri || meta[0].metadata?.displayUri || null
            });
          } else {
            tokenCache.set(tokenKey, { name: null, decimals: null });
          }
        } catch (err) {
          console.warn(`Error fetching token metadata for ${tokenKey}:`, err);
          tokenCache.set(tokenKey, { name: null, decimals: null });
        }
      }
      const cachedMeta = tokenCache.get(tokenKey);
      token_name = cachedMeta?.name;
      token_decimals = cachedMeta?.decimals;
      token_symbol = cachedMeta?.symbol;
      token_thumbnail = cachedMeta?.thumbnail;
    }

    const baseTx = {
      blockchain: 'tezos',
      block_id: op.level,
      height: op.level,
      timestamp: new Date(op.timestamp).getTime().toString(),
      hash: op.hash,
      amount: op.amount ? op.amount.toString() : "0",
      fee: totalFee.toString(),
      memo: "",
      status: op.status === "applied" ? "applied" : "failed",
      failure_reason: op.status === "applied" ? null : (op.errors?.[0]?.message || "unknown_error"),
      sender_key: sender_key,
      receiver_key: receiver_key,
      sender_name: op.sender?.alias || "noname",
      receiver_name: op.target?.alias || op.newDelegate?.alias || "noname",
      fee_payer_key: sender_key,
      chain_status: "canonical",
      block_hash: op.block || null,
      token_contract: token_contract,
      token_receiver: token_receiver,
      token_amount: token_amount,
      token_name: token_name,
      token_symbol: token_symbol,
      token_thumbnail: token_thumbnail,
      token_decimals: token_decimals,      
      command_type: command_type,  // Always set as contract_call if it's a contract call
      contract_call_entrypoint: contract_call_entrypoint,  // Store the specific entrypoint here
      label: command_type,
      r_thief: 0, s_thief: 0,
      r_scammer: 0, s_scammer: 0,
      r_spammer: 0, s_spammer: 0
    };


    transactions.push(baseTx);
  }

  // 2. Fetch FA2 token transfers (independent of contract calls)
  const tokenTransferParams = addDateFilters(new URLSearchParams({
    "anyof.from.to": tezosAddress,
    limit: limit.toString(),
    "sort.desc": "timestamp"
  }));
  const tokenRes = await fetch(`${baseUrl}/tokens/transfers?${tokenTransferParams}`, { headers });
  await assertApiResponse(tokenRes, "TzKT token transfers API");
  const tokenTransfers = await tokenRes.json();

  // Optional: push tokenTransfers into a second loop or convert to the same structure
  for (const tf of tokenTransfers) {
    const tokenKey = `${tf.token.contract.address}_${tf.token.tokenId}`;
    if (!tokenCache.has(tokenKey)) {
      try {
        const res = await fetch(`https://api.tzkt.io/v1/tokens?contract=${tf.token.contract.address}&tokenId=${tf.token.tokenId}&sort.desc=timestamp`);
        const meta = await res.json();
        tokenCache.set(tokenKey, {
          name: meta[0]?.metadata?.name || null,
          symbol: meta[0]?.metadata?.symbol || null,
          decimals: meta[0]?.metadata?.decimals || null,
          thumbnail: meta[0]?.metadata?.thumbnailUri || meta[0]?.metadata?.displayUri || null
        });
      } catch {
        tokenCache.set(tokenKey, { name: null, symbol: null, decimals: null, thumbnail: null });
      }
    }
    const cachedMeta = tokenCache.get(tokenKey);

    transactions.push({
      blockchain: 'tezos',
      block_id: tf.level,
      height: tf.level,
      timestamp: new Date(tf.timestamp).getTime().toString(),
      hash: tf.transactionHash,
      amount: "0",
      fee: "0",
      memo: "",
      status: "applied",
      failure_reason: null,
      sender_key: tf.from?.address || null,
      receiver_key: tf.to?.address || null,
      sender_name: tf.from?.alias || "noname",
      receiver_name: tf.to?.alias || "noname",
      fee_payer_key: tf.from?.address || null,
      chain_status: "canonical",
      block_hash: null,
      token_contract: tf.token.contract.address,
      token_receiver: tf.to?.address || null,
      token_amount: tf.amount,
      token_name: cachedMeta?.name,
      token_symbol: cachedMeta?.symbol,
      token_thumbnail: cachedMeta?.thumbnail,
      token_decimals: cachedMeta?.decimals,
      command_type: "token_transfer",
      label: "token_transfer",
      r_thief: 0, s_thief: 0,
      r_scammer: 0, s_scammer: 0,
      r_spammer: 0, s_spammer: 0
    });
  }



  return transactions;
}


async function callAlchemyRpc(url, headers, method, params = []) {
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  await assertApiResponse(res, `Alchemy RPC ${method}`);
  const json = await res.json();
  if (json.error) {
    const error = new Error(json.error.message || `Alchemy RPC ${method} failed`);
    error.status = Number(json.error.code) === 429 ? 429 : undefined;
    throw error;
  }
  return json.result;
}

async function getAlchemyBlockRange(blockchain, url, headers) {
  if (FETCH_START_TIMESTAMP === null && FETCH_END_TIMESTAMP === null) {
    return { fromBlock: "0x0", toBlock: "latest" };
  }

  const cacheKey = `${blockchain}:${FETCH_START_TIMESTAMP ?? "start"}:${FETCH_END_TIMESTAMP ?? "end"}`;
  if (fetchBlockRangeCache.has(cacheKey)) return fetchBlockRangeCache.get(cacheKey);

  const latestHex = await callAlchemyRpc(url, headers, "eth_blockNumber");
  const latest = Number(BigInt(latestHex));
  const blockTimestamp = async blockNumber => {
    const block = await callAlchemyRpc(url, headers, "eth_getBlockByNumber", [`0x${blockNumber.toString(16)}`, false]);
    return Number(BigInt(block.timestamp)) * 1000;
  };
  const latestTimestamp = await blockTimestamp(latest);

  const firstBlockAtOrAfter = async target => {
    if (target > latestTimestamp) return latest + 1;
    let low = 0;
    let high = latest;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (await blockTimestamp(middle) < target) low = middle + 1;
      else high = middle;
    }
    return low;
  };

  const from = FETCH_START_TIMESTAMP === null ? 0 : await firstBlockAtOrAfter(FETCH_START_TIMESTAMP);
  let to = latest;
  if (FETCH_END_TIMESTAMP !== null && FETCH_END_TIMESTAMP < latestTimestamp) {
    to = Math.max(0, (await firstBlockAtOrAfter(FETCH_END_TIMESTAMP + 1)) - 1);
  }

  const range = {
    fromBlock: `0x${from.toString(16)}`,
    toBlock: `0x${to.toString(16)}`,
    empty: from > to
  };
  fetchBlockRangeCache.set(cacheKey, range);
  return range;
}

async function fetchTransactionsFromAlchemy(publicKey, blockchain, limit) {
  const baseUrls = {
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/`,
    bsc: `https://bnb-mainnet.g.alchemy.com/v2/`,
    solana: `https://solana-mainnet.g.alchemy.com/v2/`,
    zksync: `https://zksync-mainnet.g.alchemy.com/v2/`,
    optimism: `https://opt-mainnet.g.alchemy.com/v2/`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/`,
    cronos: `https://explorer-api.cronos.org/mainnet/api/v2`,
    tezos: `https://api.tzkt.io/v1`,
    base: `https://base-mainnet.g.alchemy.com/v2/`
  };

  const encodedTargetUrl = encodeURIComponent(`${baseUrls[blockchain]}`);
  const url = `https://www.akirion.com:4664/proxy?url=${encodedTargetUrl}`;
  const apiKeyHeader = { 'x-api-key': '2c57fa11-3463-47fa-802d-116c2dfff660' };
  const toMillis = iso => iso ? new Date(iso).getTime().toString() : null;

  console.log(`Calling ${blockchain.toUpperCase()}Scan API`);

  if (blockchain === 'solana') {
    return await fetchSolanaTransactions(publicKey, limit, url);
  }

  if (blockchain === 'cronos') {
    return await fetchCronosTransactions(publicKey, limit, url);
  }
  if (blockchain === 'tezos') {
    return await fetchTezosTransactions(publicKey, limit);
  }  
  // Set category for ETH, POLYGON, BSC
  /*let category = ["external", "erc20"];
  if (blockchain === "ethereum" || blockchain === "polygon") {
    category.push("internal", "erc721", "erc1155");
  }
  if (blockchain === "zksync"  || blockchain === "optimism" || blockchain === "arbitrum" || blockchain === "cronos" || blockchain === "base" ) {
    category.push("erc721", "erc1155");
  }*/

  const categoryByChain = {
    ethereum:      ["external", "internal", "erc20", "erc721", "erc1155"],
    polygon:       ["external", "internal", "erc20", "erc721", "erc1155"],
    bsc:           ["external", "erc20", "erc721", "erc1155"],
    optimism:      ["external", "erc20", "erc721", "erc1155"],
    arbitrum:      ["external", "erc20", "erc721", "erc1155"],
    zksync:        ["external", "erc20", "erc721", "erc1155"], // no "internal"
    base:          ["external", "erc20", "erc721", "erc1155"], // no "internal"
    cronos:        ["external", "erc20", "erc721", "erc1155"],                      // basic support
  };

  const category = categoryByChain[blockchain] || ["external"];
  const blockRange = await getAlchemyBlockRange(blockchain, url, apiKeyHeader);
  if (blockRange.empty) return [];


  // Setup query parameters for both directions
  const baseParams = {
    fromBlock: blockRange.fromBlock,
    toBlock: blockRange.toBlock,
    category,
    withMetadata: true,
    maxCount: `0x${limit.toString(16)}`,
    order: "desc",
    excludeZeroValue: false
  };

  const toParams = { ...baseParams, toAddress: publicKey };
  const fromParams = { ...baseParams, fromAddress: publicKey };

  const [toRes, fromRes] = await Promise.all([
    fetch(url, {
      method: "POST",
      headers: { ...apiKeyHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "alchemy_getAssetTransfers",
        params: [toParams]
      })
    }),
    fetch(url, {
      method: "POST",
      headers: { ...apiKeyHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [fromParams]
      })
    })
  ]);

  await Promise.all([
    assertApiResponse(toRes, `Alchemy ${blockchain} transfers`),
    assertApiResponse(fromRes, `Alchemy ${blockchain} transfers`)
  ]);

  const [toJson, fromJson] = await Promise.all([toRes.json(), fromRes.json()]);
  const rpcError = toJson?.error || fromJson?.error;
  if (rpcError) {
    const error = new Error(rpcError.message || `Alchemy ${blockchain} transfer request failed`);
    error.status = Number(rpcError.code) === 429 ? 429 : undefined;
    throw error;
  }
  const transfers = [...(toJson?.result?.transfers || []), ...(fromJson?.result?.transfers || [])];

  // Deduplicate by tx.hash
  const seen = new Set();
  const uniqueTransfers = transfers.filter(tx => {
    const id = tx.uniqueId || tx.hash;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Enrich with contract creation / call info
  const enriched = await Promise.all(uniqueTransfers.map(async (tx) => {
    const receiptBody = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionReceipt",
      params: [tx.hash]
    };

    let receiptData = null;
    try {
      const receiptRes = await fetch(url, {
        method: "POST",
        headers: { ...apiKeyHeader, "Content-Type": "application/json" },
        body: JSON.stringify(receiptBody)
      });
      await assertApiResponse(receiptRes, `Alchemy ${blockchain} transaction receipt`);
      const receiptJson = await receiptRes.json();
      if (receiptJson?.error) {
        const error = new Error(receiptJson.error.message || `Alchemy ${blockchain} transaction receipt failed`);
        error.status = Number(receiptJson.error.code) === 429 ? 429 : undefined;
        throw error;
      }
      receiptData = receiptJson?.result;
    } catch (err) {
      if (getApiErrorStatus(err) === 429) throw err;
      console.warn(`Receipt fetch failed for tx ${tx.hash}`, err.message);
    }

    const contractFromLogs = receiptData?.logs?.[0]?.address?.toLowerCase() || null;
    const contractAddress = receiptData?.contractAddress?.toLowerCase() || contractFromLogs;

    const nativeAssets = {
      ethereum: "ETH",
      polygon: "MATIC",
      bsc: "BNB",
      zksync: "ETH",
      optimism: "ETH",
      arbitrum: "ETH",
      cronos: "ETH",
      tezos: "XTZ",
      base: "ETH",
    };

    const isNativeTransfer = (
      tx.category?.includes("external") &&
      tx.asset?.toUpperCase() === nativeAssets[blockchain]
    );

    // ❗ NE PAS se baser sur receipt.contractAddress seul
    const isContractCreation =
      receiptData?.to === null &&
      tx.from?.toLowerCase() === receiptData?.from?.toLowerCase() &&
      tx.rawContract?.address?.toLowerCase() === receiptData?.contractAddress?.toLowerCase();

    const hasTokenContract = !!tx.rawContract?.address;
    const isTokenTransfer = !isContractCreation && hasTokenContract;

    let command_type = "contract_call";

    if (isContractCreation) {
      command_type = "contract_creation";
    } else if (isNativeTransfer) {
      command_type = "transfer";
    } else if (tx.category?.includes("erc1155")) {
      command_type = "token_transfer";
    } else if (tx.category?.includes("erc721")) {
      command_type = "nft_transfer";
    } else if (isTokenTransfer) {
      command_type = "token_transfer";
    }

    const tokenAmount =
      tx.erc1155Metadata?.[0]?.value
        ? parseInt(tx.erc1155Metadata[0].value, 16).toString()
        : tx.category?.includes("erc721") && (tx.tokenId || tx.erc721TokenId)
          ? "1"
          : tx.rawContract?.value || null;



    const tokenId = tx.erc721TokenId || tx.tokenId || null;

    console.log("token amount", tokenAmount);

    const gasUsed = receiptData?.gasUsed ? BigInt(receiptData.gasUsed) : 0n;
    const gasPrice = receiptData?.effectiveGasPrice ? BigInt(receiptData.effectiveGasPrice) : 0n;
    const decimals = getDecimalsForBlockchain(blockchain);
    const fee = gasUsed * gasPrice;
    const feeFloat = Number(fee) / 10 ** decimals;
    const formattedFee = feeFloat.toFixed(2);

    if (!receiptData || receiptData.from == null || receiptData.to == null) {
      console.warn("Incomplete transaction receipt; keeping transfer without receipt details", {
        transaction: tx,
        receipt: receiptData
      });
    }

    return {
      blockchain,
      block_id: parseInt(tx.blockNum, 16),
      height: parseInt(tx.blockNum, 16),
      timestamp: toMillis(tx.metadata?.blockTimestamp),
      timestamp_iso: tx.metadata?.blockTimestamp || null,
      hash: tx.hash,
      amount: tx.value ? (parseFloat(tx.value)).toString() : "0",
      fee: formattedFee,
      memo: "",
      status: "applied",
      sender_key: tx.from?.toLowerCase() || null,
      receiver_key: tx.to?.toLowerCase() || null,
      sender_name: tx.from ? tx.from.slice(0, 6) + "..." + tx.from.slice(-4) : "unknown",
      receiver_name: tx.to ? tx.to.slice(0, 6) + "..." + tx.to.slice(-4) : "unknown",
      command_type,
      label: command_type,
      token_contract: tx.rawContract?.address ? tx.rawContract.address.toLowerCase() : null,
      token_receiver: tx.to?.toLowerCase() || null,
      token_amount: tokenAmount,
      token_name: tx.asset || null,
      token_decimals: tx.category === "erc1155" || tx.category === "erc721" ? 0 : tx.rawContract?.decimals || null,
      token_id: tokenId,
      // 📦 Nouveaux champs enrichis depuis receipt :
      block_hash: receiptData?.blockHash || null,
      gas_used: receiptData?.gasUsed || null,
      gas_price: receiptData?.effectiveGasPrice || null,
      receipt_from: receiptData?.from?.toLowerCase() || null,
      receipt_to: receiptData?.to?.toLowerCase() || null,
      receipt_contract_address: contractAddress,
      receipt_logs: receiptData?.logs || []      
    };
  }));

  return enriched;
}

async function fetchMinaTransactions(publicKey, limit) {
  const hasDateRange = FETCH_START_TIMESTAMP !== null || FETCH_END_TIMESTAMP !== null;
  const pageSize = hasDateRange ? Math.min(1000, Math.max(100, limit)) : limit;
  const collected = [];
  let offset = 0;
  let pageCount = 0;
  const maxPages = 200;

  while (!cancelRequested && collected.length < limit && pageCount < maxPages) {
    const res = await fetch("https://www.akirion.com:4664/proxy?url=https://minataur.net/api/v1/transactions", {
      method: "POST",
      headers: {
        "Minataur-Authorization": API_TOKEN,
        "x-api-key": "755beb7f-24bc-4ead-924c-031e89af6d89",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ publicKey, limit: pageSize, offset })
    });

    await assertApiResponse(res, "Minataur API");
    const json = await res.json();
    const page = json?.payload?.transactions;
    if (!Array.isArray(page)) throw new Error("Unexpected response format from Minataur API");

    if (!hasDateRange) return page;
    collected.push(...page.filter(isTransactionInFetchDateRange));

    const timestamps = page.map(getTransactionTimestampMs).filter(Number.isFinite);
    const oldestTimestamp = timestamps.length ? Math.min(...timestamps) : null;
    if (!page.length || page.length < pageSize ||
        (FETCH_START_TIMESTAMP !== null && oldestTimestamp !== null && oldestTimestamp < FETCH_START_TIMESTAMP)) break;

    offset += pageSize;
    pageCount++;
  }

  if (pageCount >= maxPages) console.warn(`Minataur date pagination stopped after ${maxPages} pages for ${publicKey}.`);
  return collected.slice(0, limit);
}



async function fetchTransactionsForKey2(publicKey, blockchain = selectedBlockchain, delay = 0) {
    const normalizedKey = blockchain === "polygon" ? publicKey.toLowerCase() : publicKey;
    
    if (normalizedKey === "genesis") 
      return;
    
    delay = delayByBlockchain[blockchain] || delay;
    console.log("selectedBlockchain : ", selectedBlockchain);
    console.log("Normalized Key : ", normalizedKey);

    const chain = blockchain;
    if (!visitedKeysByChain.has(chain)) {
      visitedKeysByChain.set(chain, new Set());
    }
    const visitedForChain = visitedKeysByChain.get(chain);

    if (visitedForChain.has(normalizedKey)) return [];
    visitedForChain.add(normalizedKey);

    const limit = (normalizedKey === BASE_KEY) ? FIRST_ITERATION_LIMIT : LIMIT;

    try {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        let transactions = [];

        if (blockchain === 'mina') {
            console.log("Calling Minataur API");
            transactions = Array.from(new Map((await fetchMinaTransactions(normalizedKey, limit)).map(tx => [tx.hash, tx])).values());

            transactions.forEach(tx => {
              tx.blockchain = 'mina';
              // 🔵 New fields added for ERC-20 Tokens
              tx.token_contract = null;
              tx.token_receiver = null;
              tx.token_amount = null;                                   
              tx.token_name = null,
              tx.token_decimals = null
            });


        } else if (blockchain === 'ethereum') {
            const etherscanApiKey = API_TOKEN;
          const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${etherscanApiKey}`;

            console.log("Calling Etherscan API");

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Etherscan API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
          
          if (!json || !json.result) {
                throw new Error("Unexpected response format from EtherScan API");
            }

            log_api_call (blockchain);
            
          if (json.status === "0" && json.message === "No transactions found") {
            console.log(`No transactions found for ${normalizedKey} on ${blockchain.toUpperCase()}.`);
            transactions = []; // Just return empty
          } else if (json.status === "1") {
            log_api_call(blockchain);

          transactions = [];

          for (const tx of json.result) {
            const isContractCreation = !tx.to;
            const isTokenTransfer = tx.input && tx.input.startsWith("0xa9059cbb");
              let tokenReceiver = null;
              let tokenAmount = null;
              let tokenName = null;
              let tokenDecimals = null;              
              
            if (isTokenTransfer && tx.input.length >= 138) {
                  try {
                tokenReceiver = "0x" + tx.input.slice(34, 74);
                tokenAmount = BigInt("0x" + tx.input.slice(74, 138)).toString();
                      const tokenInfo = getKnownTokenInfo(tx.to);
                      if (tokenInfo) {
                  tokenName = tokenInfo.symbol;
                  tokenDecimals = tokenInfo.decimals;
                  console.log(tokenInfo);
                      }
                  } catch (err) {
                      console.warn(`Failed to parse ERC20 input for tx ${tx.hash}`);
                  }
              }              

            const baseTx = {
                blockchain: blockchain,
                block_id: parseInt(tx.blockNumber),
                height: parseInt(tx.blockNumber),
                timestamp: `${parseInt(tx.timeStamp) * 1000}`,
                hash: tx.hash,
                nonce: tx.nonce,
                fee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
                memo: "",
                sequence_no: null,
                status: tx.isError === "0" ? "applied" : "failed",
                failure_reason: tx.isError === "0" ? null : "error",
                confirm: null,
                sender_id: null,
                sender_key: tx.from.toLowerCase(),
                fee_payer_id: null,
                fee_payer_key: tx.from.toLowerCase(),
                fee_payer_name: null,
                chain_status: "canonical",
                block_hash: tx.blockHash,
                r_thief: 0,
                s_thief: 0,
                r_scammer: 0,
                s_scammer: 0,
                r_spammer: 0,
                s_spammer: 0,
              token_amount: tokenAmount,
              token_name: tokenName,
              token_decimals: tokenDecimals          
            };
                
            if (isTokenTransfer) {
              // 1. First record: the contract execution itself
              transactions.push({
                ...baseTx,
                command_type: "contract_call",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tx.to.toLowerCase(),
                receiver_name: "noname",
                label: "contract_call",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals   
              });

              // 2. Second record: the token transfer itself
              transactions.push({
                ...baseTx,
                command_type: "token_transfer",
                amount: "0", // direct token transfers don't move native ETH
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tokenReceiver ? tokenReceiver.toLowerCase() : "unknown",
                receiver_name: tokenReceiver ? tokenReceiver.toLowerCase().slice(0,6) + "..." + tokenReceiver.toLowerCase().slice(-6) : "unknown",
                label: "token_transfer",
                token_contract: tx.to ? tx.to.toLowerCase() : null,
                token_receiver: tokenReceiver ? tokenReceiver.toLowerCase() : null,
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
            });
            } else {
              // Simple ETH transfer or contract call
              transactions.push({
                ...baseTx,
                command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: isContractCreation ? tx.from.toLowerCase() : tx.to.toLowerCase(),
                receiver_name: isContractCreation ? "contract_creation" : "noname",
                label: tx.input && tx.input !== "0x" ? "contract_call" : "payment",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals   
              });
            }
          }
          }
        } else if (blockchain === 'polygon' || blockchain === 'bsc') {
          const apiKey = API_TOKEN;
          const apiBaseUrl = blockchain === 'polygon'
            ? 'https://api.polygonscan.com'
            : 'https://api.bscscan.com';
            
            const encodedTargetUrl = encodeURIComponent(
            `${apiBaseUrl}/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${apiKey}`
            );

          const url = blockchain === 'polygon'
            ? `${apiBaseUrl}/api?module=account&action=txlist&address=${normalizedKey}&startblock=0&endblock=99999999&sort=asc&page=1&offset=${limit}&apikey=${apiKey}`
            : `https://www.akirion.com:4664/proxy?url=${encodedTargetUrl}`; // Use proxy for BSC
        
          console.log(`Calling ${blockchain.toUpperCase()}Scan API`);

            const res = await fetch(url, {
            headers: blockchain === 'bsc' ? {
                    'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
              'Content-Type': 'application/json'
            } : {}
            });
            
            if (!res.ok) {
            throw new Error(`${blockchain.toUpperCase()}Scan API error: ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
          // 🛡️ Proper handling if "no transactions found"
          if (!json || !json.result) {
            throw new Error(`Unexpected response format from ${blockchain.toUpperCase()}Scan API`);
            }

          if (json.status === "0" && json.message === "No transactions found") {
            console.log(`No transactions found for ${normalizedKey} on ${blockchain.toUpperCase()}.`);
            transactions = []; // Just return empty
          } else if (json.status === "1") {
            log_api_call (blockchain);

          transactions = [];

          for (const tx of json.result) {
            const isContractCreation = !tx.to;
            const isTokenTransfer = tx.input && tx.input.startsWith("0xa9059cbb");
            let tokenReceiver = null;
            let tokenAmount = null;
            let tokenName = null;
            let tokenDecimals = null;

            if (isTokenTransfer && tx.input.length >= 138) {
              try {
                tokenReceiver = "0x" + tx.input.slice(34, 74);
                tokenAmount = BigInt("0x" + tx.input.slice(74, 138)).toString();
                const tokenInfo = getKnownTokenInfo(tx.to); // You already have this for Ethereum
                if (tokenInfo) {
                  tokenName = tokenInfo.symbol;
                  tokenDecimals = tokenInfo.decimals;
                  console.log(tokenInfo);
                }
              } catch (err) {
                console.warn(`Failed to parse ERC20 input for tx ${tx.hash}`);
              }
            }

            const baseTx = {
                blockchain: blockchain,
                block_id: parseInt(tx.blockNumber),
                height: parseInt(tx.blockNumber),
                timestamp: `${parseInt(tx.timeStamp) * 1000}`,
                hash: tx.hash,
                nonce: tx.nonce,
                fee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
                memo: "",
                sequence_no: null,
                status: tx.isError === "0" ? "applied" : "failed",
                failure_reason: tx.isError === "0" ? null : "error",
                confirm: null,
                sender_id: null,
                sender_key: tx.from.toLowerCase(),
                fee_payer_id: null,
                fee_payer_key: tx.from.toLowerCase(),
                fee_payer_name: null,
                chain_status: "canonical",
                block_hash: tx.blockHash,
                r_thief: 0,
                s_thief: 0,
                r_scammer: 0,
                s_scammer: 0,
                r_spammer: 0,
                s_spammer: 0,
              token_amount: tokenAmount,
              token_name: tokenName,
              token_decimals: tokenDecimals
              };

            if (isTokenTransfer) {
              // 1. Contract execution
              transactions.push({
                ...baseTx,
                command_type: "contract_call",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tx.to.toLowerCase(),
                receiver_name: "noname",
                label: "contract_call",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
            });

              // 2. Token transfer
              transactions.push({
                ...baseTx,
                command_type: "token_transfer",
                amount: "0", // Token transfers do not move native coins
                sender_name: "noname",
                receiver_id: null,
                receiver_key: tokenReceiver ? tokenReceiver.toLowerCase() : "unknown",
                receiver_name: tokenReceiver ? tokenReceiver.toLowerCase().slice(0,6) + "..." + tokenReceiver.toLowerCase().slice(-6) : "unknown",
                label: "token_transfer",
                token_contract: tx.to ? tx.to.toLowerCase() : null,
                token_receiver: tokenReceiver ? tokenReceiver.toLowerCase() : null,
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
              });
            } else {
              transactions.push({
                ...baseTx,
                command_type: tx.input && tx.input !== "0x" ? "contract_call" : "transfer",
                amount: tx.value,
                sender_name: "noname",
                receiver_id: null,
                receiver_key: isContractCreation ? tx.from.toLowerCase() : tx.to.toLowerCase(),
                receiver_name: isContractCreation ? "contract_creation" : "noname",
                label: tx.input && tx.input !== "0x" ? "contract_call" : "payment",
                token_amount: tokenAmount,
                token_name: tokenName,
                token_decimals: tokenDecimals
              });
            }
          }
          } else {
             throw new Error(`Error from ${blockchain.toUpperCase()}Scan API: ${json.message || "Unknown error"}`);
          }
        } else if (blockchain === 'solana') {
        
        // ======== SOLANA =========
          console.log("Calling Helius Solana API");

          const HELIUS_API_KEY = API_TOKEN;
          const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

          const signaturesPayload = {
            jsonrpc: "2.0",
            id: 1,
            method: "getSignaturesForAddress",
            params: [
              normalizedKey,
              { limit: limit }
            ]
          };

          const signaturesRes = await fetch(url, {
            method: "POST",
            headers: {
              'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
              "Content-Type": "application/json"
            },
            body: JSON.stringify(signaturesPayload)
          });

          await assertApiResponse(signaturesRes, "Helius API");

          const signaturesJson = await signaturesRes.json();

          if (!signaturesJson || !signaturesJson.result) {
            throw new Error("Unexpected response format from Helius API");
          }
          
          console.log("signaturesJson : ", signaturesJson);

          appendLoaderLog(`🔄 Loading ${signaturesJson.result.length} tx for ${normalizedKey.slice(0, 6)}…${normalizedKey.slice(-6)}`);

          const txDetails = [];

          for (const sig of signaturesJson.result) {
            const txPayload = {
              jsonrpc: "2.0",
              id: 1,
              method: "getTransaction",
              params: [
                sig.signature,
                {
                  encoding: "jsonParsed",
                  maxSupportedTransactionVersion: 0
                }
              ]
            };

            const txRes = await fetch(url, {
              method: "POST",
              headers: {
                'x-api-key': '755beb7f-24bc-4ead-924c-031e89af6d89',
                "Content-Type": "application/json"
              },
              body: JSON.stringify(txPayload)
            });

            await assertApiResponse(txRes, "Helius API");
            const txJson = await txRes.json();
            if (txJson && txJson.result) {
              txDetails.push(txJson.result);
            }

            await sleep(delay);
          }

          log_api_call(blockchain);

          transactions = txDetails
            .filter(tx => tx !== null)
            .map(tx => {
              const accountKeys = tx.transaction.message.accountKeys;
              const senderKey = accountKeys[0].pubkey;

              let receiverKey = senderKey;
              if (tx.meta && tx.meta.postTokenBalances && tx.meta.postTokenBalances.length > 0) {
                const tokenRecipient = accountKeys[tx.meta.postTokenBalances[0].accountIndex];
                receiverKey = tokenRecipient.pubkey;
              } else if (accountKeys.length > 1) {
                receiverKey = accountKeys[1].pubkey;
              }

              return {
                tx,
                senderKey,
                receiverKey
              };
            })
            .filter(({ senderKey, receiverKey }) =>
              senderKey === normalizedKey || receiverKey === normalizedKey
            )
            .map(({ tx, senderKey, receiverKey }) => {
              const commandType = getSolCommandType(tx);
              
              const accountKeys = tx.transaction.message.accountKeys;

              let amount = "0";
              if (tx.meta && tx.meta.preToken && tx.meta.postToken) {
                const receiverIndex = accountKeys.findIndex(k => k.pubkey === receiverKey);
                if (receiverIndex >= 0) {
                  const pre = tx.meta.preToken[receiverIndex] || 0;
                  const post = tx.meta.postToken[receiverIndex] || 0;
                  if (post - pre > 0) {
                    amount = (post - pre).toString();
                  }
                }
              }

              return {
                blockchain: blockchain,
                block_id: tx.slot,
                height: tx.slot,
                timestamp: tx.blockTime ? `${tx.blockTime * 1000}` : null,
                hash: tx.transaction.signatures[0],
                command_type: commandType,
                nonce: null,
                amount: amount,
                fee: tx.meta?.fee?.toString() || "0",
                memo: "",
                sequence_no: null,
                status: tx.meta?.err ? "failed" : "applied",
                failure_reason: tx.meta?.err ? JSON.stringify(tx.meta.err) : null,
                confirm: null,
                sender_id: null,
                sender_key: senderKey,
                receiver_key: receiverKey,
                sender_name: "noname",
                receiver_id: null,
                receiver_name: "noname",
                fee_payer_id: null,
                fee_payer_key: senderKey,
                fee_payer_name: null,
                chain_status: "canonical",
                block_hash: tx.slot,
                r_thief: 0,
                s_thief: 0,
                r_scammer: 0,
                s_scammer: 0,
                r_spammer: 0,
                s_spammer: 0,
                // 🔵 New fields added for ERC-20 Tokens
                token_contract: null,
                token_receiver: null,
                token_amount: null,
                token_name: null,
                token_decimals: null
              };
            });
        }

        console.log(transactions);

        currentStep++;
        updateProgressBar(currentStep, totalSteps);
        return transactions;

    } catch (error) {
        console.error("Error occurred:", error);
        cancelRequested = true;
        hideLoader();
        showApiError(error, capitalize(blockchain));
        return transactions || [];
    }
}

async function fetchTransactionsForKey(publicKey, blockchain = selectedBlockchain, delay = 0) {
    const normalizedKey = ["polygon", "ethereum", "bsc", "zksync", "optimism","arbitrum","base"].includes(blockchain)
      ? publicKey.toLowerCase()
      : publicKey;    
      
    if (normalizedKey === "genesis") 
      return;
    
    delay = delayByBlockchain[blockchain] || delay;
    console.log("selectedBlockchain : ", selectedBlockchain);
    console.log("Normalized Key : ", normalizedKey);

  const chain = blockchain;
  if (!visitedKeysByChain.has(chain)) {
    visitedKeysByChain.set(chain, new Set());
  }
  const visitedForChain = visitedKeysByChain.get(chain);

  if (visitedForChain.has(normalizedKey)) return [];
  visitedForChain.add(normalizedKey);

  let limit;

  if (blockchain === "mina") {
    limit = (normalizedKey.toLowerCase() === BASE_KEY.toLowerCase())
      ? FIRST_ITERATION_LIMIT
      : LIMIT;
  } else {
    limit = (normalizedKey.toLowerCase() === BASE_KEY.toLowerCase())
      ? Math.floor(FIRST_ITERATION_LIMIT / 2)
      : Math.floor(LIMIT / 2);
  }

  limit = Math.max(1, Math.floor(limit)); // évite un limit de 0 ou inférieur


    console.log("normalizedKey=",normalizedKey, " | BASEKEY=",BASE_KEY);

    try {
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        let transactions = [];

        //log_api_call(blockchain);

        if (blockchain === 'mina') {
            console.log("Calling Minataur API");
            transactions = Array.from(new Map((await fetchMinaTransactions(normalizedKey, limit)).map(tx => [tx.hash, tx])).values());

            transactions.forEach(tx => {
              tx.blockchain = 'mina';
              // 🔵 New fields added for ERC-20 Tokens
              tx.token_contract = null;
              tx.token_receiver = null;
              tx.token_amount = null;                                   
              tx.token_name = null,
              tx.token_decimals = null
            });


        }  else if (["ethereum", "polygon", "bsc", "solana", "zksync", "optimism","arbitrum","cronos", "tezos", "base"].includes(blockchain)) {
          transactions = await fetchTransactionsFromAlchemy(normalizedKey, blockchain, limit);
        }

        transactions = filterTransactionsByFetchDateRange(transactions);

        console.log(transactions);

        currentStep++;
        updateProgressBar(currentStep, totalSteps);
        return transactions;

    } catch (error) {
    console.warn("⚠️ Error during fetch, continuing anyway:", error.message || error);
    
    // Optionnel : log visible pour debugging si debugLevel >= 2
    console.warn(`⚠️ Error fetching tx for ${normalizedKey}: ${error.message}`);
    visitedForChain.delete(normalizedKey);
    if (getApiErrorStatus(error) === 429) {
      cancelRequested = true;
      hideLoader();
    }
    showApiError(error, capitalize(blockchain));

    // On continue le processus même en cas d'échec
    return typeof transactions !== "undefined" ? transactions : [];
    }
}

async function buildGraphRecursively(publicKey, depth, level = 0, chainOverride = null) {
  const chain = chainOverride || selectedBlockchain;

  const normalizedKey = ["polygon", "ethereum", "bsc", "zksync", "optimism", "arbitrum", "cronos", "base"].includes(chain)
    ? publicKey.toLowerCase()
    : publicKey;
    
  if (normalizedKey === "genesis") return;
  if (!window.initialPublicKey) window.initialPublicKey = normalizedKey;

  if (depth < 0 || cancelRequested) return;

  // Init visitedKeysByChain[chain]
  if (!visitedKeysByChain.has(chain)) {
    visitedKeysByChain.set(chain, new Set());
  }
  const visitedForChain = visitedKeysByChain.get(chain);
  
  if (visitedForChain.has(normalizedKey)) return;  

  log_api_call(chain);
    
  while (pause) await new Promise(r => setTimeout(r, 100));
  const transactions = await fetchTransactionsForKey(normalizedKey, chain, 1000);

  transactionsByNeighbor[normalizedKey] = transactions; // ✅ ici

  appendLoaderLog(`🔄 Loaded ${transactions.length} tx for ${normalizedKey.slice(0, 4)}…${normalizedKey.slice(-4)} on ${chain} depth ${level}`);

  const isValidEdge = (tx) => tx?.sender_key && tx?.receiver_key; // && tx.sender_key !== tx.receiver_key;

  const addOrUpdateNode = (key, name, chain) => {
    if (!graph.hasNode(key)) {
      graph.addNode(key, {
        label: `${name !== "noname" ? name : "Address"} (${key.slice(0, 6)}…${key.slice(-6)})`,
        name,
        chains: [chain],
        x: Math.random() * 1000,
        y: Math.random() * 1000
      });
    } else {
      const existingChains = graph.getNodeAttribute(key, 'chains') || [];
      if (!existingChains.includes(chain)) {
        graph.setNodeAttribute(key, 'chains', [...existingChains, chain]);
      }
    }
  };

  for (const tx of transactions) {
    const sender = tx.sender_key;
    const receiver = tx.receiver_key;
    
    if (tx.command_type === "stake") {
      console.warn("🌱 Stake tx detected:", tx);
    }
    
    if (!isValidEdge(tx)) {
      console.warn(`⚠️ Skipping tx with missing or invalid sender/receiver:`, tx);
      continue;
    }    
    
    const senderName = tx.sender_name;
    const receiverName = tx.receiver_name;
    const txChain = tx.blockchain || chain;

    addOrUpdateNode(sender, senderName, txChain);
    addOrUpdateNode(receiver, receiverName, txChain);

    const edgeId = `${tx.hash}-${tx.command_type}-${sender}-${receiver}-${tx.nonce}`;
    const edgeColor =
        tx.command_type === "token_transfer" || tx.command_type === "nft_transfer"
        ? "#f9a825" // 🟨 Dark Yellow for token transfers
        : tx.status === "applied"
          ? "#ccc"  // Light grey for normal applied tx
          : "#f66"; // Red for failed

    if (!graph.hasEdge(edgeId)) {
      const timestamp = parseInt(tx.timestamp); // parse to ensure it's a number
      graph.addEdgeWithKey(edgeId, sender, receiver, {
        label: tx.command_type,
        command_type: tx.command_type,
        contract_call_entrypoint: tx.contract_call_entrypoint ? tx.contract_call_entrypoint : null,  // Store the specific entrypoint here
        status: tx.status,
        sender_key: tx.sender_key,
        receiver_key: tx.receiver_key,
        sender_name: tx.sender_name,
        receiver_name: tx.receiver_name,
        timestamp: timestamp,
        fee: tx.fee,
        amount: tx.amount,
        block_id: tx.block_id,
        block_hash: tx.block_hash,
        memo: tx.memo,
        blockchain: txChain,
        token_contract: tx.token_contract,
        token_receiver: tx.token_receiver,
        token_amount: tx.token_amount,        
        token_name: tx.token_name,
        token_decimals: tx.token_decimals,
        color: edgeColor,
        hash: tx.hash 
      });
    }
  }

  // 🎨 Node coloring
  if (["polygon", "ethereum", "bsc", "solana", "zksync", "optimism", "arbitrum", "cronos", "tezos", "base"].includes(chain)) {
    const degrees = graph.nodes().map(n => graph.degree(n));
    const minDeg = Math.min(...degrees);
    const maxDeg = Math.max(...degrees);

    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      
      const chains = graph.getNodeAttribute(node, 'chains') || [chain];
      const primaryChain = chains[0];
      const color = getColorByDegree(degree, minDeg, maxDeg, primaryChain, chains.length);
      
      //const color = getColorByDegree(degree, minDeg, maxDeg);
      //console.log(degree," : ",color);
      graph.setNodeAttribute(node, 'colorByDegree', color);
      graph.setNodeAttribute(node, 'originalColor', color);
    });
  } else if (chain === "mina") {
    graph.forEachNode(node => {
      const name = graph.getNodeAttribute(node, 'name') || "noname";
      const color = getBrightColorByName(name);
      graph.setNodeAttribute(node, 'colorByDegree', color);
      graph.setNodeAttribute(node, 'originalColor', color);
    });
  }

  // Prepare next keys
  const normalize = (key) =>
    ["polygon", "ethereum", "bsc", "zksync", "optimism", "arbitrum", "cronos", "base"].includes(chain)
      ? key?.toLowerCase()
      : key;

  const nextKeys = [...new Set(
    transactions.flatMap(t => [
      normalize(t.receiver_key),
      normalize(t.sender_key)
    ]).filter(k => k && k !== normalizedKey)
  )];



  visitedForChain.add(normalizedKey);

  /*for (const t of transactions) {
    const rk = t.receiver_key;
    if (!rk) continue;
    
    const rkLower = rk.toLowerCase();
    const isSame = rkLower === normalizedKey;

    if (isSame) {
      console.warn("⚠️ Receiver equals normalizedKey after toLowerCase:");
      console.warn("  → receiver_key (original):", rk);
      console.warn("  → normalizedKey:", normalizedKey);
    } else {
      console.log("📬 New candidate receiver:", rk, "→", rkLower);
    }
  }*/

  totalSteps += nextKeys.length;
  updateProgressBar(currentStep, totalSteps);
  
  for (const k of nextKeys) {
    if (cancelRequested) break;
    await buildGraphRecursively(k, depth - 1, level + 1, chain);
  }  
  
}

function applyNodeSizesByDegree() {
  graph.forEachNode(node => {
    const degree = graph.degree(node);
    graph.setNodeAttribute(node, "size", 4 + Math.sqrt(degree));
  });
}

function stopLayout() {
  layoutController.stop({ remember: true });
}

function getAutomaticLayoutIterations(profile = "initial") {
  const nodeCount = graph?.order || 0;

  if (profile === "drag") return nodeCount <= 500 ? 150 : 75;
  if (profile === "incremental") return nodeCount <= 500 ? 500 : 250;
  if (nodeCount <= 150) return 2000;
  if (nodeCount <= 400) return 1200;
  if (nodeCount <= 1000) return 600;
  if (nodeCount <= 2000) return 250;
  return 100;
}

function animateLayout(iterations = null, profile = "initial") {
  layoutController.run({
    iterationsOverride: iterations ?? (profile === "initial" ? null : getAutomaticLayoutIterations(profile)),
    origin: "automatic"
  });
}

function setFilterPanelVisible(visible, { persist = true } = {}) {
  isFilterPanelVisible = Boolean(visible);
  const legend = document.getElementById("legend");
  const button = document.getElementById("filter-toggle-btn");

  if (legend) legend.style.display = isFilterPanelVisible && !isFullscreen ? "block" : "none";
  if (button) {
    const label = isFilterPanelVisible ? "Hide filters" : "Show filters";
    button.classList.toggle("is-active", isFilterPanelVisible);
    button.setAttribute("aria-pressed", String(isFilterPanelVisible));
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  if (persist) {
    try {
      localStorage.setItem(FILTER_PANEL_VISIBILITY_KEY, String(isFilterPanelVisible));
    } catch (error) {
      console.warn("Could not save filter visibility:", error);
    }
  }
}

function deleteSelectedNode(nodeId) {
  const panel = document.getElementById("side-panel");
  
  if (!graph.hasNode(nodeId)) return;

  // Clear selection *before* deletion
  if (selectedNode === nodeId) selectedNode = null;
  if (hoveredNode === nodeId) hoveredNode = null;

  if (isLayoutRunning) {
    stopLayoutInWorker();
    isLayoutRunning = false;
    setLayoutUiState("stopped");
  }

  const neighbors = graph.neighbors(nodeId);
  const toDelete = new Set([nodeId]); // Start with selected node

  neighbors.forEach(neighbor => {
    const neighborEdges = graph.edges(neighbor);
    let connectedOutside = false;

    for (const edge of neighborEdges) {
      const other = graph.source(edge) === neighbor ? graph.target(edge) : graph.source(edge);
      if (other !== nodeId && !toDelete.has(other)) {
        connectedOutside = true;
        break;
      }
    }

    if (!connectedOutside) {
      toDelete.add(neighbor);
    }
  });

  // Drop all nodes marked for deletion
  toDelete.forEach(n => {
    // Extra safety before deleting
    if (selectedNode === n) selectedNode = null;
    if (hoveredNode === n) hoveredNode = null;
    if (graph.hasNode(n)) graph.dropNode(n);
  });

  setNodePanelOpen(false);
  renderer.refresh();
}

function updateProgressBar(step, max) {
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");
  bar.max = max;
  bar.value = step;
  text.textContent = `${Math.round((step / max) * 100)}%`;
}

function isLightTheme() {
  return currentTheme === "light";
}

function formatTimestamp(timestamp) {
  var t = Number(timestamp);
  if (isNaN(t)) return "-";
  var date = new Date(t);
  if (isNaN(date.getTime())) return "-";
  return date.toISOString().replace(/:\d{2}\.\d{3}Z$/, "Z");
}

function formatTokenAmount(amount, decimals = 18) {
  try {
    if (!amount) return "0";

    // Convert hex if necessary
    if (typeof amount === "string" && amount.startsWith("0x")) {
      amount = BigInt(amount);
    } else if (typeof amount === "string" && /^[0-9]+$/.test(amount)) {
      amount = BigInt(amount);
    } else if (typeof amount === "number" && Number.isInteger(amount)) {
      amount = BigInt(amount);
    } else {
      // If it's a decimal number, return it as is (assuming it's already formatted)
      return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
    }

    const divisor = BigInt(10) ** BigInt(decimals);
    const result = Number(amount) / Number(divisor);

    return result.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });

  } catch (e) {
    console.warn("Invalid token amount:", amount, e);
    return "0";
  }
}

async function fetchMoreForNode(key, chain = selectedBlockchain) {
  const visitedSet = visitedKeysByChain.get(chain) || new Set();
  
  cancelRequested = false;
  
  if (visitedSet.has(key)) {
    alert(`This node was already fetched for ${capitalize(chain)}.`);
    return;
  }

  const previousInitialKey = BASE_KEY;
  const initialFirstLimit = FIRST_ITERATION_LIMIT;
  const initialLimit = LIMIT;
  
  BASE_KEY = key;
  FIRST_ITERATION_LIMIT = parseInt(document.getElementById("param-first-iteration").value, 10);;
  LIMIT = 0;
  showOverlaySpinner(chain, FIRST_ITERATION_LIMIT);  // ⬅️ Show fullscreen spinner
  //showLoader();
  await buildGraphRecursively(key, 0, 0, chain); // 👉 passe `chain`
  applyNodeSizesByDegree();
  setupReducers();
  rebuildTransactionsByNeighbor();
  setupDateSlicer(); // ✅ Update the slicer to reflect new edges
  if (isLayoutRunning) {
    stopLayoutInWorker();
    isLayoutRunning = false;
    setLayoutUiState("stopped");
  }  
  renderer.refresh();
  //hideLoader();
  hideOverlaySpinner();       // ⬅️ Hide spinner overlay
  showNodePanel(key); // 🔁 Refresh node panel after fetch
  // A cross-chain expansion is an explicit user action: honor every current
  // layout setting, including the iterations field, instead of using the
  // automatic incremental profile.
  animateLayout(null, "initial");

  BASE_KEY = previousInitialKey;
  //FIRST_ITERATION_LIMIT = initialFirstLimit;
  LIMIT = initialLimit;
}



function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getChainIcon(chain) {
  return blockchainSVGs[chain] || "";
}

function isTimestampInCurrentRange(timestamp) {
  const value = Number(timestamp);
  const [min, max] = currentRange;
  const lowerBound = new Date(min);
  const upperBound = new Date(max);
  lowerBound.setHours(0, 0, 0, 0);
  upperBound.setHours(24, 0, 0, 0);
  // The labels expose calendar days, so both selected days are inclusive even
  // when the underlying slider handles retain a transaction's time of day.
  return Number.isFinite(value) && value >= lowerBound.getTime() && value < upperBound.getTime();
}

function setNodeTransactionsChronological(enabled) {
  showNodeTransactionsChronologically = Boolean(enabled);
  if (selectedNode && graph?.hasNode(selectedNode)) showNodePanel(selectedNode, false);
}

function loadNodeTransactionSort() {
  const fallback = { column: "timestamp", direction: "desc" };
  try {
    const saved = JSON.parse(localStorage.getItem(NODE_TRANSACTION_SORT_STORAGE_KEY));
    const columns = new Set(["timestamp", "linkedNode", "blockchain", "block", "type", "amount", "fee", "status"]);
    if (columns.has(saved?.column) && ["asc", "desc"].includes(saved?.direction)) return saved;
  } catch (error) {
    console.warn("Unable to restore transaction sorting:", error);
  }
  return fallback;
}

function setNodeTransactionSort(column) {
  nodeTransactionSort = {
    column,
    direction: nodeTransactionSort.column === column && nodeTransactionSort.direction === "asc" ? "desc" : "asc"
  };
  try {
    localStorage.setItem(NODE_TRANSACTION_SORT_STORAGE_KEY, JSON.stringify(nodeTransactionSort));
  } catch (error) {
    console.warn("Unable to save transaction sorting:", error);
  }
  if (selectedNode && graph?.hasNode(selectedNode)) showNodePanel(selectedNode, false);
}

function renderSortableTransactionHeader(column, label, textAlign = "center") {
  const active = nodeTransactionSort.column === column;
  const indicator = active ? (nodeTransactionSort.direction === "asc" ? " ▲" : " ▼") : "";
  const nextDirection = active && nodeTransactionSort.direction === "asc" ? "descending" : "ascending";
  return `<th style="text-align:${textAlign};" aria-sort="${active ? (nodeTransactionSort.direction === "asc" ? "ascending" : "descending") : "none"}">
    <button type="button" class="transaction-sort-button" onclick="setNodeTransactionSort('${column}')"
      title="Sort ${nextDirection}">${label}<span aria-hidden="true">${indicator}</span></button>
  </th>`;
}

function parseNodeTransactionNumber(value) {
  if (typeof value === "string" && /^0x[0-9a-f]+$/i.test(value)) return Number(BigInt(value));
  const number = Number.parseFloat(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function getSortableNodeTransactionAmount(tx, field) {
  const value = parseNodeTransactionNumber(tx[field]);
  const alchemyChains = ["ethereum", "polygon", "bsc", "zksync", "optimism", "arbitrum", "base"];
  if (field === "amount" && alchemyChains.includes(tx.blockchain)) return value;
  if (field === "token_amount") {
    const decimals = tx.token_decimals ?? getKnownTokenInfo(tx.token_contract)?.decimals ?? 18;
    return value / Math.pow(10, decimals);
  }
  return value / Math.pow(10, getDecimalsForBlockchain(tx.blockchain));
}

function addressesMatchForTransaction(left, right) {
  if (!left || !right) return false;
  const a = String(left);
  const b = String(right);
  return a.startsWith("0x") && b.startsWith("0x")
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

function getNodeTransactionDirection(tx, node) {
  const isSender = addressesMatchForTransaction(tx.sender_key, node);
  const isReceiver = addressesMatchForTransaction(tx.receiver_key || tx.token_receiver, node);
  if (isSender && isReceiver) return 0;
  if (isSender) return -1;
  if (isReceiver) return 1;
  return null;
}

function formatSignedNodeTransactionAmount(tx, node) {
  const formattedAmount = formatNodeTransactionAmount(tx);
  if (formattedAmount === "-" || formattedAmount === "") return formattedAmount;
  const direction = getNodeTransactionDirection(tx, node);
  if (direction === -1) return `−${formattedAmount}`;
  if (direction === 1) return `+${formattedAmount}`;
  if (direction === 0) return `±${formattedAmount}`;
  return formattedAmount;
}

function getNodeTransactionSortValue(item, column, node) {
  const tx = item.tx || item;
  switch (column) {
    case "timestamp": return Number(tx.timestamp || 0);
    case "linkedNode": return item.linkedNodeLabel || item.linkedNode || "";
    case "blockchain": return tx.blockchain || "";
    case "block": return Number.isFinite(Number(tx.block_id)) ? Number(tx.block_id) : (tx.block_id || tx.block_hash || "");
    case "type": return `${tx.label || tx.command_type || ""}${tx.contract_call_entrypoint || ""}`;
    case "amount": {
      const amount = getSortableNodeTransactionAmount(
        tx,
        ["token_transfer", "nft_transfer"].includes(tx.label) ? "token_amount" : "amount"
      );
      const direction = getNodeTransactionDirection(tx, node);
      return direction === null ? amount : amount * direction;
    }
    case "fee": return getSortableNodeTransactionAmount(tx, "fee");
    case "status": return tx.status || "";
    default: return "";
  }
}

function sortNodeTransactions(items, node) {
  const direction = nodeTransactionSort.direction === "asc" ? 1 : -1;
  return items.map((item, index) => ({ item, index })).sort((left, right) => {
    const a = getNodeTransactionSortValue(left.item, nodeTransactionSort.column, node);
    const b = getNodeTransactionSortValue(right.item, nodeTransactionSort.column, node);
    let comparison;
    if (typeof a === "number" && typeof b === "number") comparison = a - b;
    else comparison = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    return comparison === 0 ? left.index - right.index : comparison * direction;
  }).map(entry => entry.item);
}

function formatNodeTransactionAmount(tx) {
  const isAlchemyChain = ["ethereum", "polygon", "bsc", "zksync", "optimism", "arbitrum", "base"].includes(tx.blockchain);
  if (!["token_transfer", "nft_transfer"].includes(tx.label)) {
    return isAlchemyChain
      ? parseFloat(tx.amount || 0).toFixed(2)
      : formatAmount(tx.amount, getDecimalsForBlockchain(tx.blockchain));
  }

  if (!tx.token_amount) return "-";
  const decimals = tx.token_decimals !== undefined && tx.token_decimals !== null
    ? tx.token_decimals
    : (getKnownTokenInfo(tx.token_contract)?.decimals ?? 18);
  const normalizedAmount = typeof tx.token_amount === "string" && tx.token_amount.startsWith("0x")
    ? BigInt(tx.token_amount).toString()
    : tx.token_amount.toString();
  const tokenInfo = getKnownTokenInfo(tx.token_contract);
  const tokenLabel = tx.token_name || tx.token_symbol || tokenInfo?.symbol || "token";
  return `${formatTokenAmount(normalizedAmount, decimals)} ${tokenLabel}`;
}

function renderChronologicalNodeTransactions(visibleEdges, node) {
  if (!visibleEdges.length) return '<p style="color:#888; margin-bottom: 16px;">No operations in the selected period.</p>';

  const operations = sortNodeTransactions(visibleEdges.map(edge => {
    const source = graph.source(edge);
    const target = graph.target(edge);
    const linkedNode = source === node ? target : source;
    return {
      tx: graph.getEdgeAttributes(edge),
      linkedNode,
      linkedNodeLabel: graph.hasNode(linkedNode) ? graph.getNodeAttribute(linkedNode, "label") : linkedNode
    };
  }), node);

  return `
    <div class="mono">
      <table style="width:100%; border-collapse: collapse; font-size: 8px; margin-bottom: 20px;">
        <thead>
          <tr>
            ${renderSortableTransactionHeader("timestamp", "Timestamp", "left")}
            ${renderSortableTransactionHeader("linkedNode", "Linked Node", "left")}
            ${renderSortableTransactionHeader("blockchain", "Chain")}
            ${renderSortableTransactionHeader("block", "Block")}
            ${renderSortableTransactionHeader("type", "Type")}
            ${renderSortableTransactionHeader("amount", "Amount")}
            ${renderSortableTransactionHeader("fee", "Fee")}
            ${renderSortableTransactionHeader("status", "Status")}
          </tr>
        </thead>
        <tbody>
          ${operations.map(({ tx, linkedNode }) => {
            const linkedLabel = graph.hasNode(linkedNode) ? graph.getNodeAttribute(linkedNode, "label") : linkedNode;
            const transactionLink = tx.hash
              ? getExplorerURL("transaction", tx.hash, tx.blockchain)
              : getExplorerURL("block", tx.block_hash || tx.block_id, tx.blockchain);
            const typeLabel = `${tx.label || "-"}${tx.contract_call_entrypoint ? `:${tx.contract_call_entrypoint}` : ""}`;
            const isAlchemyChain = ["ethereum", "polygon", "bsc", "zksync", "optimism", "arbitrum", "base"].includes(tx.blockchain);
            const fee = isAlchemyChain
              ? parseFloat(tx.fee || 0).toFixed(2)
              : formatAmount(tx.fee, getDecimalsForBlockchain(tx.blockchain));
            return `
              <tr title="${tx.memo || ""}">
                <td>${formatTimestamp(tx.timestamp)}</td>
                <td>
                  <a href="#" onclick="showNodePanel('${linkedNode}'); return false;" style="color:#4fc3f7; text-decoration:none;">
                    ${linkedLabel}
                  </a>
                </td>
                <td>${tx.blockchain}</td>
                <td>${tx.block_id || tx.block_hash
                  ? `<a href="${getExplorerURL("block", tx.block_hash || tx.block_id, tx.blockchain)}" target="_blank" rel="noopener noreferrer" style="color:white; text-decoration:none;">${tx.block_id || tx.block_hash}</a>`
                  : "-"}</td>
                <td><a href="${transactionLink}" target="_blank" rel="noopener noreferrer" style="color:white; text-decoration:none;">${typeLabel}</a></td>
                <td>${formatSignedNodeTransactionAmount(tx, node)}</td>
                <td>${fee}</td>
                <td>${tx.status || "-"}</td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function showNodePanel(node, refreshExternalStatus = true) {
  //rebuildTransactionsByNeighbor();
  const panel = document.getElementById("side-panel");
  const previouslySelectedNode = selectedNode;
  const currentWatchIcon = document.querySelector("#watch-status > span");
  const cachedWatchState = currentWatchIcon?.title === "Unwatch address";
  const data = graph.getNodeAttributes(node);
  const visibleEdges = graph.edges(node).filter(edge => {
    const attributes = graph.getEdgeAttributes(edge);
    return isTimestampInCurrentRange(attributes.timestamp) &&
      transactionMatchesActiveLegendFilters(attributes);
  });
  const neighbors = [...new Set(visibleEdges.map(edge => {
    const source = graph.source(edge);
    const target = graph.target(edge);
    return source === node ? target : source;
  }))];
  const isFav = isFavorite(node, selectedBlockchain);
  let favName;
  
  setNodePanelOpen(true);
  
  selectedNode = node;

  let tx = 0, del = 0, failed = 0, sc = 0, tt = 0;
  visibleEdges.forEach(edge => {
    const attr = graph.getEdgeAttributes(edge);
    if (attr.status !== "applied") failed++;
        else if (attr.command_type === "delegation") del++;
        else if (attr.command_type === "stake" || attr.command_type === "delegate") del++;
        else if (attr.command_type === "payment" || attr.command_type === "transfer") tx++;
        else if (attr.command_type === "contract_call" || attr.command_type === "zkapp" || attr.command_type === "contract_creation") sc++;
        else if (attr.command_type === "token_transfer" || attr.command_type === "nft_transfer") tt++;
  });


  const evmChains = ["ethereum", "polygon", "bsc", "zksync", "optimism", "arbitrum", "cronos", "base"];
  const strictChains = ["mina", "solana", "tezos"];

  const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(node);
  const isTezosAddress = /^(tz[1-3]|KT1)[a-zA-Z0-9]{33}$/.test(node); // include tz1-3 and KT1
  const isMinaAddress = /^B62[a-zA-Z0-9]{52}$/.test(node);
  const isSolanaAddress =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(node) &&
    !isTezosAddress && !isMinaAddress && !isEvmAddress; // avoid false positives

  let compatibleChains = [];

  if (isMinaAddress) compatibleChains = ["mina"];
  else if (isTezosAddress) compatibleChains = ["tezos"];
  else if (isSolanaAddress) compatibleChains = ["solana"];
  else if (isEvmAddress) compatibleChains = evmChains;

  const chainsToFetch = compatibleChains.filter(chain => {
    const visitedSet = visitedKeysByChain.get(chain) || new Set();
    return !visitedSet.has(node);
  });

  let fetchButtonsHTML = "";

  if (chainsToFetch.length === 0) {
    fetchButtonsHTML = `<p style="font-size: 12px; color: #aaa; margin-top: 4px;">✅ Already fetched for all chains</p>`;
  } else {
    const links = chainsToFetch.map(chain => `
      <a class="chain-fetch-link" href="#" onclick="fetchMoreForNode('${node}', '${chain}'); return false;"
         title="Fetch from ${capitalize(chain)}">
        <img class="chain-fetch-icon" src="img/${chain}.png" alt="${chain} icon" />
      </a>`).join("");

    fetchButtonsHTML = `
      <p style="margin-top: 4px; margin-bottom: 0px; font-size: 14px;">
        ${links}
      </p>`;
  }


  //console.log('transactionsByNeighbor keys:', Object.keys(transactionsByNeighbor));
  //console.log('Looking for node:', node);
  //neighbors.forEach(n => {
  //  console.log('Looking for neighbor:', n);
  //});
  
  const html = `
    <h3 class="node-title">
      <a href="${getExplorerURL('account', node, selectedBlockchain)}" target="_blank" style="color:#4fc3f7">
        ${data.label}
      </a>
      <span id="favorite-status"></span>
      <span id="watch-status"></span>
    </h3>      
    <button class="node-delete-button" onclick="deleteSelectedNode('${node}')" title="Delete node (Del)">🗑️ Delete Node from Graph</button>
    <div class="node-key-row">
      <code class="node-key-value" title="${node}">${node}</code>
      <button class="node-key-copy" type="button" aria-label="Copy address" title="Copy address">
        <span>Copy</span>
      </button>
    </div>
    ${fetchButtonsHTML}
    <div class="node-stats">
      <div><span>Degree</span><strong>${neighbors.length}</strong></div>
      <div><span>Transactions</span><strong>${tx}</strong></div>
      <div><span>Delegations</span><strong>${del}</strong></div>
      <div><span>Contracts</span><strong>${sc}</strong></div>
      <div><span>Token transfers</span><strong>${tt}</strong></div>
      <div><span>Failed</span><strong>${failed}</strong></div>
    </div>
    <p class="node-period">
      Operations from ${new Date(currentRange[0]).toLocaleDateString()} to ${new Date(currentRange[1]).toLocaleDateString()}
    </p>
    <p class="node-transactions-heading"><strong>Linked Nodes & Transactions</strong></p>
    <label class="node-chronological-toggle">
      <input type="checkbox" id="chronological-transactions-toggle"
        ${showNodeTransactionsChronologically ? "checked" : ""}
        onchange="setNodeTransactionsChronological(this.checked)">
      Show all transactions chronologically
    </label>
    <div>
      ${showNodeTransactionsChronologically
        ? renderChronologicalNodeTransactions(visibleEdges, node)
        : (neighbors.length ? neighbors
        .map(n => {
          const directEdges = visibleEdges.filter(e => {
            const source = graph.source(e);
            const target = graph.target(e);
            return (source === node && target === n) || (source === n && target === node);
          });
          const interactions = directEdges.map(e => graph.getEdgeAttributes(e));
          const latestTimestamp = interactions.reduce((max, tx) => Math.max(max, tx.timestamp || 0), 0);
          return { n, latestTimestamp };
        })
        .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
        .map(({ n, latestTimestamp }) => {
          const isFav = isFavorite(n, selectedBlockchain);
          const favName = getFavoriteName(n, selectedBlockchain);
          const shortId = n.slice(0,6) + '…' + n.slice(-6);
          const label = graph.getNodeAttribute(n, 'label');
          const age = Date.now() - (latestTimestamp || 0);
          let recencyBadge = '';

          if (latestTimestamp) {
            if (age < 30 * 24 * 60 * 60 * 1000) {
              recencyBadge = `<span style="color:#00e676; font-size: 10px; margin-left: 6px;">● last 30 days</span>`;
            } else if (age < 365 * 24 * 60 * 60 * 1000) {
              recencyBadge = `<span style="color:#ffee58; font-size: 10px; margin-left: 6px;">● last 365 days</span>`;
            } else {
              recencyBadge = `<span style="color:#90a4ae; font-size: 10px; margin-left: 6px;">● older</span>`;
            }
          }

        const directEdges = visibleEdges.filter(e => {
          const source = graph.source(e);
          const target = graph.target(e);
          return (source === node && target === n) || (source === n && target === node);
        });

        const interactions = directEdges.map(e => graph.getEdgeAttributes(e));

          const sortedInteractions = sortNodeTransactions(interactions, node);

        const txTable = interactions.length > 0 ? `
          <table style="width:100%; border-collapse: collapse; font-size: 8px; margin-bottom: 20px;">
            <thead>
              <tr>
                ${renderSortableTransactionHeader("blockchain", "Chain")}
                ${renderSortableTransactionHeader("timestamp", "Timestamp", "left")}
                ${renderSortableTransactionHeader("block", "Block")}
                ${renderSortableTransactionHeader("type", "Type")}
                ${renderSortableTransactionHeader("amount", "Amount")}
                ${renderSortableTransactionHeader("fee", "Fee")}
                ${renderSortableTransactionHeader("status", "Status")}
                <!--<th>Chain</th>-->
              </tr>
            </thead>
            <tbody>
              ${sortedInteractions.map(tx => {
                console.log("Tx Hash: ",tx.hash, " | Debug Token Amount:", tx.token_amount, "Raw amount:", tx.amount);
                  const isAlchemyChain = (chain) => ["ethereum", "polygon", "bsc","zksync","optimism","arbitrum", "base"].includes(chain);
                return `
                <tr title="${tx.memo || ''}">
                  <td>${tx.blockchain}</td>
                  <td>${formatTimestamp(tx.timestamp)}</td>
                  <td>
                      ${tx.block_id || tx.block_hash
                        ? `<a href="${getExplorerURL('block', tx.block_hash || tx.block_id, tx.blockchain)}" 
                              target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: none;">
                             ${tx.block_id || tx.block_hash}
                        </a> <span style="font-size: 9px; opacity: 0.7;">🔗</span>`
                      : "-"}
                  </td>                    
                  <td>
                    ${(() => {
                        const isTokenTransfer = ["token_transfer", "nft_transfer"].includes(tx.label);
                      //const link = isTokenTransfer
                      //  ? (tx.token_contract ? getExplorerURL('account', tx.token_contract, tx.blockchain) : "#")
                      //  : (tx.hash ? getExplorerURL('transaction', tx.hash, tx.blockchain) : "#");
                        const link = tx.hash ? getExplorerURL('transaction', tx.hash, tx.blockchain) : getExplorerURL('block', tx.block_hash || tx.block_id, tx.blockchain);           
                        const tlabel = tx.label || "-"; // Default to "-" if no label
                        const entryPoint = tx.contract_call_entrypoint ? `:${tx.contract_call_entrypoint}` : ''; // Check if entrypoint exists and append it
                        // Concatenate the entry point to the label
                        const label = tlabel + entryPoint;
                      return `
                        <a href="${link}" target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: none;">
                          ${label} <span style="font-size: 9px; opacity: 0.7;">🔗</span>
                    </a>
                      `;
                    })()}
                  </td>
                  <td>${formatSignedNodeTransactionAmount(tx, node)}</td>
                  <td>${isAlchemyChain(tx.blockchain) 
                         ? parseFloat(tx.fee || 0).toFixed(2)
                         : formatAmount(tx.fee, getDecimalsForBlockchain(tx.blockchain))}</td>
                  <td>${tx.status || "-"}</td>
                </tr>
                  ${tx.label === "token_transfer" || tx.label === "nft_transfer" ? `
                  <tr style="opacity: 0.7;">
                    <td colspan="2" style="text-align: right;">
                      Receiver: ${(tx.token_receiver ? `${tx.token_receiver.slice(0,6)}...${tx.token_receiver.slice(-6)}` : "unknown")}
                    </td>
                    <td colspan="5" style="text-align: right;">
                      ${(() => {
                        if (!tx.token_amount) return "-";

                        const decimals = (tx.token_decimals !== undefined && tx.token_decimals !== null)
                          ? tx.token_decimals
                          : (getKnownTokenInfo(tx.token_contract)?.decimals ?? 18);

                        let normalizedAmount;

                        // Case 1: Hex string (e.g., "0x7d2b7500")
                        if (typeof tx.token_amount === "string" && tx.token_amount.startsWith("0x")) {
                          normalizedAmount = BigInt(tx.token_amount).toString(); // Convert hex to decimal string
                        }
                        // Case 2: Number (e.g., 2100) — convert to string
                        else if (typeof tx.token_amount === "number") {
                          normalizedAmount = tx.token_amount.toString();
                        }
                        // Case 3: Already a decimal string (e.g., "2100")
                        else {
                          normalizedAmount = tx.token_amount;
                        }
                        //console.log("Amount : ",normalizedAmount, "| Decimals : ", decimals);
                        return formatTokenAmount(normalizedAmount, decimals);
                      })()} 
                      ${(() => {
                        const tokenLink = tx.token_contract ? getExplorerURL('account', tx.token_contract, tx.blockchain) : "#";
                        let tokenLabel = "UnknownToken";

                        if (tx.token_name) {
                          tokenLabel = tx.token_name;
                        } else {
                          const tokenInfo = getKnownTokenInfo(tx.token_contract);
                          if (tokenInfo) {
                            tokenLabel = tokenInfo.symbol;
                          } else if (tx.token_contract) {
                            tokenLabel = tx.token_contract.slice(0, 6) + "..." + tx.token_contract.slice(-6);
                            console.log ("\"" + tx.token_contract + "\",");
                          }
                        }

                        return `
                          <a href="${tokenLink}" target="_blank" rel="noopener noreferrer" style="color: #f9a825; text-decoration: none;">
                            ${tokenLabel} 🔗
                          </a>
                        `;
                      })()}
                    </td>
                  </tr>` : ""}
              `}).join("")}
            </tbody>
          </table>
        ` : `<p style="color:#888; margin-bottom: 16px;">No direct interactions.</p>`;

        return `
          <div style="margin-bottom: 20px;">
              <div class="linked-node" onclick="showNodePanel('${n}')">
                ${((isFav && favName) ? ` ⭐ ${favName} (${shortId})` : label)}${recencyBadge}
              </div>
            <div class="mono">
              ${txTable}
            </div>
          </div>
        `;
      }).join('') : '<p style="color:#888; margin-bottom: 16px;">No operations in the selected period.</p>')}
    </div>`;
    
  details.innerHTML = html;
  details.querySelector(".node-key-copy")?.addEventListener("click", event => copyNodeKey(node, event.currentTarget));
  if (previouslySelectedNode !== node) details.scrollTop = 0;
  
  if (evmChains.includes(selectedBlockchain) || selectedBlockchain==="tezos" || selectedBlockchain==="mina" || selectedBlockchain==="solana") {
    const watchSpan = document.getElementById("watch-status");
    if (!watchSpan) return;

    if (refreshExternalStatus) {
      isWatched(node, selectedBlockchain).then(watched => {
        renderWatchIcon(watchSpan, watched, node, selectedBlockchain);
      });
    } else {
      renderWatchIcon(watchSpan, cachedWatchState, node, selectedBlockchain);
    }
  }

  const favSpan = document.getElementById("favorite-status");
  renderFavIcon(favSpan, isFav, node, selectedBlockchain);

  
  renderer.refresh(); // ✅ ensures selection is visible immediately
}

function initRenderer() {
  const container = document.getElementById("sigma-container");
  
  // ⛔ Block init if container is not visible
  if (!container.offsetWidth || !container.offsetHeight) {
    console.warn("Sigma container not ready. Retrying in 100ms...");
    setTimeout(initRenderer, 100); // retry later
    return;
  }    
  
  graph = new Graph({ multi: true });
  //console.log("Dans InitRenderer - isLightTheme = " + isLightTheme())
  param = {
    labelColor: {
        color: isLightTheme() ? "#000" : "#9999ff"
    },
    defaultNodeType: "bordered",
    nodeProgramClasses: {
      bordered: NodeBorderProgram,
    },
  }
  //renderer = new Sigma(graph, container);

  renderer = new Sigma(graph,container,param);
  bindSigmaRenderingRecovery();
  renderer.setSetting("defaultNodeBorderColor", "#fff");
  renderer.setSetting("defaultNodeBorderSize", 40);
  syncCameraControlsToRenderer();
  
  // Re-apply settings and listeners
  setupReducers();
  setupInteractions();
  setupSearch();
}

function setupReducers() {
  // 🔢 Precompute min/max degree for color gradient (used only for Polygon & Ethereum & BSC)
  let minDegree = Infinity;
  let maxDegree = -Infinity;

  if (selectedBlockchain === "polygon" || selectedBlockchain === "ethereum" || selectedBlockchain === "bsc" || selectedBlockchain === "solana" || selectedBlockchain === "zksync" || selectedBlockchain === "optimism" || selectedBlockchain === "arbitrum" || selectedBlockchain === "cronos" || selectedBlockchain === "tezos" || selectedBlockchain === "base") {
    graph.forEachNode(node => {
      const deg = graph.degree(node);
      if (deg < minDegree) minDegree = deg;
      if (deg > maxDegree) maxDegree = deg;
    });
  }
  
  renderer.setSetting("nodeReducer", (node, data) => {
    if (!graph.hasNode(node)) return { ...data, hidden: true };

    const focusCandidate = hoveredNode || selectedNode;
    const focusNode = focusCandidate && graph.hasNode(focusCandidate) ? focusCandidate : null;
    const neighbors = focusNode ? new Set(graph.neighbors(focusNode)) : null;
    const isFocus = focusNode === node;
    const isNeighbor = neighbors?.has(node);
    //console.log("getBrightColorByName " + data.name); 
    //const glowColor =  getBrightColorByName(data.name || "noname");
    //const glowColor =  data.color;
    

    // 🖌️ Use color from degree for Polygon & Ethereum, or name-based color for Mina
    // 🖌️ Use color from degree for Polygon & Ethereum, or name-based color for Mina
    const isMina = selectedBlockchain === "mina";
    let glowColor;

    const chains = data.chains instanceof Set ? Array.from(data.chains) : (data.chains || []);
    const chainCount = chains.length;
    const primaryChain = chains[0] || selectedBlockchain;

    // ★— NEW: check if this node is in favorites
    const isFav = isAddressInFavorites(node, primaryChain);
    const favName = getFavoriteName(node, primaryChain);

    if (node === window.initialPublicKey) {
      glowColor = "#FF0000"; // 🔥 Red for the initial key
    } else if (primaryChain === "mina") {
      glowColor = getBrightColorByName(data.name || "noname");
    } else if (chainCount > 1) {
      glowColor = "#ff00ff"; // 🟠 Orange for shared nodes
    } else {
      glowColor = getColorByDegree(graph.degree(node), minDegree, maxDegree, primaryChain, chainCount);
    }

    
    const defaultSize = data.size || 5;
    //console.log("Dans nodeReducer - isLightTheme = " + isLightTheme())


    const hasActiveLegendFilters = commandTypeFilter.size > 0 || chainFilter.size > 0;
    const matchesActiveFilters = !hasActiveLegendFilters || graph.edges(node).some(edge =>
      transactionMatchesActiveLegendFilters(graph.getEdgeAttributes(edge))
    );

    if (!matchesActiveFilters) {
        return {
          ...data,
          color: isLightTheme() ? "#eee" : "#111",
          label: "",
          labelSize: 36,
          hidden: false,
          opacity: 0.05,
          size: defaultSize * 0.1, //* 0.7,
          borderSize: 0,
          zIndex: 0
        };
      }

    // ✨ Focus or neighbor styling
    if (focusNode) {
      if (isFocus) {
        //console.log ("Node Focused");
        return {
          ...data,
          //type: "circle",
          color: glowColor,
          overrideColor: glowColor, // 🟢 force Sigma to use this color
          label: data.label + (isFav ? ` ⭐ (${favName})` : ""),
          //label: showAllLabels ? data.label : "",
          labelSize: 36,
          labelColor: {color: "#000"},
          forceLabelColor: true,
          //labelBackground: {
          //  color: currentTheme === "light" ? "#000" : "#fff",
          //  opacity: 0.6,
          //  padding: 3,
          //  borderRadius: 4,
          //},  
          //forceLabelBackground: true,
          zIndex: 2,
          size: defaultSize * 2.2,
          borderColor: isLightTheme() ? "#111" : "#eee",
          borderSize: 12,
          opacity: 0.9,
        };
      }

      if (isNeighbor) {
        return {
          ...data,
          //type: "circle",
          color: glowColor,
          overrideColor: glowColor, // 🟢 force Sigma to use this color
          label: showAllLabels ? data.label + (isFav ? ` ⭐ (${favName})` : "") : "",
          //label: showAllLabels ? data.label : "",
          labelSize: 36,
          // 👇 Force label color
          labelColor: {color: isLightTheme() ? "#000" : "#fff"},
          forceLabelColor: true,
          labelBackground: {
            color: currentTheme === "light" ? "#000" : "#fff",
            opacity: 0.6,
            padding: 3,
            borderRadius: 4,
          },  
          forceLabelBackground: true,                
          zIndex: 1,
          size: defaultSize * 1.5,
          borderColor: isLightTheme() ? "#111" : "#eee", //glowColor,
          borderSize: 4,
          opacity: 0.5,
        };
      }

      // Dim unrelated nodes
      return {
        ...data,
        //type: "circle",
        color: isLightTheme() ? "#EEECEE" : "#111",
        labelColor: {color: isLightTheme() ? "#000" : "#fff"},
        label: "",
        labelSize: 36,
        size: defaultSize * 0.7,
        opacity: 0.1,
        borderSize: 0,
        borderColor: isLightTheme() ? "#EEECEE" : "#111",
        zIndex: 0
      };
    }

    // 🧩 Default view
    standardNode = {
      ...data,
      //type: "circle",
      color: glowColor,
      overrideColor: glowColor, // 🟢 force Sigma to use this color
      borderColor: isLightTheme() ? "#111" : "#eee",
      borderSize: 10,
      opacity: 1,
      label: showAllLabels ? data.label + (isFav ? ` ⭐ (${favName})` : "") : "",
      //label: showAllLabels ? data.label : "",
      // 👇 Force label color
      labelColor: {color: isLightTheme() ? "#000" : "#fff"},
      forceLabelColor: true,
      //labelBackground: {
      //  color: currentTheme === "light" ? "#000" : "#fff",
      //  opacity: 0.6,
      //  padding: 3,
      //  borderRadius: 4,
      //},
      labelSize: 36,
      //forceLabelBackground: true,          
      size: defaultSize,
      zIndex: 1
    };
    
    //console.log("Rendering node:", node, standardNode);

    // 🧩 Default view
    return standardNode;
  });
  
  //renderer.setSetting("defaultNodeColor", "#fff"); // or any default fallback


  renderer.setSetting("edgeReducer", (edge, data) => {
    // Sigma can render from its cache while Graphology is emitting a removal or
    // replacement event. Never resolve extremities for an edge that has already
    // disappeared from the graph.
    if (!graph.hasEdge(edge)) return { ...data, hidden: true };

    const focusNode = hoveredNode || selectedNode;
    const command = data.command_type || data.label;

    const source = graph.source(edge);
    const target = graph.target(edge);
    const sourceNode = graph.getNodeAttributes(source);
    const targetNode = graph.getNodeAttributes(target);

    // Base color by type
    let baseColor = "#666";
    switch (command) {
      case "payment": baseColor = "#4caf50"; break;
      case "transfer": baseColor = "#4caf50"; break;
      case "delegation": baseColor = "#2196f3"; break;
      case "delegate": baseColor = "#2196f3"; break;
      case "stake": baseColor = "#2196f3"; break;
      case "zkapp": baseColor = "#ff57c1"; break;
      case "contract_call": baseColor = "#ff57c1"; break;
      case "contract_creation": baseColor = "#ff57c1"; break;
      case "token_transfer": baseColor = "#f9a825"; break;
      case "nft_transfer": baseColor = "#f9a825"; break;
    }

    const fadedStyle = {
        ...data,
        color: isLightTheme() ? "#eee" : "#111",
        size: 0.3,
        opacity: 0.05,
        zIndex: 0
      };

    if (!transactionMatchesActiveLegendFilters(data)) return fadedStyle;

    if (focusNode) {
      const neighbors = new Set(graph.neighbors(focusNode));

      const isFocusEdge =
        (source === focusNode && neighbors.has(target)) ||
        (target === focusNode && neighbors.has(source));

        return {
          ...data,
        color: isFocusEdge ? baseColor : (isLightTheme() ? "#eee" : "#111"),
        size: isFocusEdge ? 1.5 : 0.4,
        opacity: isFocusEdge ? 0.6 : 0.1,
        zIndex: isFocusEdge ? 2 : 0
        };
      }

    // 🌐 Default
    return {
      ...data,
      color: baseColor,
      size: 0.8,
      opacity: 0.3,
      zIndex: 0
    };
  });
}

function setupInteractions() {
  // State for drag'n'drop
  let draggedNode   = null;
  let isDragging = false;  
  let hasMoved = false;
  let dragOwnsCustomBBox = false;
  let suppressNodeClick = false;
  let ignoreStageClickUntil = 0;
  let lastTouchNodeClick = { node: null, time: 0 };
  let dragStartPos = { x: 0, y: 0 };
  const interactionContainer = renderer.getContainer();

  const isTouchInteraction = event => event?.original?.type?.startsWith("touch") === true;
  const getTouchCount = event => event?.original?.touches?.length || 0;

  const cancelDrag = () => {
    if (draggedNode && graph.hasNode(draggedNode)) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    if (dragOwnsCustomBBox) {
      renderer.setCustomBBox(null);
      dragOwnsCustomBBox = false;
    }
    draggedNode = null;
    isDragging = false;
    hasMoved = false;
  };
  
  // Hover in/out to show tooltip & halo
  renderer.on("enterNode", ({ node, event }) => {
    // A first finger temporarily looks like a hover before the second finger
    // lands. Never turn that transient touch state into a node selection.
    if (isTouchInteraction(event)) return;
    hoveredNode = node;
    tooltip.style.display = "block";
    tooltip.innerText = graph.getNodeAttribute(node, "label");
    
    const pos = renderer.getNodeDisplayData(node);
    const halo = document.createElement("div");
    halo.className = "node-halo";
    halo.style.left = `${pos.x}px`;
    halo.style.top = `${pos.y}px`;
    halo.id = "node-halo";
    document.getElementById("sigma-container").appendChild(halo);        
    
    renderer.refresh();
  });

  renderer.on("leaveNode", ({ event }) => {
    if (isTouchInteraction(event)) return;
    hoveredNode = null;
    tooltip.style.display = "none";
    const halo = document.getElementById("node-halo");
    if (halo) halo.remove();        
    renderer.refresh();
  });

  // Click on the background to hide the panel
  renderer.on("clickStage", () => {
    if (Date.now() <= ignoreStageClickUntil) {
      return;
    }
    hideNodePanel();
  });

  // Sigma's dedicated click event is reliable even when pointer-up lands a
  // few pixels outside the node. Drag completion must never open the panel.
  renderer.on("clickNode", ({ node, event }) => {
    if (hasMoved || suppressNodeClick || !graph.hasNode(node)) return;
    const touchInteraction = isTouchInteraction(event);

    // Chromium can emit a compatibility mouse click immediately after Sigma's
    // touch tap. It is the same physical tap, not a request to open details.
    if (
      !touchInteraction &&
      lastTouchNodeClick.node === node &&
      Date.now() - lastTouchNodeClick.time < 800
    ) {
      return;
    }
    ignoreStageClickUntil = Date.now() + 150;

    // On touch, the first tap mirrors desktop hover/selection. A deliberate
    // second tap on the same node opens its details. Mouse clicks keep their
    // existing one-step behaviour.
    if (touchInteraction) {
      lastTouchNodeClick = { node, time: Date.now() };
      if (selectedNode === node) {
        showNodePanel(node);
      } else {
        setNodePanelOpen(false);
        selectedNode = node;
      }
      renderer.refresh();
      return;
    }

    selectedNode = node;
    showNodePanel(node);
    renderer.refresh();
  });

  // Keep tooltip following pointer. The container survives WebGL renderer
  // rebuilds, so this DOM listener must only be installed once.
  if (interactionContainer.dataset.minagraphTooltipTracking !== "true") {
    interactionContainer.dataset.minagraphTooltipTracking = "true";
    interactionContainer.addEventListener("mousemove", e => {
      tooltip.style.left = e.pageX + 10 + "px";
      tooltip.style.top = e.pageY + 10 + "px";
    });
  }
  
  // Start drag on downNode (mouse or touch)
    renderer.on("downNode", ({ node, event }) => {
      if (getTouchCount(event) > 1) {
        cancelDrag();
        return;
      }
      draggedNode = node;
      isDragging = true;
      hasMoved = false;
      dragStartPos = { x: event.x, y: event.y };
    });

  // During drag, move the node and detect “real” drag vs click
    renderer.on("moveBody", ({ event }) => {
      // If a second finger joins a node drag, hand the gesture back to Sigma's
      // camera immediately. In particular, do not prevent the pinch default.
      if (getTouchCount(event) > 1) {
        cancelDrag();
        return;
      }
      if (!isDragging || !draggedNode) return;

    const dx = event.x - dragStartPos.x,
          dy = event.y - dragStartPos.y;
    if (!hasMoved && Math.hypot(dx, dy) > 5) {
      hasMoved = true;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      if (!renderer.getCustomBBox()) {
        renderer.setCustomBBox(renderer.getBBox());
        dragOwnsCustomBBox = true;
      }
    }

      if (hasMoved) {
        const pos = renderer.viewportToGraph(event);
        graph.setNodeAttribute(draggedNode, "x", pos.x);
        graph.setNodeAttribute(draggedNode, "y", pos.y);
      }

    // prevent Sigma’s default camera drag
      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    });

  // End drag (mouse-up or touch-end) — handle as click if no real drag
  const endDrag = ({ node }) => {
    // clear highlighting
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted");
      }

    // Release Sigma's frozen normalization before opening details or starting
    // another layout. Only clear a BBox installed by this drag interaction.
    if (dragOwnsCustomBBox) {
      renderer.setCustomBBox(null);
      dragOwnsCustomBBox = false;
    }

    if (hasMoved) {
      suppressNodeClick = true;
      // you dragged: optionally re-layout or whatever
      animateLayout(null, "drag");
      setTimeout(() => { suppressNodeClick = false; }, 0);
    }

    // reset state
    isDragging   = false;
    draggedNode  = null;
    hasMoved     = false;
  };

  renderer.on("upNode", endDrag);
  renderer.on("upStage", endDrag);
}

function setupSearch_old() {
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search");
  const panel = document.getElementById("side-panel");


  searchInput.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const panel = document.getElementById("side-panel");

    clearBtn.style.display = query ? "block" : "none";

    if (!query) {
      selectedNode = null;
      setNodePanelOpen(false);
      renderer.refresh();
      return;
    }

    const match = graph.nodes().find(n =>
      graph.getNodeAttribute(n, "label").toLowerCase().includes(query)
    );

    selectedNode = match || null;

    if (match) {
      //showNodePanel(match);
      //panel.style.display = "flex";
    } else {
      setNodePanelOpen(false);
    }

    renderer.refresh();
  });
  
  document.getElementById("search-icon").addEventListener("click", () => {
    const searchDiv = document.getElementById("searchdiv");
    const input = document.getElementById("search-input");
    const searchVisible = searchDiv.style.display === "block" ? false : true;
    searchDiv.style.display = searchVisible ? "none" : "block";
    input.style.display = searchVisible ? "none" : "block";
    if (searchVisible) input.focus();
  });
  

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    selectedNode = null;
    clearBtn.style.display = "none";
    setNodePanelOpen(false);
    renderer.refresh();
  });
}

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search");
  const searchButton = document.getElementById("search-icon");

  // Renderer recovery can call setupSearch again. Keep a single set of DOM
  // listeners so one tap always produces exactly one visibility transition.
  if (!searchInput || !clearBtn || !searchButton || searchButton.dataset.searchInitialized === "true") return;
  searchButton.dataset.searchInitialized = "true";

  searchInput.addEventListener("input", e => {
    const query = e.target.value;
    clearBtn.style.display = query ? "block" : "none";
    if (graph && renderer) handleSearch(query);
  });

  searchButton.addEventListener("click", () => {
    const searchDiv = document.getElementById("searchdiv");
    const input = document.getElementById("search-input");
    const shouldShow = searchDiv.style.display !== "block";
    searchDiv.style.display = shouldShow ? "block" : "none";
    input.style.display = shouldShow ? "block" : "none";
    searchButton.setAttribute("aria-expanded", String(shouldShow));
    if (shouldShow) input.focus();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    selectedNode = null;
    clearBtn.style.display = "none";
    setNodePanelOpen(false);
    if (graph && renderer) handleSearch("");
  });
}

function handleSearch(query) {
  const trimmed = query.trim();

  if (!trimmed) {
    graph.forEachNode(n => {
      graph.setNodeAttribute(n, "hidden", false);
    });
    graph.forEachEdge(e => {
      graph.setEdgeAttribute(e, "hidden", false);
    });

    renderer.setSetting("nodeReducer", (node, attr) => ({
      ...attr,
      color: attr.originalColor || attr.color,
      zIndex: 1
    }));

    setupReducers();

    renderer.refresh();
    return;
  }

  let lowerQuery = trimmed.toLowerCase();
  const directlyMatchedNodes = new Set(); // ✅ Strictly matched
  const visibleNodes = new Set();         // ✅ For visibility
  const visibleEdges = new Set();

  // ✅ Step 1: find direct matches from edges
  let matchMode = "both"; // default legacy mode

  if (lowerQuery.startsWith("-")) {
    matchMode = "sender";
    lowerQuery = lowerQuery.slice(1);
  } else if (lowerQuery.startsWith("+")) {
    matchMode = "receiver";
    lowerQuery = lowerQuery.slice(1);
  }
  graph.forEachEdge((edge, attr) => {
      const source = graph.source(edge);
      const target = graph.target(edge);

    let senderMatched = false;
    let receiverMatched = false;

    const senderFields = [attr.sender_key, attr.sender_name]
      .map(v => (v || "").toLowerCase());

    const receiverFields = [attr.receiver_key, attr.receiver_name]
      .map(v => (v || "").toLowerCase());

    if (matchMode === "sender" || matchMode === "both") {
      senderMatched = senderFields.some(f => f.includes(lowerQuery));
    }

    if (matchMode === "receiver" || matchMode === "both") {
      receiverMatched = receiverFields.some(f => f.includes(lowerQuery));
    }

    if (senderMatched || receiverMatched) {
      if (senderMatched) directlyMatchedNodes.add(source);
      if (receiverMatched) directlyMatchedNodes.add(target);

      visibleEdges.add(edge);
      visibleNodes.add(source);
      visibleNodes.add(target);
      }
    });

  // ✅ Step 2: expand visibility to 1-hop neighbors
  directlyMatchedNodes.forEach(node => {
    graph.forEachNeighbor(node, neighbor => {
      visibleNodes.add(neighbor);
      graph.edges(node, neighbor).forEach(e => visibleEdges.add(e));
    });
  });

  // ✅ Step 3: update visibility attributes
  graph.forEachNode(n => {
    graph.setNodeAttribute(n, "hidden", !visibleNodes.has(n));
  });

  graph.forEachEdge(e => {
    graph.setEdgeAttribute(e, "hidden", !visibleEdges.has(e));
  });

  // ✅ Step 4: highlight only strictly matched nodes
  renderer.setSetting("nodeReducer", (node, attr) => {
    if (graph.getNodeAttribute(node, "hidden")) return attr;

    if (directlyMatchedNodes.has(node)) {
      return {
        ...attr,
        color: "#ffff00",
        zIndex: 10,
        size: (attr.size || 6) * 1.6, // bigger node
        highlighted: true        // optional flag if needed later
      };
    }

    return {
      ...attr,
      color: attr.originalColor || attr.color,
      zIndex: 1,
      size: attr.size || 6
    };
  });

  renderer.refresh();
}




async function main(depth = 2, wipeGraph = true, chainOverride = null) {
  const panel = document.getElementById("side-panel");
  
  showLoader(); // ✅ show modal

  if (wipeGraph) {
    // Reducers close over the global `graph`. Keeping the previous Sigma
    // instance alive after replacing that object makes it resolve old edge ids
    // against the new graph while the asynchronous fetch is running.
    layoutController.stop({ message: "Graph changed" });
    if (renderer) {
      renderer.kill();
      renderer = null;
    }
    hoveredNode = null;
    selectedNode = null;
  }

  totalSteps = 1;
  currentStep = 0;
  //visitedKeys.clear();

  // Rebuild the graph object BEFORE rendering
  if (wipeGraph || !graph) {
    graph = new Graph({ multi: true });
    window.initialPublicKey = "";
  }
  visitedKeysByChain.clear();
  
  await buildGraphRecursively(BASE_KEY, depth, 0, chainOverride);

  applyNodeSizesByDegree();
  //fruchtermanReingold(graph);

  // Only now, create the renderer
  const container = document.getElementById("sigma-container");
  
  if (wipeGraph || !renderer) {
    container.innerHTML = ""; // ✅ clears canvas and attached DOM elements
    tooltip.style.display = "none";
    setNodePanelOpen(false);
    hoveredNode = null;
    selectedNode = null;      

    param = {
        labelColor: {
            color: isLightTheme() ? "#000" : "#9999ff"
        },
        defaultNodeType: "bordered",
        nodeProgramClasses: {
          bordered: NodeBorderProgram,
        },        
    }

    //renderer = new Sigma(graph, container);

    renderer = new Sigma(graph,container,param);
    bindSigmaRenderingRecovery();
    renderer.setSetting("defaultNodeBorderColor", "#fff");
    renderer.setSetting("defaultNodeBorderSize", 40);
    syncCameraControlsToRenderer();
    
  }
 
 if (!wipeGraph)
  rebuildTransactionsByNeighbor();
 
  // Apply reducers and interactions
  setupReducers();
  setupInteractions();
  setupSearch();

  renderer.refresh();
  
  animateLayout(null, "initial");
  
  hideLoader(); // ✅ hide modal
  
  setTimeout(() => updateProgressBar(0, 1), 500); // clear bar after delay
  
  setupDateSlicer();  // 👈 à ajouter à la fin de main()
  
}




function exportJSON() {
  const json = {
    nodes: graph.nodes().map(n => {
      const attrs = graph.getNodeAttributes(n);

      // Convert Set to Array for export
      const exportedChains = Array.isArray(attrs.chains) ? attrs.chains : [attrs.chains];

      return {
        id: n,
        ...attrs,
        chains: exportedChains
      };
    }),
    edges: graph.edges().map(e => ({
      id: e,
      source: graph.source(e),
      target: graph.target(e),
      ...graph.getEdgeAttributes(e)
    }))
  };

  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDHHMMSS
  const algorithm = document.getElementById("layout-algorithm")?.value || "unknown";
  const address = (BASE_KEY || "address").substring(0, 8);
  const filename = `${selectedBlockchain}-${algorithm}-${address}_${timestamp}.json`;

  a.href = url;
  a.download = filename;
  a.click();
}


function importJSON(file, mode="", iterations=500) {
  if (!graph || !renderer) {
    initRenderer();
  }

  hoveredNode = null;
  selectedNode = null;

  const reader = new FileReader();
  const progressBar = document.getElementById("progress-bar");

  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      if (!data.nodes || !data.edges) {
        alert("Invalid JSON format (missing 'nodes' or 'edges')");
        return;
      }

      layoutController.stop({ message: "Graph changed" });
      graph.clear();
      const total = data.nodes.length + data.edges.length;
      let current = 0;
      updateProgressBar(current, total);

      data.nodes.forEach(n => {
        if (typeof n.chains === "string") {
          n.chains = [n.chains];
        }
        graph.addNode(n.id, n);
        current++;
        updateProgressBar(current, total);
      });

      data.edges.forEach((e) => {
        if (e.timestamp) {
          e.timestamp = parseInt(e.timestamp); // 🛠️ Convert back to number
        }        
        graph.addEdgeWithKey(e.id, e.source, e.target, e);
        current++;
        updateProgressBar(current, total);
      });

      applyNodeSizesByDegree();     // reuse your logic
      //fruchtermanReingold(graph);   // optional
      renderer.refresh();

      // Reset bar
      setTimeout(() => {
        progressBar.value = 0;
        document.getElementById("progress-text").textContent = "";
      }, 300);

      if (mode === "")
        alert("Graph imported successfully!");
      rebuildTransactionsByNeighbor();
      setupDateSlicer();    
      setupReducers();
      setupInteractions();
      setupSearch();
      renderer.refresh();
      animateLayout(iterations);
    } catch (e) {
      console.error("Failed to load graph JSON:", e);
      alert("Failed to load graph JSON. See console for details.");
    }
  };

  reader.readAsText(file);
}


function exportPNG() {
  const nodeCanvas = document.querySelector("canvas.sigma-nodes");
  if (!nodeCanvas) {
    console.error("❌ Node canvas (.sigma-nodes) not found");
    return;
  }

  // Use the DISPLAY size (CSS) for output
  const cssWidth = nodeCanvas.offsetWidth;
  const cssHeight = nodeCanvas.offsetHeight;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = cssWidth;
  exportCanvas.height = cssHeight;

  const ctx = exportCanvas.getContext("2d");

  // Optional black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  // Draw node canvas scaled from internal resolution to display size
  ctx.drawImage(
    nodeCanvas,
    0, 0, nodeCanvas.width, nodeCanvas.height, // source
    0, 0, cssWidth, cssHeight                  // destination (scaled)
  );

  // Export
  const link = document.createElement("a");
  link.download = "mina-nodes.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
}

async function demo() {
  const sampleFiles = [
    "sample1.json",
    "sample2.json",
    "sample3.json",
    "sample4.json",
  ];

  const randomFile = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];

  try {
    const response = await fetch(`./sample/${randomFile}`);
    if (!response.ok) throw new Error(`Erreur chargement ${randomFile}`);

    const blob = await response.blob();
    const file = new File([blob], randomFile, { type: "application/json" });

    // Injecter les valeurs spécifiques du layout dans l'UI
    document.getElementById("layout-algorithm").value = "fr";
    document.getElementById("layout-iterations").value = 5000;
    document.getElementById("layout-gravity").value = 0.1;
    document.getElementById("layout-scale").value = 100;

    // Largeur/hauteur par défaut si non initialisées
    document.getElementById("layout-width").value = 2000;
    document.getElementById("layout-height").value = 2000;

    // Importer le graphe
    importJSON(file, "demo", 2000);

    // Lancer le layout avec petit délai (laisser le temps à importJSON de finir)
    const layoutBtn = document.getElementById("layout-toggle-btn");
    setTimeout(() => {
      //runLayoutInWorker();
      //layoutBtn.textContent = "Stop Layout";
      //isLayoutRunning = true;
      log_api_call("demo");
    }, 1200); // ajustable si import plus long
  } catch (error) {
    console.error("Erreur lors du chargement du fichier de démo :", error);
  }
}

// Save current layout parameters
function saveLayoutSettings(algorithm) {
  const settings = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY)) || {};

  const inputIds = {
    fr: ["layout-iterations", "layout-width", "layout-height", "layout-gravity", "layout-scale"],
    fa: [
      "layout-iterations",
      "layout-width",
      "layout-height",
      "layout-gravity",
      "layout-scale",
      "layout-linlog",
      "layout-outbound",
      "layout-strong-gravity",
      "layout-prevent-overlap"
    ],
    ord: ["layout-iterations", "layout-width", "layout-height", "layout-ewi", "layout-cooling", "layout-attraction", "layout-repulsion"]
  };

  settings[algorithm] = {};

  inputIds[algorithm].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    settings[algorithm][id] = el.type === "checkbox" ? el.checked : parseFloat(el.value);
  });

  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(settings));
}

// Load layout parameters
function loadLayoutSettings(algorithm) {
  const settings = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY));
  if (!settings || !settings[algorithm]) return;

  Object.entries(settings[algorithm]).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = val;
    else el.value = val;
  });
}

function getExplorerURL(type, value, blockchain) {
  const chain = blockchain?.toLowerCase?.();
  const explorerMap = {
    mina: {
      block: (val) => `https://minascan.io/mainnet/block/${val}/txs`,
      transaction: (val) => `https://minascan.io/mainnet/tx/${val}/txInfo`,
      account: (val) => `https://minascan.io/mainnet/account/${val}`,
    },
    ethereum: {
      block: (val) => `https://etherscan.io/block/${val}`,
      transaction: (val) => `https://etherscan.io/tx/${val}`,
      account: (val) => `https://etherscan.io/address/${val}`,
    },
    polygon: {
      block: (val) => `https://polygonscan.com/block/${val}`,
      transaction: (val) => `https://polygonscan.com/tx/${val}`,
      account: (val) => `https://polygonscan.com/address/${val}`,
    },
    bsc: {
      block: (val) => `https://bscscan.com/block/${val}`,
      transaction: (val) => `https://bscscan.com/tx/${val}`,
      account: (val) => `https://bscscan.com/address/${val}`,
    },    
    solana: {
      block: (val) => `https://solscan.io/block/${val}`,
      transaction: (val) => `https://solscan.io/tx/${val}`,
      account: (val) => `https://solscan.io/account/${val}`,
    },
    zksync: {
      block: (val) => `https://explorer.zksync.io/block/${val}`,
      transaction: (val) => `https://explorer.zksync.io/tx/${val}`,
      account: (val) => `https://explorer.zksync.io/address/${val}`,
    },
    optimism: {
      block: (val) => `https://optimistic.etherscan.io/block/${val}`,
      transaction: (val) => `https://optimistic.etherscan.io/tx/${val}`,
      account: (val) => `https://optimistic.etherscan.io/address/${val}`,
    },
    arbitrum: {
      block: (val) => `https://arbiscan.io/block/${val}`,
      transaction: (val) => `https://arbiscan.io/tx/${val}`,
      account: (val) => `https://arbiscan.io/address/${val}`,
    },
    cronos: {
      block: (val) => `https://cronoscan.com/block/${val}`,
      transaction: (val) => `https://cronoscan.com/tx/${val}`,
      account: (val) => `https://cronoscan.com/address/${val}`,
    },
    tezos: {
      block: (val) => `https://tzkt.io/${val}`,
      transaction: (val) => `https://tzkt.io/${val}`,
      account: (val) => `https://tzkt.io/${val}`,
    },
    starknet: {
      block: (val) => `https://voyager.online/block/${val}`,
      transaction: (val) => `https://voyager.online/tx/${val}`,
      account: (val) => `https://voyager.online/contract/${val}`,
    },
    base: {
      block: (val) => `https://basescan.org/block/${val}`,
      transaction: (val) => `https://basescan.org/tx/${val}`,
      account: (val) => `https://basescan.org/address/${val}`,
    },    
  };

  const explorer = explorerMap[chain]?.[type];
  return typeof explorer === "function" ? explorer(value) : "#";
}

function saveApiToken(chain, token) {
  const tokens = JSON.parse(localStorage.getItem("apiTokens") || "{}");
  tokens[chain] = token;
  localStorage.setItem("apiTokens", JSON.stringify(tokens));
}

function getApiToken(chain) {
  const tokens = JSON.parse(localStorage.getItem("apiTokens") || "{}");
  return tokens[chain] || "";
}

function clearApiToken(chain) {
  const tokens = JSON.parse(localStorage.getItem("apiTokens") || "{}");
  delete tokens[chain];
  localStorage.setItem("apiTokens", JSON.stringify(tokens));
}

function loadFetchParams() {
  const storedDepth = localStorage.getItem("param-depth");
  const storedLimit = localStorage.getItem("param-limit");
  const storedFirstLimit = localStorage.getItem("param-first-iteration");
  const storedStartDate = localStorage.getItem("param-start-date");
  const storedEndDate = localStorage.getItem("param-end-date");

  if (storedDepth !== null) document.getElementById("param-depth").value = storedDepth;
  if (storedLimit !== null) document.getElementById("param-limit").value = storedLimit;
  if (storedFirstLimit !== null) document.getElementById("param-first-iteration").value = storedFirstLimit;
  if (storedStartDate !== null) document.getElementById("param-start-date").value = storedStartDate;
  if (storedEndDate !== null) document.getElementById("param-end-date").value = storedEndDate;
  syncFetchDateRangeFromInputs();
}

function setupFetchParamListeners() {
  document.getElementById("param-depth").addEventListener("input", e => {
    localStorage.setItem("param-depth", e.target.value);
  });
  document.getElementById("param-limit").addEventListener("input", e => {
    localStorage.setItem("param-limit", e.target.value);
  });
  document.getElementById("param-first-iteration").addEventListener("input", e => {
    localStorage.setItem("param-first-iteration", e.target.value);
  });
  document.getElementById("param-start-date").addEventListener("input", e => {
    localStorage.setItem("param-start-date", e.target.value);
    syncFetchDateRangeFromInputs();
  });
  document.getElementById("param-end-date").addEventListener("input", e => {
    localStorage.setItem("param-end-date", e.target.value);
    syncFetchDateRangeFromInputs();
  });
}

function loadStartKeyForBlockchain(blockchain) {
  const savedKey = localStorage.getItem(`start-key-${blockchain}`);
  if (savedKey) {
    document.getElementById("param-base-key").value = savedKey;
    BASE_KEY = savedKey;
  }
}

function updateDateFilterTheme(isLight = currentTheme === "light") {
  if (!histogramChart) return;
  const textColor = isLight ? "#263238" : "#f1f5f7";
  const gridColor = isLight ? "rgba(38, 50, 56, 0.18)" : "rgba(255, 255, 255, 0.18)";
  [histogramChart.options.scales.x, histogramChart.options.scales.y].forEach(scale => {
    scale.ticks = { ...scale.ticks, color: textColor };
    scale.grid = { ...scale.grid, color: gridColor };
    scale.border = { ...scale.border, color: gridColor };
    scale.title = { ...scale.title, color: textColor };
  });
  histogramChart.update("none");
}

function updateSlicerView() {
  const slicerContainer = document.getElementById("date-slicer-container");
  const slicerInner = document.getElementById("slicer-container");
  const chartCanvas = document.getElementById("slicer-chart");
  const labels = slicerContainer.querySelectorAll("#slicer-start-label, #slicer-end-label");
  const slider = document.getElementById("slicer-range");
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    document.body.classList.add("mobile-mode");

    if (chartCanvas) {
      chartCanvas.style.display = "none";
      chartCanvas.style.height = "0";
    }

    if (slicerInner) {
      slicerInner.style.height = "auto";
    }

    if (slicerContainer) {
      // 🧹 Clear any stale inline height or display
      slicerContainer.style.removeProperty("height");
      slicerContainer.style.removeProperty("display");

      // ✅ Force mobile layout re-apply
      slicerContainer.style.height = "auto";
      slicerContainer.style.display = "block";
    }
    labels.forEach(label => label.style.display = "none");
  } else {
    document.body.classList.remove("mobile-mode");

    if (chartCanvas) {
      chartCanvas.style.display = "block";
      chartCanvas.style.height = "150px";
    }

    if (slicerInner) {
      slicerInner.style.height = "140px";
    }

    labels.forEach(label => label.style.display = "inline-block");

    slicerContainer.style.display = "block";
    slicerContainer.style.height = "auto";
  }

  // Slider refresh or rebuild
  if (slider && slider.noUiSlider) {
    try {
      slider.noUiSlider.refresh?.(); // Optional chaining for non-standard APIs
    } catch (err) {
      console.warn("⚠️ noUiSlider.refresh failed, reinitializing...");

      try {
        if (!Array.isArray(allTimestamps) || allTimestamps.length < 2) {
          console.error("❌ allTimestamps are invalid, cannot rebuild slider.");
          slicerContainer.style.display = "none";
          return;
        }

        const values = slider.noUiSlider.get();
        const min = allTimestamps[0];
        const max = allTimestamps[allTimestamps.length - 1];

        slider.noUiSlider.destroy();
        slider.innerHTML = "";

        setTimeout(() => {
          noUiSlider.create(slider, {
            start: values.map(v => parseInt(v)),
            connect: true,
            range: { min, max },
            step: 24 * 60 * 60 * 1000,
            format: {
              to: value => Math.round(value),
              from: Number
            }
          });

          //console.log("✅ noUiSlider reinitialized");

          slider.noUiSlider.on("update", function (values) {
            currentRange = values.map(v => parseInt(v));
            applyDateFilter();
          });
          slider.noUiSlider.on("end", function (values) {
            if (!updatingRangeFromWindowShift) {
              configureDateWindowShiftControl(values.map(v => parseInt(v)));
            }
          });
          configureDateWindowShiftControl(values.map(v => parseInt(v)));

          applyDateFilter();
        }, 50);
      } catch (e2) {
        console.error("🔥 Rebuild of noUiSlider failed:", e2);
      }
    }
  }
  
  // 🔒 Prevent re-showing slicer if fullscreen is active
  if (isFullscreen && slicerContainer) {
    slicerContainer.style.display = "none";
    return;
  }
}

async function connectAuroAndSend() {
  const email = document.getElementById("minataur-email").value.trim();
  if (!email || !email.includes("@")) {
    alert("Merci d'entrer un email valide");
    return;
  }

  if (!window.mina) {
    alert("Auro Wallet n'est pas détecté. Installez-le depuis https://www.aurowallet.com/");
    return;
  }

  try {
    const accounts = await window.mina.requestAccounts();
    const publicKey = accounts[0];
    console.log("Wallet connecté :", publicKey);

    // Construction transaction
    const { hash } = await window.mina.sendPayment({
      to: MINATAUR_API_ADDRESS,
      amount: "1.0",
      fee: "0.01",
      memo: email
    });

    alert("Transaction envoyée ! Hash : " + hash + "\nVotre token arrivera bientôt par email.");

    // Fold the section after success
    const tokenSection = document.getElementById("minataur-token-section");
    const arrow = document.getElementById("toggle-token-arrow");
    tokenSection.style.display = "none";
    if (arrow) arrow.textContent = "▸";
  } catch (err) {
    console.error("Erreur avec Auro :", err);
    alert("Erreur lors de l'envoi : " + err.message);
  }
}

function adjustSidebarState() {
  const sidebar = document.getElementById("left-sidebar");
  const appContainer = document.getElementById("app-container");
  const activeElement = document.activeElement;
  const isInputFocusedInSidebar = sidebar.contains(activeElement) &&
    (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.tagName === "SELECT");

  if (window.innerWidth >= 769 && !isFullscreen) {
    const savedState = localStorage.getItem(SIDEBAR_STATE_STORAGE_KEY);
    setLeftSidebarOpen(savedState !== "false");
  } else {
    // ✅ Ne ferme pas la sidebar si un champ est actif dedans (sur mobile)
    if (!isInputFocusedInSidebar) {
      setLeftSidebarOpen(false);
    }
  }

  // 👇 Always hide the slicer in fullscreen mode
  if (isFullscreen && slicer) {
    slicer.style.display = "none";
  }

  updateLegendOffset(); // 👈 met aussi à jour la légende
}

async function sendDonation() {
  const params = new URLSearchParams(window.location.search);
  const debug = params.get("debug");  
  //if (debug === "1")
  //  alert ("in sendDonation");
  const amount = parseFloat(document.getElementById("donation-amount").value);
  if (!amount || amount <= 0) {
    //alert("Please enter a valid donation amount (at least 0.1 MINA).");
    showStatus("Please enter a valid donation amount (at least 0.1 MINA).", 'error');
    return;
  }

  const provider = auroProvider || window.mina;
  if (!provider) {
    showStatus(
      "Auro Wallet not detected. Please install it from https://www.aurowallet.com/",
      "error"
    );
    return;
  }

  try {
    const accounts = await provider.requestAccounts();
    const sender = accounts[0];
    //showStatus(`Donating from: ${sender.slice(0,6) + "..." + sender.slice(-6)}`, 'info');
    showStatus(`Donating from: ${sender}`, 'info');
    console.log("Donating from:", sender);

    const { hash } = await provider.sendPayment({
      to: DONATION_ADDRESS,
      amount: amount.toString(),
      fee: "0.01",
      memo: "Thanks for Mina Graph!"
    });

    //alert("Thanks for your donation! Tx hash: " + hash);
    showStatus("Thank you for you donation !", 'info');
  } catch (err) {
    console.error("Donation error:", err);
    //alert("Error while sending donation: " + err.message);
    showStatus(`Donation error: ${err.message}`, 'error');
  }
}

/*async function sendEVMDonation() {
  const amount = parseFloat(document.getElementById("donation-amount-evm").value);
  const token = document.getElementById("donation-token").value;
  if (!amount || amount <= 0) return alert("Enter a valid amount.");

  let provider;
  let ethersProvider;
  let signer;
  let chainId;
  let chain;

  try {
    if (window.ethereum && window.ethereum.isMetaMask) {
      // ✅ MetaMask or injected provider
    provider = window.ethereum;
    await provider.request({ method: 'eth_requestAccounts' });
      ethersProvider = new ethers.BrowserProvider(provider);
    } else if (window.WalletConnectEthereumProvider?.default) {
      // ✅ WalletConnect (even with no wallet installed, shows QR modal)
      const WalletConnectProvider = window.WalletConnectEthereumProvider.default;

      provider = await WalletConnectProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [1, 56, 137],
        showQrModal: true
    });

      await provider.connect(); // Instead of enable() to trigger QR modal
      ethersProvider = new ethers.BrowserProvider(provider);
    } else {
      // ❌ Neither MetaMask nor WalletConnect available
      alert("WalletConnect is not loaded. Please check your script import.");
      return;
  }

    signer = await ethersProvider.getSigner();
    chainId = (await ethersProvider.getNetwork()).chainId;
    chain = CHAIN_NAMES[Number(chainId)];

    if (!chain) return alert("Unsupported chain");

    if (token === "native") {
      const tx = await signer.sendTransaction({
        to: EVM_DONATION_ADDRESS,
        value: ethers.parseEther(amount.toString())
      });
      alert(`Thanks! TX hash: ${tx.hash}`);
    } else {
      const tokenAddr = ERC20_ADDRESSES[token][chain];
      if (!tokenAddr) return alert("Unsupported token for this chain");

      const contract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      const decimals = await contract.decimals();
      const value = ethers.parseUnits(amount.toString(), decimals);

      const tx = await contract.transfer(EVM_DONATION_ADDRESS, value);
      alert(`Thanks for your donation! TX hash: ${tx.hash}`);
    }
  } catch (err) {
    console.error(err);
    alert("Error: " + (err.message || err));
  }

  // Optional disconnect
  if (provider?.disconnect) {
    try {
      await provider.disconnect();
    } catch (e) {
      console.warn("WalletConnect disconnect failed:", e);
}
  }
}*/

async function toggleFullscreen(forceExit = false) {
  const nativeFullscreenActive = Boolean(document.fullscreenElement);
  const shouldExit = forceExit || isFullscreen || nativeFullscreenActive;

  if (shouldExit) {
    if (nativeFullscreenActive && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn("Could not exit native fullscreen:", error);
      }
    }
    setFullscreenMode(Boolean(document.fullscreenElement));
    return;
  }

  if (document.documentElement.requestFullscreen) {
    try {
      // navigationUI is a hint to Chromium to hide its remaining browser UI.
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      setFullscreenMode(true);
      return;
    } catch (error) {
      // Keep the existing in-page mode as a graceful fallback (unsupported
      // browser, denied permission, or non-user-initiated keyboard shortcut).
      console.warn("Native fullscreen unavailable; using in-page mode:", error);
    }
  }

  setFullscreenMode(true);
}

function setFullscreenMode(active) {
  isFullscreen = active;
  const legend = document.getElementById("legend");
  const menu = document.getElementById("menu-toggle");
  const fillColor = currentTheme === "dark" ? "white" : "black"  
  const exitfillColor = currentTheme === "dark" ? "black" : "white"  

  if (isFullscreen) {
    sidebar.style.display = "none";
    controls.style.display = "none";
    slicer.style.display = "none";
    if (footer) footer.style.display = "none";
    appContainer.classList.remove("sidebar-open"); // 👈 remove margin
    //sidebar.classList.remove("open"); // 👈 remove margin
    fullscreenBtn.title = "Exit Full Screen (F)";
    fullscreenBtn.setAttribute("aria-label", "Exit Full Screen");
    exitFullscreenBtn.style.background = exitfillColor;
    exitFullscreenBtn.style.color = fillColor;
    exitFullscreenBtn.style.display = "block";
    document.body.classList.add("fullscreen-mode");
    legend.style.left = "50px";
    legend.style.display="none";
    menu.style.display="none"
  } else {
    sidebar.style.display = "block";
    controls.style.display = "flex";
    slicer.style.display = "block";
    setFilterPanelVisible(isFilterPanelVisible, { persist: false });
    legend.style.top = "70px";
    if (footer) footer.style.display = "block";
    menu.style.display="block"

    // 👇 Only add sidebar-open on desktop
    if (window.innerWidth >= 769 && sidebar.classList.contains("open")) {
      appContainer.classList.add("sidebar-open");
      legend.style.left = `${sidebar.getBoundingClientRect().width + 50}px`; // sidebar + margin
    } else { 
      appContainer.classList.remove("sidebar-open");
      legend.style.left = "50px";
    }

    fullscreenBtn.title = "Full Screen (F)";
    fullscreenBtn.setAttribute("aria-label", "Full Screen");
    exitFullscreenBtn.style.display = "none";
    document.body.classList.remove("fullscreen-mode");
    updateLegendOffset(); // 👈 and here too
  }

  // Chromium updates the visual viewport asynchronously when Android system
  // bars are hidden or restored. Resize Sigma after that transition so its
  // canvases use the newly available area instead of retaining the old inset.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (renderer?.resize) renderer.resize();
      window.dispatchEvent(new Event("resize"));
    });
  });
}

function setupDateSlicer() {
  if (!graph || !graph.edges) return;

  const timestamps = graph.edges().map(id => {
    const ts = graph.getEdgeAttribute(id, "timestamp");
    return typeof ts === "string" ? parseInt(ts) : ts;
  }).filter(t => !isNaN(t)).sort((a, b) => a - b);

  if (!timestamps.length) return;

  allTimestamps = timestamps;

  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const binCount = 20;
  const binSize = Math.ceil((maxTimestamp - minTimestamp) / binCount);
  currentRange = [minTimestamp, maxTimestamp];

  const bins = new Array(binCount).fill(0);
  timestamps.forEach(ts => {
    const index = Math.min(Math.floor((ts - minTimestamp) / binSize), binCount - 1);
    bins[index]++;
  });

  const ctx = document.getElementById("slicer-chart").getContext("2d");
  if (histogramChart) histogramChart.destroy();

  histogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins.map((_, i) => {
        const d = new Date(minTimestamp + i * binSize);
        return d.toLocaleDateString(); // or d.toISOString().slice(0, 10)
      }),
      datasets: [{
        label: 'Tx Count',
        data: bins,
        backgroundColor: '#4fc3f7'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              const startDate = new Date(minTimestamp + index * binSize);
              const endDate = new Date(minTimestamp + (index + 1) * binSize);
              return `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Transaction Date'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        }
      }
    }
  });
  updateDateFilterTheme();

  // Create noUiSlider range control
  const slider = document.getElementById("slicer-range");
  slider.innerHTML = ""; // Clear any previous

  // 💥 Prevent re-initialization
  if (slider.noUiSlider) {
    slider.noUiSlider.destroy();
  }

  noUiSlider.create(slider, {
    start: [minTimestamp, maxTimestamp],
    connect: true,
    range: {
      min: minTimestamp,
      max: maxTimestamp
    },
    step: 24 * 60 * 60 * 1000, // 1 day in ms
    tooltips: [false, false], // start with no tooltip
    format: {
      to: value => Math.round(value),
      from: Number
    }
  });

  const handles = slider.querySelectorAll('.noUi-handle');

  // On drag start: add tooltip divs
  slider.noUiSlider.on("start", () => {
    handles.forEach((handle, i) => {
      if (!handle.querySelector('.tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.top = '-28px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.background = '#000';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '2px 6px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '11px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.opacity = '0.9';
        handle.appendChild(tooltip);
      }
    });
  });

  // On slide: update tooltip content
  slider.noUiSlider.on("slide", (values) => {
    handles.forEach((handle, i) => {
      const tooltip = handle.querySelector('.tooltip');
      if (tooltip) {
        tooltip.textContent = new Date(+values[i]).toLocaleDateString();
      }
    });
  });

  // On end: remove tooltips
  slider.noUiSlider.on("end", () => {
    handles.forEach(handle => {
      const tooltip = handle.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
    });
    if (!updatingRangeFromWindowShift) {
      configureDateWindowShiftControl(slider.noUiSlider.get().map(v => parseInt(v)));
    }
  });

  // Update range filter
  slider.noUiSlider.on("update", function (values) {
    currentRange = values.map(v => parseInt(v));
    applyDateFilter(); // filter the graph dynamically
  });


  configureDateWindowShiftControl(currentRange);
  applyDateFilter(); // Initial filtering
}

function getDateWindowShiftConfig(globalMin, globalMax, rangeStart, rangeEnd) {
  const selectedSpan = Math.max(0, rangeEnd - rangeStart);
  const stepDays = Math.max(1, Math.floor(selectedSpan / DAY_IN_MILLISECONDS) + 1);
  const stepMilliseconds = stepDays * DAY_IN_MILLISECONDS;
  return {
    stepDays,
    stepMilliseconds,
    minPage: Math.ceil((globalMin - rangeStart) / stepMilliseconds),
    maxPage: Math.floor((globalMax - rangeEnd) / stepMilliseconds)
  };
}

function configureDateWindowShiftControl(range = currentRange) {
  const control = document.getElementById("date-window-shift");
  const valueLabel = document.getElementById("date-window-shift-value");
  const stepLabel = document.getElementById("date-window-shift-step");
  const previousButton = document.getElementById("date-window-shift-previous");
  const nextButton = document.getElementById("date-window-shift-next");
  const panel = document.getElementById("date-filter-panel");
  if (!control || !valueLabel || !allTimestamps.length) return;
  if (control.dataset.shiftListenerBound !== "true") {
    control.addEventListener("input", event => {
      shiftSelectedDateWindow(event.target.value);
      updateDateWindowShiftButtons(event.target);
    });
    previousButton?.addEventListener("click", () => moveDateWindowByOnePeriod(-1));
    nextButton?.addEventListener("click", () => moveDateWindowByOnePeriod(1));
    if (panel) {
      const savedPanelState = localStorage.getItem(DATE_WINDOW_PANEL_STORAGE_KEY);
      panel.open = savedPanelState === null
        ? !window.matchMedia("(max-width: 768px)").matches
        : savedPanelState === "true";
      panel.addEventListener("toggle", () => {
        localStorage.setItem(DATE_WINDOW_PANEL_STORAGE_KEY, String(panel.open));
      });
    }
    control.dataset.shiftListenerBound = "true";
  }

  const [rangeStart, rangeEnd] = range.map(Number);
  const globalMin = allTimestamps[0];
  const globalMax = allTimestamps[allTimestamps.length - 1];
  const config = getDateWindowShiftConfig(globalMin, globalMax, rangeStart, rangeEnd);
  dateWindowShiftState = { ...config, rangeStart, rangeEnd };

  control.min = String(Math.min(0, config.minPage));
  control.max = String(Math.max(0, config.maxPage));
  control.value = "0";
  control.disabled = config.minPage === 0 && config.maxPage === 0;
  if (stepLabel) stepLabel.textContent = `${config.stepDays} day${config.stepDays > 1 ? "s" : ""}`;
  valueLabel.textContent = control.disabled
    ? `Selected period: ${config.stepDays} day${config.stepDays > 1 ? "s" : ""} (no complete adjacent period)`
    : `Move by ${config.stepDays}-day periods`;
  updateDateWindowShiftButtons(control);
}

function updateDateWindowShiftButtons(control = document.getElementById("date-window-shift")) {
  if (!control) return;
  const value = Number(control.value);
  const previousButton = document.getElementById("date-window-shift-previous");
  const nextButton = document.getElementById("date-window-shift-next");
  if (previousButton) previousButton.disabled = control.disabled || value <= Number(control.min);
  if (nextButton) nextButton.disabled = control.disabled || value >= Number(control.max);
}

function moveDateWindowByOnePeriod(direction) {
  const control = document.getElementById("date-window-shift");
  if (!control || control.disabled) return;
  const nextValue = Math.max(Number(control.min), Math.min(Number(control.max), Number(control.value) + direction));
  control.value = String(nextValue);
  shiftSelectedDateWindow(nextValue);
  updateDateWindowShiftButtons(control);
}

function getShiftedDateRange(rangeStart, rangeEnd, stepMilliseconds, pageIndex) {
  const delta = Number(pageIndex) * stepMilliseconds;
  return [rangeStart + delta, rangeEnd + delta];
}

function shiftSelectedDateWindow(pageIndex) {
  const slider = document.getElementById("slicer-range");
  const valueLabel = document.getElementById("date-window-shift-value");
  if (!slider?.noUiSlider || !dateWindowShiftState) return;

  const index = Number(pageIndex);
  const { rangeStart, rangeEnd, stepMilliseconds, stepDays } = dateWindowShiftState;
  const shiftedRange = getShiftedDateRange(rangeStart, rangeEnd, stepMilliseconds, index);
  updatingRangeFromWindowShift = true;
  // exactInput=true prevents each handle from being rounded independently to
  // noUiSlider's step grid, which would progressively change the window span.
  slider.noUiSlider.set(shiftedRange, true, true);
  updatingRangeFromWindowShift = false;
  if (valueLabel) {
    const formatter = timestamp => new Date(timestamp).toLocaleDateString();
    valueLabel.textContent = `${formatter(shiftedRange[0])} – ${formatter(shiftedRange[1])} (${stepDays}-day period)`;
  }
}


function applyDateFilter() {
  const [min, max] = currentRange;

  const formatter = ts => new Date(ts).toLocaleDateString();
  document.getElementById("slicer-start-label").textContent = `From: ${formatter(min)}`;
  document.getElementById("slicer-end-label").textContent = `To: ${formatter(max)}`;

  graph.forEachEdge((e, attrs) => {
    const keep = isTimestampInCurrentRange(attrs.timestamp);
    graph.setEdgeAttribute(e, "hidden", !keep);
  });

  const visibleNodes = new Set();
  graph.forEachEdge((e) => {
    if (!graph.getEdgeAttribute(e, "hidden")) {
      visibleNodes.add(graph.source(e));
      visibleNodes.add(graph.target(e));
    }
  });

  graph.forEachNode((n) => {
    graph.setNodeAttribute(n, "hidden", !visibleNodes.has(n));
  });

  if (selectedNode && graph.hasNode(selectedNode)) {
    showNodePanel(selectedNode, false);
  }

  renderer.refresh();
}

function hideNodePanel(options = {}) {
  setNodePanelOpen(false, options);
  selectedNode = null;
  renderer?.refresh();
}

function rebuildTransactionsByNeighbor() {
  transactionsByNeighbor = {}; // ⚠️ Assure-toi que cette variable est bien déclarée globalement avec let

  graph.forEachEdge((edge, attrs, source, target) => {
    const tx = {
      blockchain: attrs.blockchain,
      sender_key: source,
      receiver_key: target,
      sender_name: attrs.sender_name || null,
      receiver_name: attrs.receiver_name || null,
      command_type: attrs.label,
      status: attrs.status,
      timestamp: attrs.timestamp,
      hash: attrs.hash,
      fee: attrs.fee,
      amount: attrs.amount,
      block_id: attrs.block_id,
      block_hash: attrs.block_hash,
      memo: attrs.memo,
      label: attrs.label,
      token_contract: attrs.token_contract,
      token_receiver: attrs.token_receiver,
      token_amount: attrs.token_amount,
      token_name: attrs.token_name,
      token_decimals: attrs.token_decimals,
      contract_call_entrypoint: attrs.contract_call_entrypoint || null, // Valeur par défaut si non défini
    };

    if (!transactionsByNeighbor[source]) transactionsByNeighbor[source] = [];
    if (!transactionsByNeighbor[target]) transactionsByNeighbor[target] = [];

    transactionsByNeighbor[source].push(tx);
    transactionsByNeighbor[target].push(tx);
  });
}

document.addEventListener("keydown", function (event) {
  const tag = document.activeElement.tagName.toLowerCase();
  const input = document.getElementById("search-input");
  const searchDiv = document.getElementById("searchdiv");
  const clearBtn = document.getElementById("clear-search");

  if (event.key === "Escape" && !document.getElementById("error-popup")?.hidden) {
    closeErrorPopup();
    return;
  }

  // ESC clears search only if focused
  if (event.key === "Escape" && document.activeElement === input) {
    input.value = "";
    selectedNode = null;
    clearBtn.style.display = "none";
    searchDiv.style.display = "none";
    handleSearch("");
    renderer.refresh();
    return;
  } else if (event.key === "Escape") {
    if (document.getElementById("side-panel")?.classList.contains("open")) {
      hideNodePanel({ restoreFocus: true });
      return;
    }
    if (document.getElementById("left-sidebar")?.classList.contains("open")) {
      setLeftSidebarOpen(false, { restoreFocus: true });
      return;
    }
    if (isLayoutRunning) {
      layoutController.stop({ remember: true });
    }
  }

  // Ignore all other keys if typing in a field
  if (tag === "input" || tag === "textarea" || tag === "select" || document.activeElement.isContentEditable) return;

  if (handleGraphKeyboardNavigation(event)) return;

  // Layout (L)
  if (event.key === "l" || event.key === "L") {
    const layoutBtn = document.getElementById("layout-toggle-btn");
    if (layoutBtn) layoutBtn.click();
  }
  
  // Sidebar toggle (S)
  if (event.key === "s" || event.key === "S") {
    const menuBtn = document.getElementById("menu-toggle");
    if (menuBtn) menuBtn.click();
  }  
  
  // Fullscreen toggle (F)
  if (event.key === "f" || event.key === "F") {
    const fullscreenBtn = document.getElementById("fullscreen-toggle");
    if (fullscreenBtn) fullscreenBtn.click();
  }  
  
  // Delete selected node (Del, Backspace, D)
  if (
    selectedNode &&
    (event.key === "Delete" || event.key === "Backspace" || event.key === "d" || event.key === "D")
  ) {
    deleteSelectedNode(selectedNode);
  }

  // Focus search ("/")
  if (event.key === "/") {
    event.preventDefault(); // avoid triggering default quick-find
    searchDiv.style.display = "block";
    input.style.display = "block";
    input.focus();
  }
});

async function isWatched(address, chain) {
  const userId = getOrCreateUserId();
  try {
    const res = await fetch(`https://akirion.com:4665/api/iswatched?userId=${userId}&address=${encodeURIComponent(address)}&chain=${chain}`, {
      headers: { 'x-api-key': '0e74cb18-74fa-458e-8adb-f3a8096c0678' }
    });
    const json = await res.json();
    return json.isWatched;
  } catch (err) {
    console.error('Failed to check watch status:', err);
    return false;
  }
}

function getApiEndpoint(chain, watch = true) {
  const API_URL = "https://akirion.com:4665";

  if (chain === "mina") {
    return `${API_URL}/api/${watch ? "watch-mina" : "unwatch-mina"}`;
  }

  if (chain === "tezos") {
    return `${API_URL}/api/${watch ? "watch-tezos" : "unwatch-tezos"}`;
  }

  // Default to EVM chains (Ethereum, Polygon, BSC, etc.)
  return `${API_URL}/api/${watch ? "watch-alchemy" : "unwatch-alchemy"}`;
}

async function watchThisAddress(address, chain) {
  const API_KEY = "0e74cb18-74fa-458e-8adb-f3a8096c0678";
  const userId = getOrCreateUserId();
  const endpoint = getApiEndpoint(chain, true);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({ userId, address, chain })
  });

  const result = await res.json();
  //alert(`✅ Watch registered: ${result.status}`);
}

async function unwatchThisAddress(address, chain, refreshModal = false) {
  const API_KEY = "0e74cb18-74fa-458e-8adb-f3a8096c0678";
  const endpoint = getApiEndpoint(chain, false);
  const userId = getOrCreateUserId();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ userId, address, chain })
  }).then(() => {
    if (refreshModal) showWatchedAddressesModal();
    //alert(`✅ Unwatched: ${address} (${chain})`);
  });
}


async function unWatchThisAddress_old(address, chain) {
  const API_KEY = "0e74cb18-74fa-458e-8adb-f3a8096c0678";
  const userId = getOrCreateUserId();

  const res = await fetch("https://akirion.com:4665/api/unwatch-alchemy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({ userId, address, chain })
  });

  const result = await res.json();
  alert(`✅ Watch unregistered: ${result.status}`);
}

function renderWatchIcon(container, isWatched, address, chain, refreshCallback = null) {
  container.innerHTML = "";
  const icon = document.createElement("span");
  icon.title = isWatched ? "Unwatch address" : "Watch address";
  icon.style.cursor = "pointer";
  icon.style.fontSize = "18px";
  icon.textContent = isWatched ? "🔔" : "🔕";
  icon.dataset.busy = "false";

  icon.onclick = async () => {
    if (icon.dataset.busy === "true") return; // prevent spamming
    icon.dataset.busy = "true";

    try {
      await toggleWatch(!isWatched, address, chain);
      if (typeof refreshCallback === "function") {
        await refreshCallback(); // 🧠 use await here
  }
    } catch (err) {
      console.error("Watch toggle failed:", err);
    } finally {
      icon.dataset.busy = "false";
}
  };

  container.appendChild(icon);
}



async function toggleWatch(shouldWatch, address, chain) {
  const userId = getOrCreateUserId();
  const endpoint = getApiEndpoint(chain, shouldWatch);
  const method = shouldWatch ? 'POST' : 'POST'; // both are POST, different endpoints
  const body = JSON.stringify({ userId, address, chain });

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '0e74cb18-74fa-458e-8adb-f3a8096c0678'
      },
      body
    });

    if (res.ok) {
      const watchSpan = document.getElementById("watch-status");
      if (watchSpan) renderWatchIcon(watchSpan, shouldWatch, address, chain);
      const favoriteSpan = document.getElementById("favorite-status");
      if (favoriteSpan) renderFavIcon(favoriteSpan, isFavorite(address, selectedBlockchain), address, selectedBlockchain);
    } else {
      console.warn("Failed to update watch status:", await res.text());
    }
  } catch (err) {
    console.error("Error updating watch status:", err);
  }
}

async function showWatchedAddressesModal() {
  const userId = getOrCreateUserId();
  try {
    const response = await fetch(`https://akirion.com:4665/api/watched?userId=${userId}`, {
      headers: { 'x-api-key': '0e74cb18-74fa-458e-8adb-f3a8096c0678' }
    });
    const data = await response.json();
    const list = document.getElementById('watched-list');
    list.innerHTML = '';
    list.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      </table>
      <div style="max-height: 300px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tbody id="watched-table-body"></tbody>
      </table>
      </div>
    `;

    const tbody = document.getElementById('watched-table-body');
    data.watched.forEach(({ address, chain }) => {
      const shortened = address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 6px;font-size: 10px;"><code>${shortened}</code></td>
        <td style="padding: 6px;"><small style="color:#aaa">${chain}</small></td>
        <td style="padding: 6px; text-align: center;">
          <button onclick="unwatchThisAddress('${address}', '${chain}', true)" style="
            padding: 4px 10px;
            font-size: 10px;
            background: #e53935;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Unwatch</button>
        </td>
      `;

      tbody.appendChild(row);
    });
    document.getElementById('watched-modal').style.display = 'block';
  } catch (err) {
    alert('Error fetching watched addresses');
    console.error(err);
  }
}

function getOrCreateUserId() {
  let id = localStorage.getItem("mge_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("mge_user_id", id);
  }
  return id;
}

// UNUSED
function showInAppNotification(title, body) {
  const notif = document.createElement('div');
  notif.style.position = 'fixed';
  notif.style.bottom = '20px';
  notif.style.right = '20px';
  notif.style.background = '#333';
  notif.style.color = 'white';
  notif.style.padding = '12px 18px';
  notif.style.borderRadius = '8px';
  notif.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  notif.style.zIndex = 9999;
  notif.style.fontSize = '14px';
  notif.style.maxWidth = '300px';
  notif.style.cursor = 'pointer';
  notif.style.transition = 'opacity 0.3s';

  notif.innerHTML = `<strong>${title}</strong><br>${body}`;

  notif.onclick = () => notif.remove();

  document.body.appendChild(notif);

  // Auto-remove after 5 seconds
  setTimeout(() => notif.remove(), 10000);
}

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function isAddressInFavorites(address, chain) {
  return getFavorites().some(fav => fav.address === address && fav.chain === chain);
}

function isFavorite(address, chain) {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  return favorites.some(entry => entry.address === address && entry.chain === chain);
}

function unFavThisAddress(address, chain) {
  let favorites = getFavorites();
  favorites = favorites.filter(fav => !(fav.address === address && fav.chain === chain));
  saveFavorites(favorites);
}

function renderFavIcon(container, isFav, address, chain) {
  container.innerHTML = `<span onclick="toggleFavorite(${!isFav}, '${address}', '${chain}')" 
    title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" 
    style="cursor:pointer; font-size:18px;">${isFav ? "⭐" : "☆"}</span>`;
}

function toggleFavorite(shouldAdd, address, chain) {
  const favorites = getFavorites();
  const index = favorites.findIndex(entry => entry.address === address && entry.chain === chain);

  if (shouldAdd && index === -1) {
    favorites.push({ address, chain, label: "" });
  } else if (!shouldAdd && index !== -1) {
    favorites.splice(index, 1);
  }

  saveFavorites(favorites);

  const favSpan = document.getElementById("favorite-status");
  if (favSpan) renderFavIcon(favSpan, shouldAdd, address, chain);
}

function toggleSort(key) {
  if (currentSortKey === key) {
    currentSortAsc = !currentSortAsc;
  } else {
    currentSortKey = key;
    currentSortAsc = true;
  }

  favorites.sort((a, b) => {
    const v1 = (a[currentSortKey] || "").toLowerCase();
    const v2 = (b[currentSortKey] || "").toLowerCase();
    return currentSortAsc ? v1.localeCompare(v2) : v2.localeCompare(v1);
  });

  renderFavoritesTable(favorites);

  // Update sort indicators
  modal.querySelectorAll("th[data-sort-key]").forEach(th => {
    const icon = th.querySelector(".sort-indicator");
    if (th.dataset.sortKey === currentSortKey) {
      icon.textContent = currentSortAsc ? "▲" : "▼";
    } else {
      icon.textContent = "↕";
    }
  });
}

function copyAddressToClipboard(el, address) {
  navigator.clipboard.writeText(address).then(() => {
    const toast = document.createElement("div");
    toast.textContent = "✅ Copied!";
    toast.style.cssText = `
      position: absolute;
      top: -18px;
      left: 0;
      background: #222;
      color: #fff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    el.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 1000);
  });
}

function showFavoritesAddressesModal() {
  let currentSortKey = null;
  let currentSortAsc = true;

  // Supprime tout modal existant pour repartir propre
  const existing = document.getElementById("favorites-overlay");
  if (existing) existing.remove();

  // Fonction de tri appelée depuis les en-têtes
  function toggleSort(key) {
    if (currentSortKey === key) {
      currentSortAsc = !currentSortAsc;
    } else {
      currentSortKey = key;
      currentSortAsc = true;
    }
    renderFavoritesTable(getFilteredFavorites());
    updateSortIndicators();
  }

  const modal = createFavoritesModal(toggleSort);
  modal.style.display = "flex";

  const favorites = getFavorites();
  const tableBody = modal.querySelector("#favorites-table-body");
  const searchInputs = modal.querySelectorAll(".fav-search");

  if (!tableBody) {
    console.error("❌ #favorites-table-body introuvable dans le modal.");
    console.log("Contenu du modal:", modal.outerHTML);
    return;
  }

  searchInputs.forEach(input => {
    input.addEventListener("input", () => {
      renderFavoritesTable(getFilteredFavorites());
    });
  });

  function getFilteredFavorites() {
    const [addrFilter, chainFilter, labelFilter] = Array.from(searchInputs).map(i => i.value.toLowerCase());
    let filtered = favorites.filter(f =>
      f.address.toLowerCase().includes(addrFilter) &&
      f.chain.toLowerCase().includes(chainFilter) &&
      (f.label || "").toLowerCase().includes(labelFilter)
    );

    if (currentSortKey) {
      filtered.sort((a, b) => {
        const valA = (a[currentSortKey] || "").toLowerCase();
        const valB = (b[currentSortKey] || "").toLowerCase();
        return currentSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return filtered;
  }

  function updateSortIndicators() {
    const indicators = modal.querySelectorAll(".sort-indicator");
    indicators.forEach(indicator => {
      const sortKey = indicator.closest("th")?.querySelector("input")?.dataset.sortKey;
      if (!sortKey) return;

      if (sortKey === currentSortKey) {
        indicator.textContent = currentSortAsc ? "▲" : "▼";
      } else {
        indicator.textContent = "↕";
      }
    });
  }

  function renderFavoritesTable(favs) {
    tableBody.innerHTML = "";
    favs.forEach(async ({ address, chain, label }) => {
    const shortened = address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address;
      const explorerURL = getExplorerURL("account", address, chain);
    const row = document.createElement("tr");

    row.innerHTML = `
        <td style="white-space: nowrap;">
          <code title="${address}" style="cursor: pointer; position: relative;" onclick="copyAddressToClipboard(this, '${address}')">
            ${shortened}
          </code>
        </td>     
        <td style="white-space: nowrap;">${chain}</td>
        <td style="width: 100%;">
          <input class="fav-label" value="${label || ""}" onchange="updateFavoriteLabel('${address}', '${chain}', this.value)"
                 style="width: 100%; box-sizing: border-box;" />
        </td>
        <td style="white-space: nowrap; text-align: right; width:1%;">
          <span id="watch-icon-${address}-${chain}" style="margin-left: 4px;"></span>
          <a class="fav-link" href="${explorerURL}" target="_blank" title="Voir dans explorer">🔗</a>
          <button class="fav-btn" title="QR Code" onclick="showQRCode('${address}')">📱</button>
          <button class="fav-btn" title="Fetch" onclick="fetchFavorite('${address}', '${chain}'); document.getElementById('favorites-overlay')?.remove();">🔍</button>
          <button class="fav-btn" title="Supprimer" onclick="unFavThisAddress('${address}', '${chain}'); showFavoritesAddressesModal()">❌</button>
      </td>
    `;
      tableBody.appendChild(row);
      // 🕵️ Check watch status and render the icon
      const isWatchedNow = await isWatched(address, chain);
      const iconContainer = row.querySelector(`#watch-icon-${address}-${chain}`);
      if (iconContainer) {
        const refreshIcon = async () => {
          const newStatus = await isWatched(address, chain);
          renderWatchIcon(iconContainer, newStatus, address, chain, refreshIcon);
        };
        renderWatchIcon(iconContainer, isWatchedNow, address, chain, refreshIcon); 
      }        
    });
    // 🔁 Refresh sort icons after render
    updateSortIndicators();
  }

  function addManualFavoriteRow() {
    const row = document.createElement("tr");

    const addressInput = document.createElement("input");
    addressInput.placeholder = "Full address";
    addressInput.style.cssText = "width:100%;background:#1a1a1a;color:#fff;";

    const chainSelect = document.createElement("select");
    ["ethereum", "polygon", "bsc", "solana", "mina", "tezos"].forEach(chain => {
      const opt = document.createElement("option");
      opt.value = chain;
      opt.textContent = chain;
      chainSelect.appendChild(opt);
    });
    chainSelect.style.cssText = "width:100%;background:#1a1a1a;color:#fff;";

    const labelInput = document.createElement("input");
    labelInput.placeholder = "Label";
    labelInput.style.cssText = "width:100%;background:#1a1a1a;color:#fff;";

    const addBtn = document.createElement("button");
    addBtn.textContent = "✔";
    addBtn.className = "fav-btn";
    addBtn.onclick = () => {
      const address = addressInput.value.trim();
      const chain = chainSelect.value;
      const label = labelInput.value.trim();
      if (!address || !chain) return alert("Please fill all fields.");
      toggleFavorite(true, address, chain);
      updateFavoriteLabel(address, chain, label);
      
      // ✅ Update the `favorites` array
      favorites.push({ address, chain, label });      
      
  renderFavoritesTable(getFilteredFavorites());
    };

    [addressInput, chainSelect, labelInput, addBtn].forEach(el => {
      const td = document.createElement("td");
      td.appendChild(el);
      row.appendChild(td);
    });

    tableBody.prepend(row);
}

  const addButton = modal.querySelector("#add-favorite-btn");
  if (addButton) addButton.onclick = () => addManualFavoriteRow();

  // Initial render
  renderFavoritesTable(getFilteredFavorites());
}

function createFavoritesModal(toggleSortCallback) {
  const modal = document.createElement("div");
  modal.id = "favorites-overlay";
  modal.style.display = "flex";

  const closeButton = document.createElement("button");
  closeButton.textContent = "CLOSE";
  closeButton.className = "close-fav";
  closeButton.onclick = () => modal.remove();

  const title = document.createElement("h2");
  title.textContent = "⭐ Favorites";
  title.style.fontSize = "20px";
  title.style.marginBottom = "32px";

  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "favorites-scroll-wrapper";

  const table = document.createElement("table");
  table.className = "favorites-table"; // 📌 Add this for CSS
  table.style.cssText = `
    width: 100%;
    min-width: 400px;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 12px;
  `;

  const thead = document.createElement("thead");
  const tr = document.createElement("tr");

  const sortKeys = ["address", "chain", "label"];
  ["Adresse", "Blockchain", "Label"].forEach((placeholder, index) => {
    const sortKey = sortKeys[index];

    const th = document.createElement("th");
    //th.style.position = "relative";

    const inputWrapper = document.createElement("div");
    inputWrapper.style.position = "relative";
    inputWrapper.style.width = "100%";

    const input = document.createElement("input");
    input.className = "fav-search";
    input.placeholder = placeholder;
    input.dataset.sortKey = sortKey;
    input.style.cssText = `
      padding: 6px 22px 6px 6px;
      width: 100%;
      border-radius: 4px;
      border: 1px solid #444;
      background: #1a1a1a;
      color: #f0f0f0;
      font-size: 13px;
    `;

    const icon = document.createElement("span");
    icon.className = "sort-indicator";
    icon.textContent = "↕";
    icon.style.cssText = `
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: #aaa;
      cursor: pointer;
      user-select: none;
    `;

    icon.onclick = (e) => {
      e.stopPropagation();
      if (typeof toggleSortCallback === "function") {
        toggleSortCallback(sortKey);
      }
    };

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(icon);
    th.appendChild(inputWrapper);

    tr.appendChild(th);
  });


  const emptydiv = document.createElement("input");
  emptydiv.className = "fav-search";
  emptydiv.placeholder = "Actions";
  emptydiv.style.cssText = `
      padding: 6px 22px 6px 6px;
      width: 100%;
      border-radius: 4px;
      border: 1px solid #444;
      background: #1a1a1a;
      color: #f0f0f0;
      font-size: 13px;
      
    `;  
  emptydiv.style.pointerEvents = "none";
  emptydiv.readonly = true;
  const thActions = document.createElement("th");
  //thActions.style.background = "#333333";
  //thActions.style.border = "none";
  //thActions.style.opacity = "0";
  //thActions.style.pointerEvents = "none";
  thActions.style.display = "flex";
  //thActions.style.justifyContent = "flex-end";
  //thActions.style.alignItems = "center";
  thActions.appendChild(emptydiv);
  
  const addBtn = document.createElement("button");
  addBtn.textContent = "➕";
  addBtn.title = "Add a new favorite";
  addBtn.className = "fav-btn";
  addBtn.style.float = "right";
  addBtn.style.cssText = `
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    background: #333;
    color: #fff;
    border: 1px solid #555;
    cursor: pointer;
    margin-left: auto;
  `;
  
  //addBtn.onclick = () => addManualFavoriteRow();
  addBtn.id = "add-favorite-btn"; // we'll hook it later

  thActions.appendChild(addBtn);
  
  
  tr.appendChild(thActions);

  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.id = "favorites-table-body";
  table.appendChild(tbody);

  scrollWrapper.appendChild(table);
  modal.appendChild(closeButton);
  modal.appendChild(title);
  modal.appendChild(scrollWrapper);

  document.body.appendChild(modal);
  return modal;
}




function updateFavoriteLabel(address, chain, newLabel) {
  const favorites = getFavorites();
  const idx = favorites.findIndex(f => f.address === address && f.chain === chain);
  if (idx !== -1) {
    favorites[idx].label = newLabel;
    saveFavorites(favorites);
  }
}


function fetchFavorite(address, chain) {
  const select = document.getElementById("blockchain-select");
  select.value = chain;

  // ⏬ Manually dispatch change event
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById("param-base-key").value = address;
  document.getElementById("start-graph-btn").click();
  document.getElementById("favorites-modal").style.display = "none";
}

function showQRCode(address) {
  const modal = document.getElementById("qrcode-modal");
  const container = document.getElementById("qrcode-container");
  container.innerHTML = ''; // Clear previous QR code

  // Créer un conteneur centré
  const innerWrapper = document.createElement("div");
  innerWrapper.style.display = "flex";
  innerWrapper.style.flexDirection = "column";
  innerWrapper.style.alignItems = "center";
  innerWrapper.style.justifyContent = "center";

  // Générer le QR Code
  const qrDiv = document.createElement("div");
  new QRCode(qrDiv, {
    text: address,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.M
  });
  innerWrapper.appendChild(qrDiv);

  // Ajouter l'adresse en dessous
  const label = document.createElement("p");
  label.style.marginTop = "10px";
  label.style.fontSize = "12px";
  label.style.wordBreak = "break-all";
  label.style.color = "#000";
  label.style.textAlign = "center";
  label.textContent = address;
  innerWrapper.appendChild(label);

  container.appendChild(innerWrapper);
  modal.style.display = "flex";
}

// ✅ Ensure DB version is 2 and uses message_id as key
function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notificationDB', 2);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (db.objectStoreNames.contains('notifications')) {
        db.deleteObjectStore('notifications');
      }
      db.createObjectStore('notifications', { keyPath: 'message_id' });
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

// --- Load all notifications
function getSavedNotifications() {
  return openNotificationDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = reject;
    });
  });
}

// --- Save notification
function saveNotificationToStorage(data) {
  return openNotificationDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      const timestamp = Date.now();
      const newEntry = { ...data, timestamp };

      if (!newEntry.message_id) {
        console.warn('[UI] Cannot save notification: missing message_id');
        resolve();
        return;
      }

      const getRequest = store.get(newEntry.message_id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;

        if (existing) {
          const hasAllFields =
            existing.click_action &&
            existing.chain &&
            (existing.sender || existing.receiver || existing.address) &&
            existing.action_primary;

          if (hasAllFields) {
            console.log('[UI] Duplicate message_id with complete data, skipping:', newEntry.message_id);
          resolve();
            return;
        } else {
            // Overwrite with more complete data
            console.log('[UI] Overwriting incomplete notification:', newEntry.message_id);
            store.put(newEntry);
          }
        } else {
          console.log('[UI] Saving new notification:', newEntry.message_id);
          store.add(newEntry);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = (err) => {
          console.error('[UI] IndexedDB transaction error:', err);
          reject(err);
        };
      };

      getRequest.onerror = reject;
    });
  });
}


// --- Update badge
async function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;

  try {
    const notifs = await getSavedNotifications();
    badge.textContent = notifs.length;
    badge.style.display = notifs.length > 0 ? 'inline-block' : 'none';
  } catch (err) {
    console.error('Badge update error:', err);
  }
}

function deleteNotification(message_id) {
  return openNotificationDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      store.delete(message_id);
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  });
}

function clearAllNotifications() {
  return openNotificationDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      tx.objectStore('notifications').clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  });
}

async function confirmAndClearAllNotifications() {
  const confirmed = confirm('Delete all notifications? This action cannot be undone.');
  if (!confirmed) return;

  try {
    await clearAllNotifications();
    await updateNotificationBadge();
    await showNotificationList();
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    showErrorPopup('Unable to clear notifications. Please try again.');
  }
}

async function showNotificationList() {
  const container = document.getElementById('notification-list');
  
  const isLight   = currentTheme === 'light';

  // theme-aware palette
  const bgColor             = isLight ? '#fff' : '#222';
  const textColor           = isLight ? '#000' : '#fff';
  const secondaryTextColor  = isLight ? '#555' : '#aaa';
  const borderColor         = isLight ? '#ccc' : '#555';
  const btnBgDefault        = isLight ? '#eee' : '#444';
  const btnColorDefault     = isLight ? '#333' : '#ccc';  

  // style the container itself
  Object.assign(container.style, {
    background: bgColor,
    color: textColor,
    border: `1px solid ${borderColor}`,
    boxShadow: isLight
      ? '0 2px 8px rgba(0,0,0,0.15)'
      : '0 2px 8px rgba(0,0,0,0.5)',
  });
  
  const notifs = await getSavedNotifications();

  if (!notifs.length) {
    container.innerHTML = "<p style='margin:0;color:#888;'>No notifications</p>";
  } else {
    const header = `
      <div style="
        position: sticky;
        top: -8px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: -8px -8px 8px;
        padding: 8px;
        background: ${bgColor};
        border-bottom: 1px solid ${borderColor};
      ">
        <strong>Notifications</strong>
        <button id="clear-all-notifications" type="button" style="
          padding: 4px 8px;
          color: white;
          background: #b3261e;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        ">Clear all</button>
      </div>`;

    container.innerHTML = header + notifs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(n => {
        let graphButtons = '';

        if (n.action_primary === 'show_graph' && n.chain) {
          if (n.sender) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.sender}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #2c88ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Sender</button>`;
          }
          if (n.receiver) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.receiver}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #27a745;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Receiver</button>`;
          }
          if (n.creatorAccount) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.creatorAccount}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #6f42c1;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">BP</button>`;
          }
          if (n.coinbaseReceiverAccount) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.coinbaseReceiverAccount}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #D57109;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Coinbase</button>`;
          }
          if (!n.sender && !n.receiver && n.address) {
            graphButtons += `<button onclick="handleShowGraph('${n.chain}', '${n.address}')" style="
              margin-top: 6px;
              margin-right: 6px;
              padding: 4px 8px;
              background: #2c88ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
            ">Show Graph</button>`;
          }
        }

        const dismissBtn = `<button onclick="deleteAndRefresh('${n.message_id}')" style="
            margin-top: 6px;
            padding: 4px 8px;
            background: ${btnBgDefault};
            color: ${btnColorDefault};
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
          ">Dismiss</button>`;

        return `
          <div class="notif-item" data-id="${n.message_id}" style="
            padding: 6px 4px;
            border-bottom: 1px solid ${borderColor};
            position: relative;
            background: ${bgColor};
            color: ${textColor};
          ">
          <strong>${n.title}</strong><br>
            <small style="color: ${secondaryTextColor};">${(n.body || '').replace(/\n/g, '<br/>')}</small><br/>
          <small style="color: #aaa;">${new Date(n.timestamp).toLocaleString()}</small>
          <button style="
            position: absolute;
            top: 4px;
            right: 4px;
            background: transparent;
              color: ${secondaryTextColor};
            border: none;
            cursor: pointer;
            font-size: 14px;
          " title="Delete" onclick="deleteAndRefresh('${n.message_id}')">✖</button>
            <div style="margin-top: 6px;">${graphButtons}${dismissBtn}</div>
        </div>
        `;
      }).join('');

      document.getElementById('clear-all-notifications')
        ?.addEventListener('click', confirmAndClearAllNotifications);

      // ✅ Enable swipe-to-delete
      container.querySelectorAll('.notif-item').forEach(el => {
        let startX = null;

      // Mobile
      el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
        el.addEventListener('touchmove', e => {
          if (startX === null) return;
          const deltaX = e.touches[0].clientX - startX;
          el.style.transform = `translateX(${Math.min(deltaX, 100)}px)`;
          el.style.opacity = `${1 - Math.min(deltaX / 100, 1)}`;
        });

        el.addEventListener('touchend', async () => {
          const deltaX = parseFloat(el.style.transform.replace(/[^0-9.-]/g, '') || 0);
          if (deltaX > 50) {
            const id = el.dataset.id;
            await deleteAndRefresh(id);
          } else {
            el.style.transform = '';
            el.style.opacity = '';
          }
          startX = null;
        });

        // --- Desktop: mouse
        let mouseStartX = null;

        el.addEventListener('mousedown', e => {
          mouseStartX = e.clientX;
          el.style.transition = 'none';
        });

        el.addEventListener('mousemove', e => {
          if (mouseStartX === null) return;
          const deltaX = e.clientX - mouseStartX;
          el.style.transform = `translateX(${Math.min(deltaX, 100)}px)`;
          el.style.opacity = `${1 - Math.min(deltaX / 100, 1)}`;
        });

        el.addEventListener('mouseup', async e => {
          const deltaX = e.clientX - mouseStartX;
          el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

          if (deltaX > 50) {
            const id = el.dataset.id;
            await deleteAndRefresh(id);
          } else {
            el.style.transform = '';
            el.style.opacity = '';
          }
          mouseStartX = null;
        });

        el.addEventListener('mouseleave', () => {
          mouseStartX = null;
          el.style.transform = '';
          el.style.opacity = '';
        });
      });
  }

  container.style.display = 'block';
}

// Global graph launcher
window.handleShowGraph = function(chain, address) {
  if (!chain || !address) return;
  console.log('[UI] Triggering graph display from notification list:', chain, address);
  LIMIT = parseInt(document.getElementById("param-limit").value, 10);
  FIRST_ITERATION_LIMIT = parseInt(document.getElementById("param-first-iteration").value, 10);  
  BASE_KEY = address;
  main(1, true, chain);
};


// Then attach it globally
window.deleteAndRefresh = async function(message_id) {
  await deleteNotification(message_id);
  await updateNotificationBadge();
  await showNotificationList();
};

function showToastNotification(title, body) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const safeBody = (body || '').replace(/\n/g, '<br/>');

  toast.innerHTML = `<strong>${title}</strong><br>${safeBody}`;
  toast.style.display = 'block';

  if (window._toastTimeout) {
    clearTimeout(window._toastTimeout);
  }

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.style.display = 'none';
  }, 4000);
}

/**
 * Saves all localStorage data to a JSON file.
 *
 * @param {string} filename The name of the file to save (e.g., "localStorage_backup.json").
 */
function saveLocalStorageToJsonFile(filename = 'localStorage_backup.json') {
    const dataToSave = {};
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); 
    const fileToSave = `localStorage_backup_${timestamp}.json`;    

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                dataToSave[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                dataToSave[key] = localStorage.getItem(key);
            }
        }
        console.log('localStorage data collected successfully.');
    } catch (error) {
        console.error('Error collecting localStorage data:', error);
        alert('Failed to collect localStorage data. Check console for details.');
        return;
    }

    try {
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileToSave;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Download initiated for ${fileToSave}`);
        // Remove the alert - let the browser handle the download feedback
    } catch (error) {
        console.error('Error creating or downloading JSON file:', error);
        alert('Failed to prepare download. Check console for details.');
    }
}

/**
 * Loads localStorage data from a JSON file and restores it.
 *
 * @param {File} file The JSON file selected by the user.
 */
function loadLocalStorageFromJsonFile(file) {
    if (!file) {
        alert('No file selected.');
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            const loadedData = JSON.parse(event.target.result);

            if (typeof loadedData !== 'object' || loadedData === null) {
                throw new Error('Invalid JSON structure: Expected an object.');
            }

            // Clear existing localStorage before restoring
            localStorage.clear();
            console.log('Existing localStorage cleared.');

            for (const key in loadedData) {
                if (Object.hasOwnProperty.call(loadedData, key)) {
                    // localStorage only stores strings, so stringify non-string values
                    const valueToStore = typeof loadedData[key] === 'string' ? loadedData[key] : JSON.stringify(loadedData[key]);
                    localStorage.setItem(key, valueToStore);
                }
            }
            console.log('localStorage data restored successfully.');
            alert('localStorage data loaded successfully!');
            // You might want to reload the page or trigger a UI update here
            // window.location.reload();
        } catch (error) {
            console.error('Error loading localStorage data from file:', error);
            alert(`Failed to load data from file: ${error.message}. Please ensure it's a valid JSON backup.`);
        }
    };

    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Failed to read the selected file. Check console for details.');
    };

    reader.readAsText(file);
}

  function clearEverything() {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });

    // Delete IndexedDB databases
    if (window.indexedDB && indexedDB.databases) {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
      });
    }

    // Remove FCM tokens (if using Firebase)
    if (window.firebase && firebase.messaging) {
      firebase.messaging().getToken().then(token => {
        firebase.messaging().deleteToken(token);
      });
    }

    // Clear caches (Service Worker)
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }

    console.log('✅ Everything cleared. Reloading...');

    // Reload after a short delay to ensure all async operations complete
    setTimeout(() => window.location.href = window.location.origin + window.location.pathname, 1000);
  }
  
  function getFavoriteName(address, chain) {
    const fav = getFavorites().find(
      f => f.address === address && f.chain === chain
    );
    return fav ? fav.label : null;
  }  
