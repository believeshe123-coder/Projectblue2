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
  updateDocumentSettings,
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
const MEASUREMENT_GRID_HISTORY_LIMIT = 6;
const MEASUREMENT_GRID_HISTORY_KEY = 'blueprint.measurementHistory.unitsPerGrid';
const TEXTURE_PREVIEW_SIZE = 36;
const texturePreviewCache = new Map();

function gridSignature(grid) {
  if (!Array.isArray(grid)) return '';
  return grid.map((row) => (Array.isArray(row) ? row.map((cell) => (cell ? '1' : '0')).join('') : '')).join('|');
}

export function getTexturePreviewDataUrl(texture, size = TEXTURE_PREVIEW_SIZE) {
  if (!texture) return '';
  if (texture.kind === 'image' && typeof texture.dataUrl === 'string' && texture.dataUrl) {
    return texture.dataUrl;
  }

  const signature = gridSignature(texture.grid);
  const cacheKey = `${texture.id}:${texture.updatedAt ?? 0}:${size}:${signature}`;
  if (texturePreviewCache.has(cacheKey)) {
    return texturePreviewCache.get(cacheKey);
  }

  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);
  const gridSize = Math.max(1, Array.isArray(texture.grid) ? texture.grid.length : 10);
  const cell = size / gridSize;
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!texture.grid?.[y]?.[x]) continue;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  texturePreviewCache.set(cacheKey, dataUrl);
  return dataUrl;
}

export function renderTexturePickerOptions(textures, selectedTextureId) {
  return textures.map((texture) => {
    const selected = selectedTextureId === texture.id;
    const preview = getTexturePreviewDataUrl(texture);
    return `
      <button
        type="button"
        class="texture-picker-option ${selected ? 'selected' : ''}"
        data-texture-option="true"
        data-texture-id="${texture.id}"
        aria-pressed="${selected ? 'true' : 'false'}"
        title="${texture.name}"
      >
        ${preview
    ? `<img class="texture-picker-preview" src="${preview}" alt="" />`
    : '<span class="texture-picker-preview texture-picker-preview-fallback" aria-hidden="true"></span>'}
        <span class="texture-picker-name">${texture.name}</span>
      </button>
    `;
  }).join('');
}

export function getTextureColorModeUiState(fillMode, selectedTexture, textureColorMode) {
  const selectedTextureTintable = selectedTexture ? selectedTexture.tintable !== false : true;
  return {
    selectedTextureTintable,
    selectedMode: textureColorMode === 'selected' ? 'selected' : 'original',
    showNonTintableHint: fillMode === 'texture' && !selectedTextureTintable,
  };
}

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

