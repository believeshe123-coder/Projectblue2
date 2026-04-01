import { BUILT_IN_TEXTURES } from '../canvas/texturePresets.js';
const LIBRARY_STORAGE_KEY = 'blueprint.library.v1';

function cloneGrid(grid, fallback = 10) {
  if (!Array.isArray(grid)) {
    return Array.from({ length: fallback }, () => Array.from({ length: fallback }, () => 0));
  }

  return grid.map((row) => row.map((value) => (value ? 1 : 0)));
}

function normalizeShape(shape) {
  if (!shape || typeof shape !== 'object') return null;
  if (typeof shape.id !== 'string' || typeof shape.name !== 'string') return null;
  return {
    id: shape.id,
    name: shape.name,
    grid: cloneGrid(shape.grid, 10),
    updatedAt: Number(shape.updatedAt) || Date.now(),
  };
}

function normalizeTexture(texture) {
  if (!texture || typeof texture !== 'object') return null;
  if (typeof texture.id !== 'string' || typeof texture.name !== 'string') return null;

  const kind = texture.kind === 'image' ? 'image' : 'drawn';
  const dataUrl = typeof texture.dataUrl === 'string' ? texture.dataUrl : '';

  return {
    id: texture.id,
    name: texture.name,
    kind,
    grid: cloneGrid(texture.grid, 10),
    dataUrl,
    tintable: Boolean(texture.tintable),
    updatedAt: Number(texture.updatedAt) || Date.now(),
  };
}

function defaultLibrary() {
  return { shapes: [], textures: [] };
}

function withBuiltInTextures(textures = []) {
  const byId = new Map(textures.map((texture) => [texture.id, texture]));
  for (const preset of BUILT_IN_TEXTURES) {
    byId.set(preset.id, { ...preset, ...(byId.get(preset.id) ?? {}) });
  }
  return [...byId.values()];
}

export function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) return { ...defaultLibrary(), textures: withBuiltInTextures() };
    const parsed = JSON.parse(raw);
    const shapes = Array.isArray(parsed?.shapes) ? parsed.shapes.map(normalizeShape).filter(Boolean) : [];
    const textures = Array.isArray(parsed?.textures) ? parsed.textures.map(normalizeTexture).filter(Boolean) : [];
    return { shapes, textures: withBuiltInTextures(textures) };
  } catch {
    return { ...defaultLibrary(), textures: withBuiltInTextures() };
  }
}

export function saveLibrary(library) {
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch {
    // ignore storage errors
  }
}

export function cloneShapeGrid(grid) {
  return cloneGrid(grid, 10);
}

export function cloneTextureGrid(grid) {
  return cloneGrid(grid, 10);
}
