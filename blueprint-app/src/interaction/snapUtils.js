export function snapToGrid(point, documentData) {
  const size = documentData.settings.gridSize;
  return {
    x: Math.round(point.x / size) * size,
    y: Math.round(point.y / size) * size,
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
