import { generateId } from '../utils/idGenerator.js';

export function createLayer(name = 'Default Layer') {
  return {
    id: generateId('layer'),
    name,
    visible: true,
    opacity: 1,
    locked: false,
  };
}

function clampOpacity(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

export function normalizeLayer(layer, index = 0) {
  const fallback = createLayer(`Layer ${index + 1}`);
  if (!layer || typeof layer !== 'object') return fallback;

  return {
    ...fallback,
    ...layer,
    id: typeof layer.id === 'string' && layer.id ? layer.id : fallback.id,
    name: typeof layer.name === 'string' && layer.name.trim() ? layer.name : fallback.name,
    visible: layer.visible !== false,
    opacity: clampOpacity(layer.opacity),
    locked: layer.locked === true,
  };
}

export function normalizeLayers(layers) {
  const normalized = Array.isArray(layers)
    ? layers.map((layer, index) => normalizeLayer(layer, index))
    : [];
  return normalized.length ? normalized : [createLayer()];
}

export function resolveActiveLayerId(documentData, activeLayerId) {
  const layers = normalizeLayers(documentData?.layers);
  const layerIds = new Set(layers.map((layer) => layer.id));

  if (typeof activeLayerId === 'string' && layerIds.has(activeLayerId)) {
    const activeLayer = layers.find((layer) => layer.id === activeLayerId);
    if (activeLayer?.visible !== false) return activeLayerId;
  }

  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index];
    if (layer.visible !== false) return layer.id;
  }

  return layers[layers.length - 1]?.id ?? layers[0].id;
}
