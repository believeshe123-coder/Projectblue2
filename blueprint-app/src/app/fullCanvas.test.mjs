import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyFullCanvasLayout,
  applyFullCanvasTransform,
  buildDeterministicFullCanvasTransform,
  captureViewportTransform,
} from './fullCanvas.js';

test('full-canvas layout collapses sidebars and enables orthographic review flow', () => {
  const layoutState = { leftCollapsed: false, rightCollapsed: false, fullCanvas: false, preset: 'edit' };
  const appState = { view: { projectionMode: 'perspective1', canvasRotationDeg: 45 } };

  applyFullCanvasLayout(layoutState);
  const transform = buildDeterministicFullCanvasTransform({ canvasWidth: 1200, canvasHeight: 800 });
  applyFullCanvasTransform(appState, transform);

  assert.equal(layoutState.fullCanvas, true);
  assert.equal(layoutState.leftCollapsed, true);
  assert.equal(layoutState.rightCollapsed, true);
  assert.equal(appState.view.projectionMode, 'orthographic');
});

test('full-canvas layout does not mutate the viewport or grid projection', () => {
  const layoutState = { leftCollapsed: false, rightCollapsed: false, fullCanvas: false, preset: 'edit' };
  const appState = { zoom: 1.75, panX: 42, panY: -18, view: { projectionMode: 'orthographic', canvasRotationDeg: 0 } };
  const before = captureViewportTransform(appState);

  applyFullCanvasLayout(layoutState);

  assert.deepEqual(captureViewportTransform(appState), before);
});

test('viewport transform resets deterministically for full-canvas', () => {
  const appState = { zoom: 2.2, panX: -55, panY: 91, view: { projectionMode: 'isometric', canvasRotationDeg: 90 } };
  const transform = buildDeterministicFullCanvasTransform({ canvasWidth: 1000, canvasHeight: 600 });
  applyFullCanvasTransform(appState, transform);

  assert.deepEqual({
    zoom: appState.zoom,
    panX: appState.panX,
    panY: appState.panY,
    projectionMode: appState.view.projectionMode,
    canvasRotationDeg: appState.view.canvasRotationDeg,
  }, {
    zoom: 1,
    panX: 500,
    panY: 300,
    projectionMode: 'orthographic',
    canvasRotationDeg: 0,
  });
});

test('enter-exit-enter cycle is idempotent for transform values', () => {
  const appState = { zoom: 3, panX: 777, panY: -220, view: { projectionMode: 'perspective3', canvasRotationDeg: 180 } };

  const first = buildDeterministicFullCanvasTransform({ canvasWidth: 900, canvasHeight: 500 });
  applyFullCanvasTransform(appState, first);
  const snapshot = { zoom: appState.zoom, panX: appState.panX, panY: appState.panY, ...appState.view };

  appState.zoom = 0.5;
  appState.panX = 17;
  appState.panY = -88;
  appState.view.projectionMode = 'perspective2';

  const second = buildDeterministicFullCanvasTransform({ canvasWidth: 900, canvasHeight: 500 });
  applyFullCanvasTransform(appState, second);

  assert.deepEqual(
    { zoom: appState.zoom, panX: appState.panX, panY: appState.panY, ...appState.view },
    snapshot,
  );
});
