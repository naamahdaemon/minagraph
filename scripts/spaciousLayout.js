// Spacious layout: an isolated force-directed pipeline followed by a dedicated
// collision-removal pass. Positions are only returned when every stage has
// completed with finite coordinates, allowing the caller to apply them atomically.
self.onmessage = function (event) {
  const { nodes = [], edges = [], settings = {} } = event.data || {};
  const count = nodes.length;
  const width = Math.max(1, Number(settings.width) || 2400);
  const height = Math.max(1, Number(settings.height) || 2400);
  const requestedIterations = Math.max(1, Math.floor(Number(settings.iterations) || 1200));
  const forceIterations = requestedIterations;
  const collisionIterations = Math.max(24, Math.min(120, Math.ceil(Math.sqrt(count || 1) * 7)));
  const area = width * height;
  const naturalSpacing = Math.max(18, Math.sqrt(area / Math.max(1, count)) * 0.42);
  const idealEdgeLength = naturalSpacing * 1.65;
  const gravity = Math.max(0, Number(settings.gravity) || 0.01);
  const repulsionScale = Math.max(0.1, Number(settings.scalingRatio) || 1000);
  const x = new Float64Array(count);
  const y = new Float64Array(count);
  const dx = new Float64Array(count);
  const dy = new Float64Array(count);
  const radius = new Float64Array(count);
  const degrees = new Float64Array(count);
  const indexes = new Map(nodes.map((node, index) => [node.id, index]));

  for (let index = 0; index < count; index++) {
    const node = nodes[index];
    const angle = index * 2.399963229728653;
    const fallbackRadius = naturalSpacing * Math.sqrt(index + 1) * 0.5;
    x[index] = Number.isFinite(Number(node.x)) ? Number(node.x) : width / 2 + Math.cos(angle) * fallbackRadius;
    y[index] = Number.isFinite(Number(node.y)) ? Number(node.y) : height / 2 + Math.sin(angle) * fallbackRadius;
    radius[index] = Math.max(naturalSpacing * 0.23, Math.min(naturalSpacing * 0.7, (Number(node.size) || 1) * 1.8));
  }

  // Parallel transactions share the same geometric connection. Aggregate them
  // with a square-root weight so activity matters without collapsing endpoints.
  const connections = new Map();
  for (const edge of edges) {
    const source = indexes.get(edge.source);
    const target = indexes.get(edge.target);
    if (source === undefined || target === undefined || source === target) continue;
    const low = Math.min(source, target);
    const high = Math.max(source, target);
    const key = `${low}:${high}`;
    const connection = connections.get(key) || { source: low, target: high, count: 0 };
    connection.count += Math.max(0.1, Number(edge.weight) || 1);
    connections.set(key, connection);
    degrees[source] += 1;
    degrees[target] += 1;
  }
  const indexedEdges = [...connections.values()];

  const separateCoincidentNodes = () => {
    for (let first = 0; first < count; first++) {
      for (let second = first + 1; second < count; second++) {
        if (Math.abs(x[first] - x[second]) > 0.0001 || Math.abs(y[first] - y[second]) > 0.0001) continue;
        const angle = (second + 1) * 2.399963229728653;
        x[second] += Math.cos(angle) * naturalSpacing * 0.1;
        y[second] += Math.sin(angle) * naturalSpacing * 0.1;
      }
    }
  };
  separateCoincidentNodes();

  let lastProgressTime = 0;
  const packPositions = () => {
    const positions = new Float64Array(count * 2);
    for (let index = 0; index < count; index++) {
      positions[index * 2] = x[index];
      positions[index * 2 + 1] = y[index];
    }
    return positions;
  };
  const sendProgress = (progress, force = false) => {
    const now = Date.now();
    if (!force && now - lastProgressTime < 65) return;
    lastProgressTime = now;
    const positions = packPositions();
    self.postMessage({ type: "progress", progress, positions, packed: true }, [positions.buffer]);
  };

  for (let iteration = 0; iteration < forceIterations; iteration++) {
    dx.fill(0);
    dy.fill(0);
    const cooling = Math.max(0.04, 1 - iteration / Math.max(1, forceIterations));

    for (let first = 0; first < count; first++) {
      for (let second = first + 1; second < count; second++) {
        let deltaX = x[first] - x[second];
        let deltaY = y[first] - y[second];
        let distanceSquared = deltaX * deltaX + deltaY * deltaY;
        if (distanceSquared < 0.0001) {
          const angle = (first * 31 + second * 17 + 1) * 0.61803398875;
          deltaX = Math.cos(angle) * 0.01;
          deltaY = Math.sin(angle) * 0.01;
          distanceSquared = 0.0001;
        }
        const distance = Math.sqrt(distanceSquared);
        const minimumDistance = radius[first] + radius[second] + naturalSpacing * 0.22;
        const mass = Math.sqrt((degrees[first] + 1) * (degrees[second] + 1));
        let force = (repulsionScale * mass) / Math.max(distanceSquared, naturalSpacing);
        if (distance < minimumDistance) force += (minimumDistance - distance) * 1.8;
        const forceX = deltaX / distance * force;
        const forceY = deltaY / distance * force;
        dx[first] += forceX;
        dy[first] += forceY;
        dx[second] -= forceX;
        dy[second] -= forceY;
      }
    }

    for (const edge of indexedEdges) {
      const deltaX = x[edge.target] - x[edge.source];
      const deltaY = y[edge.target] - y[edge.source];
      const distance = Math.max(0.01, Math.hypot(deltaX, deltaY));
      const activityWeight = Math.min(3, Math.sqrt(edge.count));
      const force = (distance - idealEdgeLength) * 0.012 * activityWeight;
      const forceX = deltaX / distance * force;
      const forceY = deltaY / distance * force;
      dx[edge.source] += forceX;
      dy[edge.source] += forceY;
      dx[edge.target] -= forceX;
      dy[edge.target] -= forceY;
    }

    for (let index = 0; index < count; index++) {
      dx[index] += (width / 2 - x[index]) * gravity * 0.025;
      dy[index] += (height / 2 - y[index]) * gravity * 0.025;
      const magnitude = Math.hypot(dx[index], dy[index]);
      const maximumStep = naturalSpacing * (0.24 + cooling * 0.76);
      const factor = magnitude > maximumStep ? maximumStep / magnitude : 1;
      x[index] += dx[index] * factor * cooling;
      y[index] += dy[index] * factor * cooling;
    }

    sendProgress((iteration / Math.max(1, forceIterations)) * 0.82);
  }

  // Final collision relaxation. This pass only pushes overlapping discs apart;
  // it never changes graph topology or invokes any of the existing layouts.
  for (let iteration = 0; iteration < collisionIterations; iteration++) {
    let collisions = 0;
    for (let first = 0; first < count; first++) {
      for (let second = first + 1; second < count; second++) {
        let deltaX = x[second] - x[first];
        let deltaY = y[second] - y[first];
        let distance = Math.hypot(deltaX, deltaY);
        const required = radius[first] + radius[second] + naturalSpacing * 0.28;
        if (distance >= required) continue;
        collisions++;
        if (distance < 0.0001) {
          const angle = (first * 13 + second * 29 + 1) * 0.61803398875;
          deltaX = Math.cos(angle);
          deltaY = Math.sin(angle);
          distance = 1;
        }
        const push = (required - distance) * 0.52;
        const pushX = deltaX / distance * push;
        const pushY = deltaY / distance * push;
        x[first] -= pushX;
        y[first] -= pushY;
        x[second] += pushX;
        y[second] += pushY;
      }
    }
    sendProgress(0.82 + ((iteration + 1) / collisionIterations) * 0.17, iteration === collisionIterations - 1);
    if (collisions === 0) break;
  }

  // Fit the successful result inside the configured layout space.
  if (count > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let index = 0; index < count; index++) {
      minX = Math.min(minX, x[index]);
      maxX = Math.max(maxX, x[index]);
      minY = Math.min(minY, y[index]);
      maxY = Math.max(maxY, y[index]);
    }
    const padding = Math.min(width, height) * 0.06;
    const scale = Math.min(
      (width - padding * 2) / Math.max(1, maxX - minX),
      (height - padding * 2) / Math.max(1, maxY - minY)
    );
    for (let index = 0; index < count; index++) {
      x[index] = padding + (x[index] - minX) * scale;
      y[index] = padding + (y[index] - minY) * scale;
      if (!Number.isFinite(x[index]) || !Number.isFinite(y[index])) {
        throw new Error("Spacious layout produced a non-finite coordinate");
      }
    }
  }

  const positions = packPositions();
  self.postMessage({ type: "done", positions, packed: true, atomic: true }, [positions.buffer]);
};
