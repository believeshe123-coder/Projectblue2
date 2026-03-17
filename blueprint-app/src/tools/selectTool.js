import { getShapeBehavior } from '../shapes/shapeRegistry.js';
import { findShapeAtPoint } from '../interaction/hitTest.js';
import {
  clearSelection,
  expandSelectionWithGroups,
  getSelectionBounds,
  selectOne,
  toggleSelection,
} from '../interaction/selection.js';
import { normalizeRect } from '../utils/geometry.js';
import { snapToAxis, snapToGrid } from '../interaction/snapUtils.js';
import { pushDocumentHistory } from '../app/actions.js';

const TRANSFORM_HANDLE_SIZE = 10;

function boundsIntersect(a, b) {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

function findShapeById(documentData, id) {
  return documentData.shapes.find((shape) => shape.id === id);
}

function finishLabelEditing(context) {
  if (!context.ephemeral.editingLabelId) return;
  if (context.ephemeral.editingLabelDirty) {
    pushDocumentHistory();
  }
  context.ephemeral.editingLabelId = null;
  context.ephemeral.editingLabelDirty = false;
}

function selectionCorners(bounds) {
  return [
    { x: bounds.x - 4, y: bounds.y - 4 },
    { x: bounds.x + bounds.width + 4, y: bounds.y - 4 },
    { x: bounds.x + bounds.width + 4, y: bounds.y + bounds.height + 4 },
    { x: bounds.x - 4, y: bounds.y + bounds.height + 4 },
  ];
}

function detectTransformHandle(bounds, point) {
  const corners = selectionCorners(bounds);
  return corners.findIndex((corner) => (
    Math.abs(point.x - corner.x) <= TRANSFORM_HANDLE_SIZE
    && Math.abs(point.y - corner.y) <= TRANSFORM_HANDLE_SIZE
  ));
}

function cloneShapeGeometry(shape) {
  return {
    start: shape.start ? { ...shape.start } : null,
    end: shape.end ? { ...shape.end } : null,
    control: shape.control ? { ...shape.control } : null,
    points: Array.isArray(shape.points) ? shape.points.map((point) => ({ ...point })) : null,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    angle: shape.angle,
  };
}

function captureTransformSnapshot(documentData, ids) {
  const selected = new Set(ids);
  const snapshot = {};
  for (const shape of documentData.shapes) {
    if (!selected.has(shape.id) || shape.locked) continue;
    snapshot[shape.id] = cloneShapeGeometry(shape);
  }
  return snapshot;
}

function bilinearMap(point, bounds, corners) {
  const w = Math.max(1, bounds.width + 8);
  const h = Math.max(1, bounds.height + 8);
  const u = (point.x - (bounds.x - 4)) / w;
  const v = (point.y - (bounds.y - 4)) / h;

  const tl = corners[0];
  const tr = corners[1];
  const br = corners[2];
  const bl = corners[3];

  return {
    x: tl.x * (1 - u) * (1 - v) + tr.x * u * (1 - v) + br.x * u * v + bl.x * (1 - u) * v,
    y: tl.y * (1 - u) * (1 - v) + tr.y * u * (1 - v) + br.y * u * v + bl.y * (1 - u) * v,
  };
}

function applyTransform(documentData, snapshot, bounds, corners) {
  for (const shape of documentData.shapes) {
    const original = snapshot[shape.id];
    if (!original) continue;

    if (original.start) shape.start = bilinearMap(original.start, bounds, corners);
    if (original.end) shape.end = bilinearMap(original.end, bounds, corners);
    if (original.control) shape.control = bilinearMap(original.control, bounds, corners);
    if (original.points) shape.points = original.points.map((point) => bilinearMap(point, bounds, corners));

    if (original.width != null && original.height != null && original.x != null && original.y != null) {
      const c1 = bilinearMap({ x: original.x, y: original.y }, bounds, corners);
      const c2 = bilinearMap({ x: original.x + original.width, y: original.y }, bounds, corners);
      const c3 = bilinearMap({ x: original.x + original.width, y: original.y + original.height }, bounds, corners);
      const c4 = bilinearMap({ x: original.x, y: original.y + original.height }, bounds, corners);
      const xs = [c1.x, c2.x, c3.x, c4.x];
      const ys = [c1.y, c2.y, c3.y, c4.y];
      shape.x = Math.min(...xs);
      shape.y = Math.min(...ys);
      shape.width = Math.max(...xs) - shape.x;
      shape.height = Math.max(...ys) - shape.y;
      shape.angle = 0;
    }

    if (original.width == null && original.height == null && original.x != null && original.y != null) {
      const mapped = bilinearMap({ x: original.x, y: original.y }, bounds, corners);
      shape.x = mapped.x;
      shape.y = mapped.y;
    }
  }
}

export const selectTool = {
  id: 'select',

  onPointerDown(context, point, event) {
    const { store, ephemeral } = context;

    if (store.appState.transformSelection) {
      const bounds = getSelectionBounds(store.documentData, store.appState);
      const handleIndex = bounds ? detectTransformHandle(bounds, point) : -1;
      if (handleIndex >= 0) {
        const ids = expandSelectionWithGroups(store.documentData, store.appState.selectedIds);
        ephemeral.selectionMode = 'transform';
        ephemeral.transformHandleIndex = handleIndex;
        ephemeral.transformBaseBounds = bounds;
        ephemeral.transformBaseCorners = selectionCorners(bounds);
        ephemeral.transformSnapshot = captureTransformSnapshot(store.documentData, ids);
        return;
      }
    }

    const hit = findShapeAtPoint(store.documentData, point);
    const multi = event?.ctrlKey || event?.metaKey;

    if (!hit || hit.type !== 'label' || multi) {
      finishLabelEditing(context);
    }

    if (hit && store.appState.selectedIds.includes(hit.id)) {
      ephemeral.selectionMode = 'move';
      ephemeral.moveStartPoint = point;
      ephemeral.moveLastPoint = point;
      ephemeral.moved = false;
      return;
    }

    if (!hit) {
      if (!multi) clearSelection(store.appState);
      ephemeral.selectionMode = 'box';
      ephemeral.selectionBox = { start: point, end: point };
    } else if (multi) {
      toggleSelection(store.appState, store.documentData, hit.id);
    } else {
      selectOne(store.appState, store.documentData, hit.id);
      ephemeral.selectionMode = 'move';
      ephemeral.moveStartPoint = point;
      ephemeral.moveLastPoint = point;
      ephemeral.moved = false;
    }

    store.notify();
  },

  onPointerMove(context, point, event) {
    const { store, ephemeral } = context;

    if (ephemeral.selectionMode === 'transform' && ephemeral.transformBaseBounds && ephemeral.transformBaseCorners) {
      let nextPoint = point;
      const { settings } = store.documentData;
      const snappingEnabled = !event?.ctrlKey && !event?.metaKey;
      if (snappingEnabled && settings.snap) {
        nextPoint = snapToGrid(nextPoint, store.documentData);
      }

      const corners = ephemeral.transformBaseCorners.map((corner) => ({ ...corner }));
      corners[ephemeral.transformHandleIndex] = nextPoint;

      applyTransform(store.documentData, ephemeral.transformSnapshot ?? {}, ephemeral.transformBaseBounds, corners);
      ephemeral.moved = true;
      store.notify();
      return;
    }

    if (ephemeral.selectionMode === 'move' && ephemeral.moveLastPoint) {
      let nextPoint = point;
      const { settings } = store.documentData;
      const snappingEnabled = !event?.ctrlKey && !event?.metaKey;

      if (snappingEnabled && settings.snap) {
        nextPoint = snapToGrid(nextPoint, store.documentData);
      }

      if (snappingEnabled && settings.axisSnap && ephemeral.moveStartPoint) {
        nextPoint = snapToAxis(nextPoint, ephemeral.moveStartPoint);
      }

      const dx = nextPoint.x - ephemeral.moveLastPoint.x;
      const dy = nextPoint.y - ephemeral.moveLastPoint.y;
      if (dx !== 0 || dy !== 0) {
        ephemeral.moved = true;
        const selected = new Set(store.appState.selectedIds);
        for (const shape of store.documentData.shapes) {
          if (!selected.has(shape.id) || shape.locked) continue;
          const behavior = getShapeBehavior(shape.type);
          behavior?.move?.(shape, dx, dy);
        }
        ephemeral.moveLastPoint = nextPoint;
        store.notify();
      }
      return;
    }

    if (ephemeral.selectionMode === 'box' && ephemeral.selectionBox) {
      ephemeral.selectionBox.end = point;
      const rect = normalizeRect(ephemeral.selectionBox.start, ephemeral.selectionBox.end);

      const ids = store.documentData.shapes
        .filter((shape) => {
          if (shape.locked) return false;
          const bounds = getShapeBehavior(shape.type)?.getBounds?.(shape);
          return bounds ? boundsIntersect(bounds, rect) : false;
        })
        .map((shape) => shape.id);

      store.appState.selectedIds = expandSelectionWithGroups(store.documentData, ids);
      store.notify();
    }
  },

  onPointerUp(context) {
    const { store, ephemeral } = context;
    if ((ephemeral.selectionMode === 'move' || ephemeral.selectionMode === 'transform') && ephemeral.moved) {
      pushDocumentHistory();
    }

    if (ephemeral.selectionMode === 'move' && !ephemeral.moved && store.appState.selectedIds.length === 1) {
      const selectedShape = findShapeById(store.documentData, store.appState.selectedIds[0]);
      if (selectedShape?.type === 'label') {
        ephemeral.editingLabelId = selectedShape.id;
        ephemeral.editingLabelDirty = false;
      }
    }

    ephemeral.selectionMode = null;
    ephemeral.selectionBox = null;
    ephemeral.moveStartPoint = null;
    ephemeral.moveLastPoint = null;
    ephemeral.transformHandleIndex = null;
    ephemeral.transformBaseBounds = null;
    ephemeral.transformBaseCorners = null;
    ephemeral.transformSnapshot = null;
    ephemeral.moved = false;
  },

  onKeyDown(context, key, event) {
    const { store, ephemeral } = context;
    const editingId = ephemeral.editingLabelId;
    if (!editingId) return;

    const label = findShapeById(store.documentData, editingId);
    if (!label || label.type !== 'label') {
      ephemeral.editingLabelId = null;
      ephemeral.editingLabelDirty = false;
      return;
    }

    if (event?.ctrlKey || event?.metaKey || event?.altKey) return;

    if (key === 'Enter') {
      finishLabelEditing(context);
      store.notify();
      return;
    }

    if (key === 'Escape') {
      finishLabelEditing(context);
      store.notify();
      return;
    }

    if (key === 'Backspace') {
      label.text = label.text.slice(0, -1);
      ephemeral.editingLabelDirty = true;
      store.notify();
      return;
    }

    if (key.length === 1) {
      label.text = `${label.text}${key}`;
      ephemeral.editingLabelDirty = true;
      store.notify();
    }
  },

  drawOverlay(context) {
    const { ephemeral, ctx } = context;
    if (!ephemeral.selectionBox) return;

    const rect = normalizeRect(ephemeral.selectionBox.start, ephemeral.selectionBox.end);
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
    ctx.setLineDash([4, 4]);
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  },
};
