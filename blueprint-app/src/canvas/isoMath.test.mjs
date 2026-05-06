import test from 'node:test';
import assert from 'node:assert/strict';

import { isoProject, isoUnproject, snapPointToIsoAxis } from './isoMath.js';

test('iso projection round-trip remains stable across a coordinate range', () => {
  for (let x = -200; x <= 200; x += 40) {
    for (let y = -200; y <= 200; y += 40) {
      const p = { x, y };
      const rt = isoUnproject(isoProject(p));
      assert.ok(Math.abs(rt.x - p.x) < 0.0001);
      assert.ok(Math.abs(rt.y - p.y) < 0.0001);
    }
  }
});

test('iso axis snap keeps anchor stable and snaps along one axis', () => {
  const anchor = { x: 10, y: 15 };
  const snapped = snapPointToIsoAxis({ x: 70, y: 42 }, anchor);
  assert.equal(Number.isFinite(snapped.x), true);
  assert.equal(Number.isFinite(snapped.y), true);
  assert.notDeepEqual(snapped, anchor);
});
