const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const helperMatch = source.match(/function isTimestampInCurrentRange\(timestamp\) \{[\s\S]*?\n\}/);

assert.ok(helperMatch, 'Date range helper should exist');

const context = { currentRange: [1_000, 2_000] };
vm.runInNewContext(`${helperMatch[0]}; result = isTimestampInCurrentRange;`, context);

assert.equal(context.result(1_000), true, 'Lower boundary should be included');
assert.equal(context.result('1500'), true, 'String timestamps should be supported');
assert.equal(context.result(2_000), true, 'Upper boundary should be included');
assert.equal(context.result(999), false, 'Older operations should be excluded');
assert.equal(context.result(2_001), false, 'Newer operations should be excluded');
assert.equal(context.result(null), false, 'Missing timestamps should be excluded');

assert.match(source, /const visibleEdges = graph\.edges\(node\)\.filter/);
assert.match(source, /showNodePanel\(selectedNode, false\)/);
assert.match(source, /function getDateWindowShiftConfig\(globalMin, globalMax, rangeStart, rangeEnd\)/);
assert.match(source, /function shiftSelectedDateWindow\(pageIndex\)/);

const shiftHelperMatch = source.match(/function getDateWindowShiftConfig\(globalMin, globalMax, rangeStart, rangeEnd\) \{[\s\S]*?\n\}/);
assert.ok(shiftHelperMatch, 'Date window shift helper should exist');
const shiftContext = { DAY_IN_MILLISECONDS: 24 * 60 * 60 * 1000 };
vm.runInNewContext(`${shiftHelperMatch[0]}; shiftResult = getDateWindowShiftConfig;`, shiftContext);
const day = shiftContext.DAY_IN_MILLISECONDS;
const eightDayWindow = shiftContext.shiftResult(0, 40 * day, 0, 7 * day);
assert.equal(eightDayWindow.stepDays, 8);
assert.equal(eightDayWindow.stepMilliseconds, 8 * day);
assert.equal(eightDayWindow.maxPage, 4);
const oneDayWindow = shiftContext.shiftResult(0, 10 * day, 2 * day, 2 * day);
assert.equal(oneDayWindow.stepDays, 1);
assert.equal(oneDayWindow.minPage, -2);
assert.equal(oneDayWindow.maxPage, 8);

console.log('Date filter tests passed');
