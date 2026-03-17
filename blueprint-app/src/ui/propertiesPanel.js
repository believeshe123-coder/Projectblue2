import {
  rotateSelectedShapes,
  setSelectedShapeType,
  updateSelectedShapes,
  updateSelectedStyles,
  updateSelectedRoomsFilled,
} from '../app/actions.js';

const FALLBACK_STROKE = '#1f2937';
const FALLBACK_FILL = '#0f4c81';
const FONT_OPTIONS = [
  'Inter, Segoe UI, Tahoma, sans-serif',
  'Arial, Helvetica, sans-serif',
  'Georgia, Times New Roman, serif',
  'Courier New, Courier, monospace',
];

function toColorInputValue(color, fallback) {
  if (typeof color !== 'string' || color.trim().length === 0) return fallback;

  const normalized = color.trim();
  if (/^#[\da-f]{6}$/i.test(normalized)) return normalized;
  if (/^#[\da-f]{3}$/i.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
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
        <option value="tape" ${current === 'tape' ? 'selected' : ''}>Measure</option>
      </select>
    </label>
  `;
}

function snapRotation(value) {
  const targets = [90, 180, 270, -90, -180, -270];
  const threshold = 4;
  const hit = targets.find((target) => Math.abs(target - value) <= threshold);
  return hit ?? value;
}

export function mountPropertiesPanel({ container, store }) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  container.appendChild(panel);

  let rotationValue = 0;
  let lastSelectionKey = '';

  panel.addEventListener('change', (event) => {
    const target = event.target;

    if (target.id === 'style-stroke') updateSelectedStyles({ stroke: target.value });
    if (target.id === 'style-fill') updateSelectedStyles({ fill: target.value });
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

    if (target.id === 'selection-group') updateSelectedShapes({ groupId: `group-${Date.now()}` });
    if (target.id === 'selection-ungroup') updateSelectedShapes({ groupId: null });
  });

  panel.addEventListener('input', (event) => {
    const target = event.target;
    if (target.id !== 'selection-rotate-slider') return;

    const raw = Number.parseFloat(target.value);
    if (!Number.isFinite(raw)) return;
    const next = snapRotation(raw);
    target.value = String(next);

    const delta = next - rotationValue;
    if (Math.abs(delta) < 0.001) return;

    rotateSelectedShapes(delta);
    rotationValue = next;

    const indicator = panel.querySelector('#selection-rotate-value');
    if (indicator) indicator.textContent = `${Math.round(rotationValue)}°`;
  });

  const render = () => {
    const activeTool = store.appState.activeTool;
    const count = store.appState.selectedIds.length;
    const selected = firstSelectedShape(store);
    const selectedRooms = selectedRoomShapes(store);
    const allSelectedLocked = count > 0 && selectedShapes(store).every((shape) => shape.locked);
    const allSelectedRoomsFilled = selectedRooms.length > 0 && selectedRooms.every((shape) => shape.filled);
    const selectionKey = store.appState.selectedIds.join(',');
    if (selectionKey !== lastSelectionKey) {
      rotationValue = 0;
      lastSelectionKey = selectionKey;
    }

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
          </div>
          <label>Rotate <input id="selection-rotate-slider" type="range" min="-270" max="270" step="1" value="${rotationValue}" ${count ? '' : 'disabled'} /> <span id="selection-rotate-value">${Math.round(rotationValue)}°</span></label>
          <label class="property-toggle"><input id="shape-locked" type="checkbox" ${allSelectedLocked ? 'checked' : ''} ${count ? '' : 'disabled'} /> Lock</label>
          <label>Line color <input id="style-stroke" type="color" value="${strokeValue}" ${count ? '' : 'disabled'} /></label>
          <label>Fill color <input id="style-fill" type="color" value="${fillValue}" ${count ? '' : 'disabled'} /></label>
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${style.textSize ?? 14}" ${count ? '' : 'disabled'} /></label>
        </div>
      `;
    }

    if (activeTool === 'line') {
      body += `
        <div class="property-group">
          <h3>Line</h3>
          <label>Line color <input id="style-stroke" type="color" value="${strokeValue}" ${count ? '' : 'disabled'} /></label>
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          ${lineTypeOptions(selected)}
        </div>
      `;
    }

    if (activeTool === 'room') {
      body += `
        <div class="property-group">
          <h3>Room</h3>
          <label>Line color <input id="style-stroke" type="color" value="${strokeValue}" ${count ? '' : 'disabled'} /></label>
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          ${lineTypeOptions(selected)}
          <label class="property-toggle"><input id="room-auto-fill" type="checkbox" ${allSelectedRoomsFilled ? 'checked' : ''} ${selectedRooms.length ? '' : 'disabled'} /> Auto fill</label>
          <label>Fill color <input id="style-fill" type="color" value="${fillValue}" ${count ? '' : 'disabled'} /></label>
        </div>
      `;
    }

    if (activeTool === 'curve') {
      body += `
        <div class="property-group">
          <h3>Curve</h3>
          <label>Line color <input id="style-stroke" type="color" value="${strokeValue}" ${count ? '' : 'disabled'} /></label>
          <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
          ${lineTypeOptions(selected)}
        </div>
      `;
    }

    if (activeTool === 'label') {
      body += `
        <div class="property-group">
          <h3>Label</h3>
          <label>Font color <input id="style-fill" type="color" value="${fillValue}" ${count ? '' : 'disabled'} /></label>
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
          <label>Fill color <input id="style-fill" type="color" value="${fillValue}" ${count ? '' : 'disabled'} /></label>
          <label>Transparency <input id="style-fill-alpha" type="range" min="0" max="1" step="0.05" value="${fillAlpha}" ${count ? '' : 'disabled'} /></label>
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
