import { screenToWorld } from './coordinateUtils.js';
import { snapToAxis, snapToGrid } from './snapUtils.js';
import { getTool } from '../tools/toolRegistry.js';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.1;

function eventPointFromCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function clampZoom(zoom) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function shouldPan(event) {
  return event.button === 1 || event.button === 2 || (event.button === 0 && event.shiftKey);
}

function applyDrawingSnap(world, store, activeTool) {
  if (activeTool?.id === 'select' || activeTool?.id === 'fill') return world;

  const { settings } = store.documentData;
  const { dragStart, isDragging } = store.appState;
  let point = world;

  if (settings.snap) {
    point = snapToGrid(point, store.documentData);
  }

  if (settings.axisSnap && isDragging && dragStart) {
    point = snapToAxis(point, dragStart);
  }

  return point;
}

export function bindPointerEvents({ canvas, store, ephemeral }) {
  let isPanning = false;
  let panStart = null;

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();

    const mouse = eventPointFromCanvas(canvas, event);
    const beforeZoom = screenToWorld(mouse, store.appState);
    const zoomFactor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    const nextZoom = clampZoom(store.appState.zoom * zoomFactor);

    store.appState.zoom = nextZoom;
    store.appState.panX = mouse.x - beforeZoom.x * nextZoom;
    store.appState.panY = mouse.y - beforeZoom.y * nextZoom;
    store.notify();
  }, { passive: false });

  canvas.addEventListener('pointerdown', (event) => {
    if (shouldPan(event)) {
      event.preventDefault();
      isPanning = true;
      panStart = {
        x: event.clientX,
        y: event.clientY,
        panX: store.appState.panX,
        panY: store.appState.panY,
      };
      return;
    }

    const activeTool = getTool(store.appState.activeTool);
    const screen = eventPointFromCanvas(canvas, event);
    const world = screenToWorld(screen, store.appState);
    const point = applyDrawingSnap(world, store, activeTool);

    activeTool?.onPointerDown?.({ canvas, ctx: canvas.getContext('2d'), store, ephemeral }, point, event);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (isPanning && panStart) {
      store.appState.panX = panStart.panX + (event.clientX - panStart.x);
      store.appState.panY = panStart.panY + (event.clientY - panStart.y);
      store.notify();
      return;
    }

    const activeTool = getTool(store.appState.activeTool);
    const screen = eventPointFromCanvas(canvas, event);
    const world = screenToWorld(screen, store.appState);
    const point = applyDrawingSnap(world, store, activeTool);

    ephemeral.cursorScreen = screen;
    ephemeral.cursorWorld = point;

    activeTool?.onPointerMove?.({ canvas, ctx: canvas.getContext('2d'), store, ephemeral }, point, event);
    store.notify();
  });

  canvas.addEventListener('pointerleave', () => {
    ephemeral.cursorScreen = null;
    ephemeral.cursorWorld = null;
    store.notify();
  });

  window.addEventListener('pointerup', (event) => {
    if (isPanning) {
      isPanning = false;
      panStart = null;
      return;
    }

    const activeTool = getTool(store.appState.activeTool);
    const screen = eventPointFromCanvas(canvas, event);
    const world = screenToWorld(screen, store.appState);
    const point = applyDrawingSnap(world, store, activeTool);

    activeTool?.onPointerUp?.({ canvas, ctx: canvas.getContext('2d'), store, ephemeral }, point, event);
  });
}
