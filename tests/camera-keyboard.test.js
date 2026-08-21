const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');

assert.match(html, /id="sigma-container"[^>]*tabindex="0"/);
assert.match(script, /function handleGraphKeyboardNavigation\(event\)/);
assert.match(script, /document\.activeElement !== sigmaContainer/);
assert.match(script, /event\.shiftKey/);
assert.match(script, /event\.key\.toLowerCase\(\) === "c"/);
assert.match(script, /centerGraphInViewport\(\)/);
assert.match(script, /function calculateNormalizedCenter\(allPositions, visiblePositions\)/);
assert.match(script, /sidePanel\?\.classList\.contains\("open"\)/);
assert.match(script, /recenterAfterLayout/);
assert.match(script, /ArrowLeft/);
assert.match(script, /ArrowRight/);
assert.match(script, /ArrowUp/);
assert.match(script, /ArrowDown/);
assert.match(script, /sigmaContainer\.addEventListener\("pointerdown"/);

const helperMatch = script.match(/function getRotatedPanDelta\(key, step, angle\) \{[\s\S]*?\n\}/);
assert.ok(helperMatch, 'Rotated pan helper should exist');
const context = {};
require('node:vm').runInNewContext(`${helperMatch[0]}; result = getRotatedPanDelta;`, context);

const unrotatedUp = context.result('ArrowUp', 1, 0);
assert.ok(Math.abs(unrotatedUp.x) < 1e-12);
assert.ok(Math.abs(unrotatedUp.y + 1) < 1e-12);

const unrotatedLeft = context.result('ArrowLeft', 1, 0);
assert.ok(Math.abs(unrotatedLeft.x - 1) < 1e-12);
assert.ok(Math.abs(unrotatedLeft.y) < 1e-12);

const unrotatedRight = context.result('ArrowRight', 1, 0);
assert.ok(Math.abs(unrotatedRight.x + 1) < 1e-12);
assert.ok(Math.abs(unrotatedRight.y) < 1e-12);

const quarterTurnUp = context.result('ArrowUp', 1, Math.PI / 2);
assert.ok(Math.abs(quarterTurnUp.x - 1) < 1e-12);
assert.ok(Math.abs(quarterTurnUp.y) < 1e-12);

const quarterTurnLeft = context.result('ArrowLeft', 1, Math.PI / 2);
assert.ok(Math.abs(quarterTurnLeft.x) < 1e-12);
assert.ok(Math.abs(quarterTurnLeft.y - 1) < 1e-12);

const quarterTurnRight = context.result('ArrowRight', 1, Math.PI / 2);
assert.ok(Math.abs(quarterTurnRight.x) < 1e-12);
assert.ok(Math.abs(quarterTurnRight.y + 1) < 1e-12);

const centerHelperMatch = script.match(/function calculateNormalizedCenter\(allPositions, visiblePositions\) \{[\s\S]*?\n\}/);
assert.ok(centerHelperMatch, 'Visible graph center helper should exist');
const centerContext = {};
require('node:vm').runInNewContext(`${centerHelperMatch[0]}; result = calculateNormalizedCenter;`, centerContext);

const filteredCenter = centerContext.result(
  [{ x: 0, y: 0 }, { x: 100, y: 100 }],
  [{ x: 0, y: 0 }]
);
assert.ok(Math.abs(filteredCenter.x) < 1e-12);
assert.ok(Math.abs(filteredCenter.y) < 1e-12);

const completeCenter = centerContext.result(
  [{ x: -20, y: 10 }, { x: 80, y: 110 }],
  [{ x: -20, y: 10 }, { x: 80, y: 110 }]
);
assert.ok(Math.abs(completeCenter.x - 0.5) < 1e-12);
assert.ok(Math.abs(completeCenter.y - 0.5) < 1e-12);

console.log('Camera keyboard tests passed');
