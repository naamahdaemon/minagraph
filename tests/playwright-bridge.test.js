const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const script = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "script.js"),
  "utf8",
);

assert.match(
  script,
  /URLSearchParams\(window\.location\.search\)\.get\("e2e"\) === "1"/,
  "the Playwright bridge must be explicitly enabled with ?e2e=1",
);
assert.match(script, /Object\.defineProperty\(window, "__MINAGRAPH_TEST__"/);
assert.match(script, /get graph\(\) \{\s*return graph;/);
assert.match(script, /get renderer\(\) \{\s*return renderer;/);

console.log("playwright-bridge tests passed");
