// scripts/openOrd.js
self.onmessage = function (e) {
  const { nodes, edges, settings } = e.data;
  const iterations = settings.iterations || 500;

  // Initial random clustering
  const clusters = {};
  for (const node of nodes) {
    clusters[node.id] = Math.floor(Math.random() * 5);
  }

  // Simple simulated layout step per cluster
  const positions = {};
  for (let i = 0; i < iterations; i++) {
    for (const node of nodes) {
      const angle = 2 * Math.PI * clusters[node.id] / 5 + Math.random() * 0.1;
      const radius = 500 + Math.random() * 100;
      positions[node.id] = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    }

    self.postMessage({
      type: "progress",
      progress: i / iterations,
      positions
    });
  }

  self.postMessage({
    type: "done",
    positions
  });
};
