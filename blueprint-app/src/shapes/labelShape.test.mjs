import test from 'node:test';
import assert from 'node:assert/strict';

import { labelShape } from './labelShape.js';

function createMockContext() {
  const calls = [];
  return {
    calls,
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    translate(x, y) { calls.push(['translate', x, y]); },
    rotate(radians) { calls.push(['rotate', radians]); },
    fillText(text, x, y) { calls.push(['fillText', text, x, y]); },
    set fillStyle(value) { calls.push(['fillStyle', value]); },
    set font(value) { calls.push(['font', value]); },
  };
}

test('draw rotates label text around anchor point when angle is set', () => {
  const ctx = createMockContext();
  const shape = {
    type: 'label',
    x: 10,
    y: 20,
    text: 'Test',
    angle: 90,
    style: {},
  };

  labelShape.draw(ctx, shape);

  assert.deepEqual(ctx.calls.find((call) => call[0] === 'translate'), ['translate', 10, 20]);
  const rotateCall = ctx.calls.find((call) => call[0] === 'rotate');
  assert.ok(rotateCall);
  assert.ok(Math.abs(rotateCall[1] - (Math.PI / 2)) < 0.000001);
  assert.deepEqual(ctx.calls.find((call) => call[0] === 'fillText'), ['fillText', 'Test', 0, 0]);
});

test('hit test accounts for label rotation', () => {
  const shape = {
    type: 'label',
    x: 100,
    y: 100,
    text: 'Test',
    angle: 90,
    style: { textSize: 20 },
  };

  assert.equal(labelShape.hitTest(shape, { x: 108, y: 108 }), true);
  assert.equal(labelShape.hitTest(shape, { x: 130, y: 100 }), false);
});

test('rotated bounds reflect transformed label area', () => {
  const shape = {
    type: 'label',
    x: 0,
    y: 0,
    text: 'ABCD',
    angle: 90,
    style: { textSize: 20 },
  };

  const bounds = labelShape.getBounds(shape);

  assert.ok(bounds.width > 20);
  assert.ok(bounds.height > 40);
});
