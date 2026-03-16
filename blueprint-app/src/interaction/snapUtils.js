export function snapToGrid(point, documentData) {
  const size = documentData.settings.gridSize;
  return {
    x: Math.round(point.x / size) * size,
    y: Math.round(point.y / size) * size,
  };
}
