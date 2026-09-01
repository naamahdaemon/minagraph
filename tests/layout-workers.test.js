const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function runWorker(filename, data) {
  const messages = [];
  const self = {
    postMessage(message) {
      messages.push(structuredClone(message));
    }
  };
  const source = fs.readFileSync(path.join(projectRoot, "scripts", filename), "utf8");
  vm.runInNewContext(source, { self, console, Math });
  self.onmessage({ data });
  return messages.findLast(message => message.type === "done");
}

function assertFinitePositions(positions) {
  if (ArrayBuffer.isView(positions)) {
    for (const coordinate of positions) assert.equal(Number.isFinite(coordinate), true);
    return;
  }
  for (const position of Object.values(positions)) {
    assert.equal(Number.isFinite(position.x), true);
    assert.equal(Number.isFinite(position.y), true);
  }
}

const coincidentGraph = {
  nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 0, y: 0 }],
  edges: [],
  settings: { iterations: 1, gravity: 0, scalingRatio: 10, width: 100, height: 100 }
};
const frResult = runWorker("fruchtermanReingold.js", coincidentGraph);
assertFinitePositions(frResult.positions);
assert.equal(frResult.packed, true, "FR should return compact packed positions");
assert.notDeepEqual(
  Array.from(frResult.positions.slice(0, 2)),
  Array.from(frResult.positions.slice(2, 4)),
  "FR should separate coincident nodes"
);

const iterationGraph = {
  nodes: [{ id: "a", x: 10, y: 10 }, { id: "b", x: 90, y: 90 }],
  edges: [{ source: "a", target: "b", weight: 1 }],
  settings: { iterations: 1, gravity: 0.01, scalingRatio: 100, width: 100, height: 100 }
};
const oneIteration = runWorker("fruchtermanReingold.js", iterationGraph);
const fiveIterations = runWorker("fruchtermanReingold.js", {
  ...iterationGraph,
  settings: { ...iterationGraph.settings, iterations: 5 }
});
assert.notDeepEqual(
  Array.from(oneIteration.positions),
  Array.from(fiveIterations.positions),
  "FR should honor the requested iteration count"
);

function runForceAtlas(strongGravityMode) {
  return runWorker("forceAtlas.js", {
    nodes: [{ id: "a", x: 90, y: 50 }],
    edges: [],
    settings: {
      iterations: 1,
      gravity: 1,
      scalingRatio: 1,
      width: 100,
      height: 100,
      strongGravityMode
    }
  });
}
const weakGravity = runForceAtlas(false);
const strongGravity = runForceAtlas(true);
assert.notEqual(
  weakGravity.positions.a.x,
  strongGravity.positions.a.x,
  "ForceAtlas gravity modes should produce different movement"
);

const forceAtlasSource = fs.readFileSync(path.join(projectRoot, "scripts", "forceAtlas.js"), "utf8");
assert.match(forceAtlasSource, /masses\[node\.id\] = 1 \+ degrees\[node\.id\]/);
assert.match(forceAtlasSource, /const outboundAttractionCompensation = nodes\.length \? totalMass \/ nodes\.length : 1/);
assert.match(forceAtlasSource, /attraction \*= outboundAttractionCompensation \/ masses\[src\]/);
assert.doesNotMatch(forceAtlasSource, /attraction \/= degrees\[src\]/);

function runOpenOrd(weight) {
  return runWorker("openOrd.js", {
    nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 10, y: 0 }],
    edges: [{ source: "a", target: "b", weight }],
    settings: {
      iterations: 1,
      edgeWeightInfluence: 0,
      coolingFactor: 0.95,
      attractionMultiplier: 0.1,
      repulsionMultiplier: 1
    }
  });
}
assert.deepEqual(
  runOpenOrd(1).positions,
  runOpenOrd(100).positions,
  "OpenOrd edgeWeightInfluence=0 should ignore edge weights"
);

console.log("Layout worker tests passed");
