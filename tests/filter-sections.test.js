const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'scripts/script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style/style.css'), 'utf8');
const legend = html.slice(html.indexOf('<div id="legend"'), html.indexOf('<div id="loader-modal"'));
const sections = [...legend.matchAll(/<details class="legend-section">([\s\S]*?)<\/details>/g)];
assert.equal(sections.length, 5, 'Each static filter section uses a native disclosure');
for (const section of sections) {
  const summary = section[1].match(/^\s*<summary class="legend-toggle"[^>]*data-target="#([^"]+)"[^>]*>([^<]+)<\/summary>/);
  assert.ok(summary, 'The disclosure has a native, labelled summary as its first child');
  const content = section[1].match(new RegExp(`<div id="${summary[1]}"([^>]*)>`));
  assert.ok(content, 'Its filter controls remain inside the disclosure');
  assert.doesNotMatch(content[1], /display\s*:\s*none/, 'Inline styles must not prevent native expansion');
}
assert.match(script, /const section = document\.createElement\("details"\);\s*section\.className = "legend-section";/);
assert.match(script, /<summary class="legend-toggle" data-target="#node-color-filter">Node Colors<\/summary>/);
assert.doesNotMatch(script, /toggle\.innerHTML = `<em>\$\{isVisible/,
  'Legacy click toggling must not double-toggle native disclosures');
assert.match(css, /#legend \.legend-section:not\(\[open\]\) > :not\(summary\)\s*\{\s*display: none;/,
  'Collapsed content stays hidden even when a pill list explicitly uses grid display');
assert.doesNotMatch(legend, /touch-action:\s*none/,
  'The panel must not disable native touch gestures before application initialization');
console.log('Native filter disclosure tests passed');
