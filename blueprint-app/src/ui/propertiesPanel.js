import {
  flipSelectedHorizontal,
  flipSelectedVertical,
  removeSelectedFill,
  setSelectedShapeType,
  updateSelectedShapes,
  updateSelectedStyles,
  updateSelectedRoomsFilled,
  unlockAllShapes,
  patchState,
} from '../app/actions.js';

const FALLBACK_STROKE = '#1f2937';
const FALLBACK_FILL = '#0f4c81';
const FONT_OPTIONS = [
  'Inter, Segoe UI, Tahoma, sans-serif',
  'Arial, Helvetica, sans-serif',
  'Georgia, Times New Roman, serif',
  'Courier New, Courier, monospace',
];
const COLOR_HISTORY_LIMIT = 5;
const STROKE_HISTORY_KEY = 'blueprint.colorHistory.stroke';
const FILL_HISTORY_KEY = 'blueprint.colorHistory.fill';

function toColorInputValue(color, fallback) {
  if (typeof color !== 'string' || color.trim().length === 0) return fallback;

  const normalized = color.trim();
  if (/^#[\da-f]{6}$/i.test(normalized)) return normalized.toLowerCase();
  if (/^#[\da-f]{3}$/i.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`.toLowerCase();
  }

  const parser = document.createElement('canvas').getContext('2d');
  if (!parser) return fallback;

  parser.fillStyle = '#000000';
  parser.fillStyle = normalized;
  const parsed = parser.fillStyle;
  if (typeof parsed !== 'string') return fallback;

  const rgbMatch = parsed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (!rgbMatch) return fallback;

  const [, r, g, b] = rgbMatch;
  return `#${[r, g, b].map((value) => Number(value).toString(16).padStart(2, '0')).join('')}`;
}

function colorHistoryStorageKey(kind) {
  return kind === 'stroke' ? STROKE_HISTORY_KEY : FILL_HISTORY_KEY;
}

function loadColorHistory(kind) {
  try {
    const raw = localStorage.getItem(colorHistoryStorageKey(kind));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((color) => typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)).slice(0, COLOR_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function saveColorHistory(kind, colors) {
  try {
    localStorage.setItem(colorHistoryStorageKey(kind), JSON.stringify(colors.slice(0, COLOR_HISTORY_LIMIT)));
  } catch {
    // ignore storage errors
  }
}

function rememberColor(kind, color) {
  const fallback = kind === 'stroke' ? FALLBACK_STROKE : FALLBACK_FILL;
  const normalized = toColorInputValue(color, fallback);
  const existing = loadColorHistory(kind).filter((entry) => entry !== normalized);
  saveColorHistory(kind, [normalized, ...existing]);
}

function renderColorHistory(kind, targetId, disabled) {
  const colors = loadColorHistory(kind);
  if (!colors.length) return '';

  return `
    <div class="color-history" aria-label="Recent ${kind === 'stroke' ? 'line' : 'fill'} colors">
      ${colors.map((color) => `
        <button
          type="button"
          class="color-history-swatch"
          data-color-history-kind="${kind}"
          data-color-history-value="${color}"
          data-color-target="${targetId}"
          title="${color}"
          style="--swatch-color:${color}"
          ${disabled ? 'disabled' : ''}
        ></button>
      `).join('')}
    </div>
  `;
}

function renderColorField({ label, inputId, value, disabled, historyKind }) {
  return `
    <label>${label}</label>
    <div class="color-field-row">
      <input id="${inputId}" type="color" value="${value}" ${disabled ? 'disabled' : ''} />
      <button
        type="button"
        class="color-save-button"
        data-save-color-kind="${historyKind}"
        data-save-color-target="${inputId}"
        ${disabled ? 'disabled' : ''}
      >Save color</button>
    </div>
    ${renderColorHistory(historyKind, inputId, disabled)}
  `;
}

function firstSelectedShape(store) {
  const id = store.appState.selectedIds[0];
  return store.documentData.shapes.find((shape) => shape.id === id);
}

function selectedShapes(store) {
  const selected = new Set(store.appState.selectedIds);
  return store.documentData.shapes.filter((shape) => selected.has(shape.id));
}

function selectedRoomShapes(store) {
  return selectedShapes(store).filter((shape) => shape.type === 'room' || shape.type === 'region');
}

function lineTypeOptions(selected) {
  const isTape = selected?.type === 'tape';
  const current = isTape ? 'tape' : (selected?.style?.lineType ?? 'solid');
  return `
    <label>Line type
      <select id="style-line-type">
        <option value="solid" ${current === 'solid' ? 'selected' : ''}>Single line</option>
        <option value="dotted" ${current === 'dotted' ? 'selected' : ''}>Dotted</option>
        <option value="double" ${current === 'double' ? 'selected' : ''}>Double line</option>
        <option value="capped-dotted" ${current === 'capped-dotted' ? 'selected' : ''}>Capped dotted (|---|)</option>
        <option value="tape" ${current === 'tape' ? 'selected' : ''}>Measure</option>
      </select>
    </label>
  `;
}

export function mountPropertiesPanel({ container, store }) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  container.appendChild(panel);


  panel.addEventListener('change', (event) => {
    const target = event.target;

    if (target.id === 'style-stroke') {
      const value = toColorInputValue(target.value, FALLBACK_STROKE);
      target.value = value;
      updateSelectedStyles({ stroke: value });
      rememberColor('stroke', value);
    }
    if (target.id === 'style-fill') {
      const value = toColorInputValue(target.value, FALLBACK_FILL);
      target.value = value;
      updateSelectedStyles({ fill: value });
      rememberColor('fill', value);
    }
    if (target.id === 'style-fill-alpha') {
      const fillAlpha = Number.parseFloat(target.value);
      if (Number.isFinite(fillAlpha)) updateSelectedStyles({ fillAlpha: Math.min(1, Math.max(0, fillAlpha)) });
    }
    if (target.id === 'style-stroke-width') {
      const width = Number.parseFloat(target.value);
      if (Number.isFinite(width)) updateSelectedStyles({ strokeWidth: Math.max(1, width) });
    }
    if (target.id === 'style-text-size') {
      const size = Number.parseFloat(target.value);
      if (Number.isFinite(size)) updateSelectedStyles({ textSize: Math.max(8, size) });
    }
    if (target.id === 'style-font-family') {
      updateSelectedStyles({ fontFamily: target.value || FONT_OPTIONS[0] });
    }
    if (target.id === 'style-line-type') {
      if (target.value === 'tape') {
        setSelectedShapeType('tape');
      } else {
        setSelectedShapeType('line');
        updateSelectedStyles({ lineType: target.value });
      }
    }
    if (target.id === 'shape-locked') updateSelectedShapes({ locked: target.checked });
    if (target.id === 'room-auto-fill') updateSelectedRoomsFilled(target.checked);
  });

  panel.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const historyButton = target.closest('button[data-color-history-kind][data-color-history-value]');
    if (historyButton instanceof HTMLButtonElement) {
      const kind = historyButton.dataset.colorHistoryKind;
      const color = historyButton.dataset.colorHistoryValue;
      const targetId = historyButton.dataset.colorTarget;
      if (!kind || !color || !targetId) return;

      const input = panel.querySelector(`#${targetId}`);
      if (input instanceof HTMLInputElement) {
        input.value = color;
      }

      if (kind === 'stroke') {
        updateSelectedStyles({ stroke: color });
      } else {
        updateSelectedStyles({ fill: color });
      }
      rememberColor(kind, color);
      return;
    }

    const saveColorButton = target.closest('button[data-save-color-kind][data-save-color-target]');
    if (saveColorButton instanceof HTMLButtonElement) {
      const kind = saveColorButton.dataset.saveColorKind;
      const targetId = saveColorButton.dataset.saveColorTarget;
      if (!kind || !targetId) return;

      const input = panel.querySelector(`#${targetId}`);
      if (!(input instanceof HTMLInputElement)) return;

      const fallback = kind === 'stroke' ? FALLBACK_STROKE : FALLBACK_FILL;
      const normalized = toColorInputValue(input.value, fallback);
      input.value = normalized;
      rememberColor(kind, normalized);
      render();
      return;
    }

    if (target.id === 'selection-group') updateSelectedShapes({ groupId: `group-${Date.now()}` });
    if (target.id === 'selection-ungroup') updateSelectedShapes({ groupId: null });
    if (target.id === 'selection-unlock-all') unlockAllShapes();
    if (target.id === 'selection-transform') patchState({ transformSelection: !store.appState.transformSelection, rotateSelection: false });
    if (target.id === 'selection-rotate') patchState({ rotateSelection: !store.appState.rotateSelection, transformSelection: false });
    if (target.id === 'selection-flip-horizontal') flipSelectedHorizontal();
    if (target.id === 'selection-flip-vertical') flipSelectedVertical();
    if (target.id === 'fill-remove') removeSelectedFill();
  });

  const render = () => {
    const activeTool = store.appState.activeTool;
    const count = store.appState.selectedIds.length;
    const selected = firstSelectedShape(store);
    const selectedRooms = selectedRoomShapes(store);
    const allSelectedLocked = count > 0 && selectedShapes(store).every((shape) => shape.locked);
    const allSelectedRoomsFilled = selectedRooms.length > 0 && selectedRooms.every((shape) => shape.filled);
    const anyLockedShapes = store.documentData.shapes.some((shape) => shape.locked);
    const hasFilledSelection = selectedShapes(store).some((shape) => (shape.type === 'room' || shape.type === 'region') && shape.filled === true);
    const style = selected?.style ?? {
      stroke: FALLBACK_STROKE,
      fill: FALLBACK_FILL,
      fillAlpha: 0.12,
      strokeWidth: 2,
      textSize: 14,
      lineType: 'solid',
      fontFamily: FONT_OPTIONS[0],
    };

    const strokeValue = toColorInputValue(style.stroke, FALLBACK_STROKE);
    const fillValue = toColorInputValue(style.fill, FALLBACK_FILL);
    const fillAlpha = Number.isFinite(style.fillAlpha) ? style.fillAlpha : 0.12;
    const noSelectionLabel = count ? `${count} shape(s) selected.` : 'Select a shape to edit properties.';

    let body = `<p>${noSelectionLabel}</p>`;

    if (activeTool === 'select') {
      body += `
        <div class="property-group">
          <h3>Selection</h3>
          <div class="button-row">
            <button id="selection-group" ${count ? '' : 'disabled'}>Group</button>
            <button id="selection-ungroup" ${count ? '' : 'disabled'}>Ungroup</button>
            <button id="selection-unlock-all" ${anyLockedShapes ? '' : 'disabled'}>Unlock all</button>
            <button id="selection-transform" ${count ? '' : 'disabled'}>${store.appState.transformSelection ? 'Exit transform' : 'Transform selection'}</button>
            <button id="selection-flip-horizontal" ${count ? '' : 'disabled'}>Flip left-right</button>
            <button id="selection-flip-vertical" ${count ? '' : 'disabled'}>Flip up-down</button>
          </div>
          <button id="selection-rotate" ${count ? '' : 'disabled'}>${store.appState.rotateSelection ? 'Exit rotate' : 'Rotate selection'}</button>
          <label class="property-toggle"><input id="shape-locked" type="checkbox" ${allSelectedLocked ? 'checked' : ''} ${count ? '' : 'disabled'} /> Lock</label>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: !count, historyKind: 'stroke' })}
          ${renderColorField({ label: 'Fill color', inputId: 'style-fill', value: fillValue, disabled: !count, historyKind: 'fill' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${style.textSize ?? 14}" ${count ? '' : 'disabled'} /></label>
        </div>
      `;
    }

    if (activeTool === 'line') {
      body += `
        <div class="property-group">
          <h3>Line</h3>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: !count, historyKind: 'stroke' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          ${lineTypeOptions(selected)}
        </div>
      `;
    }

    if (activeTool === 'room') {
      body += `
        <div class="property-group">
          <h3>Room</h3>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: !count, historyKind: 'stroke' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          ${lineTypeOptions(selected)}
          <label class="property-toggle"><input id="room-auto-fill" type="checkbox" ${allSelectedRoomsFilled ? 'checked' : ''} ${selectedRooms.length ? '' : 'disabled'} /> Auto fill</label>
          ${renderColorField({ label: 'Fill color', inputId: 'style-fill', value: fillValue, disabled: !count, historyKind: 'fill' })}
        </div>
      `;
    }

    if (activeTool === 'curve') {
      body += `
        <div class="property-group">
          <h3>Curve</h3>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: !count, historyKind: 'stroke' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          ${lineTypeOptions(selected)}
        </div>
      `;
    }

    if (activeTool === 'label') {
      body += `
        <div class="property-group">
          <h3>Label</h3>
          ${renderColorField({ label: 'Font color', inputId: 'style-fill', value: fillValue, disabled: !count, historyKind: 'fill' })}
          <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${style.textSize ?? 14}" ${count ? '' : 'disabled'} /></label>
          <label>Font
            <select id="style-font-family" ${count ? '' : 'disabled'}>
              ${FONT_OPTIONS.map((font) => `<option value="${font}" ${(style.fontFamily ?? FONT_OPTIONS[0]) === font ? 'selected' : ''}>${font.split(',')[0]}</option>`).join('')}
            </select>
          </label>
        </div>
      `;
    }

    if (activeTool === 'fill') {
      body += `
        <div class="property-group">
          <h3>Fill</h3>
          ${renderColorField({ label: 'Fill color', inputId: 'style-fill', value: fillValue, disabled: !count, historyKind: 'fill' })}
          <label>Transparency <input id="style-fill-alpha" type="range" min="0" max="1" step="0.05" value="${fillAlpha}" ${count ? '' : 'disabled'} /></label>
          <button id="fill-remove" ${hasFilledSelection ? '' : 'disabled'}>Take away fill</button>
        </div>
      `;
    }

    panel.innerHTML = `
      <h2>Properties</h2>
      ${body}
    `;
  };

  render();
  return render;
}
