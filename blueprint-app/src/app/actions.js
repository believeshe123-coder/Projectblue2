import { store } from './store.js';
import { pushHistory } from './history.js';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function selectedShapes() {
  const selected = new Set(store.appState.selectedIds);
  return store.documentData.shapes.filter((shape) => selected.has(shape.id));
}

function centroid(shapes) {
  if (!shapes.length) return { x: 0, y: 0 };

  const points = [];
  for (const shape of shapes) {
    if (shape.start && shape.end) {
      points.push(shape.start, shape.end);
      if (shape.control) points.push(shape.control);
      continue;
    }

    if (shape.points) {
      points.push(...shape.points);
      continue;
    }

    if (shape.x != null && shape.y != null && shape.width != null && shape.height != null) {
      points.push({ x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 });
      continue;
    }

    if (shape.x != null && shape.y != null) {
      points.push({ x: shape.x, y: shape.y });
    }
  }

  const total = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / Math.max(1, points.length), y: total.y / Math.max(1, points.length) };
}

function rotatePoint(point, center, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function setActiveTool(toolId) {
  store.appState.activeTool = toolId;
  store.notify();
}

export function pushDocumentHistory() {
  pushHistory(store.documentData);
}

export function addShape(shape) {
  store.documentData.shapes.push(shape);
  pushDocumentHistory();
  store.notify();
}

export function deleteSelectedShapes() {
  if (!store.appState.selectedIds.length) return;
  const selected = new Set(store.appState.selectedIds);
  store.documentData.shapes = store.documentData.shapes.filter((shape) => !selected.has(shape.id));
  store.appState.selectedIds = [];
  pushDocumentHistory();
  store.notify();
}

export function updateSelectedStyles(partialStyle) {
  const shapes = selectedShapes();
  if (!shapes.length) return;

  for (const shape of shapes) {
    shape.style = { ...shape.style, ...partialStyle };
  }

  pushDocumentHistory();
  store.notify();
}


export function updateSelectedRoomsFilled(filled) {
  const shapes = selectedShapes().filter((shape) => shape.type === 'room' || shape.type === 'region');
  if (!shapes.length) return;

  for (const shape of shapes) {
    shape.filled = Boolean(filled);
  }

  pushDocumentHistory();
  store.notify();
}

export function updateSelectedShapes(partial) {
  const shapes = selectedShapes();
  if (!shapes.length) return;

  for (const shape of shapes) {
    Object.assign(shape, partial);
  }

  pushDocumentHistory();
  store.notify();
}

export function setSelectedShapeType(nextType) {
  const shapes = selectedShapes();
  const allowed = new Set(['line', 'tape']);
  if (!allowed.has(nextType) || !shapes.length) return;

  let changed = false;
  for (const shape of shapes) {
    if (!allowed.has(shape.type) || shape.type === nextType) continue;
    shape.type = nextType;
    changed = true;
  }

  if (!changed) return;
  pushDocumentHistory();
  store.notify();
}

export function rotateSelectedShapes(angleDeg = 15) {
  const shapes = selectedShapes().filter((shape) => !shape.locked);
  if (!shapes.length) return;

  const center = centroid(shapes);
  const radians = (angleDeg * Math.PI) / 180;

  for (const shape of shapes) {
    if (shape.start) shape.start = rotatePoint(shape.start, center, radians);
    if (shape.end) shape.end = rotatePoint(shape.end, center, radians);
    if (shape.control) shape.control = rotatePoint(shape.control, center, radians);
    if (shape.points) shape.points = shape.points.map((point) => rotatePoint(point, center, radians));
    if (shape.x != null && shape.y != null && shape.width == null && shape.height == null) {
      const next = rotatePoint({ x: shape.x, y: shape.y }, center, radians);
      shape.x = next.x;
      shape.y = next.y;
    }
  }

  pushDocumentHistory();
  store.notify();
}

export function setSelection(ids) {
  store.appState.selectedIds = ids;
  store.notify();
}

export function patchState(partial) {
  Object.assign(store.appState, partial);
  store.notify();
}

export function setZoom(nextZoom) {
  store.appState.zoom = clampZoom(nextZoom);
  store.notify();
}

export function updateDocumentSettings(partial) {
  Object.assign(store.documentData.settings, partial);
  store.notify();
}
