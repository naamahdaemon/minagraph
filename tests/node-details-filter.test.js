const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const helper = source.match(/function transactionMatchesActiveLegendFilters\(transaction\) \{[\s\S]*?\n\}/)?.[0];
const activeViewHelper = source.match(/function edgeMatchesActiveView\(attributes\) \{[\s\S]*?\n\}/)?.[0];

assert.ok(helper, 'Shared legend filter helper should exist');
assert.ok(activeViewHelper, 'Shared edge visibility helper should exist');
assert.match(source, /graph\.edges\(node\)\.filter\(edge =>\s*edgeMatchesActiveView\(graph\.getEdgeAttributes\(edge\)\)/);
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
  transactionMatchesActiveLegendFilters: () => true
};
vm.runInNewContext(`${activeViewHelper}; result = edgeMatchesActiveView;`, activeViewContext);
assert.equal(activeViewContext.result({ hidden: false, blockchain: 'avalanche' }), true);
assert.equal(activeViewContext.result({ blockchain: 'linea' }), true);
assert.equal(activeViewContext.result({ hidden: true, blockchain: 'scroll' }), false);

console.log('Node details legend filter tests passed');
