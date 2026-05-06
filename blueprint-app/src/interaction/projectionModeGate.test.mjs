import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveProjectionMode } from './coordinateUtils.js';

test('orthographic remains unchanged', () => {
  const mode = resolveProjectionMode({
    view: { projectionMode: 'orthographic' },
  });
  assert.equal(mode, 'orthographic');
});

test('non-orthographic mode remains selected without requiring feature flag', () => {
  const mode = resolveProjectionMode({
    view: { projectionMode: 'perspective2' },
    featureFlags: { enableAdvancedProjectionModes: false },
  });
  assert.equal(mode, 'perspective2');
});

test('non-orthographic modes still resolve when feature flag is on', () => {
  const mode = resolveProjectionMode({
    view: { projectionMode: 'isometric' },
    featureFlags: { enableAdvancedProjectionModes: true },
  });
  assert.equal(mode, 'isometric');
});
