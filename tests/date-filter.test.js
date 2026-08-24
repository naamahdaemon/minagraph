const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const helperMatch = source.match(/function isTimestampInCurrentRange\(timestamp\) \{[\s\S]*?\n\}/);

assert.ok(helperMatch, 'Date range helper should exist');

const day = 24 * 60 * 60 * 1000;
const selectedDayAtNoon = new Date(2026, 0, 5, 12).getTime();
const context = { currentRange: [selectedDayAtNoon, selectedDayAtNoon] };
vm.runInNewContext(`${helperMatch[0]}; result = isTimestampInCurrentRange;`, context);

assert.equal(context.result(new Date(2026, 0, 5, 0, 0, 0).getTime()), true, 'Start of selected day should be included');
assert.equal(context.result(String(new Date(2026, 0, 5, 18).getTime())), true, 'String timestamps on the selected day should be supported');
assert.equal(context.result(new Date(2026, 0, 5, 23, 59, 59, 999).getTime()), true, 'End of selected day should be included');
assert.equal(context.result(new Date(2026, 0, 4, 23, 59, 59, 999).getTime()), false, 'Previous day should be excluded');
assert.equal(context.result(new Date(2026, 0, 6, 0, 0, 0).getTime()), false, 'Following day should be excluded');
assert.equal(context.result(null), false, 'Missing timestamps should be excluded');

assert.match(source, /const visibleEdges = graph\.edges\(node\)\.filter/);
assert.match(source, /showNodePanel\(selectedNode, false\)/);
assert.match(source, /function getDateWindowShiftConfig\(globalMin, globalMax, rangeStart, rangeEnd\)/);
assert.match(source, /function shiftSelectedDateWindow\(pageIndex\)/);
assert.match(source, /slider\.noUiSlider\.set\(shiftedRange, true, true\)/);
assert.match(source, /function moveDateWindowByOnePeriod\(direction\)/);

const shiftHelperMatch = source.match(/function getDateWindowShiftConfig\(globalMin, globalMax, rangeStart, rangeEnd\) \{[\s\S]*?\n\}/);
assert.ok(shiftHelperMatch, 'Date window shift helper should exist');
const shiftContext = { DAY_IN_MILLISECONDS: 24 * 60 * 60 * 1000 };
vm.runInNewContext(`${shiftHelperMatch[0]}; shiftResult = getDateWindowShiftConfig;`, shiftContext);
const eightDayWindow = shiftContext.shiftResult(0, 40 * day, 0, 7 * day);
assert.equal(eightDayWindow.stepDays, 8);
assert.equal(eightDayWindow.stepMilliseconds, 8 * day);
assert.equal(eightDayWindow.maxPage, 4);
const oneDayWindow = shiftContext.shiftResult(0, 10 * day, 2 * day, 2 * day);
assert.equal(oneDayWindow.stepDays, 1);
assert.equal(oneDayWindow.minPage, -2);
assert.equal(oneDayWindow.maxPage, 8);

const shiftedRangeHelper = source.match(/function getShiftedDateRange\(rangeStart, rangeEnd, stepMilliseconds, pageIndex\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(shiftedRangeHelper, 'Shifted range helper should exist');
const shiftedRangeContext = {};
vm.runInNewContext(`${shiftedRangeHelper}; shiftedRangeResult = getShiftedDateRange;`, shiftedRangeContext);
const originalStart = 10 * day;
const originalEnd = 10 * day;
const shiftedOneDay = shiftedRangeContext.shiftedRangeResult(originalStart, originalEnd, day, 5);
assert.deepEqual(Array.from(shiftedOneDay), [15 * day, 15 * day]);
assert.equal(shiftedOneDay[1] - shiftedOneDay[0], originalEnd - originalStart);

console.log('Date filter tests passed');
