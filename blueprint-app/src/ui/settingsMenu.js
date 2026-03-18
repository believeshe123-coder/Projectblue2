import { setActiveTool, updateDocumentSettings } from '../app/actions.js';
import { resolveMeasurementMode } from '../utils/measurement.js';

const GRID_MIN = 5;
const GRID_MAX = 200;
const UNITS_PER_GRID_MIN = 0.1;
const UNITS_PER_GRID_MAX = 1000;

const SETTING_DEFINITIONS = [
  {
    id: 'settings-show-grid',
    key: 'showGrid',
    type: 'boolean',
    section: 'Canvas',
    label: 'Show grid',
    description: 'Draw the grid in the workspace.',
  },
  {
    id: 'settings-draw-mode',
    key: 'drawMode',
    type: 'select',
    section: 'Canvas',
    label: 'Drawing interaction',
    description: 'Choose between click-click drawing or click-drag drawing.',
    options: [
      { value: 'click', label: 'Click start, click end' },
      { value: 'drag', label: 'Click and drag' },
    ],
  },
  {
    id: 'settings-grid-size',
    key: 'gridSize',
    type: 'number',
    section: 'Canvas',
    label: 'Grid size',
    description: 'Set grid spacing in pixels.',
    min: GRID_MIN,
    max: GRID_MAX,
    step: 1,
  },
  {
    id: 'settings-snap',
    key: 'snap',
    type: 'boolean',
    section: 'Snapping',
    label: 'Snap to grid',
    description: 'Snap points to the nearest grid intersection.',
  },
  {
    id: 'settings-half-grid-snap',
    key: 'halfGridSnap',
    type: 'boolean',
    section: 'Snapping',
    label: 'Half-grid snap',
    description: 'Allow snapping to half-grid intersections.',
  },
  {
    id: 'settings-axis-snap',
    key: 'axisSnap',
    type: 'boolean',
    section: 'Snapping',
    label: 'Axis snap',
    description: 'Constrain drawing to horizontal/vertical directions while dragging.',
  },
  {
    id: 'settings-units-per-grid',
    key: 'unitsPerGrid',
    type: 'number',
    section: 'Measurements',
    label: 'Units per grid box',
    description: 'How many units each grid box represents.',
    min: UNITS_PER_GRID_MIN,
    max: UNITS_PER_GRID_MAX,
    step: 0.1,
  },
  {
    id: 'settings-units',
    key: 'units',
    type: 'text',
    section: 'Measurements',
    label: 'Unit label',
    description: 'Label used when displaying dimensions.',
    maxLength: 12,
  },
  {
    id: 'settings-measurement-mode',
    key: 'measurementMode',
    type: 'select',
    section: 'Measurements',
    label: 'Measurement visibility',
    description: 'Control when measurements are shown.',
    options: [
      { value: 'always', label: 'At all times' },
      { value: 'drawing', label: 'Only while drawing' },
      { value: 'off', label: 'Off' },
    ],
  },
  {
    id: 'settings-selection-outline-mode',
    key: 'selectionOutlineMode',
    type: 'select',
    section: 'View',
    label: 'Selection outline',
    description: 'Control when the blue dashed outline appears around selected shapes.',
    options: [
      { value: 'off', label: 'Not at all' },
      { value: 'selection-tool', label: 'Only with Selection tool' },
      { value: 'always', label: 'At all times' },
    ],
  },

  {
    id: 'settings-show-tape-tool',
    key: 'showTapeTool',
    type: 'boolean',
    section: 'View',
    label: 'Show Measure tool',
    description: 'Show or hide the Measure tool button in the toolbar.',
  },
  {
    id: 'settings-action-toasts',
    key: 'showActionToasts',
    type: 'boolean',
    section: 'View',
    label: 'Action popups',
    description: 'Show quick bottom-left popups for actions like grouping and flipping.',
  },
  {
    id: 'settings-cursor-preview',
    key: 'showCursorPreview',
    type: 'boolean',
    section: 'View',
    label: 'Cursor preview',
    description: 'Show live cursor preview in the sidebar.',
  },
];

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

