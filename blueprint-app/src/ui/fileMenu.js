import { patchState, pushDocumentHistory, setActiveTool, setZoom } from '../app/actions.js';
import { createDocumentModel } from '../document/documentModel.js';
import { createLayer } from '../document/layerModel.js';
import { seedIdGeneratorFromDocument } from '../utils/idGenerator.js';

const PROJECT_FILE_VERSION = 1;
const PROJECT_FILE_TYPE = 'blueprint-project';
const STROKE_HISTORY_KEY = 'blueprint.colorHistory.stroke';
const FILL_HISTORY_KEY = 'blueprint.colorHistory.fill';
const PROJECT_NAME_KEY = 'blueprint.projectName';

function ensureDocumentShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return null;

  const defaults = createDocumentModel();
  const next = {
    ...defaults,
    ...candidate,
    settings: { ...defaults.settings, ...(candidate.settings ?? {}) },
    layers: Array.isArray(candidate.layers) ? candidate.layers : [],
    shapes: Array.isArray(candidate.shapes) ? candidate.shapes : [],
  };

  if (!next.layers.length) next.layers = [createLayer()];
  return next;
}

function ensureAppStateShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return null;

  return {
    activeTool: typeof candidate.activeTool === 'string' ? candidate.activeTool : 'select',
    zoom: Number.isFinite(candidate.zoom) ? candidate.zoom : 1,
    panX: Number.isFinite(candidate.panX) ? candidate.panX : 0,
    panY: Number.isFinite(candidate.panY) ? candidate.panY : 0,
    selectedIds: Array.isArray(candidate.selectedIds) ? candidate.selectedIds : [],
    hoveredId: null,
    isDragging: false,
    dragStart: null,
  };
}

function ensureProjectShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return null;

  const projectLike = candidate.type === PROJECT_FILE_TYPE && candidate.documentData;
  if (!projectLike) {
    const documentData = ensureDocumentShape(candidate);
    if (!documentData) return null;
    return { documentData, appState: null, ui: null };
  }

  const documentData = ensureDocumentShape(candidate.documentData);
  if (!documentData) return null;

  const appState = ensureAppStateShape(candidate.appState);
  const strokeHistory = Array.isArray(candidate.ui?.strokeHistory) ? candidate.ui.strokeHistory : null;
  const fillHistory = Array.isArray(candidate.ui?.fillHistory) ? candidate.ui.fillHistory : null;

  return {
    documentData,
    appState,
    ui: {
      strokeHistory,
      fillHistory,
    },
  };
}

function applyDocument(store, nextDocument) {
  Object.keys(store.documentData).forEach((key) => {
    delete store.documentData[key];
  });
  Object.assign(store.documentData, nextDocument);
  seedIdGeneratorFromDocument(store.documentData);
}

function applyProject(store, project) {
  applyDocument(store, project.documentData);

  const nextAppState = project.appState ?? {
    activeTool: 'select',
    zoom: 1,
    panX: 0,
    panY: 0,
    selectedIds: [],
    hoveredId: null,
    isDragging: false,
    dragStart: null,
  };

  setActiveTool(nextAppState.activeTool);
  setZoom(nextAppState.zoom);
  patchState({
    panX: nextAppState.panX,
    panY: nextAppState.panY,
    selectedIds: nextAppState.selectedIds,
    hoveredId: nextAppState.hoveredId,
    isDragging: false,
    dragStart: null,
    transformSelection: false,
  });

  if (project.ui?.strokeHistory) {
    localStorage.setItem(STROKE_HISTORY_KEY, JSON.stringify(project.ui.strokeHistory));
  }
  if (project.ui?.fillHistory) {
    localStorage.setItem(FILL_HISTORY_KEY, JSON.stringify(project.ui.fillHistory));
  }

  pushDocumentHistory();
}

function createProjectSnapshot(store) {
  let strokeHistory = [];
  let fillHistory = [];

  try {
    strokeHistory = JSON.parse(localStorage.getItem(STROKE_HISTORY_KEY) ?? '[]');
  } catch {
    strokeHistory = [];
  }

  try {
    fillHistory = JSON.parse(localStorage.getItem(FILL_HISTORY_KEY) ?? '[]');
  } catch {
    fillHistory = [];
  }

  return {
    type: PROJECT_FILE_TYPE,
    version: PROJECT_FILE_VERSION,
    documentData: structuredClone(store.documentData),
    appState: {
      activeTool: store.appState.activeTool,
      zoom: store.appState.zoom,
      panX: store.appState.panX,
      panY: store.appState.panY,
      selectedIds: [...store.appState.selectedIds],
    },
    ui: {
      strokeHistory: Array.isArray(strokeHistory) ? strokeHistory : [],
      fillHistory: Array.isArray(fillHistory) ? fillHistory : [],
    },
  };
}

function sanitizeProjectName(value) {
  const normalized = String(value ?? '')
    .replace(/\.json$/i, '')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .trim();
  return normalized || 'blueprint-project';
}

