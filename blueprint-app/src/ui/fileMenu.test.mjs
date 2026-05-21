import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNewPageAppState, ensureAppStateShape, renderFilePage } from './fileMenu.js';

test('buildNewPageAppState always creates a regular grid page state', () => {
  const orthographic = buildNewPageAppState('orthographic');
  const isometric = buildNewPageAppState('isometric');
  const perspective = buildNewPageAppState('perspective2');

  assert.equal(orthographic.view.projectionMode, 'orthographic');
  assert.equal(orthographic.featureFlags.enableAdvancedProjectionModes, false);

  assert.equal(isometric.view.projectionMode, 'orthographic');
  assert.equal(isometric.featureFlags.enableAdvancedProjectionModes, false);

  assert.equal(perspective.view.projectionMode, 'orthographic');
  assert.equal(perspective.featureFlags.enableAdvancedProjectionModes, false);
});

test('ensureAppStateShape normalizes view + featureFlags on load', () => {
  const normalized = ensureAppStateShape({
    activeTool: 'select',
    zoom: 2,
    panX: 3,
    panY: 4,
    view: { projectionMode: 'isometric' },
    featureFlags: { enableAdvancedProjectionModes: true },
  });

  assert.equal(normalized.view.projectionMode, 'orthographic');
  assert.equal(normalized.featureFlags.enableAdvancedProjectionModes, false);
});

test('new-page flow uses setup UI and not browser prompt', () => {
  const source = renderFilePage.toString();
  assert.match(source, /new-page-setup/);
  assert.equal(source.includes('window.prompt('), false);
});
