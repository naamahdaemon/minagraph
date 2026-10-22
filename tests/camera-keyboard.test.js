const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'style', 'style.css'), 'utf8');

assert.match(html, /id="sigma-container"[^>]*tabindex="0"/);
assert.match(script, /function handleGraphKeyboardNavigation\(event\)/);
assert.match(script, /document\.activeElement !== sigmaContainer/);
assert.match(script, /event\.shiftKey/);
assert.match(script, /event\.key\.toLowerCase\(\) === "c"/);
assert.match(script, /centerGraphInViewport\(\)/);
assert.match(script, /function calculateNormalizedCenter\(allPositions, visiblePositions\)/);
assert.match(script, /function getGraphViewportInsets\(\)/);
assert.match(script, /addPanelInset\(document\.getElementById\("left-sidebar"\), "left"\)/);
assert.match(script, /addPanelInset\(document\.getElementById\("side-panel"\), "right"\)/);
assert.match(script, /window\.matchMedia\("\(min-width: 769px\)"\)\.matches/,
  'floating panel occlusion should only affect desktop centering');
assert.match(script, /datePanelMode === "full"/,
  'the date slicer should only reserve horizontal space in full mode');
assert.match(script, /addFloatingPanelInset\(timelineFeed, "right", timelineFeed\?\.hidden === false\)/,
  'the visible timeline activity panel should reserve horizontal space');
