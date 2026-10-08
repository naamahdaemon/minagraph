const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style', 'style.css'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.match(html, /id="node-direction-types"/);
assert.match(html, /data-node-direction="all"/);
assert.match(html, /data-node-direction="incoming"/);
assert.match(html, /data-node-direction="outgoing"/);
assert.doesNotMatch(html, /data-node-direction="(?:incoming|outgoing)"[^>]*disabled/);
assert.match(css, /\.node-direction-filter\s*\{/);
assert.match(source, /let selectedNodeDirectionFilter = "all"/);
assert.match(source, /function edgeMatchesSelectedNodeDirection\(source, target, referenceNode = selectedNode\)/);
assert.match(source, /selectedNodeDirectionFilter === "incoming"\) return target === referenceNode/);
assert.match(source, /selectedNodeDirectionFilter === "outgoing"\) return source === referenceNode/);
assert.match(source, /if \(!nodeMatchesSelectedNodeDirection\(node\)\) return \{ \.\.\.data, hidden: true \}/);
assert.match(source, /if \(!edgeMatchesSelectedNodeDirection\(source, target\)\) return \{ \.\.\.data, hidden: true \}/);
assert.match(source, /graphEdgeMatchesActiveView\(edge, node\)/);
assert.match(source, /selectedNodeDirectionFilter = "all";[\s\S]*?syncNodeDirectionFilterControls\(\)/);
assert.doesNotMatch(source, /if \(mode !== "all" && \(!selectedNode/);
assert.match(source, /if \(!referenceNode \|\| selectedNodeDirectionFilter === "all"\) return true/);
assert.match(worker, /mina-graph-explorer-v117/);

console.log('Selected-node direction filter tests passed');
