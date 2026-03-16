import { store } from './store.js';
import { pushHistory } from './history.js';

export function setActiveTool(toolId) {
  store.appState.activeTool = toolId;
  store.notify();
}

export function addShape(shape) {
  store.documentData.shapes.push(shape);
  pushHistory(store.documentData);
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
