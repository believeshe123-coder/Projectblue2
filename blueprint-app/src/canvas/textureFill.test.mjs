import test from 'node:test';
import assert from 'node:assert/strict';

import { applyTextureFill } from './textureFill.js';
import { BUILT_IN_TEXTURES } from './texturePresets.js';

function decodeSvg(textureId) {
  const texture = BUILT_IN_TEXTURES.find((entry) => entry.id === textureId);
  assert.ok(texture, `missing texture ${textureId}`);
  const encoded = texture.dataUrl.split(',')[1];
  return decodeURIComponent(encoded);
}

function createMockCanvas(label = 'canvas') {
  const operations = [];
  const ctx = {
    operations,
    clearRect: (...args) => operations.push(['clearRect', ...args]),
    drawImage: (...args) => operations.push(['drawImage', ...args]),
    fillRect: (...args) => operations.push(['fillRect', ...args]),
    set fillStyle(value) {
      operations.push(['fillStyle', value]);
    },
    get fillStyle() {
      return null;
    },
    set globalCompositeOperation(value) {
      operations.push(['globalCompositeOperation', value]);
    },
    get globalCompositeOperation() {
      return 'source-over';
    },
  };

  return {
    label,
    width: 0,
    height: 0,
    getContext: () => ctx,
    operations,
  };
}

function withMockDom(fn) {
  const priorDocument = globalThis.document;
  const priorWindow = globalThis.window;
  const priorImage = globalThis.Image;

  class MockImage {
    constructor() {
      this.complete = true;
      this.naturalWidth = 96;
      this.naturalHeight = 96;
      this.width = 96;
      this.height = 96;
      this.onload = null;
    }

    set src(value) {
      this._src = value;
    }

    get src() {
      return this._src;
    }
  }

  const generatedCanvases = [];
  globalThis.document = {
    createElement(tag) {
      if (tag !== 'canvas') return {};
      const canvas = createMockCanvas(`generated-${generatedCanvases.length}`);
      generatedCanvases.push(canvas);
      return canvas;
    },
  };
  globalThis.window = { dispatchEvent() {} };
  globalThis.Image = MockImage;

  try {
    fn({ generatedCanvases });
  } finally {
    globalThis.document = priorDocument;
    globalThis.window = priorWindow;
    globalThis.Image = priorImage;
  }
}

test('selected texture color mode tints image textures while original mode leaves source untouched', () => {
  withMockDom(() => {
    const texture = BUILT_IN_TEXTURES.find((entry) => entry.id === 'builtin-wood-planks');
    const library = { textures: [texture] };

    const fillOps = [];
    const renderCtx = {
      fill: () => fillOps.push('fill'),
      createPattern: (source) => ({ source, setTransform() {} }),
      set fillStyle(value) {
        this._fillStyle = value;
      },
      get fillStyle() {
        return this._fillStyle;
      },
    };

    applyTextureFill(renderCtx, library, texture.id, '#abc', {
      tintColor: '#ff0000',
      colorMode: 'original',
      textureScale: 1,
    });
    const originalSource = renderCtx.fillStyle.source;
    assert.equal(fillOps.length, 1);
    assert.equal(originalSource.constructor.name, 'MockImage');

    applyTextureFill(renderCtx, library, texture.id, '#abc', {
      tintColor: '#00ff00',
      colorMode: 'selected',
      textureScale: 1,
    });

    const tintedSource = renderCtx.fillStyle.source;
    assert.notEqual(tintedSource.constructor.name, 'MockImage');
    assert.ok(Array.isArray(tintedSource.operations));
    const tintOps = tintedSource.operations.flat();
    assert.ok(tintOps.includes('multiply'));
    assert.ok(tintOps.includes('destination-in'));
  });
});

test('diagonal wood and loop carpet presets keep seamless-ready deterministic markup', () => {
  const diagonalSvg = decodeSvg('builtin-wood-planks-diagonal');
  const carpetSvg = decodeSvg('builtin-carpet-loop');

  assert.match(diagonalSvg, /clipPath/);
  assert.match(diagonalSvg, /M-96 0L0 96/);
  assert.match(carpetSvg, /feTurbulence/);
  assert.match(carpetSvg, /stitchTiles="stitch"/);
});

test('new built-in floor preset ids are present and tintable', () => {
  const expectedIds = [
    'builtin-tile-ceramic-square',
    'builtin-tile-large-format',
    'builtin-herringbone',
    'builtin-stone-speckle',
    'builtin-hex-tile',
  ];

  for (const textureId of expectedIds) {
    const texture = BUILT_IN_TEXTURES.find((entry) => entry.id === textureId);
    assert.ok(texture, `missing texture ${textureId}`);
    assert.equal(texture.kind, 'image');
    assert.equal(texture.tintable, true);
    assert.match(texture.dataUrl, /^data:image\/svg\+xml/);
  }
});

test('hex tile preset keeps tintable image contract with seamless repeat metadata', () => {
  const texture = BUILT_IN_TEXTURES.find((entry) => entry.id === 'builtin-hex-tile');
  assert.ok(texture, 'missing texture builtin-hex-tile');
  assert.equal(texture.kind, 'image');
  assert.equal(texture.tintable, true);

  const hexSvg = decodeSvg('builtin-hex-tile');
  assert.match(hexSvg, /pattern id="hexPattern" width="24" height="42"/);
  assert.match(hexSvg, /shape-rendering="crispEdges"/);
  assert.match(hexSvg, /M12 21\.5L23\.5 28\.5L23\.5 41\.5L12 48\.5L0\.5 41\.5L0\.5 28\.5Z/);
});