function renderSettingField(definition, settings, measurementMode) {
  if (definition.type === 'boolean') {
    const isChecked = definition.key === 'showCursorPreview'
      ? settings.showCursorPreview !== false
      : definition.key === 'showTapeTool'
        ? settings.showTapeTool !== false
        : definition.key === 'showActionToasts'
          ? settings.showActionToasts !== false
          : definition.key === 'halfGridSnap'
            ? (settings.halfGridSnap === true || settings.snapDebugHalfPoints === true)
          : Boolean(settings[definition.key]);

    return `
      <label class="settings-toggle" for="${definition.id}">
        <input id="${definition.id}" type="checkbox" ${isChecked ? 'checked' : ''} />
        <span>${definition.label}</span>
      </label>
    `;
  }

  if (definition.type === 'number') {
    const value = settings[definition.key] ?? '';
    return `
      <label for="${definition.id}" class="settings-field-label">${definition.label}</label>
      <input
        id="${definition.id}"
        type="number"
        min="${definition.min}"
        max="${definition.max}"
        step="${definition.step ?? 1}"
        value="${value}"
      />
    `;
  }

  if (definition.type === 'text') {
    const value = settings[definition.key] ?? 'ft';
    return `
      <label for="${definition.id}" class="settings-field-label">${definition.label}</label>
      <input id="${definition.id}" type="text" maxlength="${definition.maxLength ?? 32}" value="${value}" />
    `;
  }

  const selectedValue = definition.key === 'measurementMode'
    ? measurementMode
    : definition.key === 'drawMode'
      ? (settings.drawMode ?? 'click')
      : definition.key === 'selectionOutlineMode'
        ? (settings.selectionOutlineMode ?? (settings.showSelectionOutline === false ? 'off' : 'always'))
        : settings[definition.key];

  return `
    <label for="${definition.id}" class="settings-field-label">${definition.label}</label>
    <select id="${definition.id}">
      ${definition.options.map((option) => `
        <option value="${option.value}" ${selectedValue === option.value ? 'selected' : ''}>${option.label}</option>
      `).join('')}
    </select>
  `;
}

function renderSettingGroup(sectionName, settings, measurementMode) {
  const settingRows = SETTING_DEFINITIONS
    .filter((definition) => definition.section === sectionName)
    .map((definition) => `
      <article
        class="settings-row"
        data-setting-id="${definition.id}"
        data-search="${[definition.label, definition.description, definition.section].join(' ').toLowerCase()}"
      >
        <div class="settings-row-main">
          ${renderSettingField(definition, settings, measurementMode)}
        </div>
        <p class="settings-row-description">${definition.description}</p>
      </article>
    `)
    .join('');

  return `
    <section class="settings-group" data-section="${sectionName.toLowerCase()}">
      <h3>${sectionName}</h3>
      ${settingRows}
    </section>
  `;
}

export function renderSettingsPage({ container, store, previewCanvas }) {
  const settings = store.documentData.settings;
  const measurementMode = resolveMeasurementMode(settings);
  const sections = [...new Set(SETTING_DEFINITIONS.map((definition) => definition.section))];

  container.innerHTML = `
    <div class="route-card settings-page-card">
      <h2>Settings</h2>
      <p class="settings-page-subtitle">All application settings are available here.</p>
      <label class="settings-search" for="settings-search-input">
        <span>Search settings</span>
        <input id="settings-search-input" type="search" placeholder="Search by name, area, or description" />
      </label>
      ${sections.map((sectionName) => renderSettingGroup(sectionName, settings, measurementMode)).join('')}
    </div>
  `;

  const searchInput = container.querySelector('#settings-search-input');
  const rows = [...container.querySelectorAll('.settings-row')];
  const groups = [...container.querySelectorAll('.settings-group')];

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();

    rows.forEach((row) => {
      const terms = row.getAttribute('data-search') ?? '';
      row.hidden = query.length > 0 && !terms.includes(query);
    });

    groups.forEach((group) => {
      const visibleRows = group.querySelectorAll('.settings-row:not([hidden])').length;
      group.hidden = visibleRows === 0;
    });
  });

  container.addEventListener('change', (event) => {
    const target = event.target;
    if (!target?.id) return;

    if (target.id === 'settings-show-grid') updateDocumentSettings({ showGrid: target.checked });
    if (target.id === 'settings-snap') updateDocumentSettings({ snap: target.checked });
    if (target.id === 'settings-half-grid-snap') updateDocumentSettings({ halfGridSnap: target.checked, snapDebugHalfPoints: target.checked });
    if (target.id === 'settings-axis-snap') updateDocumentSettings({ axisSnap: target.checked });
    if (target.id === 'settings-cursor-preview') updateDocumentSettings({ showCursorPreview: target.checked });
    if (target.id === 'settings-action-toasts') updateDocumentSettings({ showActionToasts: target.checked });
    if (target.id === 'settings-show-tape-tool') {
      updateDocumentSettings({ showTapeTool: target.checked });
      if (!target.checked && store.appState.activeTool === 'tape') setActiveTool('line');
    }
    if (target.id === 'settings-selection-outline-mode') updateDocumentSettings({
      selectionOutlineMode: ['off', 'selection-tool', 'always'].includes(target.value) ? target.value : 'always',
    });
    if (target.id === 'settings-draw-mode') updateDocumentSettings({ drawMode: target.value === 'drag' ? 'drag' : 'click' });

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

  if (previewCanvas) {
    const showPreview = settings.showCursorPreview !== false;
    previewCanvas.style.display = showPreview ? 'block' : 'none';

    const historyControls = document.querySelector('.history-controls');
    if (historyControls instanceof HTMLElement) {
      historyControls.style.display = showPreview ? 'flex' : 'none';
    }
  }
}
