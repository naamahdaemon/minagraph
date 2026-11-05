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

// Touching a section title must preserve the browser's synthetic click.
// Only the panel background starts a drag and cancels the default gesture.
const dragHandler = source.match(/const startDrag = \(e\) => \{[\s\S]*?\n  \};/)[0];
const dragContext = { legend: { offsetLeft: 0, offsetTop: 0, style: {} }, isDragging: false };
vm.createContext(dragContext);
vm.runInContext(`${dragHandler}; this.startDrag = startDrag;`, dragContext);
let prevented = false;
const touchEvent = selector => ({
  type: 'touchstart', cancelable: true, touches: [{ clientX: 10, clientY: 20 }],
  target: { closest: selectors => selectors.split(',').map(value => value.trim()).includes(selector) },
  preventDefault() { prevented = true; }
});
for (const selector of ['.legend-toggle', '.legend-item', '.legend-chain', '.legend-node-color', '#token-filter', 'input', 'button']) {
  dragContext.startDrag(touchEvent(selector));
  assert.equal(prevented, false, `${selector} must still receive a click after touch`);
  assert.equal(dragContext.isDragging, false);
}
dragContext.startDrag(touchEvent('background'));
assert.equal(prevented, true);
assert.equal(dragContext.isDragging, true);
console.log('Filter section touch interaction tests passed');
