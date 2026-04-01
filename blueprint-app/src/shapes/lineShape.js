import { pointToSegmentDistance } from '../utils/geometry.js';
import { drawMeasurementLabel, formatMeasurement, shouldRenderPersistedMeasurements } from '../utils/measurement.js';

function drawLineMeasurement(ctx, shape, settings) {
  const dx = shape.end.x - shape.start.x;
  const dy = shape.end.y - shape.start.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return;

  const midX = (shape.start.x + shape.end.x) / 2;
  const midY = (shape.start.y + shape.end.y) / 2;
  const label = formatMeasurement(length, settings);

  drawMeasurementLabel(ctx, midX, midY, label, settings);
}

function drawStyledLine(ctx, shape) {
  const lineType = shape.style.lineType ?? 'solid';
  if (lineType === 'dotted') ctx.setLineDash([4, 4]);

  if (lineType === 'capped-dotted') {
    const dx = shape.end.x - shape.start.x;
    const dy = shape.end.y - shape.start.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const capLength = Math.max(10, shape.style.strokeWidth * 4);
    const halfCap = capLength / 2;

    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(shape.start.x, shape.start.y);
    ctx.lineTo(shape.end.x, shape.end.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(shape.start.x - nx * halfCap, shape.start.y - ny * halfCap);
    ctx.lineTo(shape.start.x + nx * halfCap, shape.start.y + ny * halfCap);
    ctx.moveTo(shape.end.x - nx * halfCap, shape.end.y - ny * halfCap);
    ctx.lineTo(shape.end.x + nx * halfCap, shape.end.y + ny * halfCap);
    ctx.stroke();
    return;
  }

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
