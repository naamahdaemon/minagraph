const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style', 'style.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.match(source, /const NODE_CUSTOM_COLORS = Object\.freeze\(\[/);
assert.equal((source.match(/value: "#[0-9a-f]{6}", label: "Flash /g) || []).length, 5);
assert.match(source, /function ensureNodeColorMenu\(\)/);
assert.match(source, /data-node-color-reset>Reset color/);
assert.match(source, /graph\.setNodeAttribute\(nodeColorMenuNode, "customColor", color\)/);
assert.match(source, /graph\.removeNodeAttribute\(nodeColorMenuNode, "customColor"\)/);
assert.match(source, /graph\.setNodeAttribute\(node, "color", data\.customColor \|\| color\)/);
assert.match(source, /color: attr\.customColor \|\| attr\.originalColor \|\| attr\.color/);
assert.match(source, /if \(data\.customColor\) \{\s*glowColor = data\.customColor/);
assert.match(source, /renderer\.on\("rightClickNode"/);
assert.match(source, /if \(!isNativeTouchInteraction\(event\) && Number\.isInteger\(originalButton\) && originalButton !== 0\) \{\s*cancelDrag\(\);\s*return;/);
assert.match(source, /nodeLongPressTimer = setTimeout\([\s\S]*?showNodeColorMenu\(node, position\.x, position\.y\);[\s\S]*?}, 600\)/);
assert.match(source, /cancelNodeLongPress\(\);\s*hasMoved = true/);
assert.match(source, /suppressNodeClick = true;[\s\S]*?setTimeout\(\(\) => \{ suppressNodeClick = false; \}, 800\)/);
assert.match(css, /\.node-color-menu\s*\{/);
assert.match(css, /\.node-color-swatches\s*\{/);
assert.match(css, /\.node-color-reset\s*\{/);
assert.match(worker, /mina-graph-explorer-v121/);

console.log('Node color context menu tests passed');
