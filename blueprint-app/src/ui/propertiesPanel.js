import { updateSelectedStyles } from '../app/actions.js';

const FALLBACK_STROKE = '#1f2937';
const FALLBACK_FILL = '#0f4c81';

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

export function mountPropertiesPanel({ container, store }) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  container.appendChild(panel);

  panel.addEventListener('change', (event) => {
    const target = event.target;

    if (target.id === 'style-stroke') updateSelectedStyles({ stroke: target.value });
    if (target.id === 'style-fill') updateSelectedStyles({ fill: target.value });
    if (target.id === 'style-stroke-width') {
      const width = Number.parseFloat(target.value);
      if (Number.isFinite(width)) updateSelectedStyles({ strokeWidth: Math.max(1, width) });
    }
    if (target.id === 'style-text-size') {
      const size = Number.parseFloat(target.value);
      if (Number.isFinite(size)) updateSelectedStyles({ textSize: Math.max(8, size) });
    }
  });

  const render = () => {
    const count = store.appState.selectedIds.length;
    const selected = firstSelectedShape(store);
    const style = selected?.style ?? { stroke: FALLBACK_STROKE, fill: FALLBACK_FILL, strokeWidth: 2, textSize: 14 };
    const strokeValue = toColorInputValue(style.stroke, FALLBACK_STROKE);
    const fillValue = toColorInputValue(style.fill, FALLBACK_FILL);

    panel.innerHTML = `
      <h2>Properties</h2>
      <p>${count ? `${count} shape(s) selected.` : 'Select a shape to edit properties.'}</p>

      <div class="property-group">
        <h3>Style</h3>
        <label>Line color <input id="style-stroke" type="color" value="${strokeValue}" ${count ? '' : 'disabled'} /></label>
        <label>Fill color <input id="style-fill" type="color" value="${fillValue}" ${count ? '' : 'disabled'} /></label>
        <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
        <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${style.textSize ?? 14}" ${count ? '' : 'disabled'} /></label>
      </div>
    `;
  };

  render();
  return render;
}
