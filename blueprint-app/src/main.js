import { performRedo, performUndo } from './app/actions.js';
import { store } from './app/store.js';
import { bindPointerEvents } from './interaction/pointerEvents.js';
import { bindKeyboardEvents } from './interaction/keyboardEvents.js';
import { renderCanvas } from './canvas/renderer.js';
import { mountToolbar } from './ui/toolbar.js';
import { mountPropertiesPanel } from './ui/propertiesPanel.js';
import { mountActionToast } from './ui/actionToast.js';
import { mountLayersPanel } from './ui/layersPanel.js';
import { renderSettingsPage } from './ui/settingsMenu.js';
import { renderFilePage } from './ui/fileMenu.js';
import { renderLibraryPage } from './ui/libraryPage.js';
import { getTool } from './tools/toolRegistry.js';

function mountTopNavigation({ container }) {
  const routes = [
    { label: 'Home', route: 'home' },
    { label: 'Settings', route: 'settings' },
    { label: 'File', route: 'file' },
    { label: 'Library', route: 'library' },
  ];

  const buttons = routes.map(({ label, route }) => {
    const button = document.createElement('button');
    button.className = 'menu-trigger';
    button.type = 'button';
    button.textContent = label;

    button.addEventListener('click', () => {
      window.location.hash = `#${route}`;
    });

    container.appendChild(button);
    return { route, button };
  });

  return (activeRoute) => {
    buttons.forEach(({ route, button }) => {
      button.setAttribute('aria-current', activeRoute === route ? 'page' : 'false');
    });
  };
}

const canvas = document.getElementById('blueprint-canvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('cursor-preview');
const appMain = document.querySelector('.app-main');
const canvasPanel = document.querySelector('.canvas-panel');
const appShell = document.querySelector('.app-shell');

const routeContainer = document.createElement('section');
routeContainer.className = 'route-page';
routeContainer.hidden = true;
appMain.insertAdjacentElement('afterend', routeContainer);

const toolbarRefresh = mountToolbar({
  container: document.getElementById('toolbar'),
  store,
});

const showActionToast = mountActionToast({
  container: canvasPanel,
  store,
});

const propsRefresh = mountPropertiesPanel({
  container: document.getElementById('properties-panel'),
  store,
  showActionToast,
});

const layersRefresh = mountLayersPanel({
  container: document.getElementById('layers-panel'),
  store,
  canvas,
});

const navRefresh = mountTopNavigation({
  container: document.getElementById('header-controls'),
});

const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');

undoButton?.addEventListener('click', () => {
  performUndo();
});

redoButton?.addEventListener('click', () => {
  performRedo();
});

const ephemeral = {
  preview: null,
  cursorScreen: null,
  cursorWorld: null,
  editingLabelId: null,
  editingLabelDirty: false,
};

function syncCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const nextWidth = Math.max(1, Math.round(rect.width));
  const nextHeight = Math.max(1, Math.round(rect.height));

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
}

bindPointerEvents({ canvas, store, ephemeral });
bindKeyboardEvents({ store, ephemeral });

function getRoute() {
  const route = window.location.hash.replace('#', '');
  if (!route || route === 'home') return 'home';
  if (route === 'file' || route === 'settings' || route === 'library') return route;
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
    return;
  }

  if (route === 'library') {
    renderLibraryPage({ container: routeContainer, store });
  }
}


function setPageVisibility({ showingHome }) {
  appMain.hidden = !showingHome;
  routeContainer.hidden = showingHome;
  appMain.style.display = showingHome ? 'grid' : 'none';
  routeContainer.style.display = showingHome ? 'none' : 'block';
  appShell.dataset.activeRoute = showingHome ? 'home' : 'route';
}

function draw() {
  const route = getRoute();
  const showingHome = route === 'home';

  setPageVisibility({ showingHome });

  if (showingHome) {
    syncCanvasSize();

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
  navRefresh(route);
}

window.addEventListener('hashchange', () => {
  draw();
});

window.addEventListener('resize', () => {
  if (getRoute() === 'home') {
    draw();
  }
});

store.subscribe(draw);

window.addEventListener('library-texture-loaded', () => {
  if (getRoute() === 'home') draw();
});

draw();
