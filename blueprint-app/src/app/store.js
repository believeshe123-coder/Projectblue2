import { createDocumentModel } from '../document/documentModel.js';
import { createLayer } from '../document/layerModel.js';

const documentData = createDocumentModel();
documentData.layers.push(createLayer());

const appState = {
  activeTool: 'select',
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedIds: [],
  hoveredId: null,
  isDragging: false,
  dragStart: null,
};

const listeners = new Set();

export const store = {
  documentData,
  appState,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notify() {
    listeners.forEach((listener) => listener());
  },
};
