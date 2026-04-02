import { colorWithAlpha } from '../utils/color.js';
import { applyTextureFill } from '../canvas/textureFill.js';
import {
  drawMeasurementLabel,
  formatShapeAreaMeasurement,
  shouldRenderMeasurements,
} from '../utils/measurement.js';
function pointInPolygon(point, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function polygonBounds(points) {
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

function polygonArea(points) {
  let twiceArea = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    twiceArea += (points[j].x * points[i].y) - (points[i].x * points[j].y);
  }
  return Math.abs(twiceArea) / 2;
}

function polygonCentroid(points) {
  const areaFactor = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + ((point.x * next.y) - (next.x * point.y));
  }, 0);

  if (Math.abs(areaFactor) < 0.0001) {
    const bounds = polygonBounds(points);
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  }

  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const cross = (current.x * next.y) - (next.x * current.y);
    cx += (current.x + next.x) * cross;
    cy += (current.y + next.y) * cross;
  }

  const scale = 1 / (3 * areaFactor);
  return { x: cx * scale, y: cy * scale };
}

export const regionShape = {
  draw(ctx, shape, options = {}) {
    if (!shape.points?.length) return;
    if (shape.filled === false) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (let index = 1; index < shape.points.length; index += 1) {
      ctx.lineTo(shape.points[index].x, shape.points[index].y);
    }
    ctx.closePath();
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
    ctx.restore();

    if (!shouldRenderMeasurements(options.settings, options.isPreview === true)) return;
    const area = polygonArea(shape.points);
    if (area < 1) return;
    const centroid = polygonCentroid(shape.points);
    const label = formatShapeAreaMeasurement(area, options.settings ?? {}, shape);
    drawMeasurementLabel(ctx, centroid.x, centroid.y, label, options.settings ?? {});
  },

  hitTest(shape, point) {
    if (!shape.points?.length) return false;
    return pointInPolygon(point, shape.points);
  },

  getBounds(shape) {
    if (!shape.points?.length) return { x: 0, y: 0, width: 0, height: 0 };
    return polygonBounds(shape.points);
  },

  move(shape, dx, dy) {
    shape.points = shape.points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
  },
};
