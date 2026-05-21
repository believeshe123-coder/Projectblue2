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
