// layoutWorker.js
self.onmessage = function (e) {
  const { nodes, edges, settings } = e.data;
  const positions = {};

  for (const node of nodes) {
    positions[node.id] = {
      x: node.x ?? Math.random() * settings.width,
      y: node.y ?? Math.random() * settings.height
    };
  }

  for (let iter = 0; iter < settings.iterations; iter++) {
    const disp = {};

    for (const v of nodes) {
      disp[v.id] = { x: 0, y: 0 };
      for (const u of nodes) {
        if (v.id !== u.id) {
          const dx = positions[v.id].x - positions[u.id].x;
          const dy = positions[v.id].y - positions[u.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
          const repulsion = settings.scalingRatio * settings.scalingRatio / dist;
          disp[v.id].x += dx / dist * repulsion;
          disp[v.id].y += dy / dist * repulsion;
        }
      }
    }

    for (const edge of edges) {
      const dx = positions[edge.source].x - positions[edge.target].x;
      const dy = positions[edge.source].y - positions[edge.target].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const attraction = dist * dist / settings.scalingRatio;
      const dxNorm = dx / dist * attraction;
      const dyNorm = dy / dist * attraction;

      disp[edge.source].x -= dxNorm;
      disp[edge.source].y -= dyNorm;
      disp[edge.target].x += dxNorm;
      disp[edge.target].y += dyNorm;
    }

    for (const v of nodes) {
      const d = Math.sqrt(disp[v.id].x ** 2 + disp[v.id].y ** 2);
      if (d > 0) {
        positions[v.id].x += (disp[v.id].x / d) * Math.min(d, 10);
        positions[v.id].y += (disp[v.id].y / d) * Math.min(d, 10);
      }
      positions[v.id].x -= settings.gravity * (positions[v.id].x - settings.width / 2) * 0.01;
      positions[v.id].y -= settings.gravity * (positions[v.id].y - settings.height / 2) * 0.01;
    }

    // Send progress every 10 iterations
    if (iter % 10 === 0 || iter === settings.iterations - 1) {
      self.postMessage({
        type: "progress",
        progress: iter / settings.iterations,
        positions
      });
    }
  }

  self.postMessage({ type: "done", positions });
};
