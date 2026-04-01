import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveAnchorPoint } from './pointerEvents.js';

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
