import test from 'node:test';
import assert from 'node:assert/strict';

import {
  shouldRenderDrawingMeasurements,
  shouldRenderMeasurements,
  shouldRenderPersistedMeasurements,
} from './measurement.js';

test('drawing-only mode hides persisted labels but keeps drawing previews', () => {
  const settings = { measurementMode: 'drawing' };
  assert.equal(shouldRenderPersistedMeasurements(settings), false);
  assert.equal(shouldRenderDrawingMeasurements(settings), true);
  assert.equal(shouldRenderMeasurements(settings, false), false);
  assert.equal(shouldRenderMeasurements(settings, true), true);
});

test('always mode renders both persisted labels and drawing previews', () => {
  const settings = { measurementMode: 'always' };
  assert.equal(shouldRenderMeasurements(settings, false), true);
  assert.equal(shouldRenderMeasurements(settings, true), true);
});

test('off mode renders no measurement labels in either context', () => {
  const settings = { measurementMode: 'off' };
  assert.equal(shouldRenderMeasurements(settings, false), false);
  assert.equal(shouldRenderMeasurements(settings, true), false);
});
