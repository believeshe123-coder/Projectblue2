import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveProjectionMode } from './coordinateUtils.js';

test('orthographic remains unchanged when feature flag is off', () => {
  const mode = resolveProjectionMode({
    view: { projectionMode: 'orthographic' },
    featureFlags: { enableAdvancedProjectionModes: false },
  });
  assert.equal(mode, 'orthographic');
});

test('non-orthographic modes are gated to orthographic when feature flag is off', () => {
  const mode = resolveProjectionMode({
    view: { projectionMode: 'perspective2' },
    featureFlags: { enableAdvancedProjectionModes: false },
  });
  assert.equal(mode, 'orthographic');
});

test('non-orthographic modes resolve when feature flag is on', () => {
  const mode = resolveProjectionMode({
    view: { projectionMode: 'isometric' },
    featureFlags: { enableAdvancedProjectionModes: true },
  });
  assert.equal(mode, 'isometric');
});
