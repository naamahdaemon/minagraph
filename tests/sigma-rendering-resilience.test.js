const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sigma = fs.readFileSync(path.join(root, 'scripts', 'sigma.umd.js'), 'utf8');
const script = fs.readFileSync(path.join(root, 'scripts', 'script.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');

assert.match(sigma, /previousPixelRatio = this\.pixelRatio/);
assert.match(sigma, /previousPixelRatio === this\.pixelRatio/);
assert.match(sigma, /__MINAGRAPH_SIGMA_PIXEL_RATIO__/);
assert.match(sigma, /function useMobileChromiumWebGLCompatibility\(/);
assert.match(sigma, /EdgA\\\//);
assert.match(sigma, /devicePixelRatio \|\| 1\) >= 3/);
assert.match(sigma, /if \(!useMobileChromiumWebGLCompatibility\(\)\) context = canvas\.getContext\("webgl2"/);
assert.doesNotMatch(sigma, /this\.width \* this\.pixelRatio \+ "px"/);
assert.match(script, /visualViewport\?\.addEventListener\('resize', scheduleSigmaViewportSync\)/);
assert.match(script, /renderer\.resize\(true\)/);
assert.match(script, /webglcontextlost/);
assert.match(script, /webglcontextrestored/);
assert.match(script, /function rebuildSigmaRendererAfterContextLoss\(/);
assert.match(script, /renderer = new Sigma\(graph, container, settings\)/);
assert.match(script, /failedRenderer\.getCamera\(\)\.getState\(\)/);
assert.match(script, /reduceSigmaPixelRatioAfterContextLoss/);
assert.match(script, /sigmaWebGlLossIncidents/);
assert.match(script, /sigmaWebGlRecoveries/);
assert.match(script, /waitForSigmaWebGlRestoration/);
assert.match(script, /failedRenderer\.webGLContexts = \{\}/);
assert.match(script, /sigmaRecoverySnapshot/);
assert.match(script, /sigmaRecoveryLastError/);
assert.match(script, /WebGL1 compatibility/);
assert.match(script, /collectSigmaRenderingDiagnostics/);
assert.match(worker, /'\/scripts\/sigma\.umd\.js'/);

console.log('Sigma rendering resilience tests passed');
