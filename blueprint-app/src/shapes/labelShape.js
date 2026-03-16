export const labelShape = {
  draw(ctx, shape) {
    ctx.save();
    ctx.fillStyle = shape.style.fill || '#111827';
    ctx.font = `${shape.style.textSize || 14}px sans-serif`;
    ctx.fillText(shape.text, shape.x, shape.y);
    ctx.restore();
  },

  hitTest(shape, point) {
    const textSize = shape.style.textSize || 14;
    const w = shape.text.length * (textSize * 0.58);
    return point.x >= shape.x && point.x <= shape.x + w && point.y <= shape.y && point.y >= shape.y - textSize;
  },

  getBounds(shape) {
    const textSize = shape.style.textSize || 14;
    return { x: shape.x, y: shape.y - textSize, width: shape.text.length * (textSize * 0.58), height: textSize + 4 };
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
