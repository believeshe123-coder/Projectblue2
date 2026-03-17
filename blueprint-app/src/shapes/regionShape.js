function pointInPolygon(point, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function polygonBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export const regionShape = {
  draw(ctx, shape) {
    if (!shape.points?.length) return;

    ctx.save();
    ctx.fillStyle = shape.style.fill || 'rgba(15, 76, 129, 0.12)';
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (let index = 1; index < shape.points.length; index += 1) {
      ctx.lineTo(shape.points[index].x, shape.points[index].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  hitTest(shape, point) {
    if (!shape.points?.length) return false;
    return pointInPolygon(point, shape.points);
  },

  getBounds(shape) {
    if (!shape.points?.length) return { x: 0, y: 0, width: 0, height: 0 };
    return polygonBounds(shape.points);
  },

  move(shape, dx, dy) {
    shape.points = shape.points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
  },
};
