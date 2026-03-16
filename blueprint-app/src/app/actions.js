import { store } from './store.js';
import { pushHistory } from './history.js';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function setActiveTool(toolId) {
  store.appState.activeTool = toolId;
  store.notify();
}

export function pushDocumentHistory() {
  pushHistory(store.documentData);
}

export function addShape(shape) {
  store.documentData.shapes.push(shape);
  pushDocumentHistory();
  store.notify();
}

export function deleteSelectedShapes() {
  if (!store.appState.selectedIds.length) return;
  const selected = new Set(store.appState.selectedIds);
  store.documentData.shapes = store.documentData.shapes.filter((shape) => !selected.has(shape.id));
  store.appState.selectedIds = [];
  pushDocumentHistory();
  store.notify();
}

export function updateSelectedStyles(partialStyle) {
  const selected = new Set(store.appState.selectedIds);
  let changed = false;
  for (const shape of store.documentData.shapes) {
    if (selected.has(shape.id)) {
      shape.style = { ...shape.style, ...partialStyle };
      changed = true;
    }
  }
  if (!changed) return;
  pushDocumentHistory();
  store.notify();
}

export function setSelection(ids) {
  store.appState.selectedIds = ids;
  store.notify();
}

export function patchState(partial) {
  Object.assign(store.appState, partial);
  store.notify();
}

export function setZoom(nextZoom) {
  store.appState.zoom = clampZoom(nextZoom);
  store.notify();
}

export function updateDocumentSettings(partial) {
  Object.assign(store.documentData.settings, partial);
  store.notify();
}
