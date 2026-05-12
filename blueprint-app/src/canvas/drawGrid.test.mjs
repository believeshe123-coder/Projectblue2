import test from 'node:test';
import assert from 'node:assert/strict';

import { drawGrid } from './drawGrid.js';

function mockCtx() {
  const calls = [];
  return {
    calls,
    save() {}, restore() {}, translate() {}, scale() {},
    beginPath() { calls.push('beginPath'); },
    moveTo(x, y) { calls.push(['moveTo', x, y]); },
    lineTo(x, y) { calls.push(['lineTo', x, y]); },
    stroke() { calls.push('stroke'); },
    set strokeStyle(_) {},
    set lineWidth(_) {},
  };
}

const canvas = { width: 400, height: 300 };
const baseState = { panX: 0, panY: 0, zoom: 1 };

function run(mode, settings = {}) {
  const ctx = mockCtx();
  drawGrid(ctx, canvas, { settings: { showGrid: true, gridSize: 25, ...settings } }, { ...baseState, view: { projectionMode: mode } });
  return ctx.calls;
}

test('orthographic strategy regression: draws axis-aligned grid lines', () => {
  const calls = run('orthographic');
  const hasVertical = calls.some((c, i) => Array.isArray(c) && c[0] === 'moveTo' && Array.isArray(calls[i + 1]) && calls[i + 1][0] === 'lineTo' && c[1] === calls[i + 1][1]);
  const hasHorizontal = calls.some((c, i) => Array.isArray(c) && c[0] === 'moveTo' && Array.isArray(calls[i + 1]) && calls[i + 1][0] === 'lineTo' && c[2] === calls[i + 1][2]);
  assert.equal(hasVertical, true);
  assert.equal(hasHorizontal, true);
});

test('isometric strategy draws diagonal lattice lines', () => {
  const calls = run('isometric');
  const hasDiagonal = calls.some((c, i) => Array.isArray(c) && c[0] === 'moveTo' && Array.isArray(calls[i + 1]) && calls[i + 1][0] === 'lineTo' && c[1] !== calls[i + 1][1] && c[2] !== calls[i + 1][2]);
  const hasHorizontal = calls.some((c, i) => Array.isArray(c) && c[0] === 'moveTo' && Array.isArray(calls[i + 1]) && calls[i + 1][0] === 'lineTo' && c[2] === calls[i + 1][2]);
  assert.equal(hasDiagonal, true);
  assert.equal(hasHorizontal, true);
});

test('isometric horizontal orientation rotates primary axis family while keeping three-axis lattice', () => {
  const verticalCalls = run('isometric', { isometricOrientation: 'vertical' });
  const horizontalCalls = run('isometric', { isometricOrientation: 'horizontal' });

  const hasHorizontalLines = (calls) => calls.some((c, i) => Array.isArray(c) && c[0] === 'moveTo' && Array.isArray(calls[i + 1]) && calls[i + 1][0] === 'lineTo' && c[2] === calls[i + 1][2]);
  const hasVerticalLines = (calls) => calls.some((c, i) => Array.isArray(c) && c[0] === 'moveTo' && Array.isArray(calls[i + 1]) && calls[i + 1][0] === 'lineTo' && c[1] === calls[i + 1][1]);
  const countDiagonalFamilies = (calls) => calls.filter((c, i) => Array.isArray(c) && c[0] === 'moveTo' && Array.isArray(calls[i + 1]) && calls[i + 1][0] === 'lineTo' && c[1] !== calls[i + 1][1] && c[2] !== calls[i + 1][2]).length;

  assert.equal(hasHorizontalLines(verticalCalls), true);
  assert.equal(hasVerticalLines(verticalCalls), false);
  assert.equal(hasVerticalLines(horizontalCalls), true);
  assert.equal(hasHorizontalLines(horizontalCalls), false);
  assert.ok(countDiagonalFamilies(verticalCalls) > 0);
  assert.ok(countDiagonalFamilies(horizontalCalls) > 0);
});

test('perspective strategies generate distinct guide geometry from orthographic', () => {
  const hasSlanted = (calls) => calls.some((c, i) => Array.isArray(c)
    && c[0] === 'moveTo'
    && Array.isArray(calls[i + 1])
    && calls[i + 1][0] === 'lineTo'
    && c[1] !== calls[i + 1][1]
    && c[2] !== calls[i + 1][2]);
  assert.equal(hasSlanted(run('perspective1')), true);
  assert.equal(hasSlanted(run('perspective2')), true);
  assert.equal(hasSlanted(run('perspective3')), true);
});
