import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getTextureColorModeUiState,
  getTexturePreviewDataUrl,
  renderTexturePickerOptions,
} from './propertiesPanel.js';

test('texture picker renders preview swatch + name and selected state', () => {
  const textures = [
    {
      id: 'builtin-a',
      name: 'Texture A',
      kind: 'image',
      tintable: true,
      dataUrl: 'data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E',
      grid: [],
      updatedAt: 0,
    },
    {
      id: 'builtin-b',
      name: 'Texture B',
      kind: 'image',
      tintable: true,
      dataUrl: 'data:image/svg+xml;utf8,%3Csvg%3E%3C/svg%3E',
      grid: [],
      updatedAt: 0,
    },
  ];

  const html = renderTexturePickerOptions(textures, 'builtin-b');
  assert.match(html, /Texture A/);
  assert.match(html, /Texture B/);
  assert.match(html, /class="texture-picker-option selected"[\s\S]*data-texture-id="builtin-b"/);
  assert.match(html, /<img class="texture-picker-preview"/);
});

test('grid preview generation is deterministic and cached', () => {
  let drawCalls = 0;
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillRect: () => {
        drawCalls += 1;
      },
      set fillStyle(_value) {},
    }),
    toDataURL: () => 'data:image/png;base64,grid-preview',
  };

  const priorDocument = globalThis.document;
  globalThis.document = {
    createElement: () => mockCanvas,
  };

  const gridTexture = {
    id: 'grid-1',
    name: 'Grid',
    kind: 'grid',
    tintable: true,
    dataUrl: '',
    updatedAt: 2,
    grid: Array.from({ length: 10 }, (_row, y) => Array.from({ length: 10 }, (_col, x) => (x + y) % 3 === 0)),
  };

  try {
    const first = getTexturePreviewDataUrl(gridTexture, 24);
    const second = getTexturePreviewDataUrl(gridTexture, 24);
    assert.equal(first, 'data:image/png;base64,grid-preview');
    assert.equal(second, first);
    assert.ok(drawCalls > 0);
  } finally {
    globalThis.document = priorDocument;
  }
});

test('non-tintable textures keep selected-color option explicit in UI state', () => {
  const nonTintableTexture = { id: 'checker', tintable: false };
  const state = getTextureColorModeUiState('texture', nonTintableTexture, 'selected');

  assert.equal(state.selectedTextureTintable, false);
  assert.equal(state.showNonTintableHint, true);
  assert.equal(state.selectedMode, 'selected');
});
