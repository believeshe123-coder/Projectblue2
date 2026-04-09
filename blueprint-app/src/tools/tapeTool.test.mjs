import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTapeShapeArgs } from './tapeTool.js';

test('offset mode keeps baseline endpoint and applies final point as offset', () => {
  const preview = {
    mode: 'offset',
    start: { x: 0, y: 0 },
    end: { x: 10, y: 0 },
    offset: { x: 10, y: 2 },
  };
  const thirdClick = { x: 7, y: 4 };

  const result = buildTapeShapeArgs(preview, thirdClick);

  assert.deepEqual(result.end, preview.end);
  assert.deepEqual(result.offset, thirdClick);

  const baseline = Math.hypot(preview.end.x - preview.start.x, preview.end.y - preview.start.y);
  const perpendicularLeg = Math.hypot(thirdClick.x - preview.end.x, thirdClick.y - preview.end.y);
  const measuredSegment = Math.hypot(result.end.x - result.start.x, result.end.y - result.start.y);

  assert.equal(measuredSegment, baseline);
  assert.notEqual(measuredSegment, perpendicularLeg);
});

test('direct mode applies final point as end and no offset', () => {
  const preview = {
    mode: 'direct',
    start: { x: 0, y: 0 },
    end: { x: 8, y: 1 },
    offset: { x: 50, y: 50 },
  };
  const finalPoint = { x: 12, y: 3 };

  const result = buildTapeShapeArgs(preview, finalPoint);

  assert.deepEqual(result.end, finalPoint);
  assert.equal(result.offset, null);
});

test('angle mode preserves first arm and applies final point as second arm', () => {
  const preview = {
    mode: 'angle',
    start: { x: 10, y: 10 },
    end: { x: 30, y: 10 },
    offset: { x: 18, y: 28 },
  };
  const finalPoint = { x: 14, y: 30 };

  const result = buildTapeShapeArgs(preview, finalPoint);

  assert.equal(result.mode, 'angle');
  assert.deepEqual(result.start, preview.start);
  assert.deepEqual(result.end, preview.end);
  assert.deepEqual(result.offset, finalPoint);
});
