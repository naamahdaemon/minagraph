const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const fs = require('node:fs');
const path = require('node:path');

global.performance = performance;
global.requestAnimationFrame = callback => {
  callback(performance.now() + 1000);
  return 1;
};
global.cancelAnimationFrame = () => {};

const { AdaptiveViewportManager } = require('../scripts/adaptive-viewport.js');
const root = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const sigmaSource = fs.readFileSync(path.join(root, 'scripts', 'sigma.umd.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'style', 'style.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.match(html, /id="adaptive-viewport-enabled"/);
assert.match(html, /id="adaptive-viewport-spacing"/);
assert.match(html, /id="adaptive-viewport-margin"/);
assert.match(html, /id="adaptive-viewport-stability"/);
assert.match(html, /id="adaptive-viewport-displacement"/);
assert.match(html, /id="adaptive-viewport-aspect"/);
assert.match(html, /id="layout-menu-adaptive-viewport"/);
assert.match(html, /id="layout-menu-adaptive-viewport"[\s\S]*?role="switch"[\s\S]*?aria-checked="false"/);
assert.match(html, /id="additional-graph-parameters-section"/);
assert.ok(
  html.indexOf('id="additional-graph-parameters-section"') > html.indexOf('id="graph-parameters-section"'),
  'adaptive controls should live in a dedicated section after Graph Parameters'
);
assert.equal((html.match(/data-adaptive-step=/g) || []).length, 10);
assert.equal((html.match(/data-adaptive-number/g) || []).length, 5,
  'adaptive settings should use browser-independent numeric text fields');
assert.doesNotMatch(html, /id="adaptive-viewport-[^"]+" type="number"/,
  'adaptive settings must not expose duplicate native number spinners');
assert.match(html, /scripts\/adaptive-viewport\.js/);
assert.match(appSource, /onViewportFit: \(\) => centerGraphInViewport/);
assert.match(appSource, /getViewportInsets: getGraphViewportInsets/);
assert.match(appSource, /getViewportElements: getGraphViewportElements/);
assert.match(appSource, /getVisibleNodeIds: getAdaptiveViewportNodeIds/);
assert.match(appSource, /LAYOUT_SCOPE_STORAGE_KEY = "minagraph-layout-scope"/);
assert.match(appSource, /localStorage\.setItem\(LAYOUT_SCOPE_STORAGE_KEY, select\.value\)/);
assert.match(appSource, /document\.getElementById\("left-sidebar"\)/);
assert.match(appSource, /document\.getElementById\("side-panel"\)/);
assert.match(appSource, /requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => \{/);
const adaptiveSource = fs.readFileSync(path.join(root, 'scripts', 'adaptive-viewport.js'), 'utf8');
assert.match(adaptiveSource, /aspect-settle:/);
assert.match(adaptiveSource, /const rawInsets = this\.options\.getViewportInsets\?\.\(\) \|\| \{\}/);
assert.match(adaptiveSource, /reason === "layout-complete" \|\| reason === "post-fit" \|\| reason\.startsWith\("aspect-settle:"\)/,
  'only layout completion and its internal settle passes may trigger adaptation');
assert.doesNotMatch(adaptiveSource, /new ResizeObserver|new MutationObserver|\.on\?\.\("updated"/,
  'ordinary viewport and camera interactions must not reshape the graph');
assert.doesNotMatch(appSource, /schedule\("filter"\)|schedule\("date-filter"\)|schedule\("layout-scope"\)/,
  'filters and scope controls must not trigger adaptive topology changes');
assert.match(appSource, /adaptiveMenuToggle\.classList\.toggle\("is-active", adaptiveEnabled\)[\s\S]*?adaptiveSettingsCheckbox\.dispatchEvent\(new Event\("change"/,
  'the quick toggle should stay synchronized with the settings checkbox');
assert.match(styleSource, /#layout-algorithm-menu[\s\S]*?font-family: ui-monospace/,
  'the layout menu should consistently use a monospace font');
assert.match(adaptiveSource, /scheduleFinalCenter\(generation\)/,
  'adaptive processing should end by centering its final node positions');
assert.match(appSource, /if \(adaptiveViewportManager\?\.enabled\) adaptiveViewportManager\.resume\("layout-complete"\);[\s\S]*?else centerGraphInViewport\(\{ trackLayout: false \}\);/,
  'layouts should also finish centered when Adaptive Viewport is disabled');
assert.doesNotMatch(appSource, /adaptiveViewportManager\?\.reduceNode/, 'Sigma overwrites reducer coordinates during processing');
assert.match(sigmaSource, /data\.x = attrs\.x;[\s\S]*data\.y = attrs\.y;/, 'test must track Sigma position processing behavior');
assert.match(appSource, /ADAPTIVE_VIEWPORT_STORAGE_KEY = "minagraph-adaptive-viewport-enabled"/);
assert.match(appSource, /ADAPTIVE_VIEWPORT_SETTINGS_STORAGE_KEY = "minagraph-adaptive-viewport-settings"/);
assert.match(appSource, /localStorage\.getItem\(ADAPTIVE_VIEWPORT_STORAGE_KEY\) === "true"/,
  'adaptive viewport activation should be restored from local storage');
assert.match(appSource, /JSON\.parse\(localStorage\.getItem\(ADAPTIVE_VIEWPORT_SETTINGS_STORAGE_KEY\) \|\| "null"\)/,
  'adaptive viewport settings should be restored from local storage');
assert.match(appSource, /const readSettings = \(\) => \(\{[\s\S]*?minDistancePx:[\s\S]*?viewportMarginPercent:[\s\S]*?positionStability:[\s\S]*?maxDisplacementPx:[\s\S]*?aspectAdaptation:[\s\S]*?\}\);/,
  'every adaptive viewport parameter should be included in the persisted settings object');
assert.match(appSource, /localStorage\.setItem\(ADAPTIVE_VIEWPORT_SETTINGS_STORAGE_KEY, JSON\.stringify\(settings\)\)/,
  'all adaptive viewport settings should be saved together');
assert.match(appSource, /localStorage\.setItem\(ADAPTIVE_VIEWPORT_STORAGE_KEY, String\(checkbox\.checked\)\)/,
  'adaptive viewport activation should be saved');
assert.match(worker, /mina-graph-explorer-v191/);
assert.match(worker, /'\/scripts\/adaptive-viewport\.js'/);

class FakeGraph {
  constructor() {
    this.data = new Map([
      ['a', { x: 45, y: 50 }],
      ['b', { x: 52, y: 52 }],
      ['fixed', { x: 58, y: 50, manuallyPositioned: true }],
    ]);
    this.listeners = new Map();
  }
  nodes() { return [...this.data.keys()]; }
  forEachNode(callback) { this.data.forEach((attributes, node) => callback(node, attributes)); }
  hasNode(node) { return this.data.has(node); }
  getNodeAttribute(node, key) { return this.data.get(node)[key]; }
  getNodeAttributes(node) { return this.data.get(node); }
  setNodeAttribute(node, key, value) { this.data.get(node)[key] = value; }
  on(event, listener) { this.listeners.set(event, listener); }
  off(event) { this.listeners.delete(event); }
}

const graph = new FakeGraph();
const cameraListeners = new Map();
const camera = {
  state: { x: 0.5, y: 0.5, ratio: 2, angle: 0 },
  on: (event, listener) => cameraListeners.set(event, listener),
  off: event => cameraListeners.delete(event),
  getState() { return { ...this.state }; },
  setState(update) { this.state = { ...this.state, ...update }; },
};
let refreshCount = 0;
const renderer = {
  getCamera: () => camera,
  getContainer: () => null,
  getDimensions: () => ({ width: 100, height: 100 }),
  graphToViewport: point => ({ ...point }),
  viewportToGraph: point => ({ ...point }),
  refresh: () => { refreshCount++; },
};

const original = Object.fromEntries(graph.nodes().map(node => [node, { ...graph.getNodeAttributes(node) }]));
const manager = new AdaptiveViewportManager({
  animationDurationMs: 0,
  debounceMs: 0,
  getVisibleNodeIds: () => graph.nodes(),
  isNodeFixed: (_node, attributes) => Boolean(attributes.manuallyPositioned),
});

manager.setContext({ graph, renderer });
manager.updateOptions({ minDistancePx: 80, maxDisplacementPx: 140, aspectAdaptation: 0.75 });
assert.equal(manager.options.minDistancePx, 80);
assert.equal(manager.options.maxDisplacementPx, 140);
assert.equal(manager.options.aspectAdaptation, 0.75);
manager.setEnabled(true);
manager.cancelPending();
assert.deepEqual(graph.getNodeAttributes('a'), original.a, 'enabling should not alter the current topology');
manager.schedule('filter', { immediate: true });
assert.equal(manager.timer, null, 'graph interactions should not schedule adaptation');
for (const interaction of ['camera', 'resize', 'viewport-obstruction', 'topology', 'date-filter', 'layout-scope', 'manual-drag']) {
  manager.schedule(interaction, { immediate: true });
  assert.equal(manager.timer, null, `${interaction} should not schedule adaptation`);
}
manager.pendingReasons.add('layout-complete');
manager.recalculate();
assert.ok(camera.state.ratio < 2, 'layout completion should zoom the camera to occupy the available viewport');
manager.cancelPending();
manager.pendingReasons.add('post-fit');
manager.recalculate();

assert.ok(manager.displayPositions.size > 0, 'ON should calculate display-only positions');
const adaptedA = graph.getNodeAttributes('a');
const adaptedB = graph.getNodeAttributes('b');
assert.ok(
  Math.abs(adaptedB.x - adaptedA.x) > Math.abs(original.b.x - original.a.x),
  'layout completion should visibly expand a compact graph across the viewport'
);
assert.ok(
  Math.abs(adaptedB.y - adaptedA.y) > Math.abs(original.b.y - original.a.y),
  'aspect adaptation should expand the under-used viewport axis'
);
assert.ok(manager.pendingReasons.has('aspect-settle:1'), 'aspect adaptation should schedule a bounded convergence pass');
const generationBeforeSettings = manager.generation;
const topologyBeforeSettings = { ...graph.getNodeAttributes('a') };
manager.updateOptions({ minDistancePx: 96, viewportMarginPercent: 0.12, positionStability: 0.6, maxDisplacementPx: 180, aspectAdaptation: 0.25 });
assert.equal(manager.generation, generationBeforeSettings, 'changing parameters should not start another adaptive pass');
assert.deepEqual(graph.getNodeAttributes('a'), topologyBeforeSettings, 'parameter changes should preserve the current topology');
assert.equal(manager.options.minDistancePx, 96);
assert.equal(manager.options.viewportMarginPercent, 0.12);
assert.equal(manager.options.positionStability, 0.6);
assert.equal(manager.options.maxDisplacementPx, 180);
assert.equal(manager.options.aspectAdaptation, 0.25);
manager.cancelPending();
assert.deepEqual(manager.logicalPositions.get('a'), topologyBeforeSettings, 'the adapted topology should become the stable graph coordinates');
assert.deepEqual(graph.getNodeAttributes('fixed'), original.fixed, 'manually positioned nodes must remain untouched');
assert.ok(refreshCount > 0, 'the renderer should refresh after adaptation');
assert.equal(cameraListeners.has('updated'), false, 'camera interactions should never trigger adaptation');

manager.setEnabled(false);
assert.equal(manager.displayPositions.size, 0, 'OFF should discard every display coordinate immediately');
assert.deepEqual(graph.getNodeAttributes('a'), topologyBeforeSettings, 'OFF should preserve the topology produced by the last layout');
assert.ok(camera.state.ratio < 2, 'OFF should preserve the current camera state');

manager.destroy();
console.log('Adaptive viewport tests passed');
