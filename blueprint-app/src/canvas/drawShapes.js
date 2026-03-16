import { getShapeBehavior } from '../shapes/shapeRegistry.js';

export function drawShapes(ctx, documentData) {
  for (const shape of documentData.shapes) {
    if (!shape.visible) continue;
    const behavior = getShapeBehavior(shape.type);
    if (!behavior?.draw) continue;
    behavior.draw(ctx, shape, { settings: documentData.settings });
  }
}
