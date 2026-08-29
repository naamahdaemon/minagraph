const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const start = source.indexOf('function setupInteractions()');
const end = source.indexOf('function setupSearch_old()', start);
assert.ok(start >= 0 && end > start, 'Interaction setup should exist');
const interactions = source.slice(start, end);

assert.match(interactions, /renderer\.on\("clickNode", \(\{ node \}\) => \{/);
assert.match(interactions, /sigmaMultiTouchGestureActive \|\|\s*Date\.now\(\) <= sigmaIgnoreNodeClickUntil/);
assert.match(interactions, /event\.touches\.length < 2/);
assert.match(interactions, /sigmaIgnoreNodeClickUntil = Date\.now\(\) \+ 500/);
assert.match(interactions, /addEventListener\("touchstart", markMultiTouch/);
assert.match(interactions, /addEventListener\("touchmove", markMultiTouch/);
assert.match(interactions, /addEventListener\("touchend", finishMultiTouch/);
assert.match(interactions, /ignoreStageClickUntil = Date\.now\(\) \+ 150;/);
assert.match(interactions, /renderer\.on\("clickStage", \(\) => \{\s*if \(Date\.now\(\) <= ignoreStageClickUntil\)/);
assert.match(interactions, /selectedNode = node;\s*showNodePanel\(node\);/);
assert.doesNotMatch(interactions, /renderer\.on\("downNode"[\s\S]*?dragStartPos = \{ x: event\.x, y: event\.y \};\s*graph\.setNodeAttribute\(node, "highlighted", true\)/);
assert.match(interactions, /Math\.hypot\(dx, dy\) > 5[\s\S]*?graph\.setNodeAttribute\(draggedNode, "highlighted", true\)/);
assert.match(interactions, /renderer\.on\("upNode", endDrag\);\s*renderer\.on\("upStage", endDrag\);/);

const endDragStart = interactions.indexOf('const endDrag =');
const endDragEnd = interactions.indexOf('renderer.on("upNode"', endDragStart);
const endDrag = interactions.slice(endDragStart, endDragEnd);
assert.doesNotMatch(endDrag, /showNodePanel\(/, 'Drag completion must not open node details');
assert.match(endDrag, /if \(hasMoved && !sigmaMultiTouchGestureActive && Date\.now\(\) > sigmaIgnoreNodeClickUntil\) \{\s*suppressNodeClick = true;/);
assert.match(interactions, /if \(hasMoved\) \{\s*const pos = renderer\.viewportToGraph\(event\);/);

console.log('Node interaction tests passed');