function normalizeMeasurementUnitsPerGrid(value) {
  const parsed = Number.parseFloat(String(value ?? '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(1000, Math.max(0.01, parsed));
}

function loadMeasurementUnitsPerGridHistory() {
  try {
    const raw = localStorage.getItem(MEASUREMENT_GRID_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeMeasurementUnitsPerGrid(entry))
      .filter((entry) => entry != null)
      .slice(0, MEASUREMENT_GRID_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function saveMeasurementUnitsPerGridHistory(values) {
  try {
    localStorage.setItem(
      MEASUREMENT_GRID_HISTORY_KEY,
      JSON.stringify(values.slice(0, MEASUREMENT_GRID_HISTORY_LIMIT)),
    );
  } catch {
    // ignore storage errors
  }
}

function rememberMeasurementUnitsPerGrid(value) {
  const normalized = normalizeMeasurementUnitsPerGrid(value);
  if (normalized == null) return;
  const existing = loadMeasurementUnitsPerGridHistory().filter((entry) => entry !== normalized);
  saveMeasurementUnitsPerGridHistory([normalized, ...existing]);
}

function renderMeasurementUnitsPerGridHistory(targetId, disabled) {
  const values = loadMeasurementUnitsPerGridHistory();
  if (!values.length) return '';
  return `
    <div class="measurement-history" aria-label="Recent units per grid values">
      ${values.map((value) => `
        <button
          type="button"
          class="measurement-history-chip"
          data-measurement-history-value="${value}"
          data-measurement-target="${targetId}"
          ${disabled ? 'disabled' : ''}
        >${value}</button>
      `).join('')}
    </div>
  `;
}

function renderMeasurementUnitsPerGridField({
  inputId,
  value,
  disabled,
  label = 'Units per grid (selected rooms/regions)',
  hint = 'Leave blank to use the global measurement settings.',
}) {
  return `
    <label>${label}
      <div class="color-field-row">
        <input
          id="${inputId}"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Use drawing default"
          value="${value}"
          ${disabled ? 'disabled' : ''}
        />
        <button
          type="button"
          class="color-save-button"
          data-save-measurement-grid-target="${inputId}"
          ${disabled ? 'disabled' : ''}
        >Save size</button>
      </div>
    </label>
    ${renderMeasurementUnitsPerGridHistory(inputId, disabled)}
    <p class="muted-hint">${hint}</p>
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

function sharedMeasurementUnitsPerGrid(shapes) {
  if (!shapes.length) return '';
  const [first, ...rest] = shapes;
  const firstValue = Number(first.measurementUnitsPerGrid);
  const normalizedFirst = Number.isFinite(firstValue) && firstValue > 0 ? firstValue : null;
  const mixed = rest.some((shape) => {
    const current = Number(shape.measurementUnitsPerGrid);
    const normalized = Number.isFinite(current) && current > 0 ? current : null;
    return normalized !== normalizedFirst;
  });
  if (mixed) return '';
  return normalizedFirst == null ? '' : String(normalizedFirst);
}

function selectedTapeShapes(store) {
  return selectedShapes(store).filter((shape) => shape.type === 'tape');
}


export function formatMeasurePreviewScale({ settings, tapeCustomMeasurementEnabled, tapeCustomMeasurementValue }) {
  const normalizedCustom = normalizeMeasurementUnitsPerGrid(tapeCustomMeasurementValue);
  const normalizedGlobal = normalizeMeasurementUnitsPerGrid(settings?.unitsPerGrid);
  const unitsPerGrid = tapeCustomMeasurementEnabled
    ? (normalizedCustom ?? normalizedGlobal ?? 1)
    : (normalizedGlobal ?? 1);
  const unitsLabel = String(settings?.units ?? '').trim() || 'ft';
  return `${unitsPerGrid} ${unitsLabel} per grid box`;
}

function renderMeasurePreview(mode, scaleLabel) {
  const isOffset = mode === 'offset-3-point';
  const isAngle = mode === 'angle-3-point';
  const baselineStroke = isOffset ? '#0f4c81' : '#1f2937';
  const baselineDash = isOffset ? '' : "stroke-dasharray='4 4'";

  return `
    <div class="measure-preview" aria-label="Measurement preview">
      <svg viewBox="0 0 140 68" role="img" aria-hidden="true">
        ${isOffset ? `
          <line x1="24" y1="16" x2="24" y2="44" stroke="#64748b" stroke-width="2" />
          <line x1="110" y1="16" x2="110" y2="44" stroke="#64748b" stroke-width="2" />
          <line x1="24" y1="44" x2="110" y2="44" stroke="#0f4c81" stroke-width="2" stroke-dasharray="5 4" />
        ` : isAngle ? `
          <line x1="24" y1="50" x2="74" y2="34" stroke="#0f4c81" stroke-width="2" stroke-dasharray="5 4" />
          <line x1="24" y1="50" x2="78" y2="54" stroke="#0f4c81" stroke-width="2" stroke-dasharray="5 4" />
          <path d="M45 45 A12 12 0 0 1 50 53" fill="none" stroke="#64748b" stroke-width="1.5" />
        ` : `
          <line x1="24" y1="32" x2="110" y2="32" stroke="${baselineStroke}" stroke-width="2" ${baselineDash} />
        `}
        <circle cx="24" cy="${isOffset ? 16 : isAngle ? 50 : 32}" r="3" fill="#0f4c81" />
        <circle cx="${isAngle ? 74 : 110}" cy="${isOffset ? 16 : isAngle ? 34 : 32}" r="3" fill="#0f4c81" />
        ${isAngle ? '<circle cx="78" cy="54" r="3" fill="#0f4c81" />' : ''}
      </svg>
      <p>${isOffset ? '3 clicks: start, end, pull offset.' : isAngle ? '3 clicks: vertex, arm one, arm two.' : '2 clicks (or drag): start and end.'}</p>
      <p class="muted-hint">Preview scale: ${scaleLabel}</p>
    </div>
  `;
}

function lineTypeOptions(selected, fallbackLineType = 'solid') {
  const isTape = selected?.type === 'tape';
  const current = isTape ? 'tape' : (selected?.style?.lineType ?? fallbackLineType);
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

export function mountPropertiesPanel({ container, store, showActionToast = () => {} }) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  container.appendChild(panel);


  const updateToolStyle = (partial) => {
    patchState({ toolStyle: { ...(store.appState.toolStyle ?? {}), ...partial } });
  };
  const applyTextureSelection = (rawTextureId) => {
    const textureId = rawTextureId || null;
    const fillMode = textureId ? 'texture' : 'color';
    const selectedTexture = store.library.textures.find((texture) => texture.id === textureId) ?? null;
    const textureColorMode = selectedTexture && selectedTexture.tintable === false
      ? 'original'
      : (store.appState.fillStyle?.textureColorMode ?? 'original');
    if (store.appState.activeTool === 'fill') {
      patchState({ fillStyle: { ...(store.appState.fillStyle ?? {}), textureId, fillMode, textureColorMode } });
    }
    if (store.appState.selectedIds.length) {
      updateSelectedStyles({ textureId, fillMode, textureColorMode });
    }
  };

  panel.addEventListener('change', (event) => {
    const target = event.target;

    if (target.id === 'style-stroke') {
      const value = toColorInputValue(target.value, FALLBACK_STROKE);
      target.value = value;
      updateToolStyle({ stroke: value });
      if (store.appState.selectedIds.length) updateSelectedStyles({ stroke: value });
      rememberColor('stroke', value);
    }
    if (target.id === 'style-fill') {
      const value = toColorInputValue(target.value, FALLBACK_FILL);
      target.value = value;
      updateToolStyle({ fill: value });
      if (store.appState.activeTool === 'fill') {
        patchState({ fillStyle: { ...(store.appState.fillStyle ?? {}), fill: value } });
      }
      if (store.appState.selectedIds.length) {
        updateSelectedStyles({ fill: value });
      }
      rememberColor('fill', value);
    }
    if (target.id === 'style-fill-alpha') {
      const fillAlpha = Number.parseFloat(target.value);
      if (Number.isFinite(fillAlpha)) {
        const nextFillAlpha = Math.min(1, Math.max(0, fillAlpha));
        updateToolStyle({ fillAlpha: nextFillAlpha });
        if (store.appState.activeTool === 'fill') {
          patchState({ fillStyle: { ...(store.appState.fillStyle ?? {}), fillAlpha: nextFillAlpha } });
        }
        if (store.appState.selectedIds.length) {
          updateSelectedStyles({ fillAlpha: nextFillAlpha });
        }
      }
    }
    if (target.id === 'style-fill-mode') {
      const nextFillMode = target.value === 'texture' ? 'texture' : 'color';
      if (store.appState.activeTool === 'fill') {
        patchState({ fillStyle: { ...(store.appState.fillStyle ?? {}), fillMode: nextFillMode } });
      }
      if (store.appState.selectedIds.length) {
        updateSelectedStyles({ fillMode: nextFillMode });
      }
    }
    if (target.id === 'style-texture-id') {
      applyTextureSelection(target.value);
    }
    if (target.id === 'style-texture-color-mode') {
      const textureColorMode = target.value === 'selected' ? 'selected' : 'original';
      if (store.appState.activeTool === 'fill') {
        patchState({ fillStyle: { ...(store.appState.fillStyle ?? {}), textureColorMode } });
      }
      if (store.appState.selectedIds.length) {
        updateSelectedStyles({ textureColorMode });
      }
    }
    if (target.id === 'style-texture-scale') {
      const parsed = Number.parseFloat(target.value);
      if (Number.isFinite(parsed)) {
        const textureScale = Math.min(4, Math.max(0.25, parsed));
        if (store.appState.activeTool === 'fill') {
          patchState({ fillStyle: { ...(store.appState.fillStyle ?? {}), textureScale } });
        }
        if (store.appState.selectedIds.length) {
          updateSelectedStyles({ textureScale });
        }
      }
    }
    if (target.id === 'style-stroke-width') {
      const width = Number.parseFloat(target.value);
      if (Number.isFinite(width)) {
        const strokeWidth = Math.max(1, width);
        updateToolStyle({ strokeWidth });
        if (store.appState.selectedIds.length) updateSelectedStyles({ strokeWidth });
      }
    }
    if (target.id === 'style-text-size') {
      const size = Number.parseFloat(target.value);
      if (Number.isFinite(size)) {
        const textSize = Math.max(8, size);
        updateToolStyle({ textSize });
        if (store.appState.selectedIds.length) updateSelectedStyles({ textSize });
      }
    }
    if (target.id === 'style-font-family') {
      const fontFamily = target.value || FONT_OPTIONS[0];
      updateToolStyle({ fontFamily });
      if (store.appState.selectedIds.length) updateSelectedStyles({ fontFamily });
    }
    if (target.id === 'style-line-type') {
      if (target.value === 'tape') {
        setSelectedShapeType('tape');
      } else {
        setSelectedShapeType('line');
        updateToolStyle({ lineType: target.value });
        if (store.appState.selectedIds.length) updateSelectedStyles({ lineType: target.value });
      }
    }
    if (target.id === 'selection-measure-enabled') {
      setSelectedShapeType(target.checked ? 'tape' : 'line');
    }
    if (target.id === 'shape-locked') updateSelectedShapes({ locked: target.checked });
    if (target.id === 'room-auto-fill') updateSelectedRoomsFilled(target.checked);
    if (target.id === 'measure-tool-type') {
      const nextTapeMeasureMode = ['direct', 'offset-3-point', 'angle-3-point'].includes(target.value)
        ? target.value
        : 'direct';
      updateDocumentSettings({ tapeMeasureMode: nextTapeMeasureMode });
    }
    if (target.id === 'measure-draw-mode') {
      updateDocumentSettings({ drawMode: target.value === 'drag' ? 'drag' : 'click' });
    }
    if (target.id === 'shape-measurement-units-per-grid') {
      const raw = target.value.trim();
      if (!raw.length) {
        updateSelectedShapes({ measurementUnitsPerGrid: null });
        return;
      }

      const measurementUnitsPerGrid = normalizeMeasurementUnitsPerGrid(raw);
      if (measurementUnitsPerGrid != null) {
        updateSelectedShapes({ measurementUnitsPerGrid });
      }
    }
    if (target.id === 'measure-custom-enabled') {
      const tapeCustomMeasurementEnabled = target.checked;
      updateToolStyle({ tapeCustomMeasurementEnabled });

      if (!tapeCustomMeasurementEnabled) {
        const selectedTapes = selectedTapeShapes(store);
        if (selectedTapes.length) {
          updateSelectedShapes({ measurementUnitsPerGrid: null });
        }
      } else {
        const parsed = normalizeMeasurementUnitsPerGrid(store.appState.toolStyle?.tapeMeasurementUnitsPerGrid);
        if (parsed != null) {
          const selectedTapes = selectedTapeShapes(store);
          if (selectedTapes.length) {
            updateSelectedShapes({ measurementUnitsPerGrid: parsed });
          }
        }
      }
      render();
    }
    if (target.id === 'measure-custom-units-per-grid') {
      const raw = target.value.trim();
      if (!raw.length) return;
      const measurementUnitsPerGrid = normalizeMeasurementUnitsPerGrid(raw);
      if (measurementUnitsPerGrid == null) return;

      updateToolStyle({ tapeMeasurementUnitsPerGrid: measurementUnitsPerGrid });

      if (store.appState.toolStyle?.tapeCustomMeasurementEnabled) {
        const selectedTapes = selectedTapeShapes(store);
        if (selectedTapes.length) {
          updateSelectedShapes({ measurementUnitsPerGrid });
        }
      }
    }
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
        updateToolStyle({ stroke: color });
        if (store.appState.selectedIds.length) updateSelectedStyles({ stroke: color });
      } else {
        updateToolStyle({ fill: color });
        if (store.appState.selectedIds.length) updateSelectedStyles({ fill: color });
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
    const saveMeasurementButton = target.closest('button[data-save-measurement-grid-target]');
    if (saveMeasurementButton instanceof HTMLButtonElement) {
      const targetId = saveMeasurementButton.dataset.saveMeasurementGridTarget;
      if (!targetId) return;
      const input = panel.querySelector(`#${targetId}`);
      if (!(input instanceof HTMLInputElement)) return;
      const normalized = normalizeMeasurementUnitsPerGrid(input.value);
      if (normalized == null) return;
      input.value = String(normalized);
      rememberMeasurementUnitsPerGrid(normalized);
      if (targetId === 'measure-custom-units-per-grid') {
        updateToolStyle({ tapeMeasurementUnitsPerGrid: normalized });
      }
      render();
      return;
    }
    const measurementHistoryButton = target.closest('button[data-measurement-history-value][data-measurement-target]');
    if (measurementHistoryButton instanceof HTMLButtonElement) {
      const targetId = measurementHistoryButton.dataset.measurementTarget;
      const value = normalizeMeasurementUnitsPerGrid(measurementHistoryButton.dataset.measurementHistoryValue);
      if (!targetId || value == null) return;
      const input = panel.querySelector(`#${targetId}`);
      if (input instanceof HTMLInputElement) input.value = String(value);
      if (targetId === 'measure-custom-units-per-grid') {
        updateToolStyle({ tapeMeasurementUnitsPerGrid: value });
        if (store.appState.toolStyle?.tapeCustomMeasurementEnabled) {
          const selectedTapes = selectedTapeShapes(store);
          if (selectedTapes.length) updateSelectedShapes({ measurementUnitsPerGrid: value });
        }
      } else {
        updateSelectedShapes({ measurementUnitsPerGrid: value });
      }
      rememberMeasurementUnitsPerGrid(value);
      return;
    }
    const textureOptionButton = target.closest('button[data-texture-option="true"]');
    if (textureOptionButton instanceof HTMLButtonElement) {
      const nextTextureId = textureOptionButton.dataset.textureId ?? '';
      applyTextureSelection(nextTextureId);
      render();
      return;
    }

    if (target.id === 'selection-group') {
      const changed = updateSelectedShapes({ groupId: `group-${Date.now()}` });
      if (changed) showActionToast('Grouped selected objects.');
    }
    if (target.id === 'selection-ungroup') {
      const changed = updateSelectedShapes({ groupId: null });
      if (changed) showActionToast('Ungrouped selected objects.');
    }
    if (target.id === 'selection-unlock-all') unlockAllShapes();
    if (target.id === 'selection-transform') patchState({ transformSelection: !store.appState.transformSelection, rotateSelection: false });
    if (target.id === 'selection-rotate') patchState({ rotateSelection: !store.appState.rotateSelection, transformSelection: false });
    if (target.id === 'selection-flip-horizontal') {
      const changed = flipSelectedHorizontal();
      if (changed) showActionToast('Flipped selected objects left-right.');
    }
    if (target.id === 'selection-flip-vertical') {
      const changed = flipSelectedVertical();
      if (changed) showActionToast('Flipped selected objects up-down.');
    }
    if (target.id === 'fill-remove') removeSelectedFill();
  });
  panel.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.textureOption !== 'true') return;
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;

    const options = [...panel.querySelectorAll('button[data-texture-option="true"]')];
    const index = options.findIndex((entry) => entry === target);
    if (index < 0) return;
    const delta = (event.key === 'ArrowDown' || event.key === 'ArrowRight') ? 1 : -1;
    const next = options[(index + delta + options.length) % options.length];
    next?.focus();
    event.preventDefault();
  });

  const render = () => {
    const activeTool = store.appState.activeTool;
    const count = store.appState.selectedIds.length;
    const selected = firstSelectedShape(store);
    const selectedRooms = selectedRoomShapes(store);
    const selectedTapes = selectedTapeShapes(store);
    const roomMeasurementUnitsPerGrid = sharedMeasurementUnitsPerGrid(selectedRooms);
    const tapeMeasurementUnitsPerGrid = sharedMeasurementUnitsPerGrid(selectedTapes);
    const selectedLineLikeShapes = selectedShapes(store).filter((shape) => shape.type === 'line' || shape.type === 'tape');
    const allSelectedLocked = count > 0 && selectedShapes(store).every((shape) => shape.locked);
    const allSelectedRoomsFilled = selectedRooms.length > 0 && selectedRooms.every((shape) => shape.filled);
    const hasSelectedLineLikeShapes = selectedLineLikeShapes.length > 0;
    const allSelectedLineLikeAreTape = hasSelectedLineLikeShapes && selectedLineLikeShapes.every((shape) => shape.type === 'tape');
    const anyLockedShapes = store.documentData.shapes.some((shape) => shape.locked);
    const hasFilledSelection = selectedShapes(store).some((shape) => (shape.type === 'room' || shape.type === 'region') && shape.filled === true);
    const style = selected?.style ?? null;
    const defaultStyle = {
      stroke: FALLBACK_STROKE,
      fill: FALLBACK_FILL,
      fillAlpha: 0.12,
      strokeWidth: 2,
      textSize: 14,
      lineType: 'solid',
      fontFamily: FONT_OPTIONS[0],
      fillMode: 'color',
      textureId: null,
      textureColorMode: 'original',
      textureScale: 1,
    };
    const toolStyle = store.appState.toolStyle ?? {};
    const fillToolStyle = store.appState.fillStyle ?? {};
    const effectiveStyle = activeTool === 'fill'
      ? {
          ...defaultStyle,
          ...toolStyle,
          ...style,
          fill: style?.fill ?? fillToolStyle.fill ?? defaultStyle.fill,
          fillAlpha: Number.isFinite(style?.fillAlpha) ? style.fillAlpha : (
            Number.isFinite(fillToolStyle.fillAlpha) ? fillToolStyle.fillAlpha : 0.12
          ),
          fillMode: style?.fillMode ?? fillToolStyle.fillMode ?? defaultStyle.fillMode,
          textureId: style?.textureId ?? fillToolStyle.textureId ?? defaultStyle.textureId,
          textureColorMode: style?.textureColorMode ?? fillToolStyle.textureColorMode ?? defaultStyle.textureColorMode,
          textureScale: Number.isFinite(style?.textureScale)
            ? style.textureScale
            : (Number.isFinite(fillToolStyle.textureScale) ? fillToolStyle.textureScale : defaultStyle.textureScale),
        }
      : { ...defaultStyle, ...toolStyle, ...style };

    const strokeValue = toColorInputValue(effectiveStyle.stroke, FALLBACK_STROKE);
    const fillValue = toColorInputValue(effectiveStyle.fill, FALLBACK_FILL);
    const fillAlpha = Number.isFinite(effectiveStyle.fillAlpha) ? effectiveStyle.fillAlpha : 0.12;
    const noSelectionLabel = count ? `${count} shape(s) selected.` : 'Select a shape to edit properties.';
    const fillMode = effectiveStyle.fillMode === 'texture' ? 'texture' : 'color';
    const textureColorMode = effectiveStyle.textureColorMode === 'selected' ? 'selected' : 'original';
    const textureScale = Number.isFinite(effectiveStyle.textureScale)
      ? Math.min(4, Math.max(0.25, effectiveStyle.textureScale))
      : 1;
    const texturePickerOptions = renderTexturePickerOptions(store.library.textures, effectiveStyle.textureId);
    const selectedTexture = store.library.textures.find((texture) => texture.id === effectiveStyle.textureId) ?? null;
    const textureColorState = getTextureColorModeUiState(fillMode, selectedTexture, textureColorMode);
    const tapeCustomMeasurementEnabled = Boolean(store.appState.toolStyle?.tapeCustomMeasurementEnabled);
    const tapeCustomMeasurementValue = normalizeMeasurementUnitsPerGrid(store.appState.toolStyle?.tapeMeasurementUnitsPerGrid) ?? 1;

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
          <label class="property-toggle"><input id="selection-measure-enabled" type="checkbox" ${allSelectedLineLikeAreTape ? 'checked' : ''} ${hasSelectedLineLikeShapes ? '' : 'disabled'} /> Measure selected lines</label>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: !count, historyKind: 'stroke' })}
          ${renderColorField({ label: 'Fill color', inputId: 'style-fill', value: fillValue, disabled: !count, historyKind: 'fill' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${effectiveStyle.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${effectiveStyle.textSize ?? 14}" ${count ? '' : 'disabled'} /></label>
        </div>
      `;

      if (selectedRooms.length) {
        body += `
          <div class="property-group">
            <h3>Measurement</h3>
            ${renderMeasurementUnitsPerGridField({
    inputId: 'shape-measurement-units-per-grid',
    value: roomMeasurementUnitsPerGrid,
    disabled: false,
  })}
          </div>
        `;
      }

    }

    if (activeTool === 'line' || activeTool === 'pen') {
      body += `
        <div class="property-group">
          <h3>Line / Pen</h3>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: false, historyKind: 'stroke' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${effectiveStyle.strokeWidth ?? 2}" /></label>
          ${lineTypeOptions(selected, effectiveStyle.lineType ?? 'solid')}
        </div>
      `;
    }

    if (activeTool === 'room') {
      body += `
        <div class="property-group">
          <h3>Room</h3>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: false, historyKind: 'stroke' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${effectiveStyle.strokeWidth ?? 2}" /></label>
          ${lineTypeOptions(selected, effectiveStyle.lineType ?? 'solid')}
          <label class="property-toggle"><input id="room-auto-fill" type="checkbox" ${allSelectedRoomsFilled ? 'checked' : ''} ${selectedRooms.length ? '' : 'disabled'} /> Auto fill</label>
          ${renderColorField({ label: 'Fill color', inputId: 'style-fill', value: fillValue, disabled: false, historyKind: 'fill' })}
          ${renderMeasurementUnitsPerGridField({
    inputId: 'shape-measurement-units-per-grid',
    value: roomMeasurementUnitsPerGrid,
    disabled: !selectedRooms.length,
  })}
        </div>
      `;
    }

    if (activeTool === 'curve') {
      body += `
        <div class="property-group">
          <h3>Curve</h3>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: false, historyKind: 'stroke' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${effectiveStyle.strokeWidth ?? 2}" /></label>
          ${lineTypeOptions(selected, effectiveStyle.lineType ?? 'solid')}
        </div>
      `;
    }

    if (activeTool === 'label') {
      body += `
        <div class="property-group">
          <h3>Label</h3>
          ${renderColorField({ label: 'Font color', inputId: 'style-fill', value: fillValue, disabled: false, historyKind: 'fill' })}
          <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${effectiveStyle.textSize ?? 14}" /></label>
          <label>Font
            <select id="style-font-family">
              ${FONT_OPTIONS.map((font) => `<option value="${font}" ${(effectiveStyle.fontFamily ?? FONT_OPTIONS[0]) === font ? 'selected' : ''}>${font.split(',')[0]}</option>`).join('')}
            </select>
          </label>
        </div>
      `;
    }

    if (activeTool === 'tape') {
      const tapeMeasureMode = ['direct', 'offset-3-point', 'angle-3-point'].includes(store.documentData.settings.tapeMeasureMode)
        ? store.documentData.settings.tapeMeasureMode
        : 'direct';
      const drawMode = store.documentData.settings.drawMode === 'drag' ? 'drag' : 'click';
      const hasSelectedTapes = selectedTapes.length > 0;
      const activeTapeMeasurementValue = hasSelectedTapes ? (tapeMeasurementUnitsPerGrid || String(tapeCustomMeasurementValue)) : String(tapeCustomMeasurementValue);
      const measurePreviewScaleLabel = formatMeasurePreviewScale({
        settings: store.documentData.settings,
        tapeCustomMeasurementEnabled,
        tapeCustomMeasurementValue,
      });
      body += `
        <div class="property-group">
          <h3>Measure</h3>
          <label>Measure type
            <select id="measure-tool-type">
              <option value="direct" ${tapeMeasureMode === 'direct' ? 'selected' : ''}>Direct dotted line</option>
              <option value="offset-3-point" ${tapeMeasureMode === 'offset-3-point' ? 'selected' : ''}>3-point pulled dimension</option>
              <option value="angle-3-point" ${tapeMeasureMode === 'angle-3-point' ? 'selected' : ''}>3-point angle</option>
            </select>
          </label>
          <label>Drawing interaction
            <select id="measure-draw-mode">
              <option value="click" ${drawMode === 'click' ? 'selected' : ''}>Click start, click end</option>
              <option value="drag" ${drawMode === 'drag' ? 'selected' : ''}>Click and drag</option>
            </select>
          </label>
          ${renderColorField({ label: 'Line color', inputId: 'style-stroke', value: strokeValue, disabled: false, historyKind: 'stroke' })}
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${effectiveStyle.strokeWidth ?? 2}" /></label>
          <label class="property-toggle">
            <input id="measure-custom-enabled" type="checkbox" ${tapeCustomMeasurementEnabled ? 'checked' : ''} />
            Custom measurement
          </label>
          ${renderMeasurementUnitsPerGridField({
    inputId: 'measure-custom-units-per-grid',
    value: activeTapeMeasurementValue,
    disabled: !tapeCustomMeasurementEnabled,
    label: 'Units per grid (measure tool)',
    hint: 'When enabled, new measurements save with this units-per-grid value.',
  })}
          ${renderMeasurePreview(tapeMeasureMode, measurePreviewScaleLabel)}
        </div>
      `;
    }

    if (activeTool === 'fill') {
      const fillControlsDisabled = false;
      body += `
        <div class="property-group">
          <h3>Fill</h3>
          <label>Fill type
            <select id="style-fill-mode" ${fillControlsDisabled ? 'disabled' : ''}>
              <option value="color" ${fillMode === 'color' ? 'selected' : ''}>Color</option>
              <option value="texture" ${fillMode === 'texture' ? 'selected' : ''}>Texture</option>
            </select>
          </label>
          ${renderColorField({ label: 'Fill color', inputId: 'style-fill', value: fillValue, disabled: fillControlsDisabled, historyKind: 'fill' })}
          <label id="style-texture-picker-label">Floor texture</label>
          <input id="style-texture-id" type="hidden" value="${effectiveStyle.textureId ?? ''}" />
          <div class="texture-picker" role="group" aria-labelledby="style-texture-picker-label">
            <button
              type="button"
              class="texture-picker-option ${!effectiveStyle.textureId ? 'selected' : ''}"
              data-texture-option="true"
              data-texture-id=""
              aria-pressed="${!effectiveStyle.textureId ? 'true' : 'false'}"
              ${fillControlsDisabled || !store.library.textures.length ? 'disabled' : ''}
            >
              <span class="texture-picker-preview texture-picker-preview-none" aria-hidden="true">∅</span>
              <span class="texture-picker-name">None</span>
            </button>
            ${texturePickerOptions}
          </div>
          <label>Texture color
            <select id="style-texture-color-mode" ${fillControlsDisabled || fillMode !== 'texture' ? 'disabled' : ''}>
              <option value="original" ${textureColorMode === 'original' ? 'selected' : ''}>Original (B/W preset)</option>
              <option value="selected" ${textureColorState.selectedMode === 'selected' ? 'selected' : ''} ${textureColorState.selectedTextureTintable ? '' : 'disabled'}>Use selected fill color</option>
            </select>
          </label>
          ${textureColorState.showNonTintableHint ? '<p class="muted-hint">Selected texture uses original colors only.</p>' : ''}
          <label>Texture scale (${textureScale.toFixed(2)}x)
            <input id="style-texture-scale" type="range" min="0.25" max="4" step="0.05" value="${textureScale}" ${fillControlsDisabled || fillMode !== 'texture' ? 'disabled' : ''} />
          </label>
          <label>Transparency <input id="style-fill-alpha" type="range" min="0" max="1" step="0.05" value="${fillAlpha}" ${fillControlsDisabled ? 'disabled' : ''} /></label>
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
