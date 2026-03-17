import { pointInRect } from '../utils/geometry.js';
import { formatMeasurement, shouldRenderPersistedMeasurements } from '../utils/measurement.js';
import { colorWithAlpha } from '../utils/color.js';

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

function roomCenter(room) {
  return {
    x: room.x + room.width / 2,
    y: room.y + room.height / 2,
  };
}

function roomCorners(room) {
  const center = roomCenter(room);
  const radians = ((room.angle ?? 0) * Math.PI) / 180;
  const halfWidth = room.width / 2;
  const halfHeight = room.height / 2;
  const baseCorners = [
    { x: center.x - halfWidth, y: center.y - halfHeight },
    { x: center.x + halfWidth, y: center.y - halfHeight },
    { x: center.x + halfWidth, y: center.y + halfHeight },
    { x: center.x - halfWidth, y: center.y + halfHeight },
  ];

  if (!radians) return baseCorners;
  return baseCorners.map((point) => rotatePoint(point, center, radians));
}

function drawMeasurementLabel(ctx, x, y, text) {
  ctx.save();
  ctx.font = '12px Inter, Segoe UI, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const width = metrics.width + 12;
  const height = 18;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f4c81';
  ctx.lineWidth = 1;
  ctx.fillRect(x - width / 2, y - height / 2, width, height);
  ctx.strokeRect(x - width / 2, y - height / 2, width, height);

  ctx.fillStyle = '#0f4c81';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawRoomMeasurements(ctx, room, settings = {}) {
  if (room.width < 1 || room.height < 1) return;

  const horizontal = formatMeasurement(room.width, settings);
  const vertical = formatMeasurement(room.height, settings);

  const topY = room.y - 12;
  const bottomY = room.y + room.height + 12;
  const leftX = room.x - 12;
  const rightX = room.x + room.width + 12;

  drawMeasurementLabel(ctx, room.x + room.width / 2, topY, horizontal);
  drawMeasurementLabel(ctx, room.x + room.width / 2, bottomY, horizontal);
  drawMeasurementLabel(ctx, leftX, room.y + room.height / 2, vertical);
  drawMeasurementLabel(ctx, rightX, room.y + room.height / 2, vertical);
}

function strokeRoom(ctx, shape) {
  const lineType = shape.style.lineType ?? 'solid';
  if (lineType === 'dotted') ctx.setLineDash([4, 4]);

  if (lineType !== 'double') {
    ctx.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
    return;
  }

  const inset = Math.max(2, shape.style.strokeWidth * 1.2);
  ctx.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
  ctx.strokeRect(
    -shape.width / 2 + inset,
    -shape.height / 2 + inset,
    Math.max(0, shape.width - inset * 2),
    Math.max(0, shape.height - inset * 2),
  );
}

export const roomShape = {
  draw(ctx, shape, options = {}) {
    const center = roomCenter(shape);
    const radians = ((shape.angle ?? 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(center.x, center.y);
    if (radians) ctx.rotate(radians);
    if (shape.filled) {
      ctx.fillStyle = colorWithAlpha(shape.style.fill, shape.style.fillAlpha ?? 0.12);
      ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
    }
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    strokeRoom(ctx, shape);
    ctx.restore();

    if (shouldRenderPersistedMeasurements(options.settings) && !radians) {
      drawRoomMeasurements(ctx, shape, options.settings);
    }
  },

  hitTest(shape, point) {
    const radians = ((shape.angle ?? 0) * Math.PI) / 180;
    if (!radians) return pointInRect(point, shape);

    const center = roomCenter(shape);
    const local = rotatePoint(point, center, -radians);
    return pointInRect(local, shape);
  },

  getBounds(shape) {
    const corners = roomCorners(shape);
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
