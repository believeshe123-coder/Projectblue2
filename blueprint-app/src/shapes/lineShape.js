import { pointToSegmentDistance } from '../utils/geometry.js';

export const lineShape = {
  draw(ctx, shape) {
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.beginPath();
    ctx.moveTo(shape.start.x, shape.start.y);
    ctx.lineTo(shape.end.x, shape.end.y);
    ctx.stroke();
    ctx.restore();
  },

  hitTest(shape, point) {
    return pointToSegmentDistance(point, shape.start, shape.end) <= 6;
  },

  getBounds(shape) {
    const x = Math.min(shape.start.x, shape.end.x);
    const y = Math.min(shape.start.y, shape.end.y);
    const width = Math.abs(shape.end.x - shape.start.x);
    const height = Math.abs(shape.end.y - shape.start.y);
    return { x, y, width, height };
  },

  move(shape, dx, dy) {
    shape.start = { x: shape.start.x + dx, y: shape.start.y + dy };
    shape.end = { x: shape.end.x + dx, y: shape.end.y + dy };
  },
};
