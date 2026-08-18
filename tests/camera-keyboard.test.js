const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');

assert.match(html, /id="sigma-container"[^>]*tabindex="0"/);
assert.match(script, /function handleGraphKeyboardNavigation\(event\)/);
assert.match(script, /document\.activeElement !== sigmaContainer/);
assert.match(script, /event\.shiftKey/);
assert.match(script, /ArrowLeft/);
assert.match(script, /ArrowRight/);
assert.match(script, /ArrowUp/);
assert.match(script, /ArrowDown/);
assert.match(script, /sigmaContainer\.addEventListener\("pointerdown"/);

console.log('Camera keyboard tests passed');
