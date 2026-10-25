const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const helper = script.match(/function normalizeEdgeVisualMetric\(value, minimum, maximum\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(helper, 'Edge metric normalizer should exist');
const context = {
  MIN_WEIGHTED_EDGE_SIZE: 0.8,
  MAX_WEIGHTED_EDGE_SIZE: 4,
  Number,
  Math
};
vm.createContext(context);
vm.runInContext(helper, context);

assert.equal(context.normalizeEdgeVisualMetric(1, 1, 100), 0.8);
assert.equal(context.normalizeEdgeVisualMetric(100, 1, 100), 4);
const middle = context.normalizeEdgeVisualMetric(10, 1, 100);
assert.ok(middle > 0.8 && middle < 4, 'Logarithmic intermediate sizes should stay bounded');
assert.equal(context.normalizeEdgeVisualMetric(0, 1, 100), 0.8);

const amountHelper = script.match(/function normalizeLayoutAmountMetric\(value, minimum, maximum, influence\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(amountHelper, 'Amount layout normalizer should exist');
vm.runInContext(amountHelper, context);
assert.equal(context.normalizeLayoutAmountMetric(1, 1, 100, 0.35), 1);
assert.equal(context.normalizeLayoutAmountMetric(100, 1, 100, 0.35), 1.35);
assert.equal(context.normalizeLayoutAmountMetric(100, 100, 100, 0.35), 1);
const middleLayoutWeight = context.normalizeLayoutAmountMetric(10, 1, 100, 0.35);
assert.ok(middleLayoutWeight > 1 && middleLayoutWeight < 1.35);

assert.match(html, /id="edge-thickness-mode"[\s\S]*?value="uniform"[\s\S]*?value="transactions"[\s\S]*?value="amount"/);
assert.match(html, /id="layout-amount-weight-enabled"/);
assert.match(html, /id="layout-amount-weight-influence"[^>]*min="0"[^>]*max="100"/);
assert.match(script, /AMOUNT_WEIGHTED_LAYOUT_STORAGE_KEY = "minagraph-layout-amount-weighting"/);
assert.match(script, /weight: amountWeightedLayout[\s\S]*?graph\.getEdgeAttribute\(id, "weight"\) \?\? 1/,
  'Disabled mode must preserve the original edge weight path');
assert.match(script, /EDGE_THICKNESS_STORAGE_KEY = "minagraphEdgeThicknessMode"/);
assert.match(script, /function rebuildEdgeVisualSizes\(visibleEdges = getRenderedEdgeRecords\(\)\)/);
assert.match(script, /function rebuildNodeVisualSizes\(visibleEdges = getRenderedEdgeRecords\(\)\)/);
assert.match(script, /function calculateDensityAwareNodeSize\(degree, nodeCount\)/);
assert.match(script, /nodeVisualSizes\.set\(node, calculateDensityAwareNodeSize\(visibleDegrees\.get\(node\) \|\| 0, visibleNodeCount\)\)/);
assert.match(script, /const defaultSize = \(nodeVisualSizes\.get\(node\) \?\? data\.size \?\? 5\)/);
assert.match(script, /getEdgeRelationKey\(source, target\)/);
assert.match(script, /getEdgeAssetKey\(attributes\)/);
assert.match(script, /if \(!\["payment", "transfer"\]\.includes\(command\)\) return 0;/);
assert.match(script, /size: isFocusEdge \? Math\.max\(1\.5, visualSize \* 1\.35\) : 0\.4/);
assert.match(script, /size: visualSize/);
assert.match(script, /function applyDateFilter\(\)[\s\S]*?rebuildVisibleGraphMetrics\(\);/);

console.log('Edge thickness tests passed');
