const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
const script = fs.readFileSync(path.join(projectRoot, "scripts", "script.js"), "utf8");
const styles = fs.readFileSync(path.join(projectRoot, "style", "style.css"), "utf8");

const parameterIds = [
  "layout-algorithm", "layout-linlog", "layout-outbound", "layout-strong-gravity",
  "layout-prevent-overlap", "layout-ewi", "layout-cooling", "layout-attraction",
  "layout-repulsion", "layout-iterations", "layout-width", "layout-height",
  "layout-gravity", "layout-scale", "toggle-labels", "edge-thickness-mode"
];

for (const id of parameterIds) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `${id} must exist in the graph parameters panel`);
  assert.match(script, new RegExp(`["']${id}["']\\s*:`), `${id} must have explanatory help text`);
}

assert.doesNotMatch(
  html,
  /<label[^>]*title=[^>]*>[\s\S]{0,180}?id="layout-(?:outbound|strong-gravity|prevent-overlap)"/,
  "legacy native titles should not compete with the consistent custom tooltip"
);
assert.match(script, /mouseenter[\s\S]*mouseleave/, "help must support mouse hovering");
assert.match(script, /label\.addEventListener\("click"/, "labels must support tapping/clicking");
assert.match(script, /label\.addEventListener\("focus"/, "labels must support keyboard focus");
assert.match(script, /\(hover: hover\) and \(pointer: fine\)/, "hover help must be limited to precise hover-capable pointers");
assert.match(script, /outsideOpenSidebar[\s\S]*suppressLayoutHelpDismissalClick = true/, "outside dismissal must preserve the open mobile sidebar");
assert.match(script, /event\.key === "Escape" && activeLayoutHelpAnchor/, "Escape must close pinned help");
assert.doesNotMatch(script, /createElement\("button"\)[\s\S]{0,500}layout-parameter-help/, "help must not inject information buttons");
assert.match(styles, /\.layout-parameter-label-help\s*\{/, "explanatory labels must expose an unobtrusive help cursor");
assert.match(styles, /\.layout-parameter-tooltip\s*\{/, "the explanatory tooltip must be styled");
assert.match(styles, /pointer-events:\s*auto/, "the tooltip itself must be tappable to dismiss it");

console.log("Layout parameter help tests passed.");
