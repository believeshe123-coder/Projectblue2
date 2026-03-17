import { pointInRect } from '../utils/geometry.js';
import { formatMeasurement, shouldRenderPersistedMeasurements } from '../utils/measurement.js';
import { colorWithAlpha } from '../utils/color.js';

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
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    return;
  }

  const inset = Math.max(2, shape.style.strokeWidth * 1.2);
  ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
  ctx.strokeRect(shape.x + inset, shape.y + inset, Math.max(0, shape.width - inset * 2), Math.max(0, shape.height - inset * 2));
}

export const roomShape = {
  draw(ctx, shape, options = {}) {
    ctx.save();
    if (shape.filled) {
      ctx.fillStyle = colorWithAlpha(shape.style.fill, shape.style.fillAlpha ?? 0.12);
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    }
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    strokeRoom(ctx, shape);
    ctx.restore();

    if (shouldRenderPersistedMeasurements(options.settings)) {
      drawRoomMeasurements(ctx, shape, options.settings);
    }
  },

  hitTest(shape, point) {
    return pointInRect(point, shape);
  },

  getBounds(shape) {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
