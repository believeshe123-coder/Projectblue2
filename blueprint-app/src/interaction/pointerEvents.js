import { screenToWorld } from './coordinateUtils.js';
import { findNearestSnapPoint, snapToAngle, snapToAxis, snapToGrid } from './snapUtils.js';
import { getTool } from '../tools/toolRegistry.js';

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.1;
const LAYER_DRAW_TOOL_IDS = new Set(['pen', 'line', 'room', 'curve', 'label', 'tape', 'place-shape']);

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

function isActiveLayerLocked(store) {
  const activeLayerId = store.appState.activeLayerId;
  if (!activeLayerId) return false;
  return store.documentData.layers.some((layer) => layer.id === activeLayerId && layer.locked === true);
}

export function resolveAnchorPoint(store, ephemeral) {
  const preview = ephemeral?.preview;
  if (preview?.type === 'tape' && preview.mode === 'offset' && preview.phase === 'set-offset') {
    return preview.end ?? preview.start ?? null;
  }

  if (preview?.type === 'line' || preview?.type === 'tape' || preview?.type === 'room' || preview?.type === 'curve') {
    return preview.start ?? null;
  }

  return store.appState.dragStart;
}

function applyDrawingSnap(world, store, activeTool, event, ephemeral) {
  if (activeTool?.id === 'select' || activeTool?.id === 'fill') return world;

  const { settings } = store.documentData;
  const { isDragging } = store.appState;
  const dragStart = resolveAnchorPoint(store, ephemeral);
  let point = world;

  const shouldGridSnap = activeTool?.id === 'erase' || (settings.snap && activeTool?.id !== 'pen');
  if (shouldGridSnap) {
    point = snapToGrid(point, store.documentData);
  }

  const shouldObjectSnap = settings.objectSnap !== false && activeTool?.id !== 'erase';
  if (shouldObjectSnap) {
    const objectSnapTolerance = Number(settings.objectSnapTolerance) || 12;
    const nearestPoint = findNearestSnapPoint(point, store.documentData.shapes, objectSnapTolerance);
    if (nearestPoint) {
      point = nearestPoint;
    }
  }

  const shouldAxisSnap = (settings.axisSnap || event?.shiftKey) && activeTool?.id !== 'pen' && activeTool?.id !== 'erase';
  if (shouldAxisSnap && isDragging && dragStart) {
    point = snapToAxis(point, dragStart);
  }

  const shouldAngleSnap = settings.angleSnap === true && activeTool?.id !== 'pen' && activeTool?.id !== 'erase';
  if (shouldAngleSnap && isDragging && dragStart) {
    const angleStep = Number(settings.angleSnapIncrement) || 15;
    point = snapToAngle(point, dragStart, angleStep);
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
    if (LAYER_DRAW_TOOL_IDS.has(activeTool?.id) && isActiveLayerLocked(store)) {
      return;
    }
    const screen = eventPointFromCanvas(canvas, event);
    const world = screenToWorld(screen, store.appState);
    const point = applyDrawingSnap(world, store, activeTool, event, ephemeral);

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
    const point = applyDrawingSnap(world, store, activeTool, event, ephemeral);

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
    const point = applyDrawingSnap(world, store, activeTool, event, ephemeral);

    activeTool?.onPointerUp?.({ canvas, ctx: canvas.getContext('2d'), store, ephemeral }, point, event);
  });
}
