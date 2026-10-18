const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
assert.match(source, /data-multi-selection-action="delete-selected">Delete selected<\/button>/);
assert.match(source, /data-multi-selection-action="delete-unselected">Delete unselected<\/button>/);
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
assert.match(source, /timelineMultiSelectedNodes\.clear\(\);[\s\S]*?datePlaybackFocusedEdges\.forEach/,
  'timeline transaction selection should update selected nodes');
assert.match(style, /\.graph-multi-selection-menu/);
assert.match(style, /\.graph-multi-selection-toggle\.is-active/);
assert.match(style, /\.graph-multi-selection-neighbors\.is-active/);
assert.match(style, /\.graph-multi-selection-focus\.is-active/);
assert.match(worker, /mina-graph-explorer-v202/);

console.log('Multi-selection tests passed');
