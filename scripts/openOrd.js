// scripts/openOrd.js
self.onmessage = function (e) {
  const { nodes, edges, settings } = e.data;

  const iterations = settings.iterations || 500;
  const edgeWeightInfluence = settings.edgeWeightInfluence || 0.5;
  const coolingFactor = settings.coolingFactor || 0.95;
  const attractionMultiplier = settings.attractionMultiplier || 0.1;
  const repulsionMultiplier = settings.repulsionMultiplier || 1.0;
  const clusterCount = settings.initialClusterCount || 5;

  // Initialize positions randomly
  const positions = {};
  nodes.forEach(n => {
    positions[n.id] = {
      x: n.x ?? (Math.random() * 1000 - 500),
      y: n.y ?? (Math.random() * 1000 - 500)
    };
  });

  function clonePositions(pos) {
    const copy = {};
    for (const id in pos) {
      copy[id] = { x: pos[id].x, y: pos[id].y };
    }
    return copy;
  }


  // Cluster assignment
  const clusters = {};
  for (const node of nodes) {
    clusters[node.id] = Math.floor(Math.random() * clusterCount);
  }

  let temperature = 1.0;

  for (let i = 0; i < iterations; i++) {
    const displacements = {};

    // Initialize displacement
    for (const node of nodes) {
      displacements[node.id] = { x: 0, y: 0 };
    }

    // Repulsion
    for (let j = 0; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const nodeA = nodes[j];
        const nodeB = nodes[k];

        const dx = positions[nodeA.id].x - positions[nodeB.id].x;
        const dy = positions[nodeA.id].y - positions[nodeB.id].y;
        const distance = Math.sqrt(dx * dx + dy * dy) + 0.01;

        const force = repulsionMultiplier / distance;

        displacements[nodeA.id].x += (dx / distance) * force;
        displacements[nodeA.id].y += (dy / distance) * force;
        displacements[nodeB.id].x -= (dx / distance) * force;
        displacements[nodeB.id].y -= (dy / distance) * force;
      }
    }

    // Attraction
    for (const edge of edges) {
      const source = edge.source;
      const target = edge.target;

      const dx = positions[source].x - positions[target].x;
      const dy = positions[source].y - positions[target].y;
      const distance = Math.sqrt(dx * dx + dy * dy) + 0.01;

      const weight = edge.weight || 1;
      const force = (weight ** edgeWeightInfluence) * attractionMultiplier * distance;

      displacements[source].x -= (dx / distance) * force;
      displacements[source].y -= (dy / distance) * force;
      displacements[target].x += (dx / distance) * force;
      displacements[target].y += (dy / distance) * force;
    }

    // Update positions
    for (const node of nodes) {
      const disp = displacements[node.id];
      positions[node.id].x += disp.x * temperature;
      positions[node.id].y += disp.y * temperature;
    }

    // Cool down
    temperature *= coolingFactor;

    if (i % 5 === 0 || i === iterations - 1) {
      self.postMessage({
        type: "progress",
        progress: i / iterations,
        positions: clonePositions(positions)
      });
    }
  }

  self.postMessage({
    type: "done",
    positions: clonePositions(positions)
  });
};
