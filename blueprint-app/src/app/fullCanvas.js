export function buildDeterministicFullCanvasTransform({ canvasWidth, canvasHeight, anchor = 'center' }) {
  const width = Math.max(1, Number(canvasWidth) || 1);
  const height = Math.max(1, Number(canvasHeight) || 1);
  return {
    zoom: 1,
    panX: anchor === 'center' ? width / 2 : 0,
    panY: anchor === 'center' ? height / 2 : 0,
    view: {
      projectionMode: 'orthographic',
      canvasRotationDeg: 0,
    },
  };
}

export function applyFullCanvasTransform(appState, transform) {
  appState.zoom = transform.zoom;
  appState.panX = transform.panX;
  appState.panY = transform.panY;
  appState.view = { ...(appState.view ?? {}), ...(transform.view ?? {}) };
}

export function applyFullCanvasLayout(layoutState) {
  layoutState.fullCanvas = true;
  layoutState.preset = 'review';
  layoutState.leftCollapsed = true;
  layoutState.rightCollapsed = true;
}

/**
 * Full-canvas mode is a layout change, not a document/view change. Keeping this
 * snapshot helper here makes that contract explicit and easy to regression test.
 */
export function captureViewportTransform(appState) {
  return {
    zoom: appState.zoom,
    panX: appState.panX,
    panY: appState.panY,
    view: { ...(appState.view ?? {}) },
  };
}
