import { createDocumentModel } from '../document/documentModel.js';
import { createLayer } from '../document/layerModel.js';
import { pushHistory } from './history.js';
import { loadLibrary } from './libraryStore.js';

const documentData = createDocumentModel();
documentData.layers.push(createLayer());
pushHistory(documentData);

const appState = {
  activeTool: 'select',
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedIds: [],
  hoveredId: null,
  isDragging: false,
  dragStart: null,
  transformSelection: false,
  rotateSelection: false,
  placeShapeTemplateId: null,
  fillStyle: {
    fill: '#0f4c81',
    fillAlpha: 0.12,
    fillMode: 'color',
    textureId: null,
  },
};

const library = loadLibrary();

const listeners = new Set();

export const store = {
  documentData,
  appState,
  library,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notify() {
    listeners.forEach((listener) => listener());
  },
};
