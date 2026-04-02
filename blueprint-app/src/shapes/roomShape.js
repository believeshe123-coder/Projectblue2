import { pointInRect } from '../utils/geometry.js';
import { drawMeasurementLabel, formatShapeMeasurement, shouldRenderMeasurements } from '../utils/measurement.js';
import { colorWithAlpha } from '../utils/color.js';
import { applyTextureFill } from '../canvas/textureFill.js';

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

export function drawRoomMeasurements(ctx, room, settings = {}) {
  if (room.width < 1 || room.height < 1) return;

  const horizontal = formatShapeMeasurement(room.width, settings, room);
  const vertical = formatShapeMeasurement(room.height, settings, room);

  const topY = room.y - 12;
  const bottomY = room.y + room.height + 12;
  const leftX = room.x - 12;
  const rightX = room.x + room.width + 12;

  drawMeasurementLabel(ctx, room.x + room.width / 2, topY, horizontal, settings);
  drawMeasurementLabel(ctx, room.x + room.width / 2, bottomY, horizontal, settings);
  drawMeasurementLabel(ctx, leftX, room.y + room.height / 2, vertical, settings);
  drawMeasurementLabel(ctx, rightX, room.y + room.height / 2, vertical, settings);
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
      ctx.beginPath();
      ctx.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
      if (shape.style?.fillMode === 'texture' && shape.style?.textureId) {
        applyTextureFill(ctx, options.library, shape.style.textureId, colorWithAlpha(shape.style.fill, shape.style.fillAlpha ?? 0.12), {
          tintColor: shape.style.fill,
          colorMode: shape.style.textureColorMode ?? 'original',
          textureScale: shape.style.textureScale ?? 1,
        });
      } else {
        ctx.fillStyle = colorWithAlpha(shape.style.fill, shape.style.fillAlpha ?? 0.12);
        ctx.fill();
      }
    }
    ctx.strokeStyle = shape.style.stroke;
    ctx.lineWidth = shape.style.strokeWidth;
    strokeRoom(ctx, shape);
    ctx.restore();

    if (shouldRenderMeasurements(options.settings, options.isPreview === true) && !radians) {
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
