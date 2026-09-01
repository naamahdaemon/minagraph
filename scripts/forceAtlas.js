self.onmessage = function (e) {
  const { nodes, edges, settings } = e.data;

  const positions = {};
  const oldPositions = {};
  const swinging = {};
  const traction = {};
  const degrees = {};
  const masses = {};
  let speed = 1.0;

  const defaultSettings = {
    iterations: 1000,
    gravity: 1.0,
    scalingRatio: 10.0,
    outboundAttractionDistribution: false,
    linLogMode: false,
    strongGravityMode: false,
    preventOverlap: true,
    width: 1000,
    height: 1000
  };

  const s = Object.assign({}, defaultSettings, settings);

  for (const node of nodes) {
    positions[node.id] = {
      x: node.x ?? Math.random() * s.width,
      y: node.y ?? Math.random() * s.height
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

  // ForceAtlas2 defines a node's mass as 1 + degree. Minagraph transaction
  // edges are directed, but their direction must not arbitrarily change the
  // visual length of a connection. Use the heavier endpoint as the hub and a
  // square-root compensation: this still distributes a hub's attraction while
  // avoiding the extreme weakening caused by dividing linearly by its mass.
  let totalMass = 0;
  for (const node of nodes) {
    masses[node.id] = 1 + degrees[node.id];
    totalMass += masses[node.id];
  }
  const outboundAttractionCompensation = nodes.length ? totalMass / nodes.length : 1;

  for (let iter = 0; iter < s.iterations; iter++) {
    const disp = {};
    for (const node of nodes) disp[node.id] = { x: 0, y: 0 };

    // Repulsion (node-node)
    for (let i = 0; i < nodes.length; i++) {
      const v = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const u = nodes[j];
        let dx = positions[v.id].x - positions[u.id].x;
        let dy = positions[v.id].y - positions[u.id].y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.0001) {
          const angle = ((i + 1) * 2.399963229728653) % (Math.PI * 2);
          dx = Math.cos(angle) * 0.01;
          dy = Math.sin(angle) * 0.01;
          dist = 0.01;
        }

        // Prevent overlap
        if (s.preventOverlap && dist < 1) dist = 1;

        let repulsion = s.scalingRatio * masses[v.id] * masses[u.id];
        repulsion /= dist;

        const forceX = dx / dist * repulsion;
        const forceY = dy / dist * repulsion;

        disp[v.id].x += forceX;
        disp[v.id].y += forceY;
        disp[u.id].x -= forceX;
        disp[u.id].y -= forceY;
      }
    }

    // Attraction (edges)
    for (const edge of edges) {
      const src = edge.source;
      const tgt = edge.target;

      const dx = positions[src].x - positions[tgt].x;
      const dy = positions[src].y - positions[tgt].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

      let attraction = (edge.weight ?? 1);
      if (s.outboundAttractionDistribution) {
        const distributionMass = Math.max(masses[src], masses[tgt]);
        const distributionFactor = Math.min(
          1,
          Math.sqrt(outboundAttractionCompensation / distributionMass)
        );
        attraction *= distributionFactor;
      }

      if (s.linLogMode) {
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
      const dx = positions[node.id].x - s.width / 2;
      const dy = positions[node.id].y - s.height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

      let gravityForce = s.gravity;
      if (s.strongGravityMode) {
        disp[node.id].x -= dx * gravityForce;
        disp[node.id].y -= dy * gravityForce;
      } else {
        disp[node.id].x -= dx / dist * gravityForce;
        disp[node.id].y -= dy / dist * gravityForce;
      }
    }

    // Adaptive movement
    for (const node of nodes) {
      const id = node.id;
      const dx = disp[id].x;
      const dy = disp[id].y;

      swinging[id] = Math.sqrt((positions[id].x - oldPositions[id].x - dx) ** 2 + (positions[id].y - oldPositions[id].y - dy) ** 2);
      traction[id] = Math.sqrt(dx * dx + dy * dy);

      oldPositions[id] = { ...positions[id] };

      const factor = speed / (1 + Math.sqrt(dx * dx + dy * dy));
      positions[id].x += dx * factor;
      positions[id].y += dy * factor;
    }

    // Convergence control
    let totalSwinging = 0;
    let totalTraction = 0;
    for (const node of nodes) {
      totalSwinging += degrees[node.id] * swinging[node.id];
      totalTraction += degrees[node.id] * traction[node.id];
    }

    const efficiency = totalTraction / (totalSwinging + 0.01);
    speed = speed * 0.5 + Math.min(10.0, Math.max(0.1, efficiency)) * 0.5;

    if (iter % 10 === 0 || iter === s.iterations - 1) {
      self.postMessage({
        type: "progress",
        progress: iter / s.iterations,
        positions
      });
    }
  }

  self.postMessage({ type: "done", positions });
};
