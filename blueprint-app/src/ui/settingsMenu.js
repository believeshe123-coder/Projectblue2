import { updateDocumentSettings } from '../app/actions.js';
import { resolveMeasurementMode } from '../utils/measurement.js';

const GRID_MIN = 5;
const GRID_MAX = 200;
const UNITS_PER_GRID_MIN = 0.1;
const UNITS_PER_GRID_MAX = 1000;

export function mountSettingsMenu({ container }) {
  const button = document.createElement('button');
  button.className = 'settings-trigger';
  button.type = 'button';
  button.textContent = 'Settings';

  button.addEventListener('click', () => {
    window.location.hash = '#settings';
  });

  container.appendChild(button);

  return () => {
    const isActive = window.location.hash === '#settings';
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  };
}

export function renderSettingsPage({ container, store, previewCanvas }) {
  const settings = store.documentData.settings;
  const measurementMode = resolveMeasurementMode(settings);

  container.innerHTML = `
    <div class="route-card">
      <h2>Settings</h2>
      <label><input id="settings-show-grid" type="checkbox" ${settings.showGrid ? 'checked' : ''} /> Show grid</label>
      <label>Grid size <input id="settings-grid-size" type="number" min="${GRID_MIN}" max="${GRID_MAX}" value="${settings.gridSize}" /></label>
      <label><input id="settings-snap" type="checkbox" ${settings.snap ? 'checked' : ''} /> Snap to grid</label>
      <label><input id="settings-axis-snap" type="checkbox" ${settings.axisSnap ? 'checked' : ''} /> Axis snap</label>
      <label>Each grid box = <input id="settings-units-per-grid" type="number" step="0.1" min="${UNITS_PER_GRID_MIN}" max="${UNITS_PER_GRID_MAX}" value="${settings.unitsPerGrid ?? 1}" /></label>
      <label>Unit label <input id="settings-units" type="text" value="${settings.units ?? 'ft'}" maxlength="12" /></label>
      <label>Measurements
        <select id="settings-measurement-mode">
          <option value="always" ${measurementMode === 'always' ? 'selected' : ''}>At all times</option>
          <option value="drawing" ${measurementMode === 'drawing' ? 'selected' : ''}>Only while drawing</option>
          <option value="off" ${measurementMode === 'off' ? 'selected' : ''}>Off</option>
        </select>
      </label>
      <label><input id="settings-cursor-preview" type="checkbox" ${settings.showCursorPreview !== false ? 'checked' : ''} /> View: cursor preview</label>
      <div class="button-row">
        <button class="settings-trigger" data-action="home" type="button">Back to Home</button>
      </div>
    </div>
  `;

  container.addEventListener('change', (event) => {
    const target = event.target;
    if (!target?.id) return;

    if (target.id === 'settings-show-grid') updateDocumentSettings({ showGrid: target.checked });
    if (target.id === 'settings-snap') updateDocumentSettings({ snap: target.checked });
    if (target.id === 'settings-axis-snap') updateDocumentSettings({ axisSnap: target.checked });
    if (target.id === 'settings-cursor-preview') updateDocumentSettings({ showCursorPreview: target.checked });

    if (target.id === 'settings-grid-size') {
      const parsed = Number.parseInt(target.value, 10);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(GRID_MAX, Math.max(GRID_MIN, parsed));
        updateDocumentSettings({ gridSize: clamped });
      }
    }

    if (target.id === 'settings-units-per-grid') {
      const parsed = Number.parseFloat(target.value);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(UNITS_PER_GRID_MAX, Math.max(UNITS_PER_GRID_MIN, parsed));
        updateDocumentSettings({ unitsPerGrid: clamped });
      }
    }

    if (target.id === 'settings-units') {
      updateDocumentSettings({ units: target.value.trim() || 'ft' });
    }

    if (target.id === 'settings-measurement-mode') {
      updateDocumentSettings({ measurementMode: target.value });
    }
  });

  container.addEventListener('click', (event) => {
    const homeButton = event.target instanceof Element
      ? event.target.closest('[data-action="home"]')
      : null;

    if (homeButton && container.contains(homeButton)) {
      window.location.hash = '#home';
    }
  });

  if (previewCanvas) {
    previewCanvas.style.display = settings.showCursorPreview === false ? 'none' : 'block';
  }
}
