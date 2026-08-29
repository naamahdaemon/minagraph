// fruchtermanReingold.js
self.onmessage = function (e) {
  const { nodes, edges, settings } = e.data;
  const nodeCount = nodes.length;
  const nodeIndexes = new Map(nodes.map((node, index) => [node.id, index]));
  const x = new Float64Array(nodeCount);
  const y = new Float64Array(nodeCount);
  const dx = new Float64Array(nodeCount);
  const dy = new Float64Array(nodeCount);

  for (let index = 0; index < nodeCount; index++) {
    x[index] = nodes[index].x ?? Math.random() * settings.width;
    y[index] = nodes[index].y ?? Math.random() * settings.height;
  }

  const indexedEdges = [];
  for (const edge of edges) {
    const source = nodeIndexes.get(edge.source);
    const target = nodeIndexes.get(edge.target);
    if (source !== undefined && target !== undefined) indexedEdges.push(source, target);
  }

  const sendPositions = (type, progress) => {
    const positions = new Float64Array(nodeCount * 2);
    for (let index = 0; index < nodeCount; index++) {
      positions[index * 2] = x[index];
      positions[index * 2 + 1] = y[index];
    }
    const message = { type, positions, packed: true };
    if (progress !== undefined) message.progress = progress;
    self.postMessage(message, [positions.buffer]);
  };

  for (let iter = 0; iter < settings.iterations; iter++) {
    dx.fill(0);
    dy.fill(0);

    for (let v = 0; v < nodeCount; v++) {
      for (let u = 0; u < nodeCount; u++) {
        if (v === u) continue;
        let deltaX = x[v] - x[u];
        let deltaY = y[v] - y[u];
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < 0.0001) {
          const angle = Math.random() * Math.PI * 2;
          deltaX = Math.cos(angle) * 0.01;
          deltaY = Math.sin(angle) * 0.01;
          distance = 0.01;
        }
        const repulsion = settings.scalingRatio * settings.scalingRatio / distance;
        dx[v] += deltaX / distance * repulsion;
        dy[v] += deltaY / distance * repulsion;
      }
    }

    for (let edgeIndex = 0; edgeIndex < indexedEdges.length; edgeIndex += 2) {
      const source = indexedEdges[edgeIndex];
      const target = indexedEdges[edgeIndex + 1];
      const deltaX = x[source] - x[target];
      const deltaY = y[source] - y[target];
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + 0.01;
      const attraction = distance * distance / settings.scalingRatio;
      const normalizedX = deltaX / distance * attraction;
      const normalizedY = deltaY / distance * attraction;
      dx[source] -= normalizedX;
      dy[source] -= normalizedY;
      dx[target] += normalizedX;
      dy[target] += normalizedY;
    }

    for (let v = 0; v < nodeCount; v++) {
      const displacement = Math.sqrt(dx[v] * dx[v] + dy[v] * dy[v]);
      if (displacement > 0) {
        x[v] += (dx[v] / displacement) * Math.min(displacement, 10);
        y[v] += (dy[v] / displacement) * Math.min(displacement, 10);
      }
      x[v] -= settings.gravity * (x[v] - settings.width / 2) * 0.01;
      y[v] -= settings.gravity * (y[v] - settings.height / 2) * 0.01;
    }

    if (iter % 10 === 0 || iter === settings.iterations - 1) {
      sendPositions("progress", iter / settings.iterations);
    }
  }

  sendPositions("done");
};
