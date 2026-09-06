// Experimental multi-phase force layout inspired by OpenOrd.
// It is not a byte-for-byte implementation of the original OpenOrd engine.
self.onmessage = function (event) {
  const { nodes, edges, settings } = event.data;
  const iterations = Math.max(1, Math.floor(settings.iterations ?? 500));
  const edgeWeightInfluence = Math.max(0, settings.edgeWeightInfluence ?? 0.5);
  const coolingFactor = Math.min(1, Math.max(0.5, settings.coolingFactor ?? 0.95));
  const attractionMultiplier = Math.max(0.0001, settings.attractionMultiplier ?? 0.1);
  const repulsionMultiplier = Math.max(0.0001, settings.repulsionMultiplier ?? 1);
  const gravity = Math.max(0, settings.gravity ?? 0.01);
  const scalingRatio = Math.max(0.0001, settings.scalingRatio ?? 1000);
  const width = Math.max(1, settings.width ?? 2000);
  const height = Math.max(1, settings.height ?? 2000);
  const centerX = width / 2;
  const centerY = height / 2;
  const nodeCount = nodes.length;

  if (!nodeCount) {
    self.postMessage({ type: "done", positions: {} });
    return;
  }

  const hash = value => {
    let result = 2166136261;
    for (const character of String(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  };
  const finiteInput = nodes.filter(node => Number.isFinite(node.x) && Number.isFinite(node.y));
  const bounds = finiteInput.reduce((result, node) => ({
    minX: Math.min(result.minX, node.x), maxX: Math.max(result.maxX, node.x),
    minY: Math.min(result.minY, node.y), maxY: Math.max(result.maxY, node.y)
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  const inputWidth = Math.max(1, bounds.maxX - bounds.minX);
  const inputHeight = Math.max(1, bounds.maxY - bounds.minY);
  const idealDistance = Math.max(1, Math.sqrt((width * height) / nodeCount) * Math.sqrt(scalingRatio / 1000));
  const positions = {};

  nodes.forEach((node, index) => {
    const hasPosition = Number.isFinite(node.x) && Number.isFinite(node.y);
    const goldenAngle = index * 2.399963229728653;
    const fallbackRadius = Math.sqrt(index + 1) * idealDistance * 0.45;
    const baseX = hasPosition
      ? width * 0.15 + ((node.x - bounds.minX) / inputWidth) * width * 0.7
      : centerX + Math.cos(goldenAngle) * fallbackRadius;
    const baseY = hasPosition
      ? height * 0.15 + ((node.y - bounds.minY) / inputHeight) * height * 0.7
      : centerY + Math.sin(goldenAngle) * fallbackRadius;
    const angle = (hash(node.id) / 0xffffffff) * Math.PI * 2;
    const jitter = idealDistance * 0.12;
    positions[node.id] = {
      x: baseX + Math.cos(angle) * jitter,
      y: baseY + Math.sin(angle) * jitter
    };
  });

  const clonePositions = () => Object.fromEntries(nodes.map(node => [node.id, {
    x: positions[node.id].x,
    y: positions[node.id].y
  }]));
  const phases = [
    { end: 0.15, attraction: 0.30, repulsion: 1.80, shake: 0.10 },
    { end: 0.40, attraction: 0.55, repulsion: 1.45, shake: 0.045 },
    { end: 0.65, attraction: 0.85, repulsion: 1.00, shake: 0.015 },
    { end: 0.85, attraction: 1.10, repulsion: 0.72, shake: 0.004 },
    { end: 1.00, attraction: 0.90, repulsion: 0.45, shake: 0 }
  ];
  const initialTemperature = Math.max(idealDistance * 1.5, Math.min(width, height) * 0.035);
  const finalTemperature = Math.max(idealDistance * 0.012, 0.05);
  const reportEvery = Math.max(1, Math.floor(iterations / 100));

  for (let iteration = 0; iteration < iterations; iteration++) {
    const progress = iterations === 1 ? 1 : iteration / (iterations - 1);
    const phase = phases.find(candidate => progress <= candidate.end) || phases[phases.length - 1];
    const scheduledTemperature = initialTemperature * Math.pow(finalTemperature / initialTemperature, progress);
    const temperature = scheduledTemperature * Math.pow(coolingFactor, progress * 10);
    const displacements = Object.fromEntries(nodes.map(node => [node.id, { x: 0, y: 0 }]));

    const sampleCount = nodeCount <= 400 ? nodeCount - 1 : Math.min(64, nodeCount - 1);
    for (let leftIndex = 0; leftIndex < nodeCount; leftIndex++) {
      const left = nodes[leftIndex];
      const comparisons = nodeCount <= 400 ? nodeCount - leftIndex - 1 : sampleCount;
      for (let offset = 1; offset <= comparisons; offset++) {
        const sampledJump = nodeCount > 1
          ? 1 + (((hash(left.id) + Math.imul(offset, 2654435761)) >>> 0) % (nodeCount - 1))
          : 0;
        const rightIndex = nodeCount <= 400 ? leftIndex + offset : (leftIndex + sampledJump) % nodeCount;
        if (rightIndex === leftIndex) continue;
        const right = nodes[rightIndex];
        let dx = positions[left.id].x - positions[right.id].x;
        let dy = positions[left.id].y - positions[right.id].y;
        let distance = Math.hypot(dx, dy);
        if (distance < 0.001) {
          const angle = ((hash(left.id) ^ hash(right.id)) / 0xffffffff) * Math.PI * 2;
          dx = Math.cos(angle) * 0.001;
          dy = Math.sin(angle) * 0.001;
          distance = 0.001;
        }
        const samplingScale = nodeCount <= 400 ? 1 : (nodeCount - 1) / sampleCount;
        const force = phase.repulsion * repulsionMultiplier * idealDistance * idealDistance * samplingScale / distance;
        const forceX = dx / distance * force;
        const forceY = dy / distance * force;
        displacements[left.id].x += forceX;
        displacements[left.id].y += forceY;
        displacements[right.id].x -= forceX;
        displacements[right.id].y -= forceY;
      }
    }

    for (const edge of edges) {
      if (!positions[edge.source] || !positions[edge.target]) continue;
      const dx = positions[edge.source].x - positions[edge.target].x;
      const dy = positions[edge.source].y - positions[edge.target].y;
      const distance = Math.max(0.001, Math.hypot(dx, dy));
      const weight = Math.max(0.0001, Number(edge.weight) || 1);
      const weightedAttraction = Math.pow(weight, edgeWeightInfluence);
      const force = phase.attraction * attractionMultiplier * weightedAttraction * distance * distance / idealDistance;
      const forceX = dx / distance * force;
      const forceY = dy / distance * force;
      displacements[edge.source].x -= forceX;
      displacements[edge.source].y -= forceY;
      displacements[edge.target].x += forceX;
      displacements[edge.target].y += forceY;
    }

    nodes.forEach(node => {
      const position = positions[node.id];
      const displacement = displacements[node.id];
      displacement.x += (centerX - position.x) * gravity * phase.repulsion;
      displacement.y += (centerY - position.y) * gravity * phase.repulsion;
      if (phase.shake) {
        const angle = ((hash(node.id) + iteration * 2654435761) >>> 0) / 0xffffffff * Math.PI * 2;
        displacement.x += Math.cos(angle) * idealDistance * phase.shake;
        displacement.y += Math.sin(angle) * idealDistance * phase.shake;
      }
      const magnitude = Math.hypot(displacement.x, displacement.y);
      if (!Number.isFinite(magnitude) || magnitude === 0) return;
      const step = Math.min(magnitude, temperature) / magnitude;
      position.x += displacement.x * step;
      position.y += displacement.y * step;
    });

    if (iteration % reportEvery === 0 || iteration === iterations - 1) {
      self.postMessage({ type: "progress", progress: (iteration + 1) / iterations, positions: clonePositions() });
    }
  }

  self.postMessage({ type: "done", positions: clonePositions() });
};
