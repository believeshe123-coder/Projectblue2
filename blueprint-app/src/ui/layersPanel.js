import {
  addLayer,
  commitLayerOpacity,
  deleteLayer,
  mergeLayerWithLower,
  moveLayerDown,
  moveLayerUp,
  renameLayer,
  setActiveLayer,
  setLayerOpacityPreview,
  toggleLayerLock,
  toggleLayerVisibility,
} from '../app/actions.js';

export function mountLayersPanel({ container, store, mode = 'main' }) {
  const isManageMode = mode === 'manage';
  const panel = document.createElement('div');
  panel.className = 'panel layers-panel';
  container.appendChild(panel);

  function countShapesOnLayer(layerId) {
    return store.documentData.shapes.filter((shape) => shape.layerId === layerId).length;
  }

  const render = () => {
    panel.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Layers';
    panel.appendChild(heading);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.textContent = 'Add Layer';
    addButton.addEventListener('click', () => {
      const suggested = `Layer ${store.documentData.layers.length + 1}`;
      const enteredName = window.prompt('New layer name', suggested);
      if (enteredName == null) return;
      addLayer(String(enteredName).trim() || suggested);
    });
    panel.appendChild(addButton);

    const list = document.createElement('ul');
    list.className = 'layers-list';
    const layers = store.documentData.layers;
    const activeLayerId = store.appState.activeLayerId;
    const layersFromTopToBottom = [...layers].reverse();
    const layerIndices = new Map(layers.map((layer, index) => [layer.id, index]));

    layersFromTopToBottom.forEach((layer) => {
      const layerIndex = layerIndices.get(layer.id);
      const isTop = layerIndex === layers.length - 1;
      const isBottom = layerIndex === 0;
      const isActive = layer.id === activeLayerId;
      const shapeCount = countShapesOnLayer(layer.id);

      const item = document.createElement('li');
      item.className = 'layers-item';
      item.style.border = isActive ? '1px solid #0f4c81' : '1px solid #d1d5db';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-current', isActive ? 'true' : 'false');
      item.addEventListener('click', () => setActiveLayer(layer.id));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setActiveLayer(layer.id);
        }
      });

      const row = document.createElement('div');
      row.className = 'layers-item-row';

      const label = document.createElement('strong');
      label.className = 'layers-item-label';
      label.textContent = `${isActive ? '● ' : ''}${layer.locked ? '🔒 ' : ''}${layer.name}`;
      label.title = layer.name;
      row.appendChild(label);

      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'layers-item-buttons';

      const upButton = document.createElement('button');
      upButton.type = 'button';
      upButton.textContent = '↑';
      upButton.title = isTop ? 'Already top layer' : 'Move layer up';
      upButton.disabled = isTop;
      upButton.addEventListener('click', (event) => {
        event.stopPropagation();
        moveLayerUp(layer.id);
      });

      const downButton = document.createElement('button');
      downButton.type = 'button';
      downButton.textContent = '↓';
      downButton.title = isBottom ? 'Already bottom layer' : 'Move layer down';
      downButton.disabled = isBottom;
      downButton.addEventListener('click', (event) => {
        event.stopPropagation();
        moveLayerDown(layer.id);
      });

      const visibilityButton = document.createElement('button');
      visibilityButton.type = 'button';
      visibilityButton.textContent = layer.visible === false ? 'Show' : 'Hide';
      visibilityButton.title = layer.visible === false ? 'Show layer' : 'Hide layer';
      visibilityButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleLayerVisibility(layer.id);
      });

      const lockButton = document.createElement('button');
      lockButton.type = 'button';
      lockButton.textContent = layer.locked ? 'Unlock' : 'Lock';
      lockButton.title = layer.locked ? 'Unlock layer' : 'Lock layer';
      lockButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleLayerLock(layer.id);
      });

      buttonGroup.append(upButton, downButton, visibilityButton, lockButton);

      if (isManageMode) {
        const renameButton = document.createElement('button');
        renameButton.type = 'button';
        renameButton.textContent = 'Rename';
        renameButton.title = 'Rename layer';
        renameButton.addEventListener('click', (event) => {
          event.stopPropagation();
          const nextName = window.prompt('Layer name', layer.name);
          if (nextName == null) return;
          renameLayer(layer.id, nextName);
        });

        const mergeButton = document.createElement('button');
        mergeButton.type = 'button';
        mergeButton.textContent = 'Merge ↓';
        mergeButton.title = isBottom ? 'No lower layer to merge into' : 'Merge this layer into lower layer';
        mergeButton.disabled = isBottom;
        mergeButton.addEventListener('click', (event) => {
          event.stopPropagation();
          mergeLayerWithLower(layer.id);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.disabled = layers.length <= 1;
        deleteButton.title = layers.length <= 1 ? 'At least one layer is required' : 'Delete layer';
        deleteButton.addEventListener('click', (event) => {
          event.stopPropagation();
          if (layers.length <= 1) return;
          if (shapeCount > 0) {
            const confirmed = window.confirm(`Delete "${layer.name}" and permanently delete ${shapeCount} shape(s) on this layer?`);
            if (!confirmed) return;
          }
          deleteLayer(layer.id);
        });

        buttonGroup.append(renameButton, mergeButton, deleteButton);
      }
      row.appendChild(buttonGroup);
      item.appendChild(row);

      const opacityRow = document.createElement('label');
      opacityRow.className = 'layers-opacity-row';
      opacityRow.textContent = 'Opacity';

      const opacityInput = document.createElement('input');
      opacityInput.type = 'range';
      opacityInput.min = '0';
      opacityInput.max = '100';
      opacityInput.step = '1';
      opacityInput.value = String(Math.round((Number(layer.opacity) || 0) * 100));
      opacityInput.addEventListener('click', (event) => event.stopPropagation());
      opacityInput.addEventListener('input', (event) => {
        event.stopPropagation();
        const percent = Number(event.target.value);
        setLayerOpacityPreview(layer.id, percent / 100);
      });
      opacityInput.addEventListener('change', (event) => {
        event.stopPropagation();
        const percent = Number(event.target.value);
        commitLayerOpacity(layer.id, percent / 100);
      });

      const opacityValue = document.createElement('span');
      opacityValue.className = 'layers-opacity-value';
      opacityValue.textContent = `${opacityInput.value}%`;
      opacityInput.addEventListener('input', () => {
        opacityValue.textContent = `${opacityInput.value}%`;
      });

      opacityRow.append(opacityInput, opacityValue);
      item.appendChild(opacityRow);

      const meta = document.createElement('small');
      meta.className = 'layers-item-meta';
      meta.textContent = `${shapeCount} shape${shapeCount === 1 ? '' : 's'}`;
      item.appendChild(meta);

      list.appendChild(item);
    });

    panel.appendChild(list);
  };

  render();
  return render;
}
