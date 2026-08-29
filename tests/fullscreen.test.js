const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '..', 'style', 'style.css'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

assert.match(source, /document\.documentElement\.requestFullscreen\(\{ navigationUI: "hide" \}\)/);
assert.match(source, /nativeFullscreenActive && document\.exitFullscreen/);
assert.match(source, /document\.addEventListener\("fullscreenchange", \(\) => \{\s*setFullscreenMode\(Boolean\(document\.fullscreenElement\)\);/);
assert.match(source, /function setFullscreenMode\(active\) \{\s*isFullscreen = active;/);
assert.match(source, /Native fullscreen unavailable; using in-page mode/);
assert.match(css, /body\.mobile-mode\.fullscreen-mode #sigma-container\s*\{[\s\S]*?height: 100dvh !important;/);
assert.match(html, /name="viewport" content="width=device-width, initial-scale=1\.0, viewport-fit=cover"/);
assert.match(css, /#main-content\s*\{[\s\S]*?padding-top: calc\(54px \+ env\(safe-area-inset-top, 0px\)\);/);

console.log('Fullscreen tests passed');
