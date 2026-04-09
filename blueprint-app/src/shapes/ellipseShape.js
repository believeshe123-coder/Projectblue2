const HIT_TOLERANCE = 6;

function ellipseMetrics(shape) {
  const rx = Math.abs(shape.width) / 2;
  const ry = Math.abs(shape.height) / 2;
  const cx = shape.x + (shape.width / 2);
  const cy = shape.y + (shape.height / 2);
  return { cx, cy, rx, ry };
}

function drawEllipse(ctx, shape, scale = 1) {
  const { cx, cy, rx, ry } = ellipseMetrics(shape);
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.5, rx * scale), Math.max(0.5, ry * scale), 0, 0, Math.PI * 2);
  ctx.stroke();
}

export const ellipseShape = {
  draw(ctx, shape) {
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;

    const lineType = shape.style.lineType ?? 'solid';
    if (lineType === 'dotted') {
      ctx.setLineDash([4, 4]);
      drawEllipse(ctx, shape);
    } else if (lineType === 'double') {
      const minRadius = Math.max(1, Math.min(Math.abs(shape.width), Math.abs(shape.height)) / 2);
      const offset = Math.min(minRadius - 0.5, Math.max(1, shape.style.strokeWidth * 0.8));
      drawEllipse(ctx, shape, Math.max(0.15, 1 - (offset / Math.max(1, minRadius))));
      drawEllipse(ctx, shape, 1 + (offset / Math.max(1, minRadius)));
    } else {
      drawEllipse(ctx, shape);
    }

    ctx.restore();
  },

  hitTest(shape, point) {
    const { cx, cy, rx, ry } = ellipseMetrics(shape);
    if (rx < 1 || ry < 1) return false;

    const nx = (point.x - cx) / rx;
    const ny = (point.y - cy) / ry;
    const value = (nx * nx) + (ny * ny);
    const tolerance = Math.max(HIT_TOLERANCE / Math.max(rx, ry), 0.05);
    return Math.abs(value - 1) <= tolerance;
  },

  getBounds(shape) {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
