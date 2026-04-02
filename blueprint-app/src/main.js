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
import { getTool } from './tools/toolRegistry.js';

const LAYOUT_STORAGE_KEY = 'blueprint-editor-layout';

function readLayoutState() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      leftCollapsed: Boolean(parsed.leftCollapsed),
      rightCollapsed: Boolean(parsed.rightCollapsed),
      fullCanvas: Boolean(parsed.fullCanvas),
      preset: typeof parsed.preset === 'string' ? parsed.preset : 'edit',
    };
  } catch {
    return null;
  }
}

function writeLayoutState(state) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
}

function mountTopNavigation({ container }) {
  const routes = [
    { label: 'Home', route: 'home' },
    { label: 'Settings', route: 'settings' },
    { label: 'File', route: 'file' },
    { label: 'Layers', route: 'layers' },
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

function mountLayoutMenu({ container, layoutState, onApplyState, showActionToast }) {
  const menu = document.createElement('div');
  menu.className = 'layout-menu';

  const presetSelect = document.createElement('select');
  presetSelect.className = 'layout-select';
  presetSelect.setAttribute('aria-label', 'Layout preset');
  [
    { value: 'draw', label: 'Draw' },
    { value: 'edit', label: 'Edit' },
    { value: 'review', label: 'Review' },
  ].forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    presetSelect.appendChild(option);
  });

  const fullCanvasButton = document.createElement('button');
  fullCanvasButton.className = 'layout-button';
  fullCanvasButton.type = 'button';
  fullCanvasButton.textContent = 'Full Canvas';

  const historyControls = document.createElement('div');
  historyControls.className = 'history-controls';
  historyControls.setAttribute('aria-label', 'History controls');

  const undoButton = document.createElement('button');
  undoButton.className = 'layout-button';
  undoButton.id = 'undo-button';
  undoButton.type = 'button';
  undoButton.textContent = 'Undo';

  const redoButton = document.createElement('button');
  redoButton.className = 'layout-button';
  redoButton.id = 'redo-button';
  redoButton.type = 'button';
  redoButton.textContent = 'Redo';

  historyControls.append(undoButton, redoButton);

  const applyPreset = (preset) => {
    layoutState.preset = preset;
    if (preset === 'draw') {
      layoutState.leftCollapsed = false;
      layoutState.rightCollapsed = true;
      layoutState.fullCanvas = false;
    } else if (preset === 'edit') {
      layoutState.leftCollapsed = false;
      layoutState.rightCollapsed = false;
      layoutState.fullCanvas = false;
    } else {
      layoutState.leftCollapsed = true;
      layoutState.rightCollapsed = true;
      layoutState.fullCanvas = true;
    }
    onApplyState();
  };

  presetSelect.addEventListener('change', () => {
    applyPreset(presetSelect.value);
  });

  fullCanvasButton.addEventListener('click', () => {
    layoutState.fullCanvas = !layoutState.fullCanvas;
    if (layoutState.fullCanvas) {
      layoutState.preset = 'review';
      showActionToast?.('Full canvas mode enabled. Press Esc to exit.');
    }
    onApplyState();
  });

  menu.appendChild(presetSelect);
  menu.appendChild(fullCanvasButton);
  menu.appendChild(historyControls);
  container.appendChild(menu);

  return () => {
    presetSelect.value = layoutState.preset;
    fullCanvasButton.textContent = layoutState.fullCanvas ? 'Exit Full Canvas' : 'Full Canvas';
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
  mode: 'main',
});

const navRefresh = mountTopNavigation({
  container: document.getElementById('header-controls'),
});

const layoutState = readLayoutState() ?? {
  leftCollapsed: false,
  rightCollapsed: false,
  fullCanvas: false,
  preset: 'edit',
};

function applyLayoutState() {
  appShell.dataset.leftCollapsed = layoutState.leftCollapsed ? 'true' : 'false';
  appShell.dataset.rightCollapsed = layoutState.rightCollapsed ? 'true' : 'false';
  appShell.dataset.fullCanvas = layoutState.fullCanvas ? 'true' : 'false';
  writeLayoutState(layoutState);
}

const layoutRefresh = mountLayoutMenu({
  container: document.getElementById('header-controls'),
  layoutState,
  onApplyState: () => {
    applyLayoutState();
    draw();
  },
  showActionToast,
});

document.getElementById('left-sidebar-toggle')?.addEventListener('click', () => {
  layoutState.leftCollapsed = !layoutState.leftCollapsed;
  if (!layoutState.leftCollapsed && !layoutState.rightCollapsed) {
    layoutState.preset = 'edit';
  }
  applyLayoutState();
  draw();
});

document.getElementById('right-sidebar-toggle')?.addEventListener('click', () => {
  layoutState.rightCollapsed = !layoutState.rightCollapsed;
  if (!layoutState.leftCollapsed && !layoutState.rightCollapsed) {
    layoutState.preset = 'edit';
  }
  applyLayoutState();
  draw();
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

window.addEventListener('keydown', (event) => {
  if (event.key === '[') {
    event.preventDefault();
    layoutState.leftCollapsed = !layoutState.leftCollapsed;
    applyLayoutState();
    draw();
    return;
  }

  if (event.key === ']') {
    event.preventDefault();
    layoutState.rightCollapsed = !layoutState.rightCollapsed;
    applyLayoutState();
    draw();
    return;
  }

  if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    layoutState.fullCanvas = !layoutState.fullCanvas;
    if (layoutState.fullCanvas) {
      layoutState.preset = 'review';
      showActionToast('Full canvas mode enabled. Press Esc to exit.');
    }
    applyLayoutState();
    draw();
    return;
  }

  if (event.key === 'Escape' && layoutState.fullCanvas) {
    layoutState.fullCanvas = false;
    if (layoutState.leftCollapsed && layoutState.rightCollapsed) {
      layoutState.preset = 'draw';
      layoutState.leftCollapsed = false;
      layoutState.rightCollapsed = true;
    }
    applyLayoutState();
    draw();
  }
});

function getRoute() {
  const route = window.location.hash.replace('#', '');
  if (!route || route === 'home') return 'home';
  if (route === 'file' || route === 'settings' || route === 'layers') return route;
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

  if (route === 'layers') {
    const refreshLayersPage = mountLayersPanel({ container: routeContainer, store, mode: 'manage' });
    refreshLayersPage();
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
  layoutRefresh();
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

applyLayoutState();
draw();
