const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "..", "scripts", "sigma.umd.js"), "utf8");
const appSource = fs.readFileSync(path.resolve(__dirname, "..", "scripts", "script.js"), "utf8");

assert.match(
  source,
  /return arr\.sort\(function \(a, b\)/,
  "Touch points should keep a stable identifier order"
);
assert.match(
  source,
  /var startTouchCenter = \{[\s\S]*?var currentTouchCenter = \{/,
  "Pinch transformations should compute both touch midpoints"
);
assert.match(
  source,
  /viewportToFramedGraph\(startTouchCenter/,
  "Pinch transformations should preserve the graph point under the initial midpoint"
);
assert.match(
  source,
  /var _x = currentTouchCenter\.x[\s\S]*?var _y = currentTouchCenter\.y/,
  "Pinch transformations should place the current midpoint over the anchored graph point"
);
assert.match(
  appSource,
  /function bindStablePinchReference\(container\)[\s\S]*?gestureRenderer\.setCustomBBox\(gestureBBox\)/,
  "The graph normalization reference should be frozen for a pinch"
);
assert.match(
  appSource,
  /if \(event\.touches\?\.length \|\| !pinchReference\) return;[\s\S]*?setCustomBBox\(reference\.previousBBox \|\| null\)/,
  "The graph normalization reference should be restored after the complete gesture"
);
assert.match(
  appSource,
  /bindStablePinchReference\(sigmaContainer\)/,
  "Stable pinch tracking should be bound to Sigma's container"
);

console.log("Sigma touch pinch tests passed");
