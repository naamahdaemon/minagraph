const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '..', 'style', 'style.css'), 'utf8');
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
assert.match(source, /primaryControls\.hidden = !datePlaybackAdvancedEnabled/);
assert.ok(html.indexOf('id="date-playback-primary-controls"') < html.indexOf('id="date-playback-controls"'), 'Playback actions should precede advanced settings');
assert.ok(html.indexOf('id="date-playback-status"') < html.indexOf('id="date-filter-labels"'), 'Playback status should precede From/To labels');
assert.match(source, /function advanceDatePlayback\(direction\)/);
assert.match(source, /function getTransactionsEnteringDateRange\(previousRange, nextRange\)/);
assert.match(source, /const DATE_PLAYBACK_STORAGE_KEY = "minagraph-date-playback-settings"/);
assert.match(source, /function saveDatePlaybackSettings\(\)/);
assert.match(source, /rangeMode: document\.getElementById\("date-playback-range-mode"\)\?\.value \|\| "cumulative"/);
assert.match(source, /liveView: document\.getElementById\("date-playback-live-view"\)\?\.checked === true/);
assert.match(source, /liveAutoLayout: document\.getElementById\("date-playback-live-auto-layout"\)\?\.checked !== false/);
assert.match(html, /id="date-playback-live-auto-layout"[^>]*type="checkbox"[^>]*checked/);
assert.match(html, /date-playback-live-layout-toggle[^>]*[\s\S]*?Auto layout/);
assert.match(source, /collapsed: document\.getElementById\("date-playback-collapse"\)/);
assert.match(source, /collapse\?\.addEventListener\("click"/);
assert.match(source, /function preserveDatePlaybackDuringPanelToggle\(\)/);
assert.match(css, /#date-filter-panel\.is-compact > #date-filter-content\s*\{[\s\S]*?display: block/);
assert.match(css, /#date-filter-panel\.is-compact #slicer-container,[\s\S]*?#date-playback-controls\s*\{[\s\S]*?display: none !important/);
assert.match(css, /#date-filter-panel\.is-compact #date-filter-labels\s*\{[\s\S]*?display: flex/);
assert.match(source, /activeDirection && datePlaybackDirection === activeDirection && datePlaybackTimer === null/);
assert.match(source, /summary\?\.addEventListener\("click", event => \{[\s\S]*?event\.preventDefault\(\)[\s\S]*?preserveDatePlaybackDuringPanelToggle\(\)/);
assert.match(source, /collapse\?\.addEventListener\("click", \(\) => \{[\s\S]*?preserveDatePlaybackDuringPanelToggle\(\)/);
assert.doesNotMatch(source, /function isDesktopDatePlayback\(\)/);
assert.match(source, /playbackFeed\.classList\.contains\("sorting"\) \? 360 : 180/);
assert.match(source, /Math\.max\(datePlaybackFeedPreferredHeight, maximumFeedHeight\)/);
assert.match(source, /function normalizeDatePlaybackSortRules\(rules\)/);
assert.match(source, /function sortDatePlaybackEdges\(edges, direction\)/);
assert.match(source, /"date-minute": "Date — minute"/);
assert.match(source, /if \(kind === "date-hour"\) return roundTimestampUp\(timestamp, 3600000\)/);
assert.match(source, /if \(kind === "date-minute"\) return roundTimestampUp\(timestamp, 60000\)/);
assert.match(source, /Math\.ceil\(Math\.abs\(numericAmount\) \/ 10\) \* 10/);
assert.match(source, /sortRules: datePlaybackSortRules/);
assert.match(source, /transactionAmount\.className = "date-playback-transaction-amount"/);
assert.match(source, /function handleDatePlaybackTransactionTouch\(edge\)/);
assert.match(source, /transactionMatchesActiveLegendFilters\(attrs\) &&\s*edgeMatchesSelectedNodeDirection\(source, target\) &&\s*edgeMatchesMultiSelection\(source, target\) &&\s*edgeMatchesActiveColorFilter\(source, target\) &&\s*\(!strictTouchFocusedNode \|\| edgeMatchesStrictTouchFocus\(edge\)\)/);
assert.match(source, /const existingEdges = new Set\(\[\.\.\.datePlaybackFocusedEdges\]\.filter\(edge => graph\.hasEdge\(edge\)\)\);/);
assert.match(source, /const referenceNode = strictTouchFocusedNode \|\| selectedNode;/);
assert.match(source, /const edges = new Set\(\[\.\.\.existingEdges\]\.filter\(edge => graphEdgeMatchesActiveView\(edge, referenceNode\)\)\);/);
assert.match(source, /datePlaybackLastTouchTransaction\.edge === edge[\s\S]*?datePlaybackFocusedEdges\.has\(edge\)/);
assert.match(source, /if \(isSecondTap && node && graph\.hasNode\(node\)\) \{\s*showNodePanel\(node\)/);
assert.match(source, /pointerType !== "touch"/);
assert.match(source, /Math\.hypot\(event\.clientX - touchCandidate\.x, event\.clientY - touchCandidate\.y\) > 12/);
assert.match(source, /Date\.now\(\) - datePlaybackLastHandledTouchAt < 2000/);
assert.match(source, /event\.sourceCapabilities\?\.firesTouchEvents === true/);
assert.match(source, /let suppressSyntheticClick = false/);
assert.doesNotMatch(source, /selectedNode = node;\s*setNodePanelOpen\(false\)/);
assert.match(source, /const DATE_PLAYBACK_DEFAULT_HIGHLIGHT_DURATION_SECONDS = 2/);
assert.match(source, /function getDatePlaybackHighlightDurationMilliseconds\(\)/);
assert.match(source, /highlightDuration: Math\.max\(0\.1,/);
assert.match(source, /storedSettings\.highlightDuration/);
assert.match(source, /Date\.now\(\) \+ getDatePlaybackHighlightDurationMilliseconds\(\)/);
assert.match(html, /id="date-playback-highlight-duration"[^>]*value="2"/);
assert.match(source, /const datePlaybackNodeFlashDeadlines = new Map\(\)/);
assert.match(source, /datePlaybackFlashDeadlines\.set\(edge, Date\.now\(\) \+ getDatePlaybackHighlightDurationMilliseconds\(\)\)/);
assert.match(source, /function runDatePlaybackFlashAnimation\(\)/);
assert.match(source, /function highlightLatestDatePlaybackFlow\(edges, direction\)/);
assert.match(source, /revealedEdges\.forEach\(startDatePlaybackFlash\)/);
assert.doesNotMatch(source, /datePlaybackAutoFlashEdge !== nextEdge[\s\S]*?stopDatePlaybackFlash/);
assert.match(source, /function initializeDatePlaybackFeedResize\(\)/);
assert.match(source, /DATE_PLAYBACK_FEED_HEIGHT_STORAGE_KEY/);
assert.match(source, /availableHeight = Math\.max\(0, Math\.floor\(slicerRect\.top - feedRect\.top - 12\)\)/);
assert.match(source, /playbackFeed\.style\.maxHeight = `\$\{availableHeight\}px`/);
assert.match(source, /initializeDatePlaybackFeedResize\(\)/);
assert.match(source, /if \(isDatePlaybackNodeFlashing\(node\)\)/);
assert.equal((source.match(/zIndex:\s*true/g) || []).length, 2, 'every Sigma renderer should sort edges by z-index');
assert.match(source, /const flashing = isDatePlaybackFlashVisible\(edge\)/);
assert.match(source, /function manuallyAdvanceDatePlayback\(direction\)/);
assert.match(source, /function moveDatePlaybackBoundary\(boundary\)/);
assert.match(source, /nextRange\[0\] = Math\.min\(previousRange\[1\], previousRange\[0\] \+ step\)/);
assert.match(source, /nextRange\[1\] = Math\.max\(previousRange\[0\], previousRange\[1\] - step\)/);
assert.match(source, /function queueLiveViewNotification\(notification\)/);
assert.match(source, /function processLiveViewQueue\(\)/);
assert.match(source, /function refreshDateSlicerAfterLiveUpdate\(newEdges = \[\]\)/);
assert.match(source, /function refreshDateSlicerAfterGraphMutation\(\) \{\s*refreshDateSlicerAfterLiveUpdate\(\[\]\);/);
assert.match(source, /if \(!timestamps\.length\) \{[\s\S]*?currentRange = \[0, 0\][\s\S]*?slider\?\.noUiSlider\?\.disable\?\.\(\)/);
assert.match(source, /if \(nextRange\[0\] > nextRange\[1\]\)/);
assert.match(source, /slider\.noUiSlider\.enable\?\.\(\)/);
assert.match(source, /const sliderMaximum = newMax > newMin[\s\S]*?getDatePlaybackStepMilliseconds\(\) : DAY_IN_MILLISECONDS/);
assert.match(source.match(/function deleteSelectedNode\(nodeId\)[\s\S]*?function renderTransactionDeleteButton/)?.[0] || '', /refreshDateSlicerAfterGraphMutation\(\)/);
assert.match(source.match(/function deleteVisibleNodeInteractions\(nodeId\)[\s\S]*?function deleteTransactionFromGraph/)?.[0] || '', /refreshDateSlicerAfterGraphMutation\(\)/);
assert.match(source.match(/function deleteTransactionFromGraph\(encodedEdgeId\)[\s\S]*?function updateProgressBar/)?.[0] || '', /refreshDateSlicerAfterGraphMutation\(\)/);
assert.match(source.match(/function deleteNodesFromMultiSelection\(deleteSelected\)[\s\S]*?function setupNativeGraphStageGestures/)?.[0] || '', /refreshDateSlicerAfterGraphMutation\(\)/);
assert.match(source, /function highlightLiveViewAdditions\(nodes = \[\], edges = \[\]\)/);
assert.match(source, /highlightLiveViewAdditions\(newNodes, newEdges\)/);
assert.match(source, /function runLiveViewLayoutIfIdle\(\)/);
assert.match(source, /if \(!isLiveViewAutoLayoutEnabled\(\) \|\| isLayoutRunning \|\| !graph\?\.order\) return false/);
assert.match(source, /animateLayout\(null, "initial"\)/);
assert.match(source, /runLiveViewLayoutIfIdle\(\)/);
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
assert.match(source, /function buildDateHistogramScale\(timestamps, minTimestamp, maxTimestamp\)/);
assert.match(source, /offset: false,[\s\S]*?maxTicksLimit: 6,[\s\S]*?font: \{ size: 8 \}/);
assert.doesNotMatch(source.match(/scales: \{[\s\S]*?\n      \}/)?.[0] || '', /text: 'Transaction Date'/);
assert.match(css, /#slicer-range\s*\{[\s\S]*?margin-top: 3px/);
assert.match(source, /configuredStep \* Math\.max\(1, Math\.ceil\(span \/ \(configuredStep \* maximumBins\)\)\)/);
assert.match(source, /function refreshDateHistogramScale\(range = currentRange\)/);
assert.match(source, /function scheduleDateHistogramScaleRefresh\(range = currentRange\)/);
assert.match(source, /if \(dateHistogramScaleRefreshFrame\) return;[\s\S]*?requestAnimationFrame/);
assert.match(source.match(/function setDatePlaybackRange\(range\)[\s\S]*?\n\}/)?.[0] || '', /scheduleDateHistogramScaleRefresh\(range\)/,
  'automatic and manual playback range changes should dynamically rescale the histogram');
assert.match(source.match(/function shiftSelectedDateWindow\(pageIndex\)[\s\S]*?\n\}/)?.[0] || '', /scheduleDateHistogramScaleRefresh\(shiftedRange\)/,
  'date-window shifts should dynamically rescale the histogram');
assert.match(source, /updateDateSliderStep\(\);\s*refreshDateHistogramScale\(\);/);
assert.equal((source.match(/refreshDateHistogramScale\(releasedRange\)/g) || []).length, 2,
  'both the normal and rebuilt sliders should rescale the histogram when a pointer interaction ends');
assert.match(source, /step: datePlaybackAdvancedEnabled \? getDatePlaybackStepMilliseconds\(\) : DAY_IN_MILLISECONDS/);
assert.match(source, /if \(playbackFocus && !playbackFocus\.nodes\.has\(node\)\)/);
assert.match(source, /if \(!playbackFocus\.edges\.has\(edge\)\) return \{ \.\.\.data, hidden: true \};/);
assert.match(source, /if \(wipeGraph\) \{[\s\S]*?visitedKeysByChain\.clear\(\);[\s\S]*?fetchProfilesByChain\.clear\(\);/);
assert.match(source, /recenterAfterLayout = true;\s*animateLayout\(null, "initial"\)/);

const histogramScaleHelper = source.slice(
  source.indexOf('function buildDateHistogramScale('),
  source.indexOf('function refreshDateHistogramScale(')
);
assert.ok(histogramScaleHelper, 'Date histogram scale helper should exist');
const histogramContext = {
  Number,
  Math,
  Date,
  DAY_IN_MILLISECONDS: day,
  datePlaybackAdvancedEnabled: true,
  getDatePlaybackStepMilliseconds: () => 60 * 60 * 1000
};
vm.runInNewContext(`${histogramScaleHelper}; result = buildDateHistogramScale;`, histogramContext);
const shortHistogram = histogramContext.result([0, 60 * 60 * 1000], 0, 3 * 60 * 60 * 1000 - 1);
assert.equal(shortHistogram.binSize, 60 * 60 * 1000, 'A practical configured step should be used exactly');
assert.equal(shortHistogram.bins.length, 3);
const longHistogram = histogramContext.result([0, 400 * 60 * 60 * 1000], 0, 400 * 60 * 60 * 1000 - 1);
assert.equal(longHistogram.binSize % (60 * 60 * 1000), 0, 'Large ranges should use an integer multiple of the configured step');
assert.ok(longHistogram.bins.length <= 240, 'Histogram density should remain bounded on large ranges');

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

const roundTimestampHelper = source.match(/function roundTimestampUp\(timestamp, unitMilliseconds\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(roundTimestampHelper, 'Timeline timestamp rounding helper should exist');
const roundingContext = {};
vm.runInNewContext(`${roundTimestampHelper}; result = roundTimestampUp;`, roundingContext);
const hour = 60 * 60 * 1000;
const minute = 60 * 1000;
assert.equal(roundingContext.result(18 * hour, hour), 18 * hour, 'Exact hours should remain unchanged');
assert.equal(roundingContext.result(18 * hour + 1, hour), 19 * hour, 'Hour sorting should round upward');
assert.equal(roundingContext.result(18 * hour + 6 * minute + 1, minute), 18 * hour + 7 * minute, 'Minute sorting should round upward');

const liveLayoutHelper = source.match(/function runLiveViewLayoutIfIdle\(\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(liveLayoutHelper, 'Live View layout helper should exist');
const liveLayoutCalls = [];
const liveLayoutContext = {
  isLayoutRunning: false,
  graph: { order: 3 },
  isLiveViewAutoLayoutEnabled: () => true,
  animateLayout: (...args) => liveLayoutCalls.push(args)
};
vm.runInNewContext(`${liveLayoutHelper}; result = runLiveViewLayoutIfIdle;`, liveLayoutContext);
assert.equal(liveLayoutContext.result(), true);
assert.deepEqual(liveLayoutCalls, [[null, 'initial']]);
liveLayoutContext.isLayoutRunning = true;
assert.equal(liveLayoutContext.result(), false);
assert.equal(liveLayoutCalls.length, 1, 'Live View must not restart an active layout');
liveLayoutContext.isLayoutRunning = false;
liveLayoutContext.isLiveViewAutoLayoutEnabled = () => false;
assert.equal(liveLayoutContext.result(), false);
assert.equal(liveLayoutCalls.length, 1, 'Live View must not start a layout when automatic layout is disabled');

console.log('Date filter tests passed');
