import { setZoom, updateSelectedStyles } from '../app/actions.js';

function firstSelectedShape(store) {
  const id = store.appState.selectedIds[0];
  return store.documentData.shapes.find((shape) => shape.id === id);
}

export function mountPropertiesPanel({ container, store }) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  container.appendChild(panel);

  panel.addEventListener('click', (event) => {
    const action = event.target?.dataset?.action;
    if (!action) return;

    if (action === 'zoom-in') setZoom(store.appState.zoom * 1.1);
    if (action === 'zoom-out') setZoom(store.appState.zoom / 1.1);
    if (action === 'zoom-reset') setZoom(1);
  });

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
    const style = selected?.style ?? { stroke: '#1f2937', fill: '#0f4c81', strokeWidth: 2, textSize: 14 };

    panel.innerHTML = `
      <h2>Properties</h2>
      <p>${count ? `${count} shape(s) selected.` : 'Select a shape to edit properties.'}</p>

      <div class="property-group">
        <h3>Canvas</h3>
        <div class="button-row">
          <button data-action="zoom-out" type="button">Zoom Out</button>
          <button data-action="zoom-in" type="button">Zoom In</button>
          <button data-action="zoom-reset" type="button">Reset</button>
        </div>
        <small>Zoom: ${(store.appState.zoom * 100).toFixed(0)}% • Pan with Shift+drag, right-drag, or middle-drag.</small>
      </div>

      <div class="property-group">
        <h3>Style</h3>
        <label>Line color <input id="style-stroke" type="color" value="${style.stroke}" ${count ? '' : 'disabled'} /></label>
        <label>Fill color <input id="style-fill" type="color" value="${style.fill?.startsWith('#') ? style.fill : '#0f4c81'}" ${count ? '' : 'disabled'} /></label>
        <label>Line thickness <input id="style-stroke-width" type="number" min="1" step="1" value="${style.strokeWidth ?? 2}" ${count ? '' : 'disabled'} /></label>
        <label>Text size <input id="style-text-size" type="number" min="8" step="1" value="${style.textSize ?? 14}" ${count ? '' : 'disabled'} /></label>
      </div>
    `;
  };

  render();
  return render;
}
