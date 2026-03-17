import { getShapeBehavior } from '../shapes/shapeRegistry.js';

function isVisuallyFilled(shape) {
  if (shape.type !== 'room' && shape.type !== 'region') return true;
  if (shape.filled !== true) return false;
  const alpha = shape.style?.fillAlpha;
  if (typeof alpha === 'number' && alpha <= 0) return false;
  return true;
}

export function findShapeAtPoint(documentData, point) {
  for (let i = documentData.shapes.length - 1; i >= 0; i -= 1) {
    const shape = documentData.shapes[i];
    if (!shape.visible || shape.locked) continue;
    if (!isVisuallyFilled(shape)) continue;
    const behavior = getShapeBehavior(shape.type);
    if (behavior?.hitTest?.(shape, point)) return shape;
  }
  return null;
}
