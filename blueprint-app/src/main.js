import { store } from './app/store.js';
import { bindPointerEvents } from './interaction/pointerEvents.js';
import { bindKeyboardEvents } from './interaction/keyboardEvents.js';
import { renderCanvas } from './canvas/renderer.js';
import { mountToolbar } from './ui/toolbar.js';
import { mountPropertiesPanel } from './ui/propertiesPanel.js';
import { mountLayersPanel } from './ui/layersPanel.js';
import { mountSettingsMenu, renderSettingsPage } from './ui/settingsMenu.js';
import { mountFileMenu, renderFilePage } from './ui/fileMenu.js';
import { getTool } from './tools/toolRegistry.js';

const canvas = document.getElementById('blueprint-canvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('cursor-preview');
const appMain = document.querySelector('.app-main');

const routeContainer = document.createElement('section');
routeContainer.className = 'route-page';
routeContainer.hidden = true;
appMain.insertAdjacentElement('afterend', routeContainer);

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
});

const settingsRefresh = mountSettingsMenu({
  container: document.getElementById('header-controls'),
});

const ephemeral = {
  preview: null,
  cursorScreen: null,
  cursorWorld: null,
};

bindPointerEvents({ canvas, store, ephemeral });
bindKeyboardEvents({ store });

function getRoute() {
  const route = window.location.hash.replace('#', '');
  if (!route || route === 'home') return 'home';
  if (route === 'file' || route === 'settings') return route;
  return 'home';
}

function renderRoutePage(route) {
  routeContainer.innerHTML = '';

  if (route === 'file') {
    renderFilePage({ container: routeContainer, store, canvas });
    return;
  }

  if (route === 'settings') {
    renderSettingsPage({ container: routeContainer, store, previewCanvas });
  }
}

function draw() {
  const route = getRoute();
  const showingHome = route === 'home';

  appMain.hidden = !showingHome;
  routeContainer.hidden = showingHome;

  if (showingHome) {
    const activeTool = getTool(store.appState.activeTool);
    renderCanvas({
      ctx,
      canvas,
      documentData: store.documentData,
      appState: store.appState,
      activeTool,
      interactionContext: { ctx, canvas, previewCanvas, store, ephemeral },
    });
  } else {
    renderRoutePage(route);
  }

  toolbarRefresh();
  propsRefresh();
  layersRefresh();
  fileRefresh();
  settingsRefresh();
}

window.addEventListener('hashchange', () => {
  draw();
});

store.subscribe(draw);
draw();
