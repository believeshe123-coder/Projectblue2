import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatShapeAreaMeasurement,
  formatShapeMeasurement,
  resolveMeasurementSettingsForShape,
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

test('shape-level units per grid override takes precedence when present', () => {
  const settings = { gridSize: 25, unitsPerGrid: 1, units: 'ft' };
  const shape = { measurementUnitsPerGrid: 4 };
  assert.equal(formatShapeMeasurement(50, settings, shape), '8.0 ft');
  assert.equal(formatShapeMeasurement(50, settings, {}), '2.0 ft');
});

test('shape-level measurement override ignores invalid values', () => {
  const settings = { unitsPerGrid: 3 };
  assert.deepEqual(resolveMeasurementSettingsForShape(settings, { measurementUnitsPerGrid: -2 }), settings);
  assert.deepEqual(resolveMeasurementSettingsForShape(settings, { measurementUnitsPerGrid: 'abc' }), settings);
});

test('region area measurement uses the shape-level grid scaling', () => {
  const settings = { gridSize: 25, unitsPerGrid: 1, units: 'ft' };
  const squarePixels = 50 * 50;
  assert.equal(formatShapeAreaMeasurement(squarePixels, settings, { measurementUnitsPerGrid: 2 }), '16.0 ft²');
});
