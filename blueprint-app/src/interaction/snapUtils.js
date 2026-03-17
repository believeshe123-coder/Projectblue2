export function snapToGrid(point, documentData) {
  const settings = documentData.settings ?? {};
  const gridSize = Number(settings.gridSize) || 25;
  const snapStep = settings.snapDebugHalfPoints ? gridSize / 2 : gridSize;

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
