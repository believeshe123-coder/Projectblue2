const imageCache = new Map();

function getTextureById(library, textureId) {
  return library?.textures?.find((texture) => texture.id === textureId) ?? null;
}

function drawGridTextureToCanvas(texture) {
  const size = 10;
  const cell = 4;
  const canvas = document.createElement('canvas');
  canvas.width = size * cell;
  canvas.height = size * cell;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!texture.grid?.[y]?.[x]) continue;
      ctx.fillStyle = '#0f4c81';
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  return canvas;
}

function getImage(texture) {
  if (!texture?.dataUrl) return null;
  if (imageCache.has(texture.id)) return imageCache.get(texture.id);

  const image = new Image();
  image.src = texture.dataUrl;
  image.onload = () => {
    window.dispatchEvent(new Event('library-texture-loaded'));
  };
  imageCache.set(texture.id, image);
  return image;
}

export function applyTextureFill(ctx, library, textureId, fallbackFill) {
  const texture = getTextureById(library, textureId);
  if (!texture) {
    ctx.fillStyle = fallbackFill;
    ctx.fill();
    return;
  }

  let source = null;
  if (texture.kind === 'image' && texture.dataUrl) {
    const image = getImage(texture);
    if (image?.complete && image.naturalWidth > 0) {
      source = image;
    }
  }

  if (!source) {
    source = drawGridTextureToCanvas(texture);
  }

  const pattern = ctx.createPattern(source, 'repeat');
  if (!pattern) {
    ctx.fillStyle = fallbackFill;
    ctx.fill();
    return;
  }

  ctx.fillStyle = pattern;
  ctx.fill();
}
