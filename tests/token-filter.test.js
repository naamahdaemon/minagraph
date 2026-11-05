const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { Graph } = require('../libs/graphology.umd.min.js');
const source = fs.readFileSync(require('node:path').join(__dirname, '../scripts/script.js'), 'utf8');
const functions = [
  'getTransactionTokenKey', 'transactionMatchesTokenFilter', 'getTransactionTokenDescription',
  'transactionMatchesActiveLegendFilters', 'edgeMatchesSelectedNodeDirection',
  'edgeMatchesActiveViewWithoutMultiSelection', 'edgeMatchesActiveView',
  'nodeMatchesMinimumExchangeAmount', 'edgeMatchesMinimumExchangeAmount',
  'graphEdgeMatchesActiveView', 'getTransactionsVisibleInDateRange'
].map(name => {
  const match = source.match(new RegExp(`function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, name);
  return match[0];
}).join('\n');
const graph = new Graph({ multi: true });
['a', 'b', 'c'].forEach(node => graph.addNode(node));
const token = { blockchain: 'ethereum', label: 'token_transfer', token_contract: '0xABCD', token_symbol: 'USDC', timestamp: 100 };
graph.addEdgeWithKey('usdc', 'a', 'b', token);
graph.addEdgeWithKey('other-contract', 'a', 'b', { ...token, token_contract: '0x2222' });
graph.addEdgeWithKey('other-chain', 'a', 'b', { ...token, blockchain: 'base' });
graph.addEdgeWithKey('native', 'b', 'c', { blockchain: 'ethereum', label: 'payment', timestamp: 100 });
graph.addEdgeWithKey('outside', 'a', 'b', { ...token, timestamp: 300 });
const context = {
  graph, tokenFilter: new Set(), chainFilter: new Set(), currentRange: [0, 200],
  selectedNode: null, selectedNodeDirectionFilter: 'all', strictTouchFocusedNode: null,
  minimumNodeExchangeAmount: 0, nodeExchangeAmountTotals: new Map(),
  EVM_CHAIN_CONFIG: { ethereum: { label: 'Ethereum', nativeSymbol: 'ETH' }, base: { label: 'Base', nativeSymbol: 'ETH' } },
  isTokenMovement: type => ['token_transfer', 'token_mint', 'token_burn'].includes(type),
  getKnownTokenInfo: () => null,
  expandedCommandTypeFilter: () => new Set(),
  edgeMatchesMultiSelection: () => true, edgeMatchesActiveColorFilter: () => true,
  edgeMatchesStrictTouchFocus: () => true
};
vm.createContext(context);
vm.runInContext(functions, context);
const visible = () => Array.from(context.getTransactionsVisibleInDateRange());
assert.equal(visible().length, 4);
context.selectedNode = 'a';
assert.deepEqual(visible(), ['usdc', 'other-contract', 'other-chain'], 'Activity only includes operations sent or received by the selected node');
context.selectedNode = 'c';
assert.deepEqual(visible(), ['native'], 'The recipient is included even without outgoing transfers');
context.selectedNode = 'b';
assert.equal(visible().length, 4, 'Activity includes both incoming and outgoing operations');
graph.addEdgeWithKey('self', 'b', 'b', { blockchain: 'ethereum', label: 'payment', timestamp: 100 });
assert.equal(visible().filter(edge => edge === 'self').length, 1, 'Self-transfers are included exactly once');
graph.dropEdge('self');
context.selectedNode = null;
assert.equal(visible().length, 4, 'Deselecting restores all operations matching the other filters');
context.tokenFilter.add(context.getTransactionTokenKey(token));
assert.deepEqual(visible(), ['usdc'], 'Token selection must apply to Activity and distinguish contract and chain');
assert.equal(context.getTransactionTokenKey(token), context.getTransactionTokenKey({ ...token, token_contract: '0xabcd', token_symbol: 'renamed' }));
const solana = { ...token, blockchain: 'solana', token_contract: 'AbCd' };
assert.notEqual(context.getTransactionTokenKey(solana), context.getTransactionTokenKey({ ...solana, token_contract: 'abcd' }), 'Non-EVM addresses are case sensitive');
const tezos = { ...token, blockchain: 'tezos', token_contract: 'KT1abc', token_id: 0 };
assert.notEqual(context.getTransactionTokenKey(tezos), context.getTransactionTokenKey({ ...tezos, token_id: 1 }));
assert.notEqual(context.getTransactionTokenKey(tezos), context.getTransactionTokenKey({ ...tezos, token_id: null }));
assert.match(context.getTransactionTokenDescription(tezos).label, /#0/);
context.tokenFilter.add(context.getTransactionTokenKey(graph.getEdgeAttributes('native')));
assert.deepEqual(visible(), ['usdc', 'native'], 'Multiple selected assets use OR');
context.chainFilter.add('base');
assert.deepEqual(visible(), [], 'Asset and chain filters use AND');
context.chainFilter.clear();
context.expandedCommandTypeFilter = () => new Set(['payment']);
assert.deepEqual(visible(), ['native']);
context.expandedCommandTypeFilter = () => new Set();
context.selectedNode = 'b';
context.selectedNodeDirectionFilter = 'incoming';
assert.deepEqual(visible(), ['usdc']);
context.selectedNodeDirectionFilter = 'all';
context.edgeMatchesActiveColorFilter = () => false;
assert.deepEqual(visible(), [], 'Activity respects colors');
context.edgeMatchesActiveColorFilter = () => true;
context.edgeMatchesMultiSelection = () => false;
assert.deepEqual(visible(), [], 'Activity respects multiple selection');
context.edgeMatchesMultiSelection = () => true;
context.minimumNodeExchangeAmount = 10;
context.nodeExchangeAmountTotals = new Map([['a', 20], ['b', 20], ['c', 5]]);
assert.deepEqual(visible(), ['usdc'], 'Activity respects minimum exchange amount');
context.minimumNodeExchangeAmount = 0;
graph.setEdgeAttribute('usdc', 'searchHidden', true);
assert.deepEqual(visible(), ['native'], 'Activity respects edge search visibility');
graph.removeEdgeAttribute('usdc', 'searchHidden');
graph.setNodeAttribute('a', 'searchHidden', true);
assert.deepEqual(visible(), ['native'], 'Activity respects node search visibility');
graph.removeNodeAttribute('a', 'searchHidden');
graph.setEdgeAttribute('usdc', 'hidden', true);
assert.deepEqual(visible(), ['native'], 'Activity respects shared date visibility');
graph.removeEdgeAttribute('usdc', 'hidden');
context.strictTouchFocusedNode = 'a';
context.edgeMatchesStrictTouchFocus = edge => edge === 'usdc';
assert.deepEqual(visible(), ['usdc']);
// Exercise the actual controls with DOM elements that record their rendered
// text and handlers; metadata must never be inserted as HTML.
class Element {
  constructor() { this.children = []; this.attributes = {}; this.handlers = {}; this.value = ''; }
  append(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, handler) { this.handlers[key] = handler; }
}
const elements = Object.fromEntries(['search', 'results', 'selected', 'status', 'clear'].map(id => [`token-filter-${id}`, new Element()]));
context.document = { getElementById: id => elements[id], createElement: () => new Element() };
context.tokenFilterCatalog = new Map();
context.tokenFilterCatalogSignature = '';
let refreshes = 0;
context.refreshLegendFilteredViews = () => refreshes++;
context.tokenFilter.clear();
const uiFunctions = ['syncTokenFilterCatalog', 'renderTokenFilterControls', 'initializeTokenFilter'].map(name => source.match(new RegExp(`function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n\\}`))[0]).join('\n');
vm.runInContext(uiFunctions, context);
context.initializeTokenFilter();
assert.equal(elements['token-filter-results'].children.length, 4, 'Repeated transfers must produce one option per asset');
elements['token-filter-search'].value = '0xABCD';
elements['token-filter-search'].handlers.input();
assert.equal(elements['token-filter-results'].children.length, 2, 'Contract search can find the asset on different networks');
const option = elements['token-filter-results'].children.find(button => button.textContent.includes('Ethereum'));
option.handlers.click();
assert.equal(context.tokenFilter.size, 1);
assert.equal(elements['token-filter-selected'].children.length, 1);
assert.equal(refreshes, 1);
elements['token-filter-selected'].children[0].handlers.click();
assert.equal(context.tokenFilter.size, 0);
option.handlers.click();
elements['token-filter-clear'].handlers.click();
assert.equal(context.tokenFilter.size, 0);
assert.equal(elements['token-filter-search'].value, '');
assert.equal(elements['token-filter-clear'].disabled, true);
graph.addEdgeWithKey('untrusted-name', 'a', 'b', { ...token, token_contract: '0x4444', token_symbol: '<img src=x onerror=alert(1)>' });
context.syncTokenFilterCatalog();
assert.equal(elements['token-filter-results'].children.length, 5, 'Loading new assets updates the available options');
assert.ok(elements['token-filter-results'].children.some(button => button.textContent.includes('<img src=x onerror=alert(1)>')));
assert.ok(elements['token-filter-results'].children.every(button => button.innerHTML === undefined), 'Names are rendered as text');
console.log('Token filter controls and Activity shared filtering tests passed');

// A tap must preserve native disclosure activation; dragging from the same
// title must move the panel and suppress only the click after that gesture.
const dragSource = source.slice(source.indexOf('  const startDrag = (e) => {'), source.indexOf('  // Filter sections use native details/summary'));
const events = {};
const legendEvents = {};
const dragContext = {
  legend: { offsetLeft: 50, offsetTop: 70, style: {}, addEventListener: (name, handler) => { legendEvents[name] = handler; } },
  document: { addEventListener: (name, handler) => { events[name] = handler; } },
  isDragging: false, suppressLegendClick: false,
  offsetX: 0, offsetY: 0, dragStartX: 0, dragStartY: 0
};
vm.createContext(dragContext);
vm.runInContext(dragSource, dragContext);
let prevented = false;
const event = (selector, x = 10, y = 20) => ({
  touches: [{ clientX: x, clientY: y }], cancelable: true,
  target: { closest: selectors => selectors.split(',').map(value => value.trim()).includes(selector) },
  preventDefault() { prevented = true; },
  stopImmediatePropagation() { this.stopped = true; }
});
for (const selector of ['.legend-toggle', '.legend-item', '.legend-chain', 'background']) {
  prevented = false;
  legendEvents.touchstart(event(selector));
  events.touchmove(event(selector, 12, 22));
  events.touchend();
  const tap = event(selector);
  legendEvents.click(tap);
  assert.equal(prevented, false, 'Small finger movements must preserve a tap');
  assert.equal(tap.stopped, undefined);
  legendEvents.touchstart(event(selector));
  events.touchmove(event(selector, 30, 50));
  assert.equal(prevented, true, 'A drag cancels native scrolling');
  assert.equal(dragContext.legend.style.left, '70px');
  assert.equal(dragContext.legend.style.top, '100px');
  events.touchend();
  const click = event(selector);
  legendEvents.click(click);
  assert.equal(click.stopped, true, 'A drag must not toggle its starting section or filter');
}
for (const selector of ['input', 'button', '#token-filter']) {
  dragContext.isDragging = false;
  dragContext.suppressLegendClick = true;
  legendEvents.touchstart(event(selector));
  assert.equal(dragContext.isDragging, false, 'Editing and token-list scrolling remain available');
  assert.equal(dragContext.suppressLegendClick, false, 'A fresh touch must never inherit click suppression from an earlier drag');
}
console.log('Filter panel tap and drag gesture tests passed');
