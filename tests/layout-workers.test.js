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
assert.notDeepEqual(frResult.positions.a, frResult.positions.b, "FR should separate coincident nodes");

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
