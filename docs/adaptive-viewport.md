# Adaptive Viewport implementation

Adaptive Viewport is an opt-in display layer. Layout algorithms remain the sole producers of logical positions. The manager keeps those coordinates in a dedicated map and can temporarily project reversible display coordinates into Graphology because this Sigma version overwrites reducer-provided `x` and `y` values during processing.

## Integration

- `scripts/adaptive-viewport.js` owns scheduling, camera/resize/topology listeners, camera fitting, grid-based local separation and cancellable transitions.
- Global viewport occupation is controlled through Sigma's camera. Local display coordinates are written through a reversible shadow layer so nodes, edges and hit-testing consume the same positions.
- Layout execution and manual node dragging suspend the manager. Completion resumes it from the newest logical coordinates.
- Disabling the option detaches listeners, cancels timers/animation frames, clears display coordinates and refreshes Sigma immediately.
- The camera state captured at activation is restored on disable, so toggling OFF is visually reversible as well as coordinate-safe.
- The preference is stored under `minagraph-adaptive-viewport-enabled`; absence of the key means disabled.
- Spacing, viewport margin, layout stability, maximum displacement and aspect adaptation are user-adjustable and persisted under `minagraph-adaptive-viewport-settings`.
- Activation and layout completion perform a bounded fit of the visible graph; camera-only updates preserve the user's current zoom and pan and apply local spacing only.
- Layout completion waits for two animation frames before measuring the final Sigma extent, preventing the stale pre-layout matrix that previously required a manual window resize.

## Bounds and compromises

- Only visible nodes in the viewport and a small outside margin participate.
- Automatic camera fitting occurs only on activation and structural events such as layout completion, resize or topology changes. Camera-only updates never trigger another fit.
- Aspect adaptation stretches only the under-used display axis, is capped at 1.6×, and is blended from 0% (layout proportions) to 100% (maximum bounded viewport use).
- Because Sigma renormalizes its extent after display coordinates change, aspect adaptation performs up to four additional render/measure cycles and stops as soon as the remaining scale is negligible.
- Local separation uses a spatial grid, twelve bounded passes and the configured maximum displacement rather than an all-pairs global layout.
- Manually positioned, pinned or fixed nodes are anchors and are not displaced.
- The mode improves density where possible but does not guarantee zero overlaps or edge crossings.

## Verification

`tests/adaptive-viewport.test.js` verifies strict OFF behavior, camera fitting, visible expansion, preservation and restoration of logical coordinates, fixed nodes, renderer refresh, and cleanup after disabling.
