(function (global) {
  "use strict";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const finitePoint = point => Number.isFinite(point?.x) && Number.isFinite(point?.y);

  class AdaptiveViewportManager {
    constructor(options = {}) {
      this.options = {
        minDistancePx: 64,
        viewportMarginPercent: 0.08,
        positionStability: 0.18,
        animationDurationMs: 380,
        debounceMs: 180,
        maxIterations: 12,
        maxDisplacementPx: 120,
        aspectAdaptation: 0.5,
        maxAspectScale: 1.6,
        minCameraRatio: 0.25,
        maxCameraRatio: 5,
        ...options,
      };
      this.graph = null;
      this.renderer = null;
      this.enabled = false;
      this.suspended = false;
      this.displayPositions = new Map();
      this.logicalPositions = new Map();
      this.displayApplied = false;
      this.cameraStateBeforeEnable = null;
      this.timer = null;
      this.frame = null;
      this.deferUntil = 0;
      this.generation = 0;
      this.pendingReasons = new Set();
      this.boundCamera = null;
      this.suppressCameraUpdates = false;
      this.cameraSuppressionToken = 0;
      this.boundCameraUpdated = () => {
        if (!this.suppressCameraUpdates) this.schedule("camera");
      };
      this.resizeObserver = null;
      this.viewportMutationObserver = null;
      this.viewportElementListeners = [];
      this.graphListeners = [];
    }

    updateOptions(options = {}) {
      const numeric = (value, fallback, min, max) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
      };
      this.options.minDistancePx = numeric(options.minDistancePx, this.options.minDistancePx, 16, 180);
      this.options.viewportMarginPercent = numeric(options.viewportMarginPercent, this.options.viewportMarginPercent, 0, 0.3);
      this.options.positionStability = numeric(options.positionStability, this.options.positionStability, 0, 1);
      this.options.maxDisplacementPx = numeric(options.maxDisplacementPx, this.options.maxDisplacementPx, 16, 300);
      this.options.aspectAdaptation = numeric(options.aspectAdaptation, this.options.aspectAdaptation, 0, 1);
      if (this.enabled && !this.suspended) {
        this.generation++;
        this.cancelPending();
        this.restoreLogicalPositions();
        this.schedule("settings", { immediate: true });
      }
    }

    setContext({ graph = this.graph, renderer = this.renderer } = {}) {
      const rendererChanged = renderer !== this.renderer;
      this.restoreLogicalPositions();
      this.detachRuntimeListeners();
      this.graph = graph || null;
      this.renderer = renderer || null;
      if (this.enabled) {
        if (rendererChanged) this.captureCameraState();
        this.captureLogicalPositions();
        this.attachRuntimeListeners();
        this.schedule("context", { immediate: true });
      }
    }

    setEnabled(enabled) {
      const next = Boolean(enabled);
      if (next === this.enabled) return;
      this.enabled = next;
      this.generation++;
      this.cancelPending();
      if (next) {
        this.captureCameraState();
        this.captureLogicalPositions();
        this.attachRuntimeListeners();
        this.schedule("enable", { immediate: true });
      } else {
        this.detachRuntimeListeners();
        this.restoreLogicalPositions();
        this.restoreCameraState();
        this.displayPositions.clear();
        this.renderer?.refresh?.();
      }
    }

    suspend() {
      if (this.suspended) return;
      this.suspended = true;
      this.generation++;
      this.cancelPending();
      this.restoreLogicalPositions();
      this.logicalPositions.clear();
      this.displayPositions.clear();
      this.renderer?.refresh?.();
    }

    resume(reason = "resume") {
      if (!this.suspended) {
        if (this.enabled) this.schedule(reason);
        return;
      }
      this.suspended = false;
      if (this.enabled) {
        this.captureLogicalPositions();
        this.schedule(reason, { immediate: true });
      }
    }

    captureLogicalPositions() {
      if (!this.graph) return;
      this.logicalPositions.clear();
      this.graph.forEachNode((node, attributes) => {
        const position = { x: Number(attributes.x), y: Number(attributes.y) };
        if (finitePoint(position)) this.logicalPositions.set(node, position);
      });
      this.displayApplied = false;
    }

    captureCameraState() {
      const state = this.renderer?.getCamera?.()?.getState?.();
      this.cameraStateBeforeEnable = state ? { ...state } : null;
    }

    restoreCameraState() {
      if (!this.cameraStateBeforeEnable) return;
      this.renderer?.getCamera?.()?.setState?.(this.cameraStateBeforeEnable);
      this.cameraStateBeforeEnable = null;
      this.options.onViewportFit?.();
    }

    restoreLogicalPositions() {
      if (!this.graph || !this.displayApplied) return;
      for (const [node, position] of this.logicalPositions) {
        if (!this.graph.hasNode(node)) continue;
        this.graph.setNodeAttribute(node, "x", position.x);
        this.graph.setNodeAttribute(node, "y", position.y);
      }
      this.displayApplied = false;
      this.displayPositions.clear();
      this.renderer?.refresh?.();
    }

    schedule(reason = "update", { immediate = false } = {}) {
      if (!this.enabled || this.suspended) return;
      this.pendingReasons.add(reason);
      clearTimeout(this.timer);
      const deferredDelay = Math.max(0, this.deferUntil - Date.now());
      const delay = Math.max(immediate ? 0 : this.options.debounceMs, deferredDelay);
      this.timer = setTimeout(() => this.recalculate(), delay);
    }

    defer(milliseconds = 0) {
      const duration = Math.max(0, Number(milliseconds) || 0);
      this.deferUntil = Math.max(this.deferUntil, Date.now() + duration);
      if (!this.enabled || this.suspended) return;
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.schedule("interaction-deferred");
    }

    recalculate() {
      this.timer = null;
      if (!this.enabled || this.suspended || !this.graph || !this.renderer) return;
      if (this.options.isBusy?.()) {
        this.schedule("busy");
        return;
      }

      const generation = ++this.generation;
      const reasons = new Set(this.pendingReasons);
      this.pendingReasons.clear();
      const dimensions = this.renderer.getDimensions?.();
      if (!(dimensions?.width > 0 && dimensions?.height > 0)) return;
      const rawInsets = this.options.getViewportInsets?.() || {};
      const insets = {
        left: clamp(Number(rawInsets.left) || 0, 0, dimensions.width * 0.8),
        right: clamp(Number(rawInsets.right) || 0, 0, dimensions.width * 0.8),
        top: clamp(Number(rawInsets.top) || 0, 0, dimensions.height * 0.8),
        bottom: clamp(Number(rawInsets.bottom) || 0, 0, dimensions.height * 0.8),
      };
      const usableViewport = {
        left: insets.left,
        top: insets.top,
        right: Math.max(insets.left + 1, dimensions.width - insets.right),
        bottom: Math.max(insets.top + 1, dimensions.height - insets.bottom),
      };
      usableViewport.width = usableViewport.right - usableViewport.left;
      usableViewport.height = usableViewport.bottom - usableViewport.top;

      const currentNodes = new Set(this.graph.nodes());
      for (const node of this.logicalPositions.keys()) {
        if (!currentNodes.has(node)) this.logicalPositions.delete(node);
      }
      this.graph.forEachNode((node, attributes) => {
        if (this.logicalPositions.has(node)) return;
        const position = { x: Number(attributes.x), y: Number(attributes.y) };
        if (finitePoint(position)) this.logicalPositions.set(node, position);
      });

      const visibleNodes = this.options.getVisibleNodeIds?.() || this.graph.nodes();
      const marginX = usableViewport.width * this.options.viewportMarginPercent;
      const marginY = usableViewport.height * this.options.viewportMarginPercent;
      const candidates = [];
      for (const node of visibleNodes) {
        if (!this.graph.hasNode(node)) continue;
        const logical = {
          x: Number(this.graph.getNodeAttribute(node, "x")),
          y: Number(this.graph.getNodeAttribute(node, "y")),
        };
        if (!finitePoint(logical)) continue;
        const viewport = this.renderer.graphToViewport(logical);
        if (!finitePoint(viewport)) continue;
        // Keep nodes covered by a newly opened sidebar in the candidate set so
        // they can be brought back into the remaining usable viewport.
        if (viewport.x < -marginX || viewport.x > dimensions.width + marginX ||
            viewport.y < -marginY || viewport.y > dimensions.height + marginY) continue;
        candidates.push({
          node,
          logical,
          base: viewport,
          point: { ...viewport },
          fixed: Boolean(this.options.isNodeFixed?.(node, this.graph.getNodeAttributes(node))),
        });
      }

      if (candidates.length < 2) {
        this.displayPositions.clear();
        this.renderer.refresh();
        if (reasons.has("layout-complete")) this.scheduleFinalCenter(generation);
        return;
      }

      const fitReasons = new Set([
        "enable",
        "context",
        "settings",
        "layout-complete",
        "layout-stop",
        "resize",
        "viewport-obstruction",
        "layout-scope",
        "interaction-deferred",
        "topology",
        "filter",
        "date-filter",
      ]);
      const shouldFitViewport = [...reasons].some(reason => fitReasons.has(reason));
      const settleReason = [...reasons].find(reason => reason.startsWith("aspect-settle:"));
      const settlePass = settleReason ? Number(settleReason.split(":")[1]) || 1 : 0;
      if (shouldFitViewport && this.fitCameraToCandidates(candidates, usableViewport)) {
        this.schedulePostFit(generation);
        return;
      }
      let aspectScale = 1;
      if (shouldFitViewport || reasons.has("post-fit") || settleReason) {
        aspectScale = this.applyAspectAdaptation(candidates, usableViewport);
      }
      candidates.forEach(candidate => {
        candidate.anchor = { ...candidate.point };
      });
      this.relaxLocally(candidates);

      const targets = new Map();
      for (const candidate of candidates) {
        const position = this.renderer.viewportToGraph(candidate.point);
        if (finitePoint(position)) targets.set(candidate.node, position);
      }
      const shouldSettleAspect = aspectScale > 1.01 && settlePass < 4;
      const shouldCenterAfterAnimation = reasons.has("layout-complete") || reasons.has("post-fit") || Boolean(settleReason);
      this.animateTo(targets, generation, () => {
        if (shouldSettleAspect) {
          this.scheduleAfterRender(`aspect-settle:${settlePass + 1}`, generation);
        } else if (shouldCenterAfterAnimation) {
          this.scheduleFinalCenter(generation);
        }
      });
    }

    scheduleFinalCenter(generation) {
      requestAnimationFrame(() => {
        if (generation !== this.generation || !this.enabled || this.suspended) return;
        this.renderer?.refresh?.();
        requestAnimationFrame(() => {
          if (generation !== this.generation || !this.enabled || this.suspended) return;
          this.suppressProgrammaticCameraUpdates();
          this.options.onViewportFit?.();
        });
      });
    }

    suppressProgrammaticCameraUpdates() {
      const token = ++this.cameraSuppressionToken;
      this.suppressCameraUpdates = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (token === this.cameraSuppressionToken) this.suppressCameraUpdates = false;
      }));
    }

    schedulePostFit(generation) {
      this.scheduleAfterRender("post-fit", generation);
    }

    scheduleAfterRender(reason, generation) {
      requestAnimationFrame(() => {
        if (generation !== this.generation || !this.enabled || this.suspended) return;
        this.renderer?.refresh?.();
        requestAnimationFrame(() => {
          if (generation !== this.generation || !this.enabled || this.suspended) return;
          this.schedule(reason, { immediate: true });
        });
      });
    }

    fitCameraToCandidates(candidates, viewport) {
      const xs = candidates.map(candidate => candidate.base.x);
      const ys = candidates.map(candidate => candidate.base.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      const margin = this.options.viewportMarginPercent;
      const availableWidth = viewport.width * (1 - margin * 2);
      const availableHeight = viewport.height * (1 - margin * 2);
      const scale = Math.min(availableWidth / width, availableHeight / height);
      const camera = this.renderer.getCamera?.();
      const state = camera?.getState?.();
      if (!state || !Number.isFinite(state.ratio) || !Number.isFinite(scale) || scale <= 0) return false;
      const targetRatio = clamp(
        state.ratio / scale,
        this.options.minCameraRatio,
        this.options.maxCameraRatio
      );
      if (Math.abs(targetRatio - state.ratio) < 0.005) {
        this.options.onViewportFit?.();
        return false;
      }
      this.suppressProgrammaticCameraUpdates();
      camera.setState({ ratio: targetRatio });
      this.options.onViewportFit?.();
      return true;
    }

    applyAspectAdaptation(candidates, viewport) {
      const strength = this.options.aspectAdaptation;
      if (!(strength > 0) || candidates.length < 2) return 1;
      const xs = candidates.map(candidate => candidate.base.x);
      const ys = candidates.map(candidate => candidate.base.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const width = Math.max(1, maxX - minX);
      const height = Math.max(1, maxY - minY);
      const margin = this.options.viewportMarginPercent;
      const availableWidth = viewport.width * (1 - margin * 2);
      const availableHeight = viewport.height * (1 - margin * 2);
      const desiredScaleX = clamp(availableWidth / width, 1, this.options.maxAspectScale);
      const desiredScaleY = clamp(availableHeight / height, 1, this.options.maxAspectScale);
      const scaleX = 1 + (desiredScaleX - 1) * strength;
      const scaleY = 1 + (desiredScaleY - 1) * strength;
      const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      for (const candidate of candidates) {
        if (candidate.fixed) continue;
        candidate.point.x = center.x + (candidate.base.x - center.x) * scaleX;
        candidate.point.y = center.y + (candidate.base.y - center.y) * scaleY;
      }
      return Math.max(scaleX, scaleY);
    }

    relaxLocally(candidates) {
      const minDistance = this.options.minDistancePx;
      const maxDisplacement = this.options.maxDisplacementPx;
      const cellSize = minDistance;
      for (let iteration = 0; iteration < this.options.maxIterations; iteration++) {
        const grid = new Map();
        candidates.forEach((candidate, index) => {
          const key = `${Math.floor(candidate.point.x / cellSize)},${Math.floor(candidate.point.y / cellSize)}`;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(index);
        });
        const shifts = candidates.map(() => ({ x: 0, y: 0 }));
        candidates.forEach((candidate, index) => {
          const cellX = Math.floor(candidate.point.x / cellSize);
          const cellY = Math.floor(candidate.point.y / cellSize);
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            for (const otherIndex of grid.get(`${cellX + dx},${cellY + dy}`) || []) {
              if (otherIndex <= index) continue;
              const other = candidates[otherIndex];
              let deltaX = other.point.x - candidate.point.x;
              let deltaY = other.point.y - candidate.point.y;
              let distance = Math.hypot(deltaX, deltaY);
              if (distance >= minDistance) continue;
              if (distance < 0.01) {
                const angle = ((index + 1) * 2.399963229728653) % (Math.PI * 2);
                deltaX = Math.cos(angle);
                deltaY = Math.sin(angle);
                distance = 1;
              }
              const force = (minDistance - distance) * 0.32;
              const pushX = deltaX / distance * force;
              const pushY = deltaY / distance * force;
              if (!candidate.fixed) { shifts[index].x -= pushX; shifts[index].y -= pushY; }
              if (!other.fixed) { shifts[otherIndex].x += pushX; shifts[otherIndex].y += pushY; }
            }
          }
        });
        candidates.forEach((candidate, index) => {
          if (candidate.fixed) return;
          const anchor = candidate.anchor || candidate.base;
          const anchorX = (anchor.x - candidate.point.x) * this.options.positionStability;
          const anchorY = (anchor.y - candidate.point.y) * this.options.positionStability;
          candidate.point.x += shifts[index].x + anchorX;
          candidate.point.y += shifts[index].y + anchorY;
          const deltaX = candidate.point.x - anchor.x;
          const deltaY = candidate.point.y - anchor.y;
          const displacement = Math.hypot(deltaX, deltaY);
          if (displacement > maxDisplacement) {
            candidate.point.x = anchor.x + deltaX / displacement * maxDisplacement;
            candidate.point.y = anchor.y + deltaY / displacement * maxDisplacement;
          }
        });
      }
    }

    animateTo(targets, generation, onComplete = null) {
      if (this.frame) cancelAnimationFrame(this.frame);
      const starts = new Map();
      for (const [node, target] of targets) {
        const logical = { x: Number(this.graph.getNodeAttribute(node, "x")), y: Number(this.graph.getNodeAttribute(node, "y")) };
        starts.set(node, this.displayPositions.get(node) || logical || target);
      }
      const startedAt = performance.now();
      const duration = Math.max(0, this.options.animationDurationMs);
      const tick = now => {
        if (generation !== this.generation || !this.enabled || this.suspended) return;
        const raw = duration ? clamp((now - startedAt) / duration, 0, 1) : 1;
        const progress = 1 - Math.pow(1 - raw, 3);
        this.displayPositions.clear();
        for (const [node, target] of targets) {
          if (!this.graph.hasNode(node)) continue;
          const start = starts.get(node);
          const position = {
            x: start.x + (target.x - start.x) * progress,
            y: start.y + (target.y - start.y) * progress,
          };
          this.displayPositions.set(node, position);
          this.graph.setNodeAttribute(node, "x", position.x);
          this.graph.setNodeAttribute(node, "y", position.y);
        }
        this.displayApplied = this.displayPositions.size > 0;
        this.renderer?.refresh?.();
        if (raw < 1) this.frame = requestAnimationFrame(tick);
        else {
          this.frame = null;
          onComplete?.();
        }
      };
      this.frame = requestAnimationFrame(tick);
    }

    attachRuntimeListeners() {
      if (!this.renderer || !this.graph) return;
      const camera = this.renderer.getCamera?.();
      if (camera && camera !== this.boundCamera) {
        this.boundCamera = camera;
        camera.on?.("updated", this.boundCameraUpdated);
      }
      const container = this.renderer.getContainer?.();
      if (container && typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => this.schedule("resize"));
        this.resizeObserver.observe(container);
        for (const element of this.options.getViewportElements?.() || []) {
          if (element) this.resizeObserver.observe(element);
        }
      }
      if (typeof MutationObserver !== "undefined") {
        const elements = (this.options.getViewportElements?.() || []).filter(Boolean);
        if (elements.length) {
          this.viewportMutationObserver = new MutationObserver(() => this.schedule("viewport-obstruction"));
          elements.forEach(element => this.viewportMutationObserver.observe(element, {
            attributes: true,
            attributeFilter: ["class", "style", "aria-hidden"],
          }));
        }
      }
      for (const element of this.options.getViewportElements?.() || []) {
        if (!element?.addEventListener) continue;
        const listener = event => {
          if (event.propertyName === "transform" || event.propertyName === "width") {
            this.schedule("viewport-obstruction", { immediate: true });
          }
        };
        element.addEventListener("transitionend", listener);
        this.viewportElementListeners.push([element, listener]);
      }
      const events = ["nodeAdded", "nodeDropped", "edgeAdded", "edgeDropped", "cleared"];
      for (const event of events) {
        const listener = () => this.schedule("topology");
        this.graph.on?.(event, listener);
        this.graphListeners.push([event, listener]);
      }
    }

    detachRuntimeListeners() {
      if (this.boundCamera) this.boundCamera.off?.("updated", this.boundCameraUpdated);
      this.boundCamera = null;
      this.resizeObserver?.disconnect?.();
      this.resizeObserver = null;
      this.viewportMutationObserver?.disconnect?.();
      this.viewportMutationObserver = null;
      for (const [element, listener] of this.viewportElementListeners) {
        element.removeEventListener?.("transitionend", listener);
      }
      this.viewportElementListeners = [];
      for (const [event, listener] of this.graphListeners) this.graph?.off?.(event, listener);
      this.graphListeners = [];
    }

    cancelPending() {
      clearTimeout(this.timer);
      this.timer = null;
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.pendingReasons.clear();
    }

    destroy() {
      this.enabled = false;
      this.cancelPending();
      this.detachRuntimeListeners();
      this.restoreLogicalPositions();
      this.restoreCameraState();
      this.displayPositions.clear();
      this.logicalPositions.clear();
      this.graph = null;
      this.renderer = null;
    }
  }

  global.AdaptiveViewportManager = AdaptiveViewportManager;
  if (typeof module !== "undefined" && module.exports) module.exports = { AdaptiveViewportManager };
})(typeof window !== "undefined" ? window : globalThis);
