const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style', 'style.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.match(source, /const NODE_CUSTOM_COLORS = Object\.freeze\(\[/);
assert.equal((source.match(/value: "#[0-9a-f]{6}", label: "Flash /g) || []).length, 15);
assert.match(source, /function ensureNodeColorMenu\(\)/);
assert.match(source, /data-node-color-reset>Reset color/);
assert.match(source, /graph\.setNodeAttribute\(nodeColorMenuNode, "customColor", color\)/);
assert.match(source, /const NODE_CUSTOM_COLOR_STORAGE_KEY = "minagraph-node-custom-colors-v1"/);
assert.match(source, /function setPersistedNodeCustomColor\(node, color/);
assert.match(source, /function applyPersistedNodeCustomColor\(node\)/);
assert.match(source, /applyPersistedNodeCustomColor\(key\)/);
assert.match(source, /setPersistedNodeCustomColor\(nodeColorMenuNode, color\)/);
assert.match(source, /removePersistedNodeCustomColor\(nodeColorMenuNode\)/);
assert.match(source, /const customColor = data\.customColor \|\| getPersistedNodeCustomColor\(node\)/);
assert.match(source, /setPersistedNodeCustomColor\(n\.id, n\.customColor, \{ save: false \}\)/);
assert.match(source, /graph\.removeNodeAttribute\(nodeColorMenuNode, "customColor"\)/);
assert.match(source, /graph\.setNodeAttribute\(node, "color", customColor \|\| color\)/);
assert.match(source, /color: attr\.customColor \|\| attr\.originalColor \|\| attr\.color/);
assert.match(source, /if \(data\.customColor\) \{\s*glowColor = data\.customColor/);
assert.match(source, /renderer\.on\("rightClickNode"/);
assert.match(source, /if \(!isNativeTouchInteraction\(event\) && Number\.isInteger\(originalButton\) && originalButton !== 0\) \{\s*cancelDrag\(\);\s*return;/);
assert.match(source, /nodeLongPressTimer = setTimeout\([\s\S]*?showNodeColorMenu\(node, position\.x, position\.y\);[\s\S]*?}, 600\)/);
assert.match(source, /cancelNodeLongPress\(\);\s*hasMoved = true/);
assert.match(source, /suppressNodeClick = true;[\s\S]*?setTimeout\(\(\) => \{ suppressNodeClick = false; \}, 800\)/);
assert.match(css, /\.node-color-menu\s*\{/);
assert.match(css, /\.node-color-swatches\s*\{/);
assert.match(css, /grid-template-columns: repeat\(5, 1fr\)/);
assert.match(source, /id="node-color-filter-swatches"/);
assert.match(source, /const nodeColorFilter = new Set\(\)/);
assert.match(source, /const NODE_DEFAULT_COLOR_FILTER = "__default__"/);
assert.match(source, /function initializeNodeColorFilters\(\)/);
assert.match(source, /if \(nodeColorFilter\.has\(color\)\) nodeColorFilter\.delete\(color\)/);
assert.match(source, /else nodeColorFilter\.add\(color\)/);
assert.match(source, /function nodeMatchesActiveColorFilter\(node\)/);
assert.match(source, /nodeColorFilter\.has\(NODE_DEFAULT_COLOR_FILTER\)/);
assert.match(source, /edgeMatchesActiveColorFilter\(source, target\)/);
assert.match(source, /class="node-color-filter-default"/);
assert.match(source, />Default color<\/button>/);
assert.match(css, /\.node-color-filter-swatches\s*\{[\s\S]*?grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
assert.match(css, /\.node-color-filter-swatches \.node-color-filter-default\s*\{[\s\S]*?grid-column: 1 \/ -1/);
assert.match(html, /id="command-types" class="legend-pill-list"/);
assert.match(html, /id="blockchain-types" class="legend-pill-list"/);
assert.doesNotMatch(html, />● (?:Payment|Mina)</);
assert.match(css, /\.legend-pill-list\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /\.legend-pill-list > \.legend-item,\s*\.legend-pill-list > \.legend-chain\s*\{[^}]*border-radius: 7px;/);
assert.match(source, /Select one or more node colors\./);
assert.match(source, /mode === "incoming" \? "In" : mode === "outgoing" \? "Out" : "All"/);
assert.match(source, /function initializeLegendPillColors\(\)/);
assert.match(source, /item\.style\.setProperty\("--legend-pill-color", color\)/);
assert.match(css, /width: min\(250px, calc\(100vw - 16px\)\)/);
assert.match(css, /body\[data-theme="light"\] #legend\.legend-box\s*\{/);
assert.match(css, /body\[data-theme="light"\] \.legend-pill-list > \.legend-item\.active/);
assert.match(css, /background: var\(--legend-pill-color, #087da8\)/);
assert.match(css, /color: #fff !important;[\s\S]*?text-shadow: 0 1px 2px rgba\(0, 0, 0, 0\.72\)/);
assert.match(css, /\.legend-pill-list > \.legend-item\.active:hover/);
assert.match(css, /body\[data-theme="light"\] \.legend-pill-list > \.legend-item,[\s\S]*?background: #fff;[\s\S]*?box-shadow: none;/);
assert.match(css, /\.node-color-reset\s*\{/);
assert.match(worker, /mina-graph-explorer-v183/);

const persistenceStart = source.indexOf('const NODE_CUSTOM_COLOR_STORAGE_KEY');
const persistenceEnd = source.indexOf('function ensureNodeColorMenu');
const persistenceSource = source.slice(persistenceStart, persistenceEnd);
const storedValues = new Map();
const context = {
  console,
  localStorage: {
    getItem: key => storedValues.get(key) ?? null,
    setItem: (key, value) => storedValues.set(key, value),
  },
};
vm.runInNewContext(`${persistenceSource}\n;globalThis.persistenceApi = { setPersistedNodeCustomColor, getPersistedNodeCustomColor, removePersistedNodeCustomColor };`, context);
const evmAddress = '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD';
context.persistenceApi.setPersistedNodeCustomColor(evmAddress, '#FF1744');
assert.equal(context.persistenceApi.getPersistedNodeCustomColor(evmAddress.toLowerCase()), '#ff1744');
assert.match(storedValues.get('minagraph-node-custom-colors-v1'), /#ff1744/);
context.persistenceApi.removePersistedNodeCustomColor(evmAddress.toLowerCase());
assert.equal(context.persistenceApi.getPersistedNodeCustomColor(evmAddress), null);

console.log('Node color context menu tests passed');
