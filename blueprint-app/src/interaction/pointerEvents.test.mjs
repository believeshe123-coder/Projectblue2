import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveAnchorPoint, resolveObjectSnapShapes } from './pointerEvents.js';

test('3-point tape offset phase uses baseline end as snapping anchor', () => {
  const store = { appState: { dragStart: { x: 1, y: 1 } } };
  const ephemeral = {
    preview: {
      type: 'tape',
      mode: 'offset',
      phase: 'set-offset',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    },
  };

  const anchor = resolveAnchorPoint(store, ephemeral);
  assert.deepEqual(anchor, { x: 100, y: 0 });
});

test('non-offset tape phases keep start as snapping anchor', () => {
  const store = { appState: { dragStart: { x: 1, y: 1 } } };
  const ephemeral = {
    preview: {
      type: 'tape',
      mode: 'offset',
      phase: 'set-end',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    },
  };

  const anchor = resolveAnchorPoint(store, ephemeral);
  assert.deepEqual(anchor, { x: 0, y: 0 });
});

test('object snap only includes shapes from the active visible layer', () => {
  const store = {
    appState: { activeLayerId: 'layer-2' },
    documentData: {
      layers: [
        { id: 'layer-1', visible: true },
        { id: 'layer-2', visible: true },
      ],
      shapes: [
        { id: 'line-a', layerId: 'layer-1', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, visible: true },
        { id: 'line-b', layerId: 'layer-2', start: { x: 20, y: 0 }, end: { x: 30, y: 0 }, visible: true },
      ],
    },
  };

  const shapes = resolveObjectSnapShapes(store);
  assert.deepEqual(shapes.map((shape) => shape.id), ['line-b']);
});
