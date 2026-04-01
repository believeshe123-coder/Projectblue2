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


function renderMeasurePreview(mode) {
  const isOffset = mode === 'offset-3-point';
  const baselineStroke = isOffset ? '#0f4c81' : '#1f2937';
  const baselineDash = isOffset ? '' : "stroke-dasharray='4 4'";

  return `
    <div class="measure-preview" aria-label="Measurement preview">
      <svg viewBox="0 0 140 68" role="img" aria-hidden="true">
        ${isOffset ? `
          <line x1="24" y1="16" x2="24" y2="44" stroke="#64748b" stroke-width="2" />
          <line x1="110" y1="16" x2="110" y2="44" stroke="#64748b" stroke-width="2" />
          <line x1="24" y1="44" x2="110" y2="44" stroke="#0f4c81" stroke-width="2" stroke-dasharray="5 4" />
        ` : `
          <line x1="24" y1="32" x2="110" y2="32" stroke="${baselineStroke}" stroke-width="2" ${baselineDash} />
        `}
        <circle cx="24" cy="${isOffset ? 16 : 32}" r="3" fill="#0f4c81" />
        <circle cx="110" cy="${isOffset ? 16 : 32}" r="3" fill="#0f4c81" />
      </svg>
      <p>${isOffset ? '3 clicks: start, end, pull offset.' : '2 clicks (or drag): start and end.'}</p>
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
      const textureId = target.value || null;
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
    if (target.id === 'shape-locked') updateSelectedShapes({ locked: target.checked });
    if (target.id === 'room-auto-fill') updateSelectedRoomsFilled(target.checked);
    if (target.id === 'measure-tool-type') {
      updateDocumentSettings({ tapeMeasureMode: target.value === 'offset-3-point' ? 'offset-3-point' : 'direct' });
    }
    if (target.id === 'measure-draw-mode') {
      updateDocumentSettings({ drawMode: target.value === 'drag' ? 'drag' : 'click' });
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

  const render = () => {
    const activeTool = store.appState.activeTool;
    const count = store.appState.selectedIds.length;
    const selected = firstSelectedShape(store);
    const selectedRooms = selectedRoomShapes(store);
    const allSelectedLocked = count > 0 && selectedShapes(store).every((shape) => shape.locked);
    const allSelectedRoomsFilled = selectedRooms.length > 0 && selectedRooms.every((shape) => shape.filled);
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
    const textureOptions = store.library.textures.map((texture) => `<option value="${texture.id}" ${effectiveStyle.textureId === texture.id ? 'selected' : ''}>${texture.name}</option>`).join('');
    const selectedTexture = store.library.textures.find((texture) => texture.id === effectiveStyle.textureId) ?? null;
    const selectedTextureTintable = selectedTexture ? selectedTexture.tintable !== false : true;

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
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${effectiveStyle.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${effectiveStyle.textSize ?? 14}" ${count ? '' : 'disabled'} /></label>
        </div>
      `;

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
      const tapeMeasureMode = store.documentData.settings.tapeMeasureMode === 'offset-3-point' ? 'offset-3-point' : 'direct';
      const drawMode = store.documentData.settings.drawMode === 'drag' ? 'drag' : 'click';
      body += `
        <div class="property-group">
          <h3>Measure</h3>
          <label>Measure type
            <select id="measure-tool-type">
              <option value="direct" ${tapeMeasureMode === 'direct' ? 'selected' : ''}>Direct dotted line</option>
              <option value="offset-3-point" ${tapeMeasureMode === 'offset-3-point' ? 'selected' : ''}>3-point pulled dimension</option>
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
          ${renderMeasurePreview(tapeMeasureMode)}
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
          <label>Floor texture
            <select id="style-texture-id" ${fillControlsDisabled || !store.library.textures.length ? 'disabled' : ''}>
              <option value="">None</option>
              ${textureOptions}
            </select>
          </label>
          <label>Texture color
            <select id="style-texture-color-mode" ${fillControlsDisabled || fillMode !== 'texture' ? 'disabled' : ''}>
              <option value="original" ${textureColorMode === 'original' ? 'selected' : ''}>Original (B/W preset)</option>
              <option value="selected" ${textureColorMode === 'selected' ? 'selected' : ''} ${selectedTextureTintable ? '' : 'disabled'}>Use selected fill color</option>
            </select>
          </label>
          ${fillMode === 'texture' && !selectedTextureTintable ? '<p class="muted-hint">Selected texture uses original colors only.</p>' : ''}
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
