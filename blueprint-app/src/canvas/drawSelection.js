import { getShapeBehavior } from '../shapes/shapeRegistry.js';

export function drawSelection(ctx, documentData, selectedIds) {
  ctx.save();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);

  for (const id of selectedIds) {
    const shape = documentData.shapes.find((item) => item.id === id);
    if (!shape) continue;
    const behavior = getShapeBehavior(shape.type);
    if (!behavior?.getBounds) continue;
    const b = behavior.getBounds(shape);
    ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
  }

  ctx.restore();
}
