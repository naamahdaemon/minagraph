const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const start = source.indexOf('function setupInteractions()');
const end = source.indexOf('function setupSearch_old()', start);
assert.ok(start >= 0 && end > start, 'Interaction setup should exist');
const interactions = source.slice(start, end);

assert.match(interactions, /const isNativeTouchInteraction = event =>[\s\S]*?sourceCapabilities\?\.firesTouchEvents === true;/);
assert.match(interactions, /const isTouchCompatibilityClick = event =>[\s\S]*?Date\.now\(\) - lastGraphTouchAt < 800;/);
assert.match(interactions, /renderer\.on\("enterNode", \(\{ node, event \}\) => \{\s*\/\/[\s\S]*?if \(isTouchInteraction\(event\)\) return;/);
assert.match(interactions, /renderer\.on\("clickNode", \(\{ node, event \}\) => \{/);
assert.match(interactions, /let lastTouchNodeClick = \{ node: null, time: 0, source: null \};/);
assert.match(interactions, /if \(hasMoved \|\| suppressNodeClick \|\| !graph\.hasNode\(node\)\) return;/);
assert.match(interactions, /ignoreStageClickUntil = Date\.now\(\) \+ 150;/);
assert.match(interactions, /renderer\.on\("clickStage", \(\{ event \}\) => \{[\s\S]*?if \(Date\.now\(\) <= ignoreStageClickUntil\)/);
assert.match(interactions, /renderer\.on\("clickStage", \(\{ event \}\) => \{\s*if \(isFullscreen && fullscreenUiVisible\) \{\s*setFullscreenUiVisible\(false\);/);
assert.match(interactions, /isFullscreen &&[\s\S]*?isTouchInteraction\(event\) &&[\s\S]*?Date\.now\(\) - lastQualifiedGraphTouchTapAt < 300[\s\S]*?setFullscreenUiVisible\(true\);/);
assert.match(interactions, /selectedNode = node;\s*showNodePanel\(node\);/);
assert.match(interactions, /touchCompatibilityClick &&[\s\S]*?lastTouchNodeClick\.source === "native"[\s\S]*?now - lastTouchNodeClick\.time < 250/);
assert.match(interactions, /const isSecondTouchTap =[\s\S]*?lastTouchNodeClick\.node === node &&[\s\S]*?now - lastTouchNodeClick\.time < 1200/);
assert.match(interactions, /if \(isSecondTouchTap\) \{\s*showNodePanel\(node\);\s*\} else \{\s*setNodePanelOpen\(false\);\s*selectedNode = node;/);
assert.doesNotMatch(interactions, /if \(selectedNode === node\) \{\s*showNodePanel\(node\)/);
assert.match(interactions, /if \(getTouchCount\(event\) > 1\) \{\s*cancelDrag\(\);\s*return;\s*\}\s*if \(!isDragging/);
assert.doesNotMatch(interactions, /renderer\.on\("downNode"[\s\S]*?dragStartPos = \{ x: event\.x, y: event\.y \};\s*graph\.setNodeAttribute\(node, "highlighted", true\)/);
assert.match(interactions, /Math\.hypot\(dx, dy\) > 5[\s\S]*?graph\.setNodeAttribute\(draggedNode, "highlighted", true\)/);
assert.match(interactions, /renderer\.on\("upNode", endDrag\);\s*renderer\.on\("upStage", endDrag\);/);

const endDragStart = interactions.indexOf('const endDrag =');
const endDragEnd = interactions.indexOf('renderer.on("upNode"', endDragStart);
const endDrag = interactions.slice(endDragStart, endDragEnd);
assert.doesNotMatch(endDrag, /showNodePanel\(/, 'Drag completion must not open node details');
assert.match(endDrag, /if \(hasMoved\) \{\s*suppressNodeClick = true;/);
assert.doesNotMatch(endDrag, /animateLayout\(/, 'Dropping a node must preserve its manually chosen position');
assert.match(interactions, /if \(hasMoved\) \{\s*const pos = renderer\.viewportToGraph\(event\);/);

console.log('Node interaction tests passed');
