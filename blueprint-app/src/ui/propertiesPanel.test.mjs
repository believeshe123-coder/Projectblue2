import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getTextureColorModeUiState,
  getTexturePreviewDataUrl,
  renderTexturePickerOptions,
} from './propertiesPanel.js';
import { BUILT_IN_TEXTURES } from '../canvas/texturePresets.js';

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

test('updated ceramic-family built-ins render previews and preserve selected state semantics', () => {
  const updatedPresetIds = [
    'builtin-tile-ceramic-square',
    'builtin-tile-large-format',
    'builtin-herringbone',
    'builtin-hex-tile',
  ];
  const updatedTextures = BUILT_IN_TEXTURES.filter((texture) => updatedPresetIds.includes(texture.id));
  assert.equal(updatedTextures.length, updatedPresetIds.length);

  for (const texture of updatedTextures) {
    const preview = getTexturePreviewDataUrl(texture);
    assert.ok(preview.startsWith('data:image/svg+xml;utf8,'));
  }

  const selectedTextureId = 'builtin-hex-tile';
  const html = renderTexturePickerOptions(updatedTextures, selectedTextureId);
  assert.equal((html.match(/class="texture-picker-preview"/g) ?? []).length, updatedTextures.length);
  assert.match(html, /class="texture-picker-option selected"[\s\S]*data-texture-id="builtin-hex-tile"/);
});
