import { getShapeBehavior } from '../shapes/shapeRegistry.js';
import { normalizeLayers, resolveActiveLayerId } from '../document/layerModel.js';

function clampOpacity(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

export function drawShapes(ctx, documentData, options = {}) {
  const layers = normalizeLayers(documentData.layers);
  const fallbackLayerId = resolveActiveLayerId(documentData, null);
  const layerIds = new Set(layers.map((layer) => layer.id));
  const shapesByLayerId = new Map(layers.map((layer) => [layer.id, []]));

  for (const shape of documentData.shapes) {
    if (shape.visible === false) continue;
    const targetLayerId = layerIds.has(shape.layerId) ? shape.layerId : fallbackLayerId;
    if (!targetLayerId) continue;
    if (!shapesByLayerId.has(targetLayerId)) shapesByLayerId.set(targetLayerId, []);
    shapesByLayerId.get(targetLayerId).push(shape);
  }

  for (const layer of layers) {
    if (layer.visible === false) continue;

    ctx.save();
    ctx.globalAlpha *= clampOpacity(layer.opacity);

    const layerShapes = shapesByLayerId.get(layer.id) ?? [];
    for (const shape of layerShapes) {
      const behavior = getShapeBehavior(shape.type);
      if (!behavior?.draw) continue;
      behavior.draw(ctx, shape, { settings: documentData.settings, ...options });
    }

    ctx.restore();
  }
}
