import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNewPageAppState, ensureAppStateShape, renderFilePage } from './fileMenu.js';

test('buildNewPageAppState toggles advanced projection flag by mode', () => {
  const orthographic = buildNewPageAppState('orthographic');
  const isometric = buildNewPageAppState('isometric');
  const perspective = buildNewPageAppState('perspective2');

  assert.equal(orthographic.view.projectionMode, 'orthographic');
  assert.equal(orthographic.featureFlags.enableAdvancedProjectionModes, false);

  assert.equal(isometric.view.projectionMode, 'isometric');
  assert.equal(isometric.featureFlags.enableAdvancedProjectionModes, true);

  assert.equal(perspective.view.projectionMode, 'perspective2');
  assert.equal(perspective.featureFlags.enableAdvancedProjectionModes, true);
});

test('ensureAppStateShape preserves view + featureFlags on load', () => {
  const normalized = ensureAppStateShape({
    activeTool: 'select',
    zoom: 2,
    panX: 3,
    panY: 4,
    view: { projectionMode: 'isometric' },
    featureFlags: { enableAdvancedProjectionModes: true },
  });

  assert.equal(normalized.view.projectionMode, 'isometric');
  assert.equal(normalized.featureFlags.enableAdvancedProjectionModes, true);
});

test('new-page flow uses setup UI and not browser prompt', () => {
  const source = renderFilePage.toString();
  assert.match(source, /new-page-setup/);
  assert.equal(source.includes('window.prompt('), false);
});
