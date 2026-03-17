import { getShapeBehavior } from '../shapes/shapeRegistry.js';

function groupMemberIds(documentData, id) {
  if (!id) return [];

  const hit = documentData.shapes.find((shape) => shape.id === id);
  if (!hit) return [];
  if (!hit.groupId) return [id];

  return documentData.shapes
    .filter((shape) => shape.groupId === hit.groupId)
    .map((shape) => shape.id);
}

export function expandSelectionWithGroups(documentData, ids) {
  const expanded = [];
  const seen = new Set();

  for (const id of ids) {
    for (const memberId of groupMemberIds(documentData, id)) {
      if (seen.has(memberId)) continue;
      seen.add(memberId);
      expanded.push(memberId);
    }
  }

  return expanded;
}

export function selectOne(appState, documentData, id) {
  appState.selectedIds = id ? expandSelectionWithGroups(documentData, [id]) : [];
}

export function toggleSelection(appState, documentData, id) {
  const groupIds = expandSelectionWithGroups(documentData, [id]);
  const selected = new Set(appState.selectedIds);
  const fullySelected = groupIds.every((groupId) => selected.has(groupId));

  if (fullySelected) {
    appState.selectedIds = appState.selectedIds.filter((item) => !groupIds.includes(item));
    return;
  }

  appState.selectedIds = [...appState.selectedIds, ...groupIds.filter((groupId) => !selected.has(groupId))];
}

export function clearSelection(appState) {
  appState.selectedIds = [];
}

export function getSelectedShapes(documentData, appState) {
  const selected = new Set(expandSelectionWithGroups(documentData, appState.selectedIds));
  return documentData.shapes.filter((shape) => selected.has(shape.id));
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
