const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const profileHelpers = source.match(/function getFetchProfileSignature\(chain, rootKey, depth\) \{[\s\S]*?function removeFetchProfile\(chain, normalizedKey, signature\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(profileHelpers, 'Incremental fetch profile helpers should exist');

const context = {
  JSON,
  Math,
  Number,
  Map,
  Set,
  fetchProfilesByChain: new Map(),
  FIRST_ITERATION_LIMIT: 100,
  LIMIT: 20,
  FETCH_START_TIMESTAMP: null,
  FETCH_END_TIMESTAMP: null,
  normalizeAddressForChain: value => String(value).toLowerCase()
};
vm.createContext(context);
vm.runInContext(`${profileHelpers}; result = { getFetchProfileSignature, hasFetchProfile, addFetchProfile, removeFetchProfile };`, context);

const initial = context.result.getFetchProfileSignature('polygon', '0xABC', 2);
context.result.addFetchProfile('polygon', '0xabc', initial);
assert.equal(context.result.hasFetchProfile('polygon', '0xabc', initial), true);

context.FIRST_ITERATION_LIMIT = 1000;
const largerLimit = context.result.getFetchProfileSignature('polygon', '0xABC', 2);
assert.notEqual(largerLimit, initial, 'Increasing the root limit must create a new fetch profile');
assert.equal(context.result.hasFetchProfile('polygon', '0xabc', largerLimit), false);

context.FIRST_ITERATION_LIMIT = 100;
context.FETCH_START_TIMESTAMP = Date.UTC(2026, 0, 1);
const dated = context.result.getFetchProfileSignature('polygon', '0xABC', 2);
assert.notEqual(dated, initial, 'Changing the date range must create a new fetch profile');

context.FETCH_START_TIMESTAMP = null;
const deeper = context.result.getFetchProfileSignature('polygon', '0xABC', 3);
assert.notEqual(deeper, initial, 'Changing recursion depth must create a new fetch profile');

const fetchFunction = source.slice(source.indexOf('async function fetchTransactionsForKey('), source.indexOf('async function buildGraphRecursively('));
assert.doesNotMatch(fetchFunction, /if \(visitedForChain\.has\(normalizedKey\)\) return \[\]/);
assert.match(fetchFunction, /visitedForChain\.add\(normalizedKey\)/);
assert.match(source, /hasFetchProfile\(chain, normalizedKey, profileSignature\)/);
assert.match(source, /buildGraphRecursively\(k, depth - 1, level \+ 1, chain, profileSignature\)/);
assert.match(source, /fetchProfilesByChain\.clear\(\)/);
assert.match(source, /let nodeFetchCoverageByChain = new Map\(\)/);
assert.match(source, /function getNodeFetchCoverageSignature\(chain, limit\)/);
assert.match(source, /addNodeFetchCoverage\([\s\S]*?getNodeFetchCoverageSignature\(chain, limit\)/);
assert.match(source, /const chainsToFetch = compatibleChains\.filter\(chain =>/);
assert.match(source, /return !hasNodeFetchCoverage\(chain, normalizedNode, coverageSignature\)/);
assert.match(source, /nodeFetchCoverageByChain\.clear\(\)/);
assert.match(source, /const refreshNodeFetchAvailability = \(\) =>/);

console.log('Incremental fetch profile tests passed');
