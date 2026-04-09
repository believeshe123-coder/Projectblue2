import test from 'node:test';
import assert from 'node:assert/strict';

import { panTool } from './panTool.js';

function createContext() {
  return {
    canvas: { style: { cursor: 'grab' } },
    store: {
      appState: { panX: 10, panY: 20 },
      notifyCalls: 0,
      notify() {
        this.notifyCalls += 1;
      },
    },
    ephemeral: {},
  };
}

test('pan tool starts left-drag pan session and updates cursor', () => {
  const context = createContext();

  panTool.onPointerDown(context, { x: 0, y: 0 }, { button: 0, clientX: 100, clientY: 80 });

  assert.deepEqual(context.ephemeral.panSession, {
    startClientX: 100,
    startClientY: 80,
    startPanX: 10,
    startPanY: 20,
  });
  assert.equal(context.canvas.style.cursor, 'grabbing');
});

test('pan tool moves viewport during left-button drag', () => {
  const context = createContext();
  panTool.onPointerDown(context, { x: 0, y: 0 }, { button: 0, clientX: 100, clientY: 80 });

  panTool.onPointerMove(context, { x: 0, y: 0 }, { buttons: 1, clientX: 125, clientY: 95 });

  assert.equal(context.store.appState.panX, 35);
  assert.equal(context.store.appState.panY, 35);
  assert.equal(context.store.notifyCalls, 1);
});

test('pan tool ignores non-left-button pointer down', () => {
  const context = createContext();

  panTool.onPointerDown(context, { x: 0, y: 0 }, { button: 2, clientX: 100, clientY: 80 });

  assert.equal(context.ephemeral.panSession, undefined);
  assert.equal(context.canvas.style.cursor, 'grab');
});

test('pan tool ends session on pointer up and restores grab cursor', () => {
  const context = createContext();
  panTool.onPointerDown(context, { x: 0, y: 0 }, { button: 0, clientX: 100, clientY: 80 });

  panTool.onPointerUp(context, { x: 0, y: 0 }, {});

  assert.equal(context.ephemeral.panSession, null);
  assert.equal(context.canvas.style.cursor, 'grab');
});
