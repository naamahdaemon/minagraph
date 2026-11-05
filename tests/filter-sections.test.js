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
assert.match(css, /#legend details\.legend-section:not\(\[open\]\) > :not\(summary\)\s*\{\s*display: none;/,
  'Collapsed content stays hidden even when a pill list explicitly uses grid display');
assert.doesNotMatch(legend, /touch-action:\s*none/,
  'The panel must not disable native touch gestures before application initialization');
assert.match(css, /\.legend-pill-list\s*\{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  'Open native disclosures must retain two equal-width columns without a JavaScript display override');
console.log('Native filter disclosure tests passed');

// Reproduce mixed PWA versions: old static div headers plus current CSS/JS.
const vm = require('node:vm');
class SectionElement {
  constructor(tagName, className = '', textContent = '') {
    Object.assign(this, { tagName, className, textContent, dataset: {}, childNodes: [], open: false });
    this.style = { display: 'none', removeProperty(name) { delete this[name]; } };
  }
  append(child) { this.childNodes.push(child); }
  querySelector(selector) {
    return this.childNodes.find(child => selector === '.legend-toggle'
      ? child.className === 'legend-toggle' : `#${child.id}` === selector) || null;
  }
  replaceWith(replacement) { roots[roots.indexOf(this)] = replacement; }
}
function legacySection(label, expanded) {
  const section = new SectionElement('DIV', 'legend-section');
  const header = new SectionElement('DIV', 'legend-toggle', `${expanded ? '▼' : '▶'} ${label}`);
  header.dataset.target = `#${label}`;
  const content = new SectionElement('DIV');
  content.id = label;
  const control = { id: 'preserved-control' };
  content.childNodes.push(control);
  section.childNodes.push(header, content);
  return { section, content, control };
}
const closed = legacySection('Tokens', false);
const expanded = legacySection('Blockchain', true);
const roots = [closed.section, expanded.section];
const context = { document: {
  querySelectorAll: () => [...roots],
  createElement: tagName => new SectionElement(tagName.toUpperCase())
} };
const migration = script.match(/function initializeLegendDisclosures\(\) \{[\s\S]*?\n\}/)[0];
vm.runInNewContext(`${migration}; initializeLegendDisclosures();`, context);
assert.equal(roots[0].tagName, 'DETAILS');
assert.equal(roots[0].childNodes[0].tagName, 'SUMMARY');
assert.equal(roots[0].childNodes[0].textContent, 'Tokens');
assert.equal(roots[0].open, false);
assert.equal(roots[1].open, true);
assert.equal(closed.content.style.display, undefined, 'Old inline hiding must not survive migration');
assert.equal(roots[0].childNodes[1].childNodes[0], closed.control, 'Preserve existing controls and listeners');
const first = roots[0];
vm.runInNewContext(`${migration}; initializeLegendDisclosures();`, context);
assert.equal(roots[0], first, 'Initialization is idempotent');
assert.match(script, /document\.addEventListener\("DOMContentLoaded", \(\) => \{\s*initializeLegendDisclosures\(\);/);
console.log('Cached HTML filter migration tests passed');
