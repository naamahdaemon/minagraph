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

console.log('Node exchange amount filter tests passed');
