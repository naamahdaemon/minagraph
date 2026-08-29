const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scripts', 'script.js'), 'utf8');

assert.match(source, /document\.documentElement\.requestFullscreen\(\{ navigationUI: "hide" \}\)/);
assert.match(source, /nativeFullscreenActive && document\.exitFullscreen/);
assert.match(source, /document\.addEventListener\("fullscreenchange", \(\) => \{\s*setFullscreenMode\(Boolean\(document\.fullscreenElement\)\);/);
assert.match(source, /function setFullscreenMode\(active\) \{\s*isFullscreen = active;/);
assert.match(source, /Native fullscreen unavailable; using in-page mode/);

console.log('Fullscreen tests passed');
