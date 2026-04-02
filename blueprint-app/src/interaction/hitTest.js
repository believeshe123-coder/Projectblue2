import { getShapeBehavior } from '../shapes/shapeRegistry.js';
import { normalizeLayers, resolveActiveLayerId } from '../document/layerModel.js';

function isVisuallyFilled(shape) {
  if (shape.type !== 'room' && shape.type !== 'region') return true;
  if (shape.filled !== true) return false;
  const alpha = shape.style?.fillAlpha;
  if (typeof alpha === 'number' && alpha <= 0) return false;
  return true;
}

export function findShapeAtPoint(documentData, point, { activeLayerId = null } = {}) {
  const layers = normalizeLayers(documentData.layers);
  const fallbackLayerId = resolveActiveLayerId(documentData, null);
  const visibleLayerIds = new Set(layers.filter((layer) => layer.visible !== false).map((layer) => layer.id));
  const resolvedActiveLayerId = activeLayerId && visibleLayerIds.has(activeLayerId) ? activeLayerId : null;
  const layerOrder = layers.map((layer) => layer.id);
  const layerShapes = new Map(layerOrder.map((layerId) => [layerId, []]));

  for (let i = 0; i < documentData.shapes.length; i += 1) {
    const shape = documentData.shapes[i];
    const layerId = visibleLayerIds.has(shape.layerId) ? shape.layerId : fallbackLayerId;
    if (!layerId || !visibleLayerIds.has(layerId)) continue;
    if (resolvedActiveLayerId && layerId !== resolvedActiveLayerId) continue;
    if (!layerShapes.has(layerId)) layerShapes.set(layerId, []);
    layerShapes.get(layerId).push(shape);
  }

  for (let layerIndex = layerOrder.length - 1; layerIndex >= 0; layerIndex -= 1) {
    const layerId = layerOrder[layerIndex];
    if (!visibleLayerIds.has(layerId)) continue;
    if (resolvedActiveLayerId && layerId !== resolvedActiveLayerId) continue;
    const shapes = layerShapes.get(layerId) ?? [];
    for (let i = shapes.length - 1; i >= 0; i -= 1) {
      const shape = shapes[i];
      if (shape.visible === false || shape.locked) continue;
      if (!isVisuallyFilled(shape)) continue;
      const behavior = getShapeBehavior(shape.type);
      if (behavior?.hitTest?.(shape, point)) return shape;
    }
  }
  return null;
}
