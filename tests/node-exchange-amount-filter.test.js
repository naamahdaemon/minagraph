const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const style = fs.readFileSync(path.resolve(__dirname, '..', 'style', 'style.css'), 'utf8');

assert.match(html, /id="minimum-node-exchange-amount"[^>]*inputmode="decimal"/);
assert.match(script, /const amount = Math\.abs\(getEdgeTransferredAmount\(attributes\)\)/);
assert.match(script, /if \(!edgeMatchesActiveView\(attributes, source, target, referenceNode\)\) return;/);
assert.match(script, /nodeExchangeAmountTotals\.set\(source,[\s\S]*?nodeExchangeAmountTotals\.set\(target,/);
assert.match(script, /function graphEdgeMatchesActiveView[\s\S]*?edgeMatchesMinimumExchangeAmount\(source, target\)/);
assert.match(script, /function rebuildVisibleGraphMetrics\(\) \{\s*rebuildNodeExchangeAmountTotals\(\);/);
assert.match(script, /minimumNodeExchangeAmount = 0;[\s\S]*?amountInput\.value = "";/);
assert.match(style, /\.node-amount-filter-control\.active input/);

const vm = require('node:vm');
const { Graph } = require('../libs/graphology.umd.min.js');
const names = ['edgeMatchesSelectedNodeDirection', 'edgeMatchesActiveViewWithoutMultiSelection',
  'edgeMatchesActiveView', 'nodeMatchesMinimumExchangeAmount', 'edgeMatchesMinimumExchangeAmount',
  'rebuildNodeExchangeAmountTotals', 'graphEdgeMatchesActiveView', 'getDatePlaybackFocus',
  'focusDatePlaybackTransaction', 'getTransactionsVisibleInDateRange', 'setMinimumNodeExchangeAmount'];
const helpers = names.map(name => {
  const match = script.match(new RegExp(`function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, name);
  return match[0];
}).join('\n');
const graph = new Graph({ multi: true });
['a', 'b', 'c', 'd'].forEach(node => graph.addNode(node));
graph.addEdgeWithKey('small', 'a', 'b', { amount: 6, timestamp: 100 });
graph.addEdgeWithKey('second', 'b', 'a', { amount: 7, timestamp: 100 });
graph.addEdgeWithKey('large', 'a', 'b', { amount: 500, timestamp: 100 });
graph.addEdgeWithKey('unrelated', 'c', 'd', { amount: 600, timestamp: 100 });
const input = { closest: () => ({ classList: { toggle() {} } }), setAttribute() {} };
const context = {
  graph, minimumNodeExchangeAmount: 0, nodeExchangeAmountTotals: new Map(),
  selectedNode: 'a', strictTouchFocusedNode: null, selectedNodeDirectionFilter: 'all',
  currentRange: [0, 200], datePlaybackFocusedEdges: new Set(),
  timelineMultiSelectedNodes: new Set(), multiSelectionEnabled: false,
  document: { getElementById: () => input, querySelectorAll: () => [] },
  transactionMatchesActiveLegendFilters: () => true,
  edgeMatchesActiveColorFilter: () => true, edgeMatchesMultiSelection: () => true,
  getEdgeTransferredAmount: attributes => attributes.amount,
  startDatePlaybackFlash() {}, stopDatePlaybackFlash() {}, renderer: { refresh() {} }
};
vm.createContext(context);
vm.runInContext(helpers, context);
let activity;
context.rebuildVisibleGraphMetrics = () => context.rebuildNodeExchangeAmountTotals();
context.refreshSelectedNodePanelIfOpen = () => { activity = Array.from(context.getTransactionsVisibleInDateRange()); };
context.refreshLegendFilteredViews = () => {
  context.rebuildVisibleGraphMetrics();
  context.refreshSelectedNodePanelIfOpen();
};
for (const value of ['', '0', '10', '0', '']) {
  context.datePlaybackFocusedEdges.clear();
  context.setMinimumNodeExchangeAmount(value);
  assert.deepEqual(activity, ['small', 'second', 'large']);
  const totalsBefore = [...context.nodeExchangeAmountTotals];
  context.focusDatePlaybackTransaction('large');
  assert.equal(context.getDatePlaybackFocus().edges.has('large'), true, `Keep a highlighted large transaction with input '${value}'`);
  assert.deepEqual([...context.nodeExchangeAmountTotals], totalsBefore, 'Highlighting must not recalculate totals from its own subset');
  assert.deepEqual(activity, ['small', 'second', 'large']);
  context.focusDatePlaybackTransaction('large');
  assert.equal(context.getDatePlaybackFocus(), null);
  context.focusDatePlaybackTransaction('small');
  assert.equal(context.getDatePlaybackFocus().edges.has('small'), true, 'A small transfer still qualifies through its nodes cumulative total');
  assert.equal(context.graphEdgeMatchesActiveView('small'), true);
  context.focusDatePlaybackTransaction('small');
}
context.setMinimumNodeExchangeAmount('10');
graph.setEdgeAttribute('large', 'hidden', true);
context.rebuildVisibleGraphMetrics();
assert.equal(context.nodeExchangeAmountTotals.get('a'), 13, 'Amount totals still respect date visibility');
context.focusDatePlaybackTransaction('small');
assert.equal(context.getDatePlaybackFocus().edges.has('small'), true, 'Highlighting preserves a cumulative threshold even when the individual transfer is below it');
assert.equal(context.nodeExchangeAmountTotals.get('a'), 13);
console.log('Node exchange amount filter and Activity focus regression tests passed');
