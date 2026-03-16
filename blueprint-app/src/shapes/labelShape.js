export const labelShape = {
  draw(ctx, shape) {
    ctx.save();
    ctx.fillStyle = shape.style.fill || '#111827';
    ctx.font = '14px sans-serif';
    ctx.fillText(shape.text, shape.x, shape.y);
    ctx.restore();
  },

  hitTest(shape, point) {
    const w = shape.text.length * 8;
    return point.x >= shape.x && point.x <= shape.x + w && point.y <= shape.y && point.y >= shape.y - 16;
  },

  getBounds(shape) {
    return { x: shape.x, y: shape.y - 16, width: shape.text.length * 8, height: 18 };
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
