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
assert.match(html, /<div id="controls">\s*<button id="menu-toggle"/);
assert.match(html, /id="layout-toggle-btn"[^>]+layout-toggle-button/);
const commandOrder = [
  'layout-toggle-btn',
  'filter-toggle-btn',
  'search-icon',
  'notification-button',
  'theme-toggle-btn',
  'fullscreen-toggle',
  'technical-info-button'
].map(id => html.indexOf(`id="${id}"`));
assert.ok(commandOrder.every(index => index >= 0), 'Every primary command should exist');
assert.deepEqual(commandOrder, [...commandOrder].sort((a, b) => a - b), 'Primary commands should keep the requested order');
assert.match(html, /<aside id="left-sidebar" aria-label="Graph settings" aria-hidden="true">/);
assert.match(html, /id="sidebar-close"[^>]+aria-label="Close settings"/);
assert.match(html, /header\.setAttribute\('tabindex', '0'\)/);
assert.match(html, /event\.key === 'Enter' \|\| event\.key === ' '/);

assert.match(css, /@media screen and \(max-width: 768px\)[\s\S]*?#app-container\.sidebar-open\s*\{\s*margin-left: 0;/);
assert.match(css, /#sidebar-backdrop\.visible/);
assert.match(css, /\.sidebar-heading\s*\{[\s\S]*?position: sticky;/);
assert.match(css, /#controls\s*\{[\s\S]*?top: 0;[\s\S]*?left: 0;[\s\S]*?right: 0;[\s\S]*?width: 100%;/);
assert.match(css, /\.layout-toggle-button\.is-running \.layout-run-icon[\s\S]*?animation: layout-button-spin/);
assert.match(css, /#controls > button[\s\S]*?width: 38px !important;[\s\S]*?border: 1px solid/);
assert.match(css, /@media screen and \(min-width: 1180px\)[\s\S]*?\.command-button \.command-label\s*\{\s*display: inline;/);
assert.match(script, /button\.classList\.toggle\("is-running", running\)/);
assert.match(script, /FILTER_PANEL_VISIBILITY_KEY = "minagraphFilterPanelVisible"/);
assert.match(script, /localStorage\.setItem\(FILTER_PANEL_VISIBILITY_KEY, String\(isFilterPanelVisible\)\)/);
assert.match(script, /function setFilterPanelVisible\(visible,/);
assert.match(script, /animateLayout\(null, "initial"\);/);
assert.match(script, /searchButton\.dataset\.searchInitialized === "true"/);
assert.match(script, /const shouldShow = searchDiv\.style\.display !== "block";/);
assert.match(css, /#notification-list\s*\{[\s\S]*?top: calc\(100% \+ 6px\) !important;/);
assert.match(css, /#searchdiv\s*\{[\s\S]*?top: calc\(100% \+ 6px\);/);

console.log('Sidebar panel tests passed');
