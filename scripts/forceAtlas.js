self.onmessage = function (e) {
  const { nodes, edges, settings } = e.data;

  const positions = {};
  const oldPositions = {};
  const swinging = {};
  const traction = {};
  const degrees = {};
  let speed = 1.0;

  console.log("Force Atals v2");

  // Initialize positions & degrees
  for (const node of nodes) {
    positions[node.id] = {
      x: node.x ?? Math.random() * settings.width,
      y: node.y ?? Math.random() * settings.height
    };
    oldPositions[node.id] = { ...positions[node.id] };
    swinging[node.id] = 0;
    traction[node.id] = 0;
    degrees[node.id] = 0;
  }

  for (const edge of edges) {
    degrees[edge.source]++;
    degrees[edge.target]++;
  }

  for (let iter = 0; iter < settings.iterations; iter++) {
    const disp = {};

    // Initial force vector
    for (const node of nodes) {
      disp[node.id] = { x: 0, y: 0 };
    }

    // Repulsion (node-node)
    for (const v of nodes) {
      for (const u of nodes) {
        if (v.id !== u.id) {
          const dx = positions[v.id].x - positions[u.id].x;
          const dy = positions[v.id].y - positions[u.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

          let repulsion = settings.scalingRatio * (1 + degrees[v.id]) * (1 + degrees[u.id]);
          repulsion /= dist;

          disp[v.id].x += dx / dist * repulsion;
          disp[v.id].y += dy / dist * repulsion;
        }
      }
    }

    // Attraction (edge-based)
    for (const edge of edges) {
      const src = edge.source;
      const tgt = edge.target;
      const dx = positions[src].x - positions[tgt].x;
      const dy = positions[src].y - positions[tgt].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

      let attraction = (edge.weight ?? 1);
      if (settings.outboundAttractionDistribution) {
        attraction /= degrees[src];
      }
      if (settings.linLogMode) {
        attraction *= Math.log(1 + dist) / dist;
      } else {
        attraction *= dist;
      }

      const dxNorm = dx / dist * attraction;
      const dyNorm = dy / dist * attraction;

      disp[src].x -= dxNorm;
      disp[src].y -= dyNorm;
      disp[tgt].x += dxNorm;
      disp[tgt].y += dyNorm;
    }

    // Gravity
    for (const node of nodes) {
      const dx = positions[node.id].x - settings.width / 2;
      const dy = positions[node.id].y - settings.height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const gForce = settings.gravity * dist;

      disp[node.id].x -= dx / dist * gForce;
      disp[node.id].y -= dy / dist * gForce;
    }

    // Adaptive movement using inertia
    for (const node of nodes) {
      const id = node.id;
      const dx = disp[id].x;
      const dy = disp[id].y;

      const deltaX = dx - (positions[id].x - oldPositions[id].x);
      const deltaY = dy - (positions[id].y - oldPositions[id].y);

      swinging[id] = Math.sqrt((positions[id].x - oldPositions[id].x - dx) ** 2 + (positions[id].y - oldPositions[id].y - dy) ** 2);
      traction[id] = Math.sqrt(dx * dx + dy * dy);

      oldPositions[id] = { ...positions[id] };

      const moveX = dx * speed / (1 + Math.sqrt(dx * dx + dy * dy));
      const moveY = dy * speed / (1 + Math.sqrt(dx * dx + dy * dy));

      positions[id].x += moveX;
      positions[id].y += moveY;
    }

    // Global speed adjustment (convergence control)
    let totalSwinging = 0;
    let totalTraction = 0;
    for (const node of nodes) {
      totalSwinging += degrees[node.id] * swinging[node.id];
      totalTraction += degrees[node.id] * traction[node.id];
    }

    const efficiency = totalTraction / totalSwinging;
    if (totalSwinging > 0) {
      speed = speed * 0.5 + Math.min(10.0, Math.max(0.1, efficiency)) * 0.5;
    }

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