assert.match(script, /x: insets\.left \+ Math\.max\(0, dimensions\.width - insets\.left - insets\.right\) \/ 2/);
assert.match(script, /recenterAfterLayout/);
assert.match(script, /function getSidePanelCoveredWidth\(panelWidth, viewportWidth, compactViewport\)/);
assert.match(script, /zoomSlider\.noUiSlider\.on\('slide', \(\) => centerGraphInViewport\(\)\)/);
assert.match(script, /zoomSlider\.noUiSlider\.on\('change', \(\) => centerGraphInViewport\(\)\)/);
assert.match(script, /function positionRotateSlider\(\)/);
assert.match(script, /function syncControlsFromCamera\(state\)/);
assert.match(script, /function bindCameraStateToControls\(\)/);
assert.match(script, /camera\.on\("updated", syncControlsFromCamera\)/);
assert.match(script, /const degrees = \(\(Number\(state\.angle\) \|\| 0\) \* 180 \/ Math\.PI \+ 360\) % 360/);
assert.match(script, /const ratio = Math\.min\(5, Math\.max\(0\.25, Number\(state\.ratio\) \|\| 1\)\)/);
assert.match(script, /if \(!ratioChanged && !angleChanged\) return;/);
assert.match(script, /if \(!renderer \|\| syncingCameraControls\) return;/);
assert.match(styles, /#zoom-slider,\s*#rotate-slider\s*\{[\s\S]*?--camera-control-accent: #4fc3f7/);
assert.match(styles, /#zoom-slider \.noUi-connect,\s*#rotate-slider \.noUi-connect\s*\{[\s\S]*?linear-gradient/);
assert.match(styles, /#zoom-slider \.noUi-connects,\s*#rotate-slider \.noUi-connects\s*\{[\s\S]*?width: 100%;[\s\S]*?margin: 0;/);
assert.match(styles, /#zoom-slider\.noUi-target,\s*#rotate-slider\.noUi-target\s*\{[\s\S]*?border: 0;[\s\S]*?background: transparent;[\s\S]*?box-shadow: none;/);
assert.match(styles, /#rotate-slider \.noUi-base\s*\{[\s\S]*?top: 50%;[\s\S]*?transform: translateY\(-50%\)/);
assert.match(styles, /#zoom-slider\s*\{[\s\S]*?height: 250px/);
assert.match(styles, /#date-slicer-container\s*\{[\s\S]*?--camera-panel-right: 34px;[\s\S]*?right: var\(--camera-panel-right\)/);
assert.match(styles, /body\.mobile-mode #date-slicer-container\s*\{[\s\S]*?left: 10px !important;[\s\S]*?right: 10px !important;[\s\S]*?width: auto !important;/);
assert.match(styles, /body\.mobile-mode #date-slicer-container\s*\{[\s\S]*?bottom: 30px !important/);
assert.match(styles, /#date-playback-feed\s*\{[\s\S]*?--playback-feed-right: 10px;[\s\S]*?width: calc\(100vw - 20px\)/);
assert.match(styles, /@media screen and \(max-width: 768px\)[\s\S]*?#zoom-slider\s*\{[\s\S]*?width: 20px/);
assert.match(styles, /body\.mobile-mode #date-slicer-container\s*\{[\s\S]*?padding: 0;/);
assert.match(styles, /body\.mobile-mode #date-filter-panel summary\s*\{[\s\S]*?min-height: 34px/);
assert.match(styles, /@media screen and \(max-width: 768px\)[\s\S]*?#zoom-slider[\s\S]*?width: 20px/);
assert.match(script, /const sliderCenterX = visibleLeft \+ visibleWidth \/ 2/);
assert.match(script, /const edgeOffset = window\.innerWidth <= 768[\s\S]*?\? 5[\s\S]*?: 8/);
assert.match(script, /const width = Math\.min\(300, Math\.max\(180, visibleWidth \* 0\.52\)\)/);
assert.match(script, /const zoomTopLimit = Math\.max\(/);
assert.match(script, /const zoomBottomLimit = Math\.min\(/);
assert.match(script, /zoomSlider\.style\.visibility = zoomHeight >= 80 \? "visible" : "hidden"/);
assert.match(script, /slicerBounds\.bottom \+ slicerGap \+ sliderHandleRadius/);
assert.match(script, /const slicerGap = 14/);
assert.match(script, /function scheduleRotateSliderPosition\(\)/);
assert.match(script, /const currentRun = \+\+rotatePositionRun/);
assert.match(script, /elapsed < 900 \|\| stableFrames < 4/);
assert.match(script, /rotateLayoutObserver\.observe\(dateSlicerContainer\)/);
assert.match(script, /rotateLayoutObserver\.observe\(datePlaybackFeed\)/);
assert.match(script, /const rotateLayoutObserver = new ResizeObserver\(\(\) => \{[\s\S]*?syncDateSlicerWithNodePanel\(\);[\s\S]*?scheduleRotateSliderPosition\(\)/);
assert.match(script, /run\(\{ iterationsOverride = null, origin = "manual" \} = \{\}\) \{[\s\S]*?renderer\?\.setCustomBBox\(null\)/);
assert.match(script, /const iterations = requestedIterations;/);
assert.doesNotMatch(script, /safeLimit/);
assert.match(script, /profile === "initial" \? null : getAutomaticLayoutIterations\(profile\)/);
assert.match(script, /let dragOwnsCustomBBox = false/);
assert.doesNotMatch(script, /graph\.setNodeAttribute\(node, "highlighted", true\);\s*if \(!renderer\.getCustomBBox\(\)\)/);
assert.match(script, /Math\.hypot\(dx, dy\) > dragTolerance[\s\S]*?renderer\.setCustomBBox\(renderer\.getBBox\(\)\)[\s\S]*?dragOwnsCustomBBox = true/);
assert.match(script, /if \(dragOwnsCustomBBox\) \{\s*renderer\.setCustomBBox\(null\);\s*dragOwnsCustomBBox = false;/);
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

const panelHelperMatch = script.match(/function getSidePanelCoveredWidth\(panelWidth, viewportWidth, compactViewport\) \{[\s\S]*?\n\}/);
assert.ok(panelHelperMatch, 'Side panel viewport helper should exist');
const panelContext = {};
require('node:vm').runInNewContext(`${panelHelperMatch[0]}; result = getSidePanelCoveredWidth;`, panelContext);
assert.equal(panelContext.result(490, 1200, false), 490);
assert.equal(panelContext.result(490, 600, true), 0);
assert.equal(panelContext.result(490, 600, false), 0);

console.log('Camera keyboard tests passed');
