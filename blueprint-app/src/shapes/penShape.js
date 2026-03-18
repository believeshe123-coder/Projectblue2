import { pointToSegmentDistance } from '../utils/geometry.js';

function drawSmoothPath(ctx, points) {
  if (!points?.length) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    return;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  ctx.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y);
  ctx.stroke();
}

function drawEndCaps(ctx, shape) {
  if (!shape.points || shape.points.length < 2) return;

  const start = shape.points[0];
  const startNext = shape.points[1];
  const end = shape.points[shape.points.length - 1];
  const endPrev = shape.points[shape.points.length - 2];

  const drawCap = (anchor, toward) => {
    const dx = toward.x - anchor.x;
    const dy = toward.y - anchor.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const capLength = Math.max(10, (shape.style?.strokeWidth ?? 2) * 4);
    const half = capLength / 2;

    ctx.beginPath();
    ctx.moveTo(anchor.x - nx * half, anchor.y - ny * half);
    ctx.lineTo(anchor.x + nx * half, anchor.y + ny * half);
    ctx.stroke();
  };

  drawCap(start, startNext);
  drawCap(end, endPrev);
}

function polylineBounds(points) {
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

export const penShape = {
  draw(ctx, shape) {
    if (!shape.points || shape.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const lineType = shape.style.lineType ?? 'solid';
    if (lineType === 'dotted') {
      ctx.setLineDash([4, 4]);
      drawSmoothPath(ctx, shape.points);
    } else if (lineType === 'capped-dotted') {
      ctx.setLineDash([6, 4]);
      drawSmoothPath(ctx, shape.points);
      ctx.setLineDash([]);
      drawEndCaps(ctx, shape);
    } else {
      drawSmoothPath(ctx, shape.points);
    }

    ctx.restore();
  },

  hitTest(shape, point) {
    if (!shape.points || shape.points.length < 2) return false;
    for (let index = 1; index < shape.points.length; index += 1) {
      if (pointToSegmentDistance(point, shape.points[index - 1], shape.points[index]) <= 6) return true;
    }
    return false;
  },

  getBounds(shape) {
    if (!shape.points || !shape.points.length) return { x: 0, y: 0, width: 0, height: 0 };
    return polylineBounds(shape.points);
  },

  move(shape, dx, dy) {
    if (!shape.points) return;
    shape.points = shape.points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
  },
};
