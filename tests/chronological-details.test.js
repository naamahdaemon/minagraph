const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');

assert.match(source, /let showNodeTransactionsChronologically = false/);
assert.match(source, /id="chronological-transactions-toggle"/);
assert.match(source, /function setNodeTransactionsChronological\(enabled\)/);
assert.match(source, /function renderChronologicalNodeTransactions\(visibleEdges, node\)/);
assert.match(source, /function sortNodeTransactions\(items, node\)/);
assert.match(source, /function setNodeTransactionSort\(column\)/);
assert.match(source, /NODE_TRANSACTION_SORT_STORAGE_KEY/);
assert.match(source, /renderSortableTransactionHeader\("timestamp", "Timestamp"/);
assert.match(source, /aria-sort=/);
assert.match(source, /function getNodeTransactionDirection\(tx, node\)/);
assert.match(source, /formatSignedNodeTransactionAmount\(tx, node\)/);
assert.match(source, /sortNodeTransactions\(interactions, node\)/);
assert.match(source, /Show all transactions chronologically/);
assert.match(source, /Linked Node/);

const addressHelper = source.match(/function addressesMatchForTransaction\(left, right\) \{[\s\S]*?\n\}/)?.[0];
const directionHelper = source.match(/function getNodeTransactionDirection\(tx, node\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(addressHelper && directionHelper, 'Transaction direction helpers should exist');
const context = {};
require('node:vm').runInNewContext(`${addressHelper}; ${directionHelper}; result = getNodeTransactionDirection;`, context);
assert.equal(context.result({ sender_key: 'B62sender', receiver_key: 'B62receiver' }, 'B62sender'), -1);
assert.equal(context.result({ sender_key: 'B62sender', receiver_key: 'B62receiver' }, 'B62receiver'), 1);
assert.equal(context.result({ sender_key: '0xABC', receiver_key: '0xDEF' }, '0xabc'), -1);
assert.equal(context.result({ sender_key: 'tz1self', receiver_key: 'tz1self' }, 'tz1self'), 0);
assert.equal(context.result({ sender_key: 'sender', receiver_key: 'receiver' }, 'unknown'), null);

console.log('Chronological details tests passed');
