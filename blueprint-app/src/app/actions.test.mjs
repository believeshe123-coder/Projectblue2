import test from 'node:test';
import assert from 'node:assert/strict';

import { deleteLayer, eraseLinesAlongSegment, mergeLayerWithLower } from './actions.js';
import { store } from './store.js';

function withStoreSnapshot(run) {
  const snapshot = {
    documentData: structuredClone(store.documentData),
    appState: structuredClone(store.appState),
  };

  try {
    run();
  } finally {
    Object.assign(store.documentData, snapshot.documentData);
    Object.assign(store.appState, snapshot.appState);
  }
}

test('deleteLayer removes shapes that belong to the deleted layer', () => {
  withStoreSnapshot(() => {
    store.documentData.layers = [
      { id: 'layer-a', name: 'Layer A', visible: true, locked: false, opacity: 1 },
      { id: 'layer-b', name: 'Layer B', visible: true, locked: false, opacity: 1 },
    ];
    store.appState.activeLayerId = 'layer-b';
    store.documentData.shapes = [
      { id: 'shape-1', type: 'line', layerId: 'layer-b', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, style: {} },
      { id: 'shape-2', type: 'line', layerId: 'layer-a', start: { x: 0, y: 5 }, end: { x: 10, y: 5 }, style: {} },
    ];

    const deleted = deleteLayer('layer-b');
    assert.equal(deleted, true);
    assert.equal(store.documentData.shapes.length, 1);
    assert.equal(store.documentData.shapes[0].id, 'shape-2');
  });
});

test('deleteLayer keeps at least one layer available and resolves active layer', () => {
  withStoreSnapshot(() => {
    store.documentData.layers = [
      { id: 'layer-a', name: 'Layer A', visible: true, locked: false, opacity: 1 },
      { id: 'layer-b', name: 'Layer B', visible: true, locked: false, opacity: 1 },
    ];
    store.appState.activeLayerId = 'layer-b';
    store.documentData.shapes = [];

    const deleted = deleteLayer('layer-b');
    assert.equal(deleted, true);
    assert.equal(store.documentData.layers.length, 1);
    assert.equal(store.appState.activeLayerId, 'layer-a');
  });
});

test('mergeLayerWithLower moves shapes into lower layer and removes merged layer', () => {
  withStoreSnapshot(() => {
    store.documentData.layers = [
      { id: 'layer-a', name: 'Layer A', visible: true, locked: false, opacity: 1 },
      { id: 'layer-b', name: 'Layer B', visible: true, locked: false, opacity: 1 },
    ];
    store.appState.activeLayerId = 'layer-b';
    store.documentData.shapes = [
      { id: 'shape-1', type: 'line', layerId: 'layer-b', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, style: {} },
    ];

    const merged = mergeLayerWithLower('layer-b');
    assert.equal(merged, true);
    assert.equal(store.documentData.layers.length, 1);
    assert.equal(store.documentData.shapes[0].layerId, 'layer-a');
    assert.equal(store.appState.activeLayerId, 'layer-a');
  });
});

test('eraseLinesAlongSegment only erases lines on the active layer', () => {
  withStoreSnapshot(() => {
    store.documentData.layers = [
      { id: 'layer-a', name: 'Layer A', visible: true, locked: false, opacity: 1 },
      { id: 'layer-b', name: 'Layer B', visible: true, locked: false, opacity: 1 },
    ];
    store.appState.activeLayerId = 'layer-a';
    store.documentData.shapes = [
      { id: 'shape-a', type: 'line', layerId: 'layer-a', visible: true, locked: false, start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, style: {} },
      { id: 'shape-b', type: 'line', layerId: 'layer-b', visible: true, locked: false, start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, style: {} },
    ];

    const erased = eraseLinesAlongSegment({ x: 20, y: 0 }, { x: 80, y: 0 });
    assert.equal(erased, 1);
    const remainingShapeIds = store.documentData.shapes.map((shape) => shape.id);
    assert.equal(remainingShapeIds.includes('shape-b'), true);
  });
});
