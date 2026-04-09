export function snapToGrid(point, documentData) {
  const settings = documentData.settings ?? {};
  const gridSize = Number(settings.gridSize) || 25;
  const useHalfGrid = settings.halfGridSnap === true || settings.snapDebugHalfPoints === true;
  const snapStep = useHalfGrid ? gridSize / 2 : gridSize;

  return {
    x: Math.round(point.x / snapStep) * snapStep,
    y: Math.round(point.y / snapStep) * snapStep,
  };
}

export function snapToAxis(point, anchorPoint) {
  const deltaX = Math.abs(point.x - anchorPoint.x);
  const deltaY = Math.abs(point.y - anchorPoint.y);

  if (deltaX >= deltaY) {
    return { x: point.x, y: anchorPoint.y };
  }

  return { x: anchorPoint.x, y: point.y };
}

export function snapToAngle(point, anchorPoint, angleStep = 15) {
  if (!anchorPoint || !Number.isFinite(angleStep) || angleStep <= 0) return point;

  const dx = point.x - anchorPoint.x;
  const dy = point.y - anchorPoint.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return point;

  const angle = Math.atan2(dy, dx);
  const stepRadians = (angleStep * Math.PI) / 180;
  const snappedAngle = Math.round(angle / stepRadians) * stepRadians;

  return {
    x: anchorPoint.x + Math.cos(snappedAngle) * distance,
    y: anchorPoint.y + Math.sin(snappedAngle) * distance,
  };
}

export function findNearestSnapPoint(point, shapes, tolerance = 10) {
  if (!point || !Array.isArray(shapes) || !Number.isFinite(tolerance) || tolerance <= 0) return null;

  let bestPoint = null;
  let bestDistance = tolerance;

  for (const shape of shapes) {
    const candidates = extractShapeSnapPoints(shape);
    for (const candidate of candidates) {
      const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
      if (distance <= bestDistance) {
        bestDistance = distance;
        bestPoint = candidate;
      }
    }
  }

  return bestPoint;
}

function extractShapeSnapPoints(shape) {
  if (!shape || shape.visible === false) return [];

  if (shape.start && shape.end) {
    return shape.control
      ? [shape.start, shape.control, shape.end]
      : [shape.start, shape.end];
  }

  if (Array.isArray(shape.points) && shape.points.length) {
    return shape.points;
  }

  if (shape.type === 'room') {
    return [
      { x: shape.x, y: shape.y },
      { x: shape.x + shape.width, y: shape.y },
      { x: shape.x + shape.width, y: shape.y + shape.height },
      { x: shape.x, y: shape.y + shape.height },
    ];
  }

  if (shape.type === 'ellipse') {
    const cx = shape.x + (shape.width / 2);
    const cy = shape.y + (shape.height / 2);
    return [
      { x: cx, y: cy },
      { x: shape.x, y: cy },
      { x: shape.x + shape.width, y: cy },
      { x: cx, y: shape.y },
      { x: cx, y: shape.y + shape.height },
    ];
  }

  if (Number.isFinite(shape.x) && Number.isFinite(shape.y)) {
    return [{ x: shape.x, y: shape.y }];
  }

  return [];
}
