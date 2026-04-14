import { resetPreferences, setActiveTool, updateDocumentSettings } from '../app/actions.js';
import { resolveMeasurementMode } from '../utils/measurement.js';

const GRID_MIN = 5;
const GRID_MAX = 200;
const UNITS_PER_GRID_MIN = 0.1;
const UNITS_PER_GRID_MAX = 1000;
const MEASUREMENT_LABEL_SIZE_MIN = 8;
const MEASUREMENT_LABEL_SIZE_MAX = 48;
const OBJECT_SNAP_TOLERANCE_MIN = 4;
const OBJECT_SNAP_TOLERANCE_MAX = 48;
const ANGLE_SNAP_INCREMENT_MIN = 5;
const ANGLE_SNAP_INCREMENT_MAX = 90;

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
    id: 'settings-object-snap',
    key: 'objectSnap',
    type: 'boolean',
    section: 'Snapping',
    label: 'Object snap',
    description: 'Snap to existing endpoints, corners, and control points.',
  },
  {
    id: 'settings-object-snap-tolerance',
    key: 'objectSnapTolerance',
    type: 'number',
    section: 'Snapping',
    label: 'Object snap radius',
    description: 'How close the cursor must be to lock onto existing geometry.',
    min: OBJECT_SNAP_TOLERANCE_MIN,
    max: OBJECT_SNAP_TOLERANCE_MAX,
    step: 1,
  },
  {
    id: 'settings-angle-snap',
    key: 'angleSnap',
    type: 'boolean',
    section: 'Snapping',
    label: 'Angle snap',
    description: 'Constrain segments to angle increments from the start point.',
  },
  {
    id: 'settings-angle-snap-increment',
    key: 'angleSnapIncrement',
    type: 'number',
    section: 'Snapping',
    label: 'Angle snap increment',
    description: 'Angle increment used when angle snap is enabled.',
    min: ANGLE_SNAP_INCREMENT_MIN,
    max: ANGLE_SNAP_INCREMENT_MAX,
    step: 1,
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
    id: 'settings-measurement-label-size',
    key: 'measurementLabelSize',
    type: 'number',
    section: 'Measurements',
    label: 'Measurement label size',
    description: 'Set the font size for all measurement labels.',
    min: MEASUREMENT_LABEL_SIZE_MIN,
    max: MEASUREMENT_LABEL_SIZE_MAX,
    step: 1,
  },
  {
    id: 'settings-measurement-label-font',
    key: 'measurementLabelFont',
    type: 'text',
    section: 'Measurements',
    label: 'Measurement label font',
    description: 'Set the font family for all measurement labels.',
    maxLength: 80,
  },
  {
    id: 'settings-measurement-label-color',
    key: 'measurementLabelColor',
    type: 'color',
    section: 'Measurements',
    label: 'Measurement text color',
    description: 'Set the text color for all measurement labels.',
  },
  {
    id: 'settings-measurement-label-background',
    key: 'measurementLabelBackground',
    type: 'color',
    section: 'Measurements',
    label: 'Measurement label fill',
    description: 'Set the background color behind measurement text.',
  },
  {
    id: 'settings-measurement-label-border',
    key: 'measurementLabelBorderColor',
    type: 'color',
    section: 'Measurements',
    label: 'Measurement label border',
    description: 'Set the border color around measurement labels.',
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
    id: 'settings-theme',
    key: 'theme',
    type: 'select',
    section: 'View',
    label: 'Theme',
    description: 'Switch between light and dark application themes (dark mode inverts canvas colors for visibility).',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark (Inverted)' },
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
    const value = settings[definition.key] ?? (definition.key === 'units' ? 'ft' : '');
    return `
      <label for="${definition.id}" class="settings-field-label">${definition.label}</label>
      <input id="${definition.id}" type="text" maxlength="${definition.maxLength ?? 32}" value="${value}" />
    `;
  }

  if (definition.type === 'color') {
    const value = settings[definition.key] ?? '#0f4c81';
    return `
      <label for="${definition.id}" class="settings-field-label">${definition.label}</label>
      <input id="${definition.id}" type="color" value="${value}" />
    `;
  }

  const selectedValue = definition.key === 'measurementMode'
    ? measurementMode
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
      <div class="settings-reset-row">
        <button id="settings-reset-all" type="button">Reset all settings & properties</button>
      </div>
      ${sections.map((sectionName) => renderSettingGroup(sectionName, settings, measurementMode)).join('')}
    </div>
  `;

  const searchInput = container.querySelector('#settings-search-input');
  const rows = [...container.querySelectorAll('.settings-row')];
  const groups = [...container.querySelectorAll('.settings-group')];

  searchInput.oninput = () => {
    const query = searchInput.value.trim().toLowerCase();

    rows.forEach((row) => {
      const terms = row.getAttribute('data-search') ?? '';
      row.hidden = query.length > 0 && !terms.includes(query);
    });

    groups.forEach((group) => {
      const visibleRows = group.querySelectorAll('.settings-row:not([hidden])').length;
      group.hidden = visibleRows === 0;
    });
  };

  container.onchange = (event) => {
    const target = event.target;
    if (!target?.id) return;

    if (target.id === 'settings-show-grid') updateDocumentSettings({ showGrid: target.checked });
    if (target.id === 'settings-snap') updateDocumentSettings({ snap: target.checked });
    if (target.id === 'settings-half-grid-snap') updateDocumentSettings({ halfGridSnap: target.checked, snapDebugHalfPoints: target.checked });
    if (target.id === 'settings-axis-snap') updateDocumentSettings({ axisSnap: target.checked });
    if (target.id === 'settings-object-snap') updateDocumentSettings({ objectSnap: target.checked });
    if (target.id === 'settings-angle-snap') updateDocumentSettings({ angleSnap: target.checked });
    if (target.id === 'settings-cursor-preview') updateDocumentSettings({ showCursorPreview: target.checked });
    if (target.id === 'settings-action-toasts') updateDocumentSettings({ showActionToasts: target.checked });
    if (target.id === 'settings-show-tape-tool') {
      updateDocumentSettings({ showTapeTool: target.checked });
      if (!target.checked && store.appState.activeTool === 'tape') setActiveTool('line');
    }
    if (target.id === 'settings-selection-outline-mode') updateDocumentSettings({
      selectionOutlineMode: ['off', 'selection-tool', 'always'].includes(target.value) ? target.value : 'always',
    });
    if (target.id === 'settings-theme') updateDocumentSettings({
      theme: ['light', 'dark'].includes(target.value) ? target.value : 'light',
    });
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

    if (target.id === 'settings-object-snap-tolerance') {
      const parsed = Number.parseInt(target.value, 10);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(OBJECT_SNAP_TOLERANCE_MAX, Math.max(OBJECT_SNAP_TOLERANCE_MIN, parsed));
        updateDocumentSettings({ objectSnapTolerance: clamped });
      }
    }

    if (target.id === 'settings-angle-snap-increment') {
      const parsed = Number.parseInt(target.value, 10);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(ANGLE_SNAP_INCREMENT_MAX, Math.max(ANGLE_SNAP_INCREMENT_MIN, parsed));
        updateDocumentSettings({ angleSnapIncrement: clamped });
      }
    }

    if (target.id === 'settings-units') {
      updateDocumentSettings({ units: target.value.trim() || 'ft' });
    }

    if (target.id === 'settings-measurement-mode') {
      updateDocumentSettings({ measurementMode: target.value });
    }
    if (target.id === 'settings-measurement-label-size') {
      const parsed = Number.parseInt(target.value, 10);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(MEASUREMENT_LABEL_SIZE_MAX, Math.max(MEASUREMENT_LABEL_SIZE_MIN, parsed));
        updateDocumentSettings({ measurementLabelSize: clamped });
      }
    }
    if (target.id === 'settings-measurement-label-font') {
      updateDocumentSettings({ measurementLabelFont: target.value.trim() || 'Inter, Segoe UI, Tahoma, sans-serif' });
    }
    if (target.id === 'settings-measurement-label-color') {
      updateDocumentSettings({ measurementLabelColor: target.value });
    }
    if (target.id === 'settings-measurement-label-background') {
      updateDocumentSettings({ measurementLabelBackground: target.value });
    }
    if (target.id === 'settings-measurement-label-border') {
      updateDocumentSettings({ measurementLabelBorderColor: target.value });
    }
  };

  container.onclick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id !== 'settings-reset-all') return;
    resetPreferences();
  };

  if (previewCanvas) {
    const showPreview = settings.showCursorPreview !== false;
    previewCanvas.style.display = showPreview ? 'block' : 'none';

    const historyControls = document.querySelector('.history-controls');
    if (historyControls instanceof HTMLElement) {
      historyControls.style.display = showPreview ? 'flex' : 'none';
    }
  }
}
