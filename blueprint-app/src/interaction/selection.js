import { getShapeBehavior } from '../shapes/shapeRegistry.js';

export function selectOne(appState, id) {
  appState.selectedIds = id ? [id] : [];
}

export function toggleSelection(appState, id) {
  const exists = appState.selectedIds.includes(id);
  appState.selectedIds = exists
    ? appState.selectedIds.filter((item) => item !== id)
    : [...appState.selectedIds, id];
}

export function clearSelection(appState) {
  appState.selectedIds = [];
}

export function getSelectedShapes(documentData, appState) {
  return documentData.shapes.filter((shape) => appState.selectedIds.includes(shape.id));
}

export function getSelectionBounds(documentData, appState) {
  const selected = getSelectedShapes(documentData, appState);
  if (!selected.length) return null;

  const bounds = selected
    .map((shape) => getShapeBehavior(shape.type)?.getBounds?.(shape))
    .filter(Boolean);

  const minX = Math.min(...bounds.map((b) => b.x));
  const minY = Math.min(...bounds.map((b) => b.y));
  const maxX = Math.max(...bounds.map((b) => b.x + b.width));
  const maxY = Math.max(...bounds.map((b) => b.y + b.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
