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
assert.match(forceAtlasSource, /Math\.pow\(outboundAttractionCompensation \/ masses\[src\], 0\.75\)/);
assert.doesNotMatch(forceAtlasSource, /attraction \/= degrees\[src\]/);

const directedHubGraph = {
  nodes: [
    { id: "hub", x: 50, y: 50 },
    { id: "a", x: 10, y: 20 },
    { id: "b", x: 90, y: 20 },
    { id: "c", x: 50, y: 90 }
  ],
  edges: [
    { source: "hub", target: "a", weight: 1 },
    { source: "b", target: "hub", weight: 1 },
    { source: "hub", target: "c", weight: 1 }
  ],
  settings: {
    iterations: 20,
    gravity: 0.01,
    scalingRatio: 10,
    width: 100,
    height: 100,
    outboundAttractionDistribution: true
  }
};
const directedHubLayout = runWorker("forceAtlas.js", directedHubGraph);
const reversedHubLayout = runWorker("forceAtlas.js", {
  ...directedHubGraph,
  edges: directedHubGraph.edges.map(edge => ({
    ...edge,
    source: edge.target,
    target: edge.source
  }))
});
assert.notDeepEqual(
  directedHubLayout.positions,
  reversedHubLayout.positions,
  "outbound distribution should preserve transaction direction in the layout"
);

const spaciousResult = runWorker("spaciousLayout.js", {
  nodes: [
    { id: "a", x: 50, y: 50, size: 8 },
    { id: "b", x: 50, y: 50, size: 8 },
    { id: "c", x: 50, y: 50, size: 8 },
    { id: "d", x: 50, y: 50, size: 8 }
  ],
  edges: [
    { source: "a", target: "b", weight: 1 },
    { source: "b", target: "c", weight: 1 },
    { source: "c", target: "d", weight: 1 }
  ],
  settings: { iterations: 80, gravity: 0.01, scalingRatio: 500, width: 800, height: 800 }
});
assert.equal(spaciousResult.packed, true, "Spacious should return compact packed positions");
assert.equal(spaciousResult.atomic, true, "Spacious results must be applied atomically");
assertFinitePositions(spaciousResult.positions);
for (let first = 0; first < 4; first++) {
  for (let second = first + 1; second < 4; second++) {
    const distance = Math.hypot(
      spaciousResult.positions[first * 2] - spaciousResult.positions[second * 2],
      spaciousResult.positions[first * 2 + 1] - spaciousResult.positions[second * 2 + 1]
    );
    assert.ok(distance > 20, "Spacious should separate initially overlapping nodes");
  }
}

const scriptSource = fs.readFileSync(path.join(projectRoot, "scripts", "script.js"), "utf8");
assert.match(scriptSource, /workerFile = "spaciousLayout\.js"/);
assert.match(scriptSource, /const renderInterval = algorithm === "spacious" \? 80 : 300/,
  "Spacious should animate more smoothly without changing existing layout refresh rates");
assert.match(scriptSource, /if \(algorithm === "spacious"\) restoreInitialPositions\(\)/,
  "Spacious must restore initial positions after a worker failure");
assert.match(scriptSource, /Spacious layout returned invalid positions; the graph was left unchanged/);
assert.match(scriptSource, /const layoutScope = document\.getElementById\("layout-scope"\)\?\.value \|\| "all"/);
assert.match(scriptSource, /graph\.edges\(\)\.filter\(edge => playbackFocus/,
  "visible scope should snapshot the focused or actively filtered transactions");
assert.match(scriptSource, /: graphEdgeMatchesActiveView\(edge\)/);
assert.match(scriptSource, /const nodes = layoutNodeIds\.map/,
  "workers should receive only nodes captured by the selected scope");
assert.match(scriptSource, /layoutEdges\.filter\(id =>[\s\S]*?layoutNodeSet\.has\(graph\.source\(id\)\)/,
  "workers should receive only edges whose endpoints are in the scoped node set");
assert.match(scriptSource, /layoutNodeIds\.forEach\(id => \{/,
  "leaving OpenOrd must not randomize nodes outside the selected scope");

const spaciousSource = fs.readFileSync(path.join(projectRoot, "scripts", "spaciousLayout.js"), "utf8");
assert.match(spaciousSource, /now - lastProgressTime < 65/,
  "Spacious progress snapshots should be time-throttled independently of iteration count");
assert.match(spaciousSource, /type: "progress", progress, positions, packed: true/);

for (const nodes of [[], [{ id: "solo", x: 12, y: 34, size: 4 }]]) {
  const boundaryResult = runWorker("spaciousLayout.js", {
    nodes,
    edges: [],
    settings: { iterations: 2, width: 200, height: 200 }
  });
  assert.equal(boundaryResult.positions.length, nodes.length * 2);
  assertFinitePositions(boundaryResult.positions);
}

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

const openOrdCollinear = runWorker("openOrd.js", {
  nodes: [
    { id: "hub", x: 0, y: 0 },
    { id: "a", x: 10, y: 10 },
    { id: "b", x: 20, y: 20 },
    { id: "c", x: 30, y: 30 }
  ],
  edges: [
    { source: "hub", target: "a", weight: 1 },
    { source: "hub", target: "b", weight: 1 },
    { source: "hub", target: "c", weight: 1 }
  ],
  settings: {
    iterations: 120,
    edgeWeightInfluence: 0,
    coolingFactor: 0.95,
    attractionMultiplier: 0.1,
    repulsionMultiplier: 1,
    gravity: 0.01,
    scalingRatio: 1000,
    width: 1000,
    height: 1000
  }
});
assertFinitePositions(openOrdCollinear.positions);
const oa = openOrdCollinear.positions.a;
const ob = openOrdCollinear.positions.b;
const oc = openOrdCollinear.positions.c;
const triangleAreaTwice = Math.abs((ob.x - oa.x) * (oc.y - oa.y) - (ob.y - oa.y) * (oc.x - oa.x));
assert.ok(triangleAreaTwice > 1, "OpenOrd should break inherited collinearity instead of returning a linear graph");

const openOrdSource = fs.readFileSync(path.join(projectRoot, "scripts", "openOrd.js"), "utf8");
assert.match(openOrdSource, /const phases = \[/, "OpenOrd-inspired layout should use a multi-phase schedule");
assert.match(openOrdSource, /Math\.min\(magnitude, temperature\)/, "OpenOrd movement should be temperature-clamped");
for (const setting of ["width", "height", "scalingRatio", "gravity"]) {
  assert.match(openOrdSource, new RegExp(`settings\\.${setting}`),
    `OpenOrd should honor the shared ${setting} control`);
}

console.log("Layout worker tests passed");
