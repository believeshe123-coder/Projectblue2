import { pointInRect } from '../utils/geometry.js';

export const roomShape = {
  draw(ctx, shape) {
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.fillStyle = shape.style.fill;
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    ctx.restore();
  },

  hitTest(shape, point) {
    return pointInRect(point, shape);
  },

  getBounds(shape) {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
