import { pointToSegmentDistance } from '../utils/geometry.js';
import { formatMeasurement, shouldRenderPersistedMeasurements } from '../utils/measurement.js';

function drawLineMeasurement(ctx, shape, settings) {
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

  const metrics = ctx.measureText(label);
  const width = metrics.width + 12;
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

function drawStyledLine(ctx, shape) {
  const lineType = shape.style.lineType ?? 'solid';
  if (lineType === 'dotted') ctx.setLineDash([4, 4]);

  if (lineType !== 'double') {
    ctx.beginPath();
    ctx.moveTo(shape.start.x, shape.start.y);
    ctx.lineTo(shape.end.x, shape.end.y);
    ctx.stroke();
    return;
  }

  const dx = shape.end.x - shape.start.x;
  const dy = shape.end.y - shape.start.y;
  const length = Math.hypot(dx, dy) || 1;
  const offset = Math.max(1.5, shape.style.strokeWidth * 0.8);
  const nx = (-dy / length) * offset;
  const ny = (dx / length) * offset;

  ctx.beginPath();
  ctx.moveTo(shape.start.x + nx, shape.start.y + ny);
  ctx.lineTo(shape.end.x + nx, shape.end.y + ny);
  ctx.moveTo(shape.start.x - nx, shape.start.y - ny);
  ctx.lineTo(shape.end.x - nx, shape.end.y - ny);
  ctx.stroke();
}

export const lineShape = {
  draw(ctx, shape, options = {}) {
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    drawStyledLine(ctx, shape);
    ctx.restore();

    if (shouldRenderPersistedMeasurements(options.settings)) {
      drawLineMeasurement(ctx, shape, options.settings);
    }
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
