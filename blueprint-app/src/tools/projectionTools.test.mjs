import test from 'node:test';
import assert from 'node:assert/strict';

import { lineTool } from './lineTool.js';

function makeContext(mode = 'orthographic') {
  return {
    ephemeral: {},
    store: {
      appState: { activeLayerId: 'layer-1', toolStyle: { stroke: '#111', strokeWidth: 2, lineType: 'solid' }, view: { projectionMode: mode } },
      documentData: { settings: { drawMode: 'click' }, layers: [{ id: 'layer-1', visible: true }], shapes: [] },
      notify() {},
    },
  };
}

test('line tool orthographic regression keeps first click as preview start', () => {
  const context = makeContext('orthographic');
  lineTool.onPointerDown(context, { x: 10, y: 20 });
  assert.deepEqual(context.ephemeral.preview.start, { x: 10, y: 20 });
});

test('line tool can accept non-orthographic points without breaking preview lifecycle', () => {
  const context = makeContext('isometric');
  lineTool.onPointerDown(context, { x: 10, y: 20 });
  assert.equal(context.ephemeral.preview?.type, 'line');
  lineTool.onPointerDown(context, { x: 30, y: 40 });
  assert.equal(context.ephemeral.preview, null);
});
