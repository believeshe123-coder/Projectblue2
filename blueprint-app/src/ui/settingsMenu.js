import { updateDocumentSettings } from '../app/actions.js';

export function mountSettingsMenu({ container, store, previewCanvas }) {
  const wrap = document.createElement('div');
  wrap.className = 'settings-menu';

  const button = document.createElement('button');
  button.className = 'settings-trigger';
  button.type = 'button';
  button.textContent = 'Settings';

  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.hidden = true;

  wrap.appendChild(button);
  wrap.appendChild(panel);
  container.appendChild(wrap);

  function closePanel() {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
  });

  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) closePanel();
  });

  panel.addEventListener('change', (event) => {
    const target = event.target;
    if (!target?.id) return;

    if (target.id === 'settings-show-grid') updateDocumentSettings({ showGrid: target.checked });
    if (target.id === 'settings-snap') updateDocumentSettings({ snap: target.checked });
    if (target.id === 'settings-axis-snap') updateDocumentSettings({ axisSnap: target.checked });
    if (target.id === 'settings-measurements') updateDocumentSettings({ showMeasurements: target.checked });
    if (target.id === 'settings-cursor-preview') updateDocumentSettings({ showCursorPreview: target.checked });
  });

  const render = () => {
    const settings = store.documentData.settings;

    panel.innerHTML = `
      <h3>Views & Debug</h3>
      <label><input id="settings-show-grid" type="checkbox" ${settings.showGrid ? 'checked' : ''} /> Show grid</label>
      <label><input id="settings-snap" type="checkbox" ${settings.snap ? 'checked' : ''} /> Snap to grid</label>
      <label><input id="settings-axis-snap" type="checkbox" ${settings.axisSnap ? 'checked' : ''} /> Axis snap</label>
      <label><input id="settings-measurements" type="checkbox" ${settings.showMeasurements !== false ? 'checked' : ''} /> Debug: line measurements</label>
      <label><input id="settings-cursor-preview" type="checkbox" ${settings.showCursorPreview !== false ? 'checked' : ''} /> View: cursor preview</label>
    `;

    if (previewCanvas) {
      previewCanvas.style.display = settings.showCursorPreview === false ? 'none' : 'block';
    }
  };

  render();
  return render;
}
