const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '..', 'style', 'style.css'), 'utf8');

assert.match(script, /function setLeftSidebarOpen\(open,/);
assert.match(script, /appElement\.classList\.toggle\("sidebar-open", isOpen && isDesktop\)/);
assert.match(script, /sidebarElement\.setAttribute\("aria-hidden", String\(!isOpen\)\)/);
assert.match(script, /setLeftSidebarOpen\(false, \{ restoreFocus: true \}\)/);
assert.match(script, /tag === "select"/);
const closeListener = 'document.getElementById("sidebar-close")?.addEventListener("click"';
assert.equal(script.split(closeListener).length - 1, 1, 'Close listener should only be registered once');
assert.ok(
  script.indexOf(closeListener) < script.indexOf('// Close side panel (right panel)'),
  'Close listener should be registered during the main DOM initialization'
);

assert.match(html, /id="sidebar-backdrop" hidden/);
assert.match(html, /id="menu-toggle"[^>]+aria-controls="left-sidebar"[^>]+aria-expanded="false"/);
assert.match(html, /<aside id="left-sidebar" aria-label="Graph settings" aria-hidden="true">/);
assert.match(html, /id="sidebar-close"[^>]+aria-label="Close settings"/);
assert.match(html, /header\.setAttribute\('tabindex', '0'\)/);
assert.match(html, /event\.key === 'Enter' \|\| event\.key === ' '/);

assert.match(css, /@media screen and \(max-width: 768px\)[\s\S]*?#app-container\.sidebar-open\s*\{\s*margin-left: 0;/);
assert.match(css, /#sidebar-backdrop\.visible/);
assert.match(css, /\.sidebar-heading\s*\{[\s\S]*?position: sticky;/);

console.log('Sidebar panel tests passed');
