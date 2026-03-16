import { pointToSegmentDistance } from '../utils/geometry.js';

function pointOnQuadratic(t, p0, p1, p2) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function sampledPoints(shape, samples = 20) {
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    points.push(pointOnQuadratic(i / samples, shape.start, shape.control, shape.end));
  }
  return points;
}

export const curveShape = {
  draw(ctx, shape) {
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.beginPath();
    ctx.moveTo(shape.start.x, shape.start.y);
    ctx.quadraticCurveTo(shape.control.x, shape.control.y, shape.end.x, shape.end.y);
    ctx.stroke();
    ctx.restore();
  },

  hitTest(shape, point) {
    const pts = sampledPoints(shape);
    for (let i = 1; i < pts.length; i += 1) {
      if (pointToSegmentDistance(point, pts[i - 1], pts[i]) <= 6) return true;
    }
    return false;
  },

  getBounds(shape) {
    const pts = sampledPoints(shape);
    const minX = Math.min(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxX = Math.max(...pts.map((p) => p.x));
    const maxY = Math.max(...pts.map((p) => p.y));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  },

  move(shape, dx, dy) {
    shape.start = { x: shape.start.x + dx, y: shape.start.y + dy };
    shape.control = { x: shape.control.x + dx, y: shape.control.y + dy };
    shape.end = { x: shape.end.x + dx, y: shape.end.y + dy };
  },
};
