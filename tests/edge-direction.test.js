const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "scripts", "script.js"), "utf8");

assert.match(html, /id="toggle-edge-directions" checked/);
assert.match(html, /for="toggle-edge-directions"[^>]*>DIRECTION ARROWS<\/label>/);
assert.match(script, /let showEdgeDirections = true;/);
assert.match(script, /data = \{ \.\.\.data, type: showEdgeDirections \? "arrow" : "line" \};/);
assert.match(script, /document\.getElementById\("toggle-edge-directions"\)\.addEventListener\("change"/);
assert.match(script, /directions: document\.getElementById\("toggle-edge-directions"\)\?\.checked \? "1" : "0"/);
assert.match(script, /directions: params\.get\("directions"\)/);
assert.match(script, /setChecked\("toggle-edge-directions", shared\.directions\)/);

console.log("Edge direction tests passed");
