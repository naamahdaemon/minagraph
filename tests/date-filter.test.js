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

const exactContext = {
  currentRange: [selectedDayAtNoon, selectedDayAtNoon + 1000],
  datePlaybackAdvancedEnabled: true
};
vm.runInNewContext(`${helperMatch[0]}; result = isTimestampInCurrentRange;`, exactContext);
assert.equal(exactContext.result(selectedDayAtNoon), true, 'Advanced playback should include its exact lower boundary');
assert.equal(exactContext.result(selectedDayAtNoon + 1000), true, 'Advanced playback should include its exact upper boundary');
assert.equal(exactContext.result(selectedDayAtNoon - 1), false, 'Advanced playback should exclude earlier milliseconds');
assert.equal(exactContext.result(selectedDayAtNoon + 1001), false, 'Advanced playback should exclude later milliseconds');

assert.match(source, /const visibleEdges = graph\.edges\(node\)\.filter/);
assert.match(source, /showNodePanel\(selectedNode, false\)/);
assert.match(source, /function getDateWindowShiftConfig\(globalMin, globalMax, rangeStart, rangeEnd\)/);
assert.match(source, /function shiftSelectedDateWindow\(pageIndex\)/);
assert.match(source, /slider\.noUiSlider\.set\(shiftedRange, true, true\)/);
assert.match(source, /function moveDateWindowByOnePeriod\(direction\)/);
assert.match(source, /function initializeDatePlaybackControls\(\)/);
assert.match(source, /function advanceDatePlayback\(direction\)/);
assert.match(source, /function getTransactionsEnteringDateRange\(previousRange, nextRange\)/);
assert.match(source, /const DATE_PLAYBACK_STORAGE_KEY = "minagraph-date-playback-settings"/);
assert.match(source, /function saveDatePlaybackSettings\(\)/);
assert.match(source, /rangeMode: document\.getElementById\("date-playback-range-mode"\)\?\.value \|\| "cumulative"/);
assert.match(source, /liveView: document\.getElementById\("date-playback-live-view"\)\?\.checked === true/);
assert.match(source, /collapsed: document\.getElementById\("date-playback-collapse"\)/);
assert.match(source, /collapse\?\.addEventListener\("click"/);
assert.doesNotMatch(source, /function isDesktopDatePlayback\(\)/);
assert.match(source, /playbackFeed\.classList\.contains\("sorting"\) \? 360 : 180/);
assert.match(source, /function normalizeDatePlaybackSortRules\(rules\)/);
assert.match(source, /function sortDatePlaybackEdges\(edges, direction\)/);
assert.match(source, /Math\.ceil\(Math\.abs\(numericAmount\) \/ 10\) \* 10/);
assert.match(source, /sortRules: datePlaybackSortRules/);
assert.match(source, /transactionAmount\.className = "date-playback-transaction-amount"/);
assert.match(source, /function manuallyAdvanceDatePlayback\(direction\)/);
assert.match(source, /function moveDatePlaybackBoundary\(boundary\)/);
assert.match(source, /nextRange\[0\] = Math\.min\(previousRange\[1\], previousRange\[0\] \+ step\)/);
assert.match(source, /nextRange\[1\] = Math\.max\(previousRange\[0\], previousRange\[1\] - step\)/);
assert.match(source, /function queueLiveViewNotification\(notification\)/);
assert.match(source, /function processLiveViewQueue\(\)/);
assert.match(source, /function refreshDateSlicerAfterLiveUpdate\(newEdges = \[\]\)/);
assert.match(source, /const newEdges = graph\.edges\(\)\.filter\(edge => !previousEdges\.has\(edge\)\)/);
assert.match(source, /const liveTimestamps = newEdges/);
assert.match(source, /renderDatePlaybackFeed\(visibleEdges, datePlaybackDirection \|\| 1, currentRange, visibleNewEdges\)/);
assert.match(source, /const LIVE_VIEW_INITIAL_DELAY_MS = 3 \* 60 \* 1000/);
assert.match(source, /function parseLiveViewNotificationTimestamp\(notification\)/);
assert.match(source, /function getUtcDayRange\(timestamp\)/);
assert.match(source, /\[FETCH_START_TIMESTAMP, FETCH_END_TIMESTAMP\] = getUtcDayRange\(transactionTimestamp\)/);
assert.match(source, /FIRST_ITERATION_LIMIT = isEvmChain\(chain\) \? LIVE_VIEW_FETCH_LIMIT \* 2 : LIVE_VIEW_FETCH_LIMIT/);
assert.match(source, /return direction < 0 \? timestampDelta : -timestampDelta/);
assert.match(source, /datePlaybackFeedPinnedTop = feedList\.scrollTop <= 2/);
assert.match(source, /list\.scrollTop = datePlaybackFeedPinnedTop \? 0 : previousScrollTop/);
assert.match(source, /step: 1000, \/\/ advanced playback can move with one-second precision/);
assert.match(source, /if \(playbackFocus && !playbackFocus\.nodes\.has\(node\)\)/);
assert.match(source, /if \(!playbackFocus\.edges\.has\(edge\)\) return \{ \.\.\.data, hidden: true \};/);
assert.match(source, /if \(wipeGraph\) \{[\s\S]*?visitedKeysByChain\.clear\(\);[\s\S]*?fetchProfilesByChain\.clear\(\);/);
assert.match(source, /recenterAfterLayout = true;\s*animateLayout\(null, "initial"\)/);

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

const liveTimestampHelper = source.match(/function parseLiveViewNotificationTimestamp\(notification\) \{[\s\S]*?\n\}/)?.[0];
const utcDayHelper = source.match(/function getUtcDayRange\(timestamp\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(liveTimestampHelper && utcDayHelper, 'Live View date helpers should exist');
const liveDateContext = { DAY_IN_MILLISECONDS: day, Date };
vm.runInNewContext(`${liveTimestampHelper}; ${utcDayHelper}; result = { parseLiveViewNotificationTimestamp, getUtcDayRange };`, liveDateContext);
const notificationTimestamp = Date.parse('2026-10-12T18:42:00Z');
assert.equal(liveDateContext.result.parseLiveViewNotificationTimestamp({ transaction_timestamp: notificationTimestamp }), notificationTimestamp);
assert.equal(liveDateContext.result.parseLiveViewNotificationTimestamp({ message_id: `${notificationTimestamp}-abcd1234` }), notificationTimestamp);
assert.deepEqual(
  Array.from(liveDateContext.result.getUtcDayRange(notificationTimestamp)),
  [Date.parse('2026-10-12T00:00:00.000Z'), Date.parse('2026-10-12T23:59:59.999Z')]
);

console.log('Date filter tests passed');
