const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const searchStart = source.indexOf('function handleSearch(query)');
const searchEnd = source.indexOf('async function main', searchStart);
assert.ok(searchStart >= 0 && searchEnd > searchStart, 'Search handler should exist');
const searchHandler = source.slice(searchStart, searchEnd);

assert.match(source, /let searchDirectlyMatchedNodes = new Set\(\);/);
assert.match(searchHandler, /graph\.setNodeAttribute\(n, "searchHidden", !visibleNodes\.has\(n\)\)/);
assert.match(searchHandler, /graph\.setEdgeAttribute\(e, "searchHidden", !visibleEdges\.has\(e\)\)/);
assert.match(searchHandler, /graph\.removeNodeAttribute\(n, "searchHidden"\)/);
assert.match(searchHandler, /graph\.removeEdgeAttribute\(e, "searchHidden"\)/);
assert.doesNotMatch(searchHandler, /renderer\.setSetting\("nodeReducer"/,
  'search must not replace the shared reducer and disable graph interactions');
assert.match(source, /if \(searchDirectlyMatchedNodes\.has\(node\)\) \{[\s\S]*?label: renderedLabel[\s\S]*?highlighted: true/,
  'matched nodes should use the shared favorite-enriched label');
assert.match(source, /if \(data\.searchHidden === true\) return \{ \.\.\.data, hidden: true \};/);
assert.match(source, /attributes\?\.searchHidden !== true/,
  'search visibility should intersect with the other active filters');
assert.match(source, /const favName = getFavoriteName\(node, primaryChain\) \|\| getFavoriteName\(node\);/,
  'favorite labels should remain available when the matching favorite belongs to another loaded chain');

console.log('Search interaction tests passed');
