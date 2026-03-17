import { store } from './store.js';
import { pushHistory, undo, redo } from './history.js';
import { snapToGrid } from '../interaction/snapUtils.js';
import { expandSelectionWithGroups } from '../interaction/selection.js';
import { generateId } from '../utils/idGenerator.js';
import { saveLibrary } from './libraryStore.js';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function selectedShapes() {
  const expandedIds = expandSelectionWithGroups(store.documentData, store.appState.selectedIds);
  const selected = new Set(expandedIds);
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

function centerFromBounds(shapes) {
  const points = [];
  for (const shape of shapes) {
    if (shape.start && shape.end) {
      points.push(shape.start, shape.end);
      if (shape.control) points.push(shape.control);
    }
    if (shape.points) points.push(...shape.points);
    if (shape.x != null && shape.y != null && shape.width != null && shape.height != null) {
      points.push({ x: shape.x, y: shape.y }, { x: shape.x + shape.width, y: shape.y + shape.height });
    } else if (shape.x != null && shape.y != null) {
      points.push({ x: shape.x, y: shape.y });
    }
  }

  if (!points.length) return centroid(shapes);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
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

function snapPoint(point) {
  const settings = store.documentData.settings;
  if (!settings?.snap) return point;
  return snapToGrid(point, store.documentData);
}


export function performUndo() {
  const snapshot = undo();
  if (!snapshot) return false;
  Object.assign(store.documentData, snapshot);
  store.notify();
  return true;
}

export function performRedo() {
  const snapshot = redo();
  if (!snapshot) return false;
  Object.assign(store.documentData, snapshot);
  store.notify();
  return true;
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
  const selectedIds = expandSelectionWithGroups(store.documentData, store.appState.selectedIds);
  const selected = new Set(selectedIds);
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

export function removeSelectedFill() {
  const shapes = selectedShapes().filter((shape) => shape.type === 'room' || shape.type === 'region');
  if (!shapes.length) return;

  for (const shape of shapes) {
    shape.filled = false;
  }

  pushDocumentHistory();
  store.notify();
}

export function updateSelectedShapes(partial) {
  const shapes = selectedShapes();
  if (!shapes.length) return false;

  for (const shape of shapes) {
    Object.assign(shape, partial);
  }

  pushDocumentHistory();
  store.notify();
  return true;
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
    if (shape.start) shape.start = snapPoint(rotatePoint(shape.start, center, radians));
    if (shape.end) shape.end = snapPoint(rotatePoint(shape.end, center, radians));
    if (shape.control) shape.control = snapPoint(rotatePoint(shape.control, center, radians));
    if (shape.points) shape.points = shape.points.map((point) => snapPoint(rotatePoint(point, center, radians)));
    if (shape.width != null && shape.height != null && shape.x != null && shape.y != null) {
      const roomCenter = {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };
      const nextCenter = snapPoint(rotatePoint(roomCenter, center, radians));
      shape.x = nextCenter.x - shape.width / 2;
      shape.y = nextCenter.y - shape.height / 2;
      shape.angle = (shape.angle ?? 0) + angleDeg;
    }
    if (shape.x != null && shape.y != null && shape.width == null && shape.height == null) {
      const next = snapPoint(rotatePoint({ x: shape.x, y: shape.y }, center, radians));
      shape.x = next.x;
      shape.y = next.y;
    }
  }

  pushDocumentHistory();
  store.notify();
}


export function unlockAllShapes() {
  const lockedShapes = store.documentData.shapes.filter((shape) => shape.locked);
  if (!lockedShapes.length) return;

  for (const shape of lockedShapes) {
    shape.locked = false;
  }

  pushDocumentHistory();
  store.notify();
}

export function setSelection(ids) {
  store.appState.selectedIds = expandSelectionWithGroups(store.documentData, ids);
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

function selectedEditableShapes() {
  const expandedIds = expandSelectionWithGroups(store.documentData, store.appState.selectedIds);
  const selected = new Set(expandedIds);
  return store.documentData.shapes.filter((shape) => selected.has(shape.id) && !shape.locked);
}

function flipPointHorizontally(point, axisX) {
  return { x: axisX * 2 - point.x, y: point.y };
}

function flipPointVertically(point, axisY) {
  return { x: point.x, y: axisY * 2 - point.y };
}

export function flipSelectedHorizontal() {
  const shapes = selectedEditableShapes();
  if (!shapes.length) return false;

  const center = centerFromBounds(shapes);
  const axisX = center.x;

  for (const shape of shapes) {
    if (shape.start) shape.start = flipPointHorizontally(shape.start, axisX);
    if (shape.end) shape.end = flipPointHorizontally(shape.end, axisX);
    if (shape.control) shape.control = flipPointHorizontally(shape.control, axisX);
    if (shape.points) shape.points = shape.points.map((point) => flipPointHorizontally(point, axisX));

    if (shape.width != null && shape.x != null) {
      shape.x = axisX * 2 - (shape.x + shape.width);
    } else if (shape.x != null) {
      shape.x = axisX * 2 - shape.x;
    }
  }

  pushDocumentHistory();
  store.notify();
  return true;
}

export function flipSelectedVertical() {
  const shapes = selectedEditableShapes();
  if (!shapes.length) return false;

  const center = centerFromBounds(shapes);
  const axisY = center.y;

  for (const shape of shapes) {
    if (shape.start) shape.start = flipPointVertically(shape.start, axisY);
    if (shape.end) shape.end = flipPointVertically(shape.end, axisY);
    if (shape.control) shape.control = flipPointVertically(shape.control, axisY);
    if (shape.points) shape.points = shape.points.map((point) => flipPointVertically(point, axisY));

    if (shape.height != null && shape.y != null) {
      shape.y = axisY * 2 - (shape.y + shape.height);
    } else if (shape.y != null) {
      shape.y = axisY * 2 - shape.y;
    }
  }

  pushDocumentHistory();
  store.notify();
  return true;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function projectPointToLineParameter(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return 0;
  return ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
}

function pointToLineDistance(point, start, end) {
  const t = clamp(projectPointToLineParameter(point, start, end), 0, 1);
  const px = start.x + (end.x - start.x) * t;
  const py = start.y + (end.y - start.y) * t;
  return Math.hypot(point.x - px, point.y - py);
}

function pointOnSegment(start, end, t) {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function cloneAsLineSegment(shape, start, end) {
  return {
    ...shape,
    id: generateId('shape'),
    start,
    end,
    style: { ...shape.style },
  };
}

export function eraseLinesAlongSegment(start, end) {
  const eraseLength = Math.hypot(end.x - start.x, end.y - start.y);
  if (eraseLength < 1) return 0;

  const nextShapes = [];
  let changed = false;
  const maxAngle = Math.cos((20 * Math.PI) / 180);

  for (const shape of store.documentData.shapes) {
    if (shape.type !== 'line' || shape.locked || !shape.visible) {
      nextShapes.push(shape);
      continue;
    }

    const lineDx = shape.end.x - shape.start.x;
    const lineDy = shape.end.y - shape.start.y;
    const lineLength = Math.hypot(lineDx, lineDy);
    if (lineLength < 1) {
      nextShapes.push(shape);
      continue;
    }

    const eraseDx = end.x - start.x;
    const eraseDy = end.y - start.y;
    const directionSimilarity = Math.abs((eraseDx * lineDx + eraseDy * lineDy) / (eraseLength * lineLength));
    if (directionSimilarity < maxAngle) {
      nextShapes.push(shape);
      continue;
    }

    const hitDistance = Math.max(6, (shape.style?.strokeWidth ?? 2) * 3);
    if (
      pointToLineDistance(start, shape.start, shape.end) > hitDistance
      || pointToLineDistance(end, shape.start, shape.end) > hitDistance
    ) {
      nextShapes.push(shape);
      continue;
    }

    const rawStart = projectPointToLineParameter(start, shape.start, shape.end);
    const rawEnd = projectPointToLineParameter(end, shape.start, shape.end);
    const brushPadding = hitDistance / lineLength;

    const cutStart = clamp(Math.min(rawStart, rawEnd) - brushPadding, 0, 1);
    const cutEnd = clamp(Math.max(rawStart, rawEnd) + brushPadding, 0, 1);

    if (cutEnd - cutStart < 0.001) {
      nextShapes.push(shape);
      continue;
    }

    const minSegment = 2 / lineLength;
    if (cutStart > minSegment) {
      nextShapes.push(cloneAsLineSegment(shape, shape.start, pointOnSegment(shape.start, shape.end, cutStart)));
    }

    if (1 - cutEnd > minSegment) {
      nextShapes.push(cloneAsLineSegment(shape, pointOnSegment(shape.start, shape.end, cutEnd), shape.end));
    }

    changed = true;
  }

  if (!changed) return 0;

  store.documentData.shapes = nextShapes;
  const existingIds = new Set(nextShapes.map((shape) => shape.id));
  store.appState.selectedIds = store.appState.selectedIds.filter((id) => existingIds.has(id));
  pushDocumentHistory();
  store.notify();
  return 1;
}


export function upsertLibraryShape(shapeTemplate) {
  const index = store.library.shapes.findIndex((entry) => entry.id === shapeTemplate.id);
  if (index >= 0) store.library.shapes[index] = shapeTemplate;
  else store.library.shapes.push(shapeTemplate);
  saveLibrary(store.library);
  store.notify();
}

export function upsertLibraryTexture(texture) {
  const index = store.library.textures.findIndex((entry) => entry.id === texture.id);
  if (index >= 0) store.library.textures[index] = texture;
  else store.library.textures.push(texture);
  saveLibrary(store.library);
  store.notify();
}
