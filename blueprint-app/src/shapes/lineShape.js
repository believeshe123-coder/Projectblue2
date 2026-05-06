import { pointToSegmentDistance } from '../utils/geometry.js';
import { drawMeasurementLabel, formatShapeMeasurement, shouldRenderMeasurements } from '../utils/measurement.js';

function drawLineMeasurement(ctx, shape, settings) {
  const dx = shape.end.x - shape.start.x;
  const dy = shape.end.y - shape.start.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return;

  const midX = (shape.start.x + shape.end.x) / 2;
  const midY = (shape.start.y + shape.end.y) / 2;
  const label = formatShapeMeasurement(length, settings, shape);

  drawMeasurementLabel(ctx, midX, midY, label, settings);
}

function drawStyledLine(ctx, shape) {
  const projection = shape.projection;
  const start = projection?.projectPoint ? projection.projectPoint(shape.start) : shape.start;
  const end = projection?.projectPoint ? projection.projectPoint(shape.end) : shape.end;
  const lineType = shape.style.lineType ?? 'solid';
  if (lineType === 'dotted') ctx.setLineDash([4, 4]);

  if (lineType === 'capped-dotted') {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const capLength = Math.max(10, shape.style.strokeWidth * 4);
    const halfCap = capLength / 2;

    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(start.x - nx * halfCap, start.y - ny * halfCap);
    ctx.lineTo(start.x + nx * halfCap, start.y + ny * halfCap);
    ctx.moveTo(end.x - nx * halfCap, end.y - ny * halfCap);
    ctx.lineTo(end.x + nx * halfCap, end.y + ny * halfCap);
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

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const offset = Math.max(1.5, shape.style.strokeWidth * 0.8);
  const nx = (-dy / length) * offset;
  const ny = (dx / length) * offset;

  ctx.beginPath();
  ctx.moveTo(start.x + nx, start.y + ny);
  ctx.lineTo(end.x + nx, end.y + ny);
  ctx.moveTo(start.x - nx, start.y - ny);
  ctx.lineTo(end.x - nx, end.y - ny);
  ctx.stroke();
}

export const lineShape = {
  draw(ctx, shape, options = {}) {
    const projectedShape = { ...shape, projection: options.projection };
    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    drawStyledLine(ctx, projectedShape);
    ctx.restore();

    if (shouldRenderMeasurements(options.settings, options.isPreview === true)) {
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
