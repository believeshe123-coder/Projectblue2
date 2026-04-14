function estimateLabelWidth(shape, textSize) {
  return Math.max(8, shape.text.length * (textSize * 0.58));
}

function rotatePoint(point, center, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function getLabelBounds(shape) {
  const textSize = shape.style.textSize || 14;
  const width = estimateLabelWidth(shape, textSize);
  const localBounds = {
    x: shape.x,
    y: shape.y - textSize,
    width,
    height: textSize + 4,
  };

  const angle = (shape.angle ?? 0) * (Math.PI / 180);
  if (Math.abs(angle) < 0.00001) return localBounds;

  const corners = [
    { x: localBounds.x, y: localBounds.y },
    { x: localBounds.x + localBounds.width, y: localBounds.y },
    { x: localBounds.x + localBounds.width, y: localBounds.y + localBounds.height },
    { x: localBounds.x, y: localBounds.y + localBounds.height },
  ].map((point) => rotatePoint(point, { x: shape.x, y: shape.y }, angle));

  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

export const labelShape = {
  draw(ctx, shape) {
    ctx.save();
    ctx.fillStyle = shape.style.fill || '#111827';
    ctx.font = `${shape.style.textSize || 14}px ${shape.style.fontFamily || 'Inter, Segoe UI, Tahoma, sans-serif'}`;
    const angle = (shape.angle ?? 0) * (Math.PI / 180);
    if (Math.abs(angle) > 0.00001) {
      ctx.translate(shape.x, shape.y);
      ctx.rotate(angle);
      ctx.fillText(shape.text, 0, 0);
    } else {
      ctx.fillText(shape.text, shape.x, shape.y);
    }
    ctx.restore();
  },

  hitTest(shape, point) {
    const textSize = shape.style.textSize || 14;
    const width = estimateLabelWidth(shape, textSize);
    const angle = (shape.angle ?? 0) * (Math.PI / 180);
    const localPoint = Math.abs(angle) > 0.00001
      ? rotatePoint(point, { x: shape.x, y: shape.y }, -angle)
      : point;

    return localPoint.x >= shape.x
      && localPoint.x <= shape.x + width
      && localPoint.y <= shape.y
      && localPoint.y >= shape.y - textSize;
  },

  getBounds(shape) {
    return getLabelBounds(shape);
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
