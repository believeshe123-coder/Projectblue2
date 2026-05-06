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

function drawCurve(ctx, start, control, end) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  ctx.stroke();
}

export const curveShape = {
  draw(ctx, shape, options = {}) {
    const projection = options.projection;
    const start = projection?.projectPoint ? projection.projectPoint(shape.start) : shape.start;
    const control = projection?.projectPoint ? projection.projectPoint(shape.control) : shape.control;
    const end = projection?.projectPoint ? projection.projectPoint(shape.end) : shape.end;
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;

    const lineType = shape.style.lineType ?? 'solid';
    if (lineType === 'dotted') {
      ctx.setLineDash([4, 4]);
      drawCurve(ctx, start, control, end);
    } else if (lineType === 'double') {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      const offset = Math.max(1.5, shape.style.strokeWidth * 0.8);
      const nx = (-dy / len) * offset;
      const ny = (dx / len) * offset;
      drawCurve(
        ctx,
        { x: start.x + nx, y: start.y + ny },
        { x: control.x + nx, y: control.y + ny },
        { x: end.x + nx, y: end.y + ny },
      );
      drawCurve(
        ctx,
        { x: start.x - nx, y: start.y - ny },
        { x: control.x - nx, y: control.y - ny },
        { x: end.x - nx, y: end.y - ny },
      );
    } else {
      drawCurve(ctx, start, control, end);
    }

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
