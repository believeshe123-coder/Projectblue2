import { store } from './app/store.js';
import { bindPointerEvents } from './interaction/pointerEvents.js';
import { bindKeyboardEvents } from './interaction/keyboardEvents.js';
import { renderCanvas } from './canvas/renderer.js';
import { mountToolbar } from './ui/toolbar.js';
import { mountPropertiesPanel } from './ui/propertiesPanel.js';
import { mountLayersPanel } from './ui/layersPanel.js';
import { getTool } from './tools/toolRegistry.js';

const canvas = document.getElementById('blueprint-canvas');
const ctx = canvas.getContext('2d');

const toolbarRefresh = mountToolbar({
  container: document.getElementById('toolbar'),
  store,
  canvas,
});

const propsRefresh = mountPropertiesPanel({
  container: document.getElementById('properties-panel'),
  store,
  canvas,
});

const layersRefresh = mountLayersPanel({
  container: document.getElementById('layers-panel'),
  store,
  canvas,
});

const ephemeral = {
  preview: null,
};

bindPointerEvents({ canvas, store, ephemeral });
bindKeyboardEvents({ store });

function draw() {
  const activeTool = getTool(store.appState.activeTool);
  renderCanvas({
    ctx,
    canvas,
    documentData: store.documentData,
    appState: store.appState,
    activeTool,
    interactionContext: { ctx, canvas, store, ephemeral },
  });

  toolbarRefresh();
  propsRefresh();
  layersRefresh();
}

store.subscribe(draw);
draw();
