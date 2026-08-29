const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sigma = fs.readFileSync(path.join(root, 'scripts', 'sigma.umd.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.match(sigma, /previousPixelRatio = this\.pixelRatio/);
assert.match(sigma, /previousPixelRatio === this\.pixelRatio/);
assert.doesNotMatch(sigma, /this\.width \* this\.pixelRatio \+ "px"/);
assert.match(script, /visualViewport\?\.addEventListener\('resize', scheduleSigmaViewportSync\)/);
assert.match(script, /renderer\.resize\(true\)/);
assert.match(script, /webglcontextlost/);
assert.match(script, /webglcontextrestored/);
assert.match(script, /collectSigmaRenderingDiagnostics/);
assert.match(worker, /'\/scripts\/sigma\.umd\.js'/);

console.log('Sigma rendering resilience tests passed');
