import { pointToSegmentDistance } from '../utils/geometry.js';
import { formatMeasurement } from '../utils/measurement.js';

function drawTapeMeasurement(ctx, shape, settings) {
  const dx = shape.end.x - shape.start.x;
  const dy = shape.end.y - shape.start.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return;

  const midX = (shape.start.x + shape.end.x) / 2;
  const midY = (shape.start.y + shape.end.y) / 2;
  const label = formatMeasurement(length, settings);

  ctx.save();
  ctx.font = '12px Inter, Segoe UI, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const width = ctx.measureText(label).width + 12;
  const height = 18;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f4c81';
  ctx.lineWidth = 1;
  ctx.fillRect(midX - width / 2, midY - height / 2, width, height);
  ctx.strokeRect(midX - width / 2, midY - height / 2, width, height);

  ctx.fillStyle = '#0f4c81';
  ctx.fillText(label, midX, midY);
  ctx.restore();
}

export const tapeShape = {
  draw(ctx, shape, options = {}) {
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(shape.start.x, shape.start.y);
    ctx.lineTo(shape.end.x, shape.end.y);
    ctx.stroke();
    ctx.restore();

    drawTapeMeasurement(ctx, shape, options.settings ?? {});
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
