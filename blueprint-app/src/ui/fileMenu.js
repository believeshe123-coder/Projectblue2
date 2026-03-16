import { patchState, pushDocumentHistory, setZoom } from '../app/actions.js';
import { createDocumentModel } from '../document/documentModel.js';
import { createLayer } from '../document/layerModel.js';

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

function applyDocument(store, nextDocument) {
  Object.keys(store.documentData).forEach((key) => {
    delete store.documentData[key];
  });
  Object.assign(store.documentData, nextDocument);

  setZoom(1);
  patchState({ panX: 0, panY: 0, selectedIds: [], hoveredId: null });
  pushDocumentHistory();
}

export function renderFilePage({ container, store }) {
  container.innerHTML = `
    <div class="route-card">
      <h2>File</h2>
      <p>Save, load, or reset your blueprint from this page.</p>
      <div class="button-row">
        <button class="menu-item" data-file-action="save" type="button">Save Blueprint</button>
        <button class="menu-item" data-file-action="load" type="button">Load Blueprint</button>
        <button class="menu-item" data-file-action="reset-view" type="button">Reset Canvas View</button>
        <button class="menu-item" data-file-action="reset-doc" type="button">Reset Blueprint</button>
      </div>
      <input id="file-load-input" type="file" accept="application/json,.json" hidden />
      <p id="file-status" class="settings-row-description" aria-live="polite"></p>
    </div>
  `;

  const fileInput = container.querySelector('#file-load-input');
  const status = container.querySelector('#file-status');

  function setStatus(message) {
    if (status) status.textContent = message;
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

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = ensureDocumentShape(parsed);
      if (!normalized) {
        setStatus('Could not load file: invalid document format.');
        return;
      }

      applyDocument(store, normalized);
      setStatus(`Loaded ${file.name}.`);
    } catch {
      setStatus('Could not load file: invalid JSON.');
    } finally {
      fileInput.value = '';
    }
  });

  container.addEventListener('click', (event) => {
    const actionButton = event.target instanceof Element
      ? event.target.closest('[data-file-action]')
      : null;
    const action = actionButton?.dataset?.fileAction;
    if (!action) return;

    if (action === 'save') {
      download('blueprint.json', JSON.stringify(store.documentData, null, 2));
      setStatus('Blueprint saved.');
    }

    if (action === 'load') {
      fileInput?.click();
    }

    if (action === 'reset-view') {
      setZoom(1);
      patchState({ panX: 0, panY: 0 });
      setStatus('Canvas view reset.');
    }

    if (action === 'reset-doc') {
      const nextDoc = createDocumentModel();
      nextDoc.layers.push(createLayer());
      applyDocument(store, nextDoc);
      setStatus('Blueprint reset.');
    }
  });
}
