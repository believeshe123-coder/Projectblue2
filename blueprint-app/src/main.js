import { store } from './app/store.js';
import { bindPointerEvents } from './interaction/pointerEvents.js';
import { bindKeyboardEvents } from './interaction/keyboardEvents.js';
import { renderCanvas } from './canvas/renderer.js';
import { mountToolbar } from './ui/toolbar.js';
import { mountPropertiesPanel } from './ui/propertiesPanel.js';
import { mountLayersPanel } from './ui/layersPanel.js';
import { mountSettingsMenu } from './ui/settingsMenu.js';
import { mountFileMenu } from './ui/fileMenu.js';
import { getTool } from './tools/toolRegistry.js';

const canvas = document.getElementById('blueprint-canvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('cursor-preview');

const toolbarRefresh = mountToolbar({
  container: document.getElementById('toolbar'),
  store,
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


const fileRefresh = mountFileMenu({
  container: document.getElementById('header-controls'),
  store,
  canvas,
});

const settingsRefresh = mountSettingsMenu({
  container: document.getElementById('header-controls'),
  store,
  previewCanvas,
});

const ephemeral = {
  preview: null,
  cursorScreen: null,
  cursorWorld: null,
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
    interactionContext: { ctx, canvas, previewCanvas, store, ephemeral },
  });

  toolbarRefresh();
  propsRefresh();
  layersRefresh();
  fileRefresh();
  settingsRefresh();
}

store.subscribe(draw);
draw();
