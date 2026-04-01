import { createDocumentModel } from '../document/documentModel.js';
import { createLayer } from '../document/layerModel.js';
import { pushHistory } from './history.js';
import { loadLibrary } from './libraryStore.js';

const USER_PREFERENCES_KEY = 'blueprint.userPreferences.v1';

export const TOOL_STYLE_DEFAULTS = {
  stroke: '#1f2937',
  strokeWidth: 2,
  fill: '#0f4c81',
  fillAlpha: 0.12,
  textSize: 14,
  fontFamily: 'Inter, Segoe UI, Tahoma, sans-serif',
  lineType: 'solid',
};

export const FILL_STYLE_DEFAULTS = {
  fill: '#0f4c81',
  fillAlpha: 0.12,
  fillMode: 'color',
  textureId: null,
  textureColorMode: 'original',
};

function loadUserPreferences() {
  try {
    const raw = localStorage.getItem(USER_PREFERENCES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveUserPreferences({ settings, toolStyle, fillStyle }) {
  try {
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify({ settings, toolStyle, fillStyle }));
  } catch {
    // ignore storage errors
  }
}

const documentData = createDocumentModel();
const defaultSettings = { ...documentData.settings };
const savedPreferences = loadUserPreferences();
if (savedPreferences?.settings && typeof savedPreferences.settings === 'object') {
  documentData.settings = { ...documentData.settings, ...savedPreferences.settings };
}
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
  fillStyle: { ...FILL_STYLE_DEFAULTS, ...(savedPreferences?.fillStyle ?? {}) },
  toolStyle: { ...TOOL_STYLE_DEFAULTS, ...(savedPreferences?.toolStyle ?? {}) },
};

const library = loadLibrary();

const listeners = new Set();

export const store = {
  documentData,
  defaultSettings,
  appState,
  library,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  notify() {
    saveUserPreferences({
      settings: documentData.settings,
      toolStyle: appState.toolStyle,
      fillStyle: appState.fillStyle,
    });
    listeners.forEach((listener) => listener());
  },
};
