import test from 'node:test';
import assert from 'node:assert/strict';

import { tapeShape } from './tapeShape.js';

function createMockContext() {
  let fillTextCalls = 0;
  return {
    save() {},
    restore() {},
    beginPath() {},
    arc() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    setLineDash() {},
    fillRect() {},
    strokeRect() {},
    measureText(text) {
      return { width: text.length * 7 };
    },
    fillText() {
      fillTextCalls += 1;
    },
    set strokeStyle(value) {
      this._strokeStyle = value;
    },
    set lineWidth(value) {
      this._lineWidth = value;
    },
    set fillStyle(value) {
      this._fillStyle = value;
    },
    set font(value) {
      this._font = value;
    },
    set textAlign(value) {
      this._textAlign = value;
    },
    set textBaseline(value) {
      this._textBaseline = value;
    },
    get fillTextCalls() {
      return fillTextCalls;
    },
  };
}

test('tape shape renders measurement labels even when measurement mode is off', () => {
  const ctx = createMockContext();
  const shape = {
    type: 'tape',
    mode: 'direct',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    style: { stroke: '#111', strokeWidth: 2 },
  };

  tapeShape.draw(ctx, shape, { settings: { measurementMode: 'off' }, isPreview: false });
  tapeShape.draw(ctx, shape, { settings: { measurementMode: 'off' }, isPreview: true });

  assert.equal(ctx.fillTextCalls, 2);
});

test('angle tape renders an angle label', () => {
  const ctx = createMockContext();
  const shape = {
    type: 'tape',
    mode: 'angle',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    offset: { x: 60, y: 60 },
    style: { stroke: '#111', strokeWidth: 2 },
  };

  tapeShape.draw(ctx, shape, { settings: { measurementMode: 'always' }, isPreview: false });

  assert.equal(ctx.fillTextCalls, 1);
});