function normalizeProjectFileName(projectName) {
  return `${sanitizeProjectName(projectName)}.json`;
}

function fileNameToProjectName(fileName) {
  if (typeof fileName !== 'string') return 'blueprint-project';
  return sanitizeProjectName(fileName);
}

function supportsNativeSave() {
  return typeof window.showSaveFilePicker === 'function';
}

export function renderFilePage({ container, store, canvas }) {
  const initialProjectName = sanitizeProjectName(localStorage.getItem(PROJECT_NAME_KEY) ?? 'blueprint-project');

  container.innerHTML = `
    <div class="route-card">
      <h2>File</h2>
      <p>Save, load, or reset your blueprint from this page.</p>
      <label class="file-name-field" for="file-project-name">
        <span>Project filename</span>
        <input id="file-project-name" type="text" value="${initialProjectName}" placeholder="blueprint-project" maxlength="80" />
      </label>
      <div class="button-row">
        <button class="menu-item" data-file-action="save" type="button">Save Project</button>
        <button class="menu-item" data-file-action="save-as" type="button">Save Project As</button>
        <button class="menu-item" data-file-action="save-canvas" type="button">Save Canvas Photo</button>
        <button class="menu-item" data-file-action="load" type="button">Load Project</button>
        <button class="menu-item" data-file-action="reset-view" type="button">Reset Canvas View</button>
        <button class="menu-item" data-file-action="reset-doc" type="button">Reset Blueprint</button>
      </div>
      <input id="file-load-input" type="file" accept="application/json,.json" hidden />
      <p id="file-status" class="settings-row-description" aria-live="polite"></p>
    </div>
  `;

  const fileInput = container.querySelector('#file-load-input');
  const nameInput = container.querySelector('#file-project-name');
  const status = container.querySelector('#file-status');

  let saveFileHandle = null;

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function getCurrentProjectName() {
    const nextName = sanitizeProjectName(nameInput?.value ?? initialProjectName);
    if (nameInput) nameInput.value = nextName;
    localStorage.setItem(PROJECT_NAME_KEY, nextName);
    return nextName;
  }

  function download(name, text, type = 'application/json') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function writeSnapshotToHandle(handle, snapshotText) {
    const writable = await handle.createWritable();
    await writable.write(snapshotText);
    await writable.close();
  }

  async function saveProject({ forceSaveAs = false } = {}) {
    const projectName = getCurrentProjectName();
    const fileName = normalizeProjectFileName(projectName);
    const snapshotText = JSON.stringify(createProjectSnapshot(store), null, 2);

    if (!supportsNativeSave()) {
      download(fileName, snapshotText);
      setStatus(`Saved ${fileName}. (Browser download mode: each save creates a download.)`);
      return;
    }

    try {
      if (forceSaveAs || !saveFileHandle) {
        saveFileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'Blueprint Project',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
      }

      await writeSnapshotToHandle(saveFileHandle, snapshotText);
      setStatus(`Saved ${saveFileHandle.name ?? fileName}.`);
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus('Save canceled.');
        return;
      }
      setStatus('Could not save project file.');
    }
  }

  nameInput?.addEventListener('change', () => {
    getCurrentProjectName();
  });

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = ensureProjectShape(parsed);
      if (!normalized) {
        setStatus('Could not load file: invalid project format.');
        return;
      }

      applyProject(store, normalized);
      const loadedName = fileNameToProjectName(file.name);
      if (nameInput) nameInput.value = loadedName;
      localStorage.setItem(PROJECT_NAME_KEY, loadedName);
      saveFileHandle = null;
      setStatus(`Loaded ${file.name}.`);
    } catch {
      setStatus('Could not load file: invalid JSON.');
    } finally {
      fileInput.value = '';
    }
  });

  container.addEventListener('click', async (event) => {
    const actionButton = event.target instanceof Element
      ? event.target.closest('[data-file-action]')
      : null;
    const action = actionButton?.dataset?.fileAction;
    if (!action) return;

    if (action === 'save') {
      await saveProject({ forceSaveAs: false });
    }

    if (action === 'save-as') {
      await saveProject({ forceSaveAs: true });
    }

    if (action === 'save-canvas') {
      if (!(canvas instanceof HTMLCanvasElement)) {
        setStatus('Canvas export unavailable.');
        return;
      }

      const imageDataUrl = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = imageDataUrl;
      anchor.download = 'blueprint-canvas.png';
      anchor.click();
      setStatus('Canvas photo saved as PNG.');
    }

    if (action === 'load') {
      fileInput?.click();
    }

    if (action === 'reset-view') {
      setZoom(1);
      patchState({ panX: 0, panY: 0, transformSelection: false });
      setStatus('Canvas view reset.');
    }

    if (action === 'reset-doc') {
      const nextDoc = createDocumentModel();
      nextDoc.layers.push(createLayer());
      applyProject(store, { documentData: nextDoc, appState: null, ui: null });
      setStatus('Blueprint reset.');
    }
  });
}
