import { getShapeBehavior } from '../shapes/shapeRegistry.js';

export function findShapeAtPoint(documentData, point) {
  for (let i = documentData.shapes.length - 1; i >= 0; i -= 1) {
    const shape = documentData.shapes[i];
    if (!shape.visible || shape.locked) continue;
    const behavior = getShapeBehavior(shape.type);
    if (behavior?.hitTest?.(shape, point)) return shape;
  }
  return null;
}
