const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
assert.match(source, /function edgeMatchesTimelineSelection\(edge\) \{\s*return datePlaybackFocusedEdges\.size === 0 \|\| datePlaybackFocusedEdges\.has\(edge\);\s*\}/);
assert.match(source, /graphEdgeMatchesActiveView\(edge, node\) && edgeMatchesTimelineSelection\(edge\)/);
assert.match(source, /timelineEdges: \[\.\.\.datePlaybackFocusedEdges\]\.sort\(\)/);
assert.match(source, /nodeColors: \[\.\.\.nodeColorFilter\]\.sort\(\)/);
assert.match(source, /function focusDatePlaybackTransaction\(edge\)[\s\S]*?refreshSelectedNodePanelIfOpen\(\);/);
const helper = source.match(/function transactionMatchesActiveLegendFilters\(transaction\) \{[\s\S]*?\n\}/)?.[0];
const directionHelper = source.match(/function edgeMatchesSelectedNodeDirection\(source, target, referenceNode = selectedNode\) \{[\s\S]*?\n\}/)?.[0];
const activeViewHelper = source.match(/function edgeMatchesActiveView\(attributes, source, target, referenceNode = selectedNode\) \{[\s\S]*?\n\}/)?.[0];

assert.ok(helper, 'Shared legend filter helper should exist');
assert.ok(directionHelper, 'Shared selected-node direction helper should exist');
assert.ok(activeViewHelper, 'Shared edge visibility helper should exist');
assert.match(source, /graph\.edges\(node\)\.filter\(edge =>\s*graphEdgeMatchesActiveView\(edge, node\)/);
assert.match(source, /function refreshLegendFilteredViews\(\)/);
assert.match(source, /showNodePanel\(selectedNode, false\)/);

const context = {
  expandedCommandTypeFilter: () => new Set(),
  chainFilter: new Set()
};
vm.runInNewContext(`${helper}; result = transactionMatchesActiveLegendFilters;`, context);

assert.equal(context.result({ command_type: 'payment', blockchain: 'mina' }), true);

context.expandedCommandTypeFilter = () => new Set(['payment', 'transfer']);
assert.equal(context.result({ command_type: 'transfer', blockchain: 'ethereum' }), true);
assert.equal(context.result({ command_type: 'delegation', blockchain: 'mina' }), false);

context.chainFilter.add('mina');
assert.equal(context.result({ command_type: 'payment', blockchain: 'mina' }), true);
assert.equal(context.result({ command_type: 'payment', blockchain: 'ethereum' }), false);

const activeViewContext = {
  transactionMatchesActiveLegendFilters: () => true,
  edgeMatchesActiveColorFilter: () => true,
  selectedNode: 'selected',
  selectedNodeDirectionFilter: 'all'
};
vm.runInNewContext(`${directionHelper}; ${activeViewHelper}; result = edgeMatchesActiveView;`, activeViewContext);
assert.equal(activeViewContext.result({ hidden: false, blockchain: 'avalanche' }, 'sender', 'selected'), true);
assert.equal(activeViewContext.result({ blockchain: 'linea' }, 'selected', 'receiver'), true);
assert.equal(activeViewContext.result({ hidden: true, blockchain: 'scroll' }, 'sender', 'selected'), false);

activeViewContext.selectedNodeDirectionFilter = 'incoming';
assert.equal(activeViewContext.result({ hidden: false }, 'sender', 'selected'), true);
assert.equal(activeViewContext.result({ hidden: false }, 'selected', 'receiver'), false);

activeViewContext.selectedNodeDirectionFilter = 'outgoing';
assert.equal(activeViewContext.result({ hidden: false }, 'selected', 'receiver'), true);
assert.equal(activeViewContext.result({ hidden: false }, 'sender', 'selected'), false);

console.log('Node details legend filter tests passed');
