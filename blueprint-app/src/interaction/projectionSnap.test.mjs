import test from 'node:test';
import assert from 'node:assert/strict';

import { createProjectionContext } from '../canvas/projection.js';
import { snapToGrid } from './snapUtils.js';
import { snapPointToIsoAxis } from '../canvas/isoMath.js';

const appStateOrtho = { view: { projectionMode: 'orthographic' } };
const appStateIso = { view: { projectionMode: 'isometric' } };

test('projection context unproject(project(point)) is stable for orthographic', () => {
  const ctx = createProjectionContext(appStateOrtho);
  const point = { x: 120, y: 80 };
  assert.deepEqual(ctx.unprojectPoint(ctx.projectPoint(point)), point);
});

test('projection context roundtrip is approximately stable for isometric', () => {
  const ctx = createProjectionContext(appStateIso);
  const point = { x: 100, y: 60 };
  const roundtrip = ctx.unprojectPoint(ctx.projectPoint(point));
  assert.ok(Math.abs(roundtrip.x - point.x) < 0.0001);
  assert.ok(Math.abs(roundtrip.y - point.y) < 0.0001);
});

test('orthographic snapping regression remains unchanged', () => {
  const snapped = snapToGrid({ x: 62, y: 63 }, { settings: { gridSize: 25 } }, appStateOrtho);
  assert.deepEqual(snapped, { x: 50, y: 75 });
});

test('isometric snapping quantizes along iso axes', () => {
  const snapped = snapToGrid({ x: 67, y: 41 }, { settings: { gridSize: 25 } }, appStateIso);
  assert.ok(Number.isFinite(snapped.x));
  assert.ok(Number.isFinite(snapped.y));
  assert.notDeepEqual(snapped, { x: 50, y: 75 });
});

test('isometric axis snap follows vertical orientation axes', () => {
  const anchor = { x: 10, y: 10 };
  const snapped = snapPointToIsoAxis({ x: 110, y: 40 }, anchor, 'vertical');
  const dy = snapped.y - anchor.y;
  const dx = snapped.x - anchor.x;
  assert.ok(Math.abs(dy) <= 0.0001 || Math.abs(Math.abs(dx / dy) - (1 / Math.sqrt(3))) < 0.001);
});

test('isometric axis snap follows horizontal orientation axes', () => {
  const anchor = { x: 10, y: 10 };
  const snapped = snapPointToIsoAxis({ x: 110, y: 40 }, anchor, 'horizontal');
  const dy = snapped.y - anchor.y;
  const dx = snapped.x - anchor.x;
  assert.ok(Math.abs(dx) <= 0.0001 || Math.abs(Math.abs(dy / dx) - (1 / Math.sqrt(3))) < 0.001);
});
