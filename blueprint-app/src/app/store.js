import { createDocumentModel } from '../document/documentModel.js';
import { normalizeLayers, resolveActiveLayerId } from '../document/layerModel.js';
import { pushHistory } from './history.js';
import { loadLibrary } from './libraryStore.js';

const USER_PREFERENCES_KEY = 'blueprint.userPreferences.v1';
const DOCUMENT_AUTOSAVE_KEY = 'blueprint.documentAutosave.v1';
const DOCUMENT_AUTOSAVE_VERSION = 1;
const DOCUMENT_AUTOSAVE_INTERVAL_MS = 5000;

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
  textureScale: 1,
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

function loadAutosavedDocument() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DOCUMENT_AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== DOCUMENT_AUTOSAVE_VERSION || typeof parsed.documentData !== 'object') {
      return null;
    }

    const defaults = createDocumentModel();
    const candidate = parsed.documentData;
    const merged = {
      ...defaults,
      ...candidate,
      settings: { ...defaults.settings, ...(candidate.settings ?? {}) },
      layers: normalizeLayers(candidate.layers),
      shapes: Array.isArray(candidate.shapes) ? candidate.shapes : [],
    };
    return merged;
  } catch {
    return null;
  }
}

function saveAutosavedDocument(documentData) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DOCUMENT_AUTOSAVE_KEY, JSON.stringify({
      version: DOCUMENT_AUTOSAVE_VERSION,
      savedAt: Date.now(),
      documentData,
    }));
  } catch {
    // ignore autosave storage errors
  }
}

const autosavedDocument = loadAutosavedDocument();
const documentData = autosavedDocument ?? createDocumentModel();
const defaultSettings = { ...documentData.settings };
const savedPreferences = loadUserPreferences();
if (!autosavedDocument && savedPreferences?.settings && typeof savedPreferences.settings === 'object') {
  documentData.settings = { ...documentData.settings, ...savedPreferences.settings };
}
documentData.layers = normalizeLayers(documentData.layers);
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
  activeLayerId: resolveActiveLayerId(documentData, null),
};

const library = loadLibrary();

const listeners = new Set();
let autosaveTimer = null;
let lastAutosaveAt = 0;

function scheduleAutosave() {
  if (typeof localStorage === 'undefined') return;
  const elapsed = Date.now() - lastAutosaveAt;
  if (elapsed >= DOCUMENT_AUTOSAVE_INTERVAL_MS && !autosaveTimer) {
    saveAutosavedDocument(documentData);
    lastAutosaveAt = Date.now();
    return;
  }

  if (autosaveTimer) return;
  const delay = Math.max(0, DOCUMENT_AUTOSAVE_INTERVAL_MS - elapsed);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    saveAutosavedDocument(documentData);
    lastAutosaveAt = Date.now();
  }, delay);
  autosaveTimer.unref?.();
}

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
    documentData.layers = normalizeLayers(documentData.layers);
    appState.activeLayerId = resolveActiveLayerId(documentData, appState.activeLayerId);
    saveUserPreferences({
      settings: documentData.settings,
      toolStyle: appState.toolStyle,
      fillStyle: appState.fillStyle,
    });
    scheduleAutosave();
    listeners.forEach((listener) => listener());
  },
};
