const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '..', 'style', 'style.css'), 'utf8');
const dateHelper = source.match(/function dateInputToUtcTimestamp\(value, endOfDay = false\) \{[\s\S]*?\n\}/)?.[0];
const timestampHelper = source.match(/function getTransactionTimestampMs\(transaction\) \{[\s\S]*?\n\}/)?.[0];

assert.ok(dateHelper, 'UTC date input helper should exist');
assert.ok(timestampHelper, 'Transaction timestamp helper should exist');

const context = {};
vm.runInNewContext(`${dateHelper}; ${timestampHelper}; result = { dateInputToUtcTimestamp, getTransactionTimestampMs };`, context);
assert.equal(context.result.dateInputToUtcTimestamp('2026-08-21'), Date.parse('2026-08-21T00:00:00.000Z'));
assert.equal(context.result.dateInputToUtcTimestamp('2026-08-21', true), Date.parse('2026-08-21T23:59:59.999Z'));
assert.equal(context.result.getTransactionTimestampMs({ timestamp: 1_700_000_000 }), 1_700_000_000_000);
assert.equal(context.result.getTransactionTimestampMs({ timestamp: '2026-08-21T12:00:00Z' }), Date.parse('2026-08-21T12:00:00Z'));

assert.match(source, /async function fetchMinaTransactions\(publicKey, limit\)/);
assert.match(source, /body: JSON\.stringify\(\{ publicKey, limit: pageSize, offset \}\)/);
assert.match(source, /options\.before = before/);
assert.match(source, /params\.set\("timestamp\.ge"/);
assert.match(source, /params\.set\("timestamp\.le"/);
assert.match(source, /async function getAlchemyBlockRange\(/);
assert.match(source, /action: "getblocknobytime"/);
assert.match(source, /cronos:\s*`https:\/\/explorer-api\.cronos\.org\/mainnet\/api\/v2`/);
assert.doesNotMatch(source, /api\.cronoscan\.com/);
assert.match(source, /transactions = filterTransactionsByFetchDateRange\(transactions\)/);
assert.match(html, /class="fetch-date-clear"[^>]+data-date-input="param-start-date"/);
assert.match(html, /class="fetch-date-clear"[^>]+data-date-input="param-end-date"/);
assert.match(source, /document\.querySelectorAll\("\.fetch-date-clear"\)[\s\S]*?input\.value = "";[\s\S]*?dispatchEvent\(new Event\("input"/);
assert.match(css, /\.fetch-date-input-row\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 38px;/);

console.log('Fetch date range tests passed');
