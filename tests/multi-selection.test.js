const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const style = fs.readFileSync(path.join(root, 'style', 'style.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.match(source, /let multiSelectionEnabled = false;/);
assert.match(source, /const manuallyMultiSelectedNodes = new Set\(\);/);
assert.match(source, /const timelineMultiSelectedNodes = new Set\(\);/);
assert.match(source, /let multiSelectionFollowLinks = false;/);
assert.match(source, /function edgeMatchesMultiSelection\(source, target\)/);
assert.match(source, /if \(multiSelectionFocused\) return selected\.has\(source\) && selected\.has\(target\);/,
  'focused selection should retain only edges whose two endpoints are selected');
assert.match(source, /if \(multiSelectionFollowLinks\) return selected\.has\(source\) \|\| selected\.has\(target\);/,
  'follow-links mode should expose only edges incident to selected nodes');
assert.match(source, /function nodeMatchesMultiSelection\(node\)[\s\S]*?if \(multiSelectionFocused\) return false;/,
  'focused selection should hide unselected nodes');
assert.match(source, /selected\.has\(otherNode\) && edgeMatchesActiveViewWithoutMultiSelection/,
  'follow-links neighbors should still obey all non-selection filters');
assert.match(source, /edgeMatchesActiveViewWithoutMultiSelection\(attributes, source, target, referenceNode\) &&\s*edgeMatchesMultiSelection\(source, target\)/,
  'multi-selection should intersect with every existing edge filter');
assert.match(source, /function showNodePanel\(node, refreshExternalStatus = true\) \{\s*if \(multiSelectionEnabled && !multiSelectionFocused\) return;/,
  'details must stay closed during free selection but reopen when focus is fixed');
assert.match(source, /if \(multiSelectionEnabled && !multiSelectionFocused && getMultiSelectedNodes\(\)\.has\(node\)\)/,
  'selected-node highlight and forced labels must only apply while building an unfocused selection');
assert.match(source, /function showGraphMultiSelectionMenu\(clientX, clientY\) \{\s*hideNodeColorMenu\(\);/,
  'opening the graph selection menu must call the existing node-color menu closer');
assert.doesNotMatch(source, /closeNodeColorMenu\(/,
  'the nonexistent closeNodeColorMenu alias would abort menu opening at runtime');
assert.match(source, /const ctrlSelection = event\?\.original\?\.ctrlKey === true;[\s\S]*?setMultiSelectionEnabled\(true, \{ mode: "ctrl" \}\)[\s\S]*?toggleMultiSelectedNode\(node\)/);
assert.match(source, /multiSelectionActivationMode === "ctrl"[\s\S]*?setMultiSelectionEnabled\(false, \{ clear: true \}\)/,
  'a plain desktop click should leave Ctrl multi-selection');
assert.match(source, /if \(ctrlSelection && !multiSelectionFocused\)[\s\S]*?else if \(multiSelectionEnabled && !multiSelectionFocused\) \{\s*toggleMultiSelectedNode\(node\);/,
  'focused multi-selection should use normal node click behaviour instead of deselecting nodes');
assert.match(source, /hoveredNode \|\| \(multiSelectionEnabled && !multiSelectionFocused \? null : selectedNode\)/,
  'free multi-selection should preserve hover focus while suppressing persistent click focus');
assert.match(source, /renderer\.on\("rightClickStage"[\s\S]*?showGraphMultiSelectionMenu/);
assert.match(source, /function setupNativeGraphStageGestures\(\)[\s\S]*?document\.addEventListener\("contextmenu"[\s\S]*?stopImmediatePropagation[\s\S]*?showNodeColorMenu[\s\S]*?showGraphMultiSelectionMenu[\s\S]*?true\)/,
  'document-level captured contextmenu should reliably distinguish nodes from the empty graph');
assert.match(source, /const customMenu = event\.target\?\.closest\?\.\("#graph-multi-selection-menu, #node-color-menu"\);[\s\S]*?if \(!context && !customMenu\) return;[\s\S]*?event\.preventDefault\(\);[\s\S]*?if \(customMenu\) return;/,
  'the delayed browser context menu must also be suppressed when the custom menu appeared beneath the pointer');
assert.match(source, /function setupNativeGraphStageGestures\(\)[\s\S]*?const getGraphSurfaceContext = event => \{[\s\S]*?container\.contains\(event\.target\)/,
  'context-menu detection should cover the complete Sigma surface rather than canvas elements only');
assert.match(source, /document\.addEventListener\("pointerdown"[\s\S]*?event\.pointerType === "touch"[\s\S]*?desktopLongPressTimer = setTimeout[\s\S]*?showGraphMultiSelectionMenu[\s\S]*?, 600\)/,
  'desktop mouse long-press should open the stage menu independently of Sigma');
assert.match(source, /const sigmaMouseCanvas = renderer\.getCanvases\?\.\(\)\.mouse[\s\S]*?sigmaMouseCanvas\.addEventListener\("mousedown"[\s\S]*?event\.button === 2[\s\S]*?showGraphMultiSelectionMenu/,
  'right mouse down should open the menu directly from Sigma mouse canvas');
assert.match(source, /mouseLongPressTimer = setTimeout\([\s\S]*?suppressGraphStageClickUntil = Date\.now\(\) \+ 700;[\s\S]*?showGraphMultiSelectionMenu[\s\S]*?, 600\)/,
  'left mouse hold should open the menu directly from Sigma mouse canvas');
assert.match(source, /renderer\.on\("downStage"[\s\S]*?isPrimaryDesktopPress[\s\S]*?setTimeout\([\s\S]*?showGraphMultiSelectionMenu[\s\S]*?, 600\)/,
  'a mobile or desktop stage long-press should open the menu');
assert.match(source, /data-multi-selection-action="delete-selected"/);
assert.match(source, /data-multi-selection-action="delete-unselected"/);
assert.match(source, /data-multi-selection-action="select-visible">Select All<\/button>/);
const selectAllStart = source.indexOf('function getNodesVisibleInCurrentViewport()');
const selectAllEnd = source.indexOf('function ensureGraphMultiSelectionMenu()', selectAllStart);
const selectAllSource = source.slice(selectAllStart, selectAllEnd);
assert.match(selectAllSource, /getGraphViewportInsets\(\)/,
  'Select All should exclude viewport space covered by side panels');
assert.match(selectAllSource, /displayData\.hidden === true/,
  'Select All should exclude nodes hidden by active filters');
assert.match(selectAllSource, /framedGraphToViewport/,
  'Select All should use rendered visibility, camera bounds, and unobstructed viewport insets');
assert.match(selectAllSource, /function selectAllVisibleNodes\(\)[\s\S]*?setMultiSelectionEnabled\(true, \{ mode: "explicit" \}\)[\s\S]*?manuallyMultiSelectedNodes\.add\(node\)/,
  'Select All should activate multi-selection and add every currently visible viewport node');
assert.match(source, /action === "select-visible"\) selectAllVisibleNodes\(\)/);
assert.match(source, /const canSelectVisible = button\.dataset\.multiSelectionAction === "select-visible";/,
  'Select All must remain available when the current selection is empty');

const selectedNodes = new Set();
let selectionEnabled = false;
const displayData = {
  centered: { x: 50, y: 40, size: 2, hidden: false },
  hidden: { x: 40, y: 30, size: 2, hidden: true },
  offscreen: { x: 120, y: 40, size: 2, hidden: false },
  partial: { x: 5, y: 40, size: 6, hidden: false },
};
const selectAllContext = {
  graph: { nodes: () => Object.keys(displayData), order: Object.keys(displayData).length },
  renderer: {
    getDimensions: () => ({ width: 100, height: 80 }),
    getNodeDisplayData: node => displayData[node],
    framedGraphToViewport: point => point,
    scaleSize: size => size,
  },
  getGraphViewportInsets: () => ({ left: 10, right: 0, top: 0, bottom: 0 }),
  multiSelectionEnabled: false,
  setMultiSelectionEnabled: enabled => { selectionEnabled = enabled; selectAllContext.multiSelectionEnabled = enabled; },
  manuallyMultiSelectedNodes: selectedNodes,
  refreshMultiSelectionViews: () => {},
};
vm.runInNewContext(`${selectAllSource}\n;globalThis.selectAllApi = { getNodesVisibleInCurrentViewport, selectAllVisibleNodes };`, selectAllContext);
assert.deepEqual(Array.from(selectAllContext.selectAllApi.getNodesVisibleInCurrentViewport()), ['centered', 'partial']);
selectAllContext.selectAllApi.selectAllVisibleNodes();
assert.equal(selectionEnabled, true);
assert.deepEqual(Array.from(selectedNodes), ['centered', 'partial']);
assert.match(source, /data-multi-selection-action="delete-selected">Del\. sel\. nodes<\/button>/);
assert.match(source, /data-multi-selection-action="delete-unselected">Del\. unsel\. nodes<\/button>/);
assert.match(source, /data-multi-selection-action="delete-filtered-transactions">Del\. filtered Txs<\/button>/);
assert.match(source, /class="graph-multi-selection-focus" role="switch"[\s\S]*?>Focus selection</);
assert.match(source, /class="graph-multi-selection-neighbors" role="switch"[\s\S]*?>Follow links</);
assert.match(source, /multiSelectionFollowLinks = !multiSelectionFollowLinks;\s*refreshMultiSelectionViews\(\);/);
assert.match(source, /data-multi-selection-action="fetch-selected"/);
assert.match(source, /async function fetchSelectedMultiSelectionNodes\(\)[\s\S]*?for \(const node of selectedNodes\)[\s\S]*?buildGraphRecursively\(node, requestedDepth, 0, chain, profileSignature\)[\s\S]*?animateLayout\(null, "initial"\)/,
  'selected-node fetch should be additive and run one layout after the batch');
assert.match(source, /const previousState = \{[\s\S]*?baseKey: BASE_KEY[\s\S]*?API_TOKEN = previousState\.apiToken/,
  'selected-node fetch should restore the active fetch configuration');
assert.match(source, /confirm\(`Delete \$\{nodesToDelete\.length\}/,
  'bulk deletion should require confirmation');
assert.match(source, /function removeOrphanedGraphNodes\(\)[\s\S]*?graph\.nodes\(\)\.filter\(node => graph\.degree\(node\) === 0\)[\s\S]*?graph\.dropNode\(node\)/,
  'bulk deletion should remove every node left without an edge');
assert.match(source, /nodesToDelete\.forEach[\s\S]*?removeOrphanedGraphNodes\(\);[\s\S]*?manuallyMultiSelectedNodes/,
  'orphan cleanup should happen before stale selection references are purged');
assert.match(source, /function deleteFilteredTransactionsFromMultiSelection\(\)[\s\S]*?selected\.has\(source\) \|\| selected\.has\(target\)[\s\S]*?graphEdgeMatchesActiveView\(edge\)[\s\S]*?edgeMatchesTimelineSelection\(edge\)/,
  'filtered transaction deletion should intersect the selection with every active graph and timeline filter');
assert.match(source, /function deleteFilteredTransactionsFromMultiSelection\(\)[\s\S]*?graph\.dropEdge\(edge\)[\s\S]*?removeOrphanedGraphNodes\(\)/,
  'filtered transaction deletion should remove matching edges and resulting orphan nodes');
assert.match(source, /timelineMultiSelectedNodes\.clear\(\);[\s\S]*?datePlaybackFocusedEdges\.forEach/,
  'timeline transaction selection should update selected nodes');
assert.match(style, /\.graph-multi-selection-menu/);
assert.match(style, /\.graph-multi-selection-toggle\.is-active/);
assert.match(style, /\.graph-multi-selection-neighbors\.is-active/);
assert.match(style, /\.graph-multi-selection-focus\.is-active/);
assert.match(style, /\.graph-multi-selection-menu button\s*\{[\s\S]*?white-space:\s*nowrap/);
assert.match(worker, /mina-graph-explorer-v213/);

console.log('Multi-selection tests passed');
