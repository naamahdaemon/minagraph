const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '..', 'style', 'style.css'), 'utf8');
const manifest = fs.readFileSync(path.resolve(__dirname, '..', 'manifest.webmanifest'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

assert.match(source, /document\.documentElement\.requestFullscreen\(\{ navigationUI: "hide" \}\)/);
assert.match(source, /nativeFullscreenActive && document\.exitFullscreen/);
assert.match(source, /document\.addEventListener\("fullscreenchange", \(\) => \{\s*setFullscreenMode\(Boolean\(document\.fullscreenElement\)\);/);
assert.match(source, /function setFullscreenMode\(active\) \{\s*isFullscreen = active;/);
assert.match(source, /function setFullscreenUiVisible\(visible\)/);
assert.match(source, /const interfaceCanShowFilters = !isFullscreen \|\| fullscreenUiVisible;/);
assert.match(source, /function setFullscreenUiVisible\(visible\)[\s\S]*?setFilterPanelVisible\(isFilterPanelVisible, \{ persist: false \}\);/);
assert.match(source, /if \(isFullscreen && fullscreenUiVisible\) \{\s*setFullscreenUiVisible\(false\);/);
assert.match(source, /if \(isFullscreen\) \{\s*event\.preventDefault\(\);\s*setFullscreenUiVisible\(!fullscreenUiVisible\);/);
assert.match(source, /Native fullscreen unavailable; using in-page mode/);
assert.match(css, /body\.mobile-mode\.fullscreen-mode #sigma-container\s*\{[\s\S]*?height: 100dvh !important;/);
assert.match(css, /body\.fullscreen-mode #app-container,[\s\S]*?width: 100%;/);
assert.match(css, /body\.fullscreen-mode\.fullscreen-ui-visible #controls/);
assert.match(css, /body\.fullscreen-mode\.fullscreen-ui-visible #date-slicer-container/);
assert.match(css, /body\.fullscreen-mode\.fullscreen-ui-visible #legend\.legend-box[\s\S]*?var\(--z-floating-panel\)/);
assert.match(css, /--z-command-bar: 1000;[\s\S]*?--z-floating-panel: 1120;[\s\S]*?--z-modal: 10000;/);
assert.match(css, /body\.fullscreen-mode #app-container\.sidebar-open\s*\{[\s\S]*?margin-left: 0;/);
assert.doesNotMatch(css, /body\.mobile-mode\.fullscreen-mode #sigma-container\s*\{[\s\S]*?width: 100vw !important;/);
assert.equal(JSON.parse(manifest).display, 'fullscreen');
assert.match(html, /viewport-fit=cover/);
assert.match(source, /if \(renderer\?\.resize\) renderer\.resize\(\)/);

console.log('Fullscreen tests passed');
