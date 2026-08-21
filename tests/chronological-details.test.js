const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');

assert.match(source, /let showNodeTransactionsChronologically = false/);
assert.match(source, /id="chronological-transactions-toggle"/);
assert.match(source, /function setNodeTransactionsChronological\(enabled\)/);
assert.match(source, /function renderChronologicalNodeTransactions\(visibleEdges, node\)/);
assert.match(source, /Number\(b\.tx\.timestamp \|\| 0\) - Number\(a\.tx\.timestamp \|\| 0\)/);
assert.match(source, /Show all transactions chronologically/);
assert.match(source, /Linked Node/);

console.log('Chronological details tests passed');
