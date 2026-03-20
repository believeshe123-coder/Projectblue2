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
const labelEditor = document.createElement('textarea');
labelEditor.className = 'canvas-label-editor';
labelEditor.setAttribute('aria-label', 'Edit label text');
labelEditor.rows = 1;
labelEditor.spellcheck = false;
labelEditor.hidden = true;
canvasPanel.appendChild(labelEditor);

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
  labelInputActive: false,
};

function findShapeById(documentData, id) {
  return documentData.shapes.find((shape) => shape.id === id);
}

function focusLabelEditor() {
  if (document.activeElement !== labelEditor) {
    labelEditor.focus({ preventScroll: true });
  }
  const end = labelEditor.value.length;
  labelEditor.setSelectionRange(end, end);
}

function hideLabelEditor() {
  labelEditor.hidden = true;
  labelEditor.value = '';
  ephemeral.labelInputActive = false;
}

function syncLabelEditor() {
  const labelId = ephemeral.editingLabelId;
  if (!labelId) {
    hideLabelEditor();
    return;
  }

  const shape = findShapeById(store.documentData, labelId);
  if (!shape || shape.type !== 'label') {
    hideLabelEditor();
    ephemeral.editingLabelId = null;
    ephemeral.editingLabelDirty = false;
    return;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;
  const textSize = shape.style.textSize || 14;
  const fontFamily = shape.style.fontFamily || 'Inter, Segoe UI, Tahoma, sans-serif';
  const paddingX = 4;
  const minWidth = 120;
  const width = Math.max(minWidth, (shape.text.length * (textSize * 0.58)) + (paddingX * 2));

  labelEditor.hidden = false;
  labelEditor.style.left = `${shape.x * scaleX}px`;
  labelEditor.style.top = `${(shape.y - textSize) * scaleY}px`;
  labelEditor.style.width = `${Math.max(48, width * scaleX)}px`;
  labelEditor.style.height = `${Math.max(28, (textSize + 10) * scaleY)}px`;
  labelEditor.style.fontSize = `${textSize * scaleY}px`;
  labelEditor.style.fontFamily = fontFamily;
  labelEditor.style.lineHeight = `${textSize * scaleY}px`;
  labelEditor.style.color = shape.style.fill || '#111827';
  labelEditor.style.padding = `${Math.max(2, 3 * scaleY)}px ${Math.max(2, paddingX * scaleX)}px`;

  if (labelEditor.value !== shape.text) {
    labelEditor.value = shape.text;
  }

  ephemeral.labelInputActive = document.activeElement === labelEditor;
  if (!ephemeral.labelInputActive) {
    focusLabelEditor();
    ephemeral.labelInputActive = true;
  }
}

labelEditor.addEventListener('input', () => {
  if (!ephemeral.editingLabelId) return;
  const shape = findShapeById(store.documentData, ephemeral.editingLabelId);
  if (!shape || shape.type !== 'label') return;
  shape.text = labelEditor.value;
  ephemeral.editingLabelDirty = true;
  store.notify();
});

labelEditor.addEventListener('keydown', (event) => {
  if (!ephemeral.editingLabelId) return;
  if (event.key === 'Enter' || event.key === 'Escape') {
    event.preventDefault();
    const activeTool = getTool(store.appState.activeTool);
    activeTool?.onKeyDown?.({ store, ephemeral }, event.key, event);
    store.notify();
    return;
  }

  event.stopPropagation();
});

labelEditor.addEventListener('blur', () => {
  ephemeral.labelInputActive = false;
});

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
    syncLabelEditor();
  } else {
    hideLabelEditor();
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
