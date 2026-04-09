import { pointToSegmentDistance } from '../utils/geometry.js';
import { drawMeasurementLabel, formatShapeMeasurement } from '../utils/measurement.js';

function drawTapeMeasurement(ctx, shape, lineStart, lineEnd, settings) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return;

  const midX = (lineStart.x + lineEnd.x) / 2;
  const midY = (lineStart.y + lineEnd.y) / 2;
  const label = formatShapeMeasurement(length, settings, shape);

  drawMeasurementLabel(ctx, midX, midY, label, settings);
}

function drawTapeAngleMeasurement(ctx, shape, settings) {
  const vertex = shape.start;
  const armA = shape.end;
  const armB = shape.offset;
  if (!vertex || !armA || !armB) return;

  const v1x = armA.x - vertex.x;
  const v1y = armA.y - vertex.y;
  const v2x = armB.x - vertex.x;
  const v2y = armB.y - vertex.y;
  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 < 0.01 || len2 < 0.01) return;

  const dot = (v1x * v2x) + (v1y * v2y);
  const cos = Math.max(-1, Math.min(1, dot / (len1 * len2)));
  const angleRad = Math.acos(cos);
  const angleDeg = (angleRad * 180) / Math.PI;
  const label = `${angleDeg.toFixed(1)}°`;

  const startAngle = Math.atan2(v1y, v1x);
  let endAngle = Math.atan2(v2y, v2x);
  let sweep = endAngle - startAngle;
  while (sweep <= -Math.PI) sweep += Math.PI * 2;
  while (sweep > Math.PI) sweep -= Math.PI * 2;

  const radius = Math.max(14, Math.min(28, Math.min(len1, len2) * 0.35));
  ctx.save();
  ctx.strokeStyle = shape.style.stroke;
  ctx.lineWidth = Math.max(1, shape.style.strokeWidth - 0.5);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(vertex.x, vertex.y, radius, startAngle, startAngle + sweep, sweep < 0);
  ctx.stroke();
  ctx.restore();

  const midAngle = startAngle + (sweep / 2);
  const labelRadius = radius + 12;
  drawMeasurementLabel(
    ctx,
    vertex.x + Math.cos(midAngle) * labelRadius,
    vertex.y + Math.sin(midAngle) * labelRadius,
    label,
    settings,
  );
}

function resolveOffsetGeometry(shape) {
  const dx = shape.end.x - shape.start.x;
  const dy = shape.end.y - shape.start.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return null;

  const unitX = dx / length;
  const unitY = dy / length;
  const normal = { x: -unitY, y: unitX };
  const offsetPoint = shape.offset ?? shape.end;
  const offsetDistance = ((offsetPoint.x - shape.start.x) * normal.x) + ((offsetPoint.y - shape.start.y) * normal.y);

  const dimStart = {
    x: shape.start.x + normal.x * offsetDistance,
    y: shape.start.y + normal.y * offsetDistance,
  };
  const dimEnd = {
    x: shape.end.x + normal.x * offsetDistance,
    y: shape.end.y + normal.y * offsetDistance,
  };

  return {
    extensionA: [shape.start, dimStart],
    extensionB: [shape.end, dimEnd],
    dimension: [dimStart, dimEnd],
  };
}

export const tapeShape = {
  draw(ctx, shape, options = {}) {
    const shouldRenderLabel = true;

    if (shape.mode === 'angle') {
      if (!shape.offset) return;

      ctx.save();
      ctx.strokeStyle = shape.style.stroke;
      ctx.lineWidth = shape.style.strokeWidth;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.offset.x, shape.offset.y);
      ctx.stroke();
      ctx.restore();

      if (shouldRenderLabel) {
        drawTapeAngleMeasurement(ctx, shape, options.settings ?? {});
      }
      return;
    }

    if (shape.mode === 'offset') {
      const geometry = resolveOffsetGeometry(shape);
      if (!geometry) return;

      ctx.save();
      ctx.strokeStyle = shape.style.stroke;
      ctx.lineWidth = Math.max(1, shape.style.strokeWidth - 0.5);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(geometry.extensionA[0].x, geometry.extensionA[0].y);
      ctx.lineTo(geometry.extensionA[1].x, geometry.extensionA[1].y);
      ctx.moveTo(geometry.extensionB[0].x, geometry.extensionB[0].y);
      ctx.lineTo(geometry.extensionB[1].x, geometry.extensionB[1].y);
      ctx.stroke();

      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(geometry.dimension[0].x, geometry.dimension[0].y);
      ctx.lineTo(geometry.dimension[1].x, geometry.dimension[1].y);
      ctx.stroke();
      ctx.restore();

      if (shouldRenderLabel) {
        drawTapeMeasurement(ctx, shape, geometry.dimension[0], geometry.dimension[1], options.settings ?? {});
      }
      return;
    }

    ctx.save();
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(shape.start.x, shape.start.y);
    ctx.lineTo(shape.end.x, shape.end.y);
    ctx.stroke();
    ctx.restore();

    if (shouldRenderLabel) {
      drawTapeMeasurement(ctx, shape, shape.start, shape.end, options.settings ?? {});
    }
  },

  hitTest(shape, point) {
    if (shape.mode === 'angle') {
      if (!shape.offset) return false;
      return (
        pointToSegmentDistance(point, shape.start, shape.end) <= 6
        || pointToSegmentDistance(point, shape.start, shape.offset) <= 6
      );
    }

    if (shape.mode === 'offset') {
      const geometry = resolveOffsetGeometry(shape);
      if (!geometry) return false;
      return (
        pointToSegmentDistance(point, geometry.extensionA[0], geometry.extensionA[1]) <= 6 ||
        pointToSegmentDistance(point, geometry.extensionB[0], geometry.extensionB[1]) <= 6 ||
        pointToSegmentDistance(point, geometry.dimension[0], geometry.dimension[1]) <= 6
      );
    }

    return pointToSegmentDistance(point, shape.start, shape.end) <= 6;
  },

  getBounds(shape) {
    const points = [shape.start, shape.end];
    if (shape.mode === 'offset' && shape.offset) points.push(shape.offset);
    const x = Math.min(...points.map((p) => p.x));
    const y = Math.min(...points.map((p) => p.y));
    const width = Math.max(...points.map((p) => p.x)) - x;
    const height = Math.max(...points.map((p) => p.y)) - y;
    return { x, y, width, height };
  },

  move(shape, dx, dy) {
    shape.start = { x: shape.start.x + dx, y: shape.start.y + dy };
    shape.end = { x: shape.end.x + dx, y: shape.end.y + dy };
    if (shape.offset) {
      shape.offset = { x: shape.offset.x + dx, y: shape.offset.y + dy };
    }
  },
};
