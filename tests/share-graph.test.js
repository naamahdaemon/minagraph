const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "scripts", "script.js"), "utf8");

assert.match(html, /id="shareGraphBtn"/);
assert.match(html, /id="copyGraphLinkBtn"/);
assert.match(html, /id="graph-share-status"[^>]+aria-live="polite"/);
assert.match(script, /function getGraphShareUrl\(\)/);
assert.match(script, /firstiterationlimit:[\s\S]*?iterationlimit:[\s\S]*?depth:/);
assert.match(script, /layout:[\s\S]*?iterations:[\s\S]*?width:[\s\S]*?height:/);
assert.match(script, /navigator\.share\(\{/);
assert.match(script, /navigator\.clipboard\?\.writeText/);
assert.match(script, /applySharedLayoutParams\(sharedLayoutParams\)/);
assert.doesNotMatch(script.slice(script.indexOf("function getGraphShareUrl"), script.indexOf("function setGraphShareStatus")), /api-token|API_TOKEN/);

console.log("Graph sharing tests passed");
