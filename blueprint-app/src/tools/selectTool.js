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
import { resolveActiveLayerId } from '../document/layerModel.js';

const TRANSFORM_HANDLE_SIZE = 10;
const SELECTION_PADDING = 4;
const MIN_TRANSFORM_SIZE = 8;
const ROTATE_CIRCLE_PADDING = 28;
const ROTATE_HANDLE_RADIUS = 8;
const ROTATE_SNAP_THRESHOLD = 4;

function boundsIntersect(a, b) {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

function findShapeById(documentData, id) {
  return documentData.shapes.find((shape) => shape.id === id);
}

function isShapeOnActiveLayer(activeLayerId, shape) {
  const shapeLayerId = shape?.layerId ?? activeLayerId;
  return shapeLayerId === activeLayerId;
}

function finishLabelEditing(context) {
  if (!context.ephemeral.editingLabelId) return;
  if (context.ephemeral.editingLabelDirty) {
    pushDocumentHistory();
  }
  context.ephemeral.editingLabelId = null;
  context.ephemeral.editingLabelDirty = false;
}

function selectionRect(bounds) {
  return {
    x: bounds.x - SELECTION_PADDING,
    y: bounds.y - SELECTION_PADDING,
    width: bounds.width + (SELECTION_PADDING * 2),
    height: bounds.height + (SELECTION_PADDING * 2),
  };
}

function transformHandles(bounds) {
  const rect = selectionRect(bounds);
  return [
    { type: 'left', x: rect.x, y: rect.y + rect.height / 2 },
    { type: 'right', x: rect.x + rect.width, y: rect.y + rect.height / 2 },
    { type: 'top', x: rect.x + rect.width / 2, y: rect.y },
    { type: 'bottom', x: rect.x + rect.width / 2, y: rect.y + rect.height },
  ];
}

function detectTransformHandle(bounds, point) {
  const handles = transformHandles(bounds);
  return handles.find((handle) => (
    Math.abs(point.x - handle.x) <= TRANSFORM_HANDLE_SIZE
    && Math.abs(point.y - handle.y) <= TRANSFORM_HANDLE_SIZE
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

function mapPointByBounds(point, fromBounds, toBounds) {
  const mapped = { ...point };

  if (fromBounds.width > 0.001) {
    const rx = (point.x - fromBounds.x) / fromBounds.width;
    mapped.x = toBounds.x + (rx * toBounds.width);
  } else {
    mapped.x = point.x + (toBounds.x - fromBounds.x);
  }

  if (fromBounds.height > 0.001) {
    const ry = (point.y - fromBounds.y) / fromBounds.height;
    mapped.y = toBounds.y + (ry * toBounds.height);
  } else {
    mapped.y = point.y + (toBounds.y - fromBounds.y);
  }

  return mapped;
}

function boundsFromHandleDrag(baseBounds, handleType, point) {
  const baseRight = baseBounds.x + baseBounds.width;
  const baseBottom = baseBounds.y + baseBounds.height;
  const next = { ...baseBounds };

  if (handleType === 'left') {
    const nextLeft = Math.min(point.x, baseRight - MIN_TRANSFORM_SIZE);
    next.x = nextLeft;
    next.width = baseRight - nextLeft;
  }

  if (handleType === 'right') {
    const nextRight = Math.max(point.x, baseBounds.x + MIN_TRANSFORM_SIZE);
    next.width = nextRight - baseBounds.x;
  }

  if (handleType === 'top') {
    const nextTop = Math.min(point.y, baseBottom - MIN_TRANSFORM_SIZE);
    next.y = nextTop;
    next.height = baseBottom - nextTop;
  }

  if (handleType === 'bottom') {
    const nextBottom = Math.max(point.y, baseBounds.y + MIN_TRANSFORM_SIZE);
    next.height = nextBottom - baseBounds.y;
  }

  return next;
}

function applyTransform(documentData, snapshot, fromBounds, toBounds) {
  for (const shape of documentData.shapes) {
    const original = snapshot[shape.id];
    if (!original) continue;

    if (original.start) shape.start = mapPointByBounds(original.start, fromBounds, toBounds);
    if (original.end) shape.end = mapPointByBounds(original.end, fromBounds, toBounds);
    if (original.control) shape.control = mapPointByBounds(original.control, fromBounds, toBounds);
    if (original.points) shape.points = original.points.map((point) => mapPointByBounds(point, fromBounds, toBounds));

    if (original.width != null && original.height != null && original.x != null && original.y != null) {
      const c1 = mapPointByBounds({ x: original.x, y: original.y }, fromBounds, toBounds);
      const c2 = mapPointByBounds({ x: original.x + original.width, y: original.y }, fromBounds, toBounds);
      const c3 = mapPointByBounds({ x: original.x + original.width, y: original.y + original.height }, fromBounds, toBounds);
      const c4 = mapPointByBounds({ x: original.x, y: original.y + original.height }, fromBounds, toBounds);
      const xs = [c1.x, c2.x, c3.x, c4.x];
      const ys = [c1.y, c2.y, c3.y, c4.y];
      shape.x = Math.min(...xs);
      shape.y = Math.min(...ys);
      shape.width = Math.max(...xs) - shape.x;
      shape.height = Math.max(...ys) - shape.y;
      shape.angle = 0;
    }

    if (original.width == null && original.height == null && original.x != null && original.y != null) {
      const mapped = mapPointByBounds({ x: original.x, y: original.y }, fromBounds, toBounds);
      shape.x = mapped.x;
      shape.y = mapped.y;
    }
  }
}

function applyTranslation(documentData, snapshot, dx, dy) {
  for (const shape of documentData.shapes) {
    const original = snapshot[shape.id];
    if (!original) continue;

    if (original.start) shape.start = { x: original.start.x + dx, y: original.start.y + dy };
    if (original.end) shape.end = { x: original.end.x + dx, y: original.end.y + dy };
    if (original.control) shape.control = { x: original.control.x + dx, y: original.control.y + dy };
    if (original.points) shape.points = original.points.map((point) => ({ x: point.x + dx, y: point.y + dy }));

    if (original.x != null) shape.x = original.x + dx;
    if (original.y != null) shape.y = original.y + dy;
    if (original.width != null) shape.width = original.width;
    if (original.height != null) shape.height = original.height;
    if (original.angle != null) shape.angle = original.angle;
  }
}

function normalizeAngleDelta(deltaDeg) {
  let normalized = deltaDeg;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function snapRotationAngle(angleDeg) {
  const normalized = normalizeAngleDelta(angleDeg);
  const targets = [0, 90, 180, -90, -180, 270, -270];
  const hit = targets.find((target) => Math.abs(target - normalized) <= ROTATE_SNAP_THRESHOLD);
  return hit ?? normalized;
}

function angleFromCenter(center, point) {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
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

function applyRotation(documentData, snapshot, center, angleDeg) {
  const radians = (angleDeg * Math.PI) / 180;

  for (const shape of documentData.shapes) {
    const original = snapshot[shape.id];
    if (!original) continue;

    if (original.start) shape.start = rotatePoint(original.start, center, radians);
    if (original.end) shape.end = rotatePoint(original.end, center, radians);
    if (original.control) shape.control = rotatePoint(original.control, center, radians);
    if (original.points) shape.points = original.points.map((point) => rotatePoint(point, center, radians));

    if (original.width != null && original.height != null && original.x != null && original.y != null) {
      const roomCenter = {
        x: original.x + original.width / 2,
        y: original.y + original.height / 2,
      };
      const nextCenter = rotatePoint(roomCenter, center, radians);
      shape.x = nextCenter.x - original.width / 2;
      shape.y = nextCenter.y - original.height / 2;
      shape.width = original.width;
      shape.height = original.height;
      shape.angle = (original.angle ?? 0) + angleDeg;
    }

    if (original.width == null && original.height == null && original.x != null && original.y != null) {
      const mapped = rotatePoint({ x: original.x, y: original.y }, center, radians);
      shape.x = mapped.x;
      shape.y = mapped.y;
    }
  }
}

function getRotateGeometry(bounds) {
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const radius = Math.max(bounds.width, bounds.height) / 2 + ROTATE_CIRCLE_PADDING;
  return {
    center,
    radius,
    handle: {
      x: center.x + radius,
      y: center.y,
    },
  };
}

function isPointNearRotateHandle(bounds, point) {
  const geometry = getRotateGeometry(bounds);
  return Math.hypot(point.x - geometry.handle.x, point.y - geometry.handle.y) <= ROTATE_HANDLE_RADIUS + 4;
}

export const selectTool = {
  id: 'select',

  onPointerDown(context, point, event) {
    const { store, ephemeral } = context;
    const activeLayerId = resolveActiveLayerId(store.documentData, store.appState.activeLayerId);

    if (store.appState.rotateSelection) {
      const bounds = getSelectionBounds(store.documentData, store.appState);
      if (bounds && isPointNearRotateHandle(bounds, point)) {
        const ids = expandSelectionWithGroups(store.documentData, store.appState.selectedIds);
        ephemeral.selectionMode = 'rotate';
        ephemeral.rotateCenter = getRotateGeometry(bounds).center;
        ephemeral.rotateLastPointerAngle = angleFromCenter(ephemeral.rotateCenter, point);
        ephemeral.rotateAccumulatedAngle = 0;
        ephemeral.rotateAppliedAngle = 0;
        ephemeral.transformSnapshot = captureTransformSnapshot(store.documentData, ids);
        ephemeral.moved = false;
        return;
      }
    }

    if (store.appState.transformSelection) {
      const bounds = getSelectionBounds(store.documentData, store.appState);
      const handle = bounds ? detectTransformHandle(bounds, point) : null;
      if (handle) {
        const ids = expandSelectionWithGroups(store.documentData, store.appState.selectedIds);
        ephemeral.selectionMode = 'transform';
        ephemeral.transformHandle = handle;
        ephemeral.transformBaseBounds = bounds;
        ephemeral.transformSnapshot = captureTransformSnapshot(store.documentData, ids);
        return;
      }
    }

    const hit = findShapeAtPoint(store.documentData, point, { activeLayerId });
    const multi = event?.ctrlKey || event?.metaKey;

    if (!hit || hit.type !== 'label' || multi) {
      finishLabelEditing(context);
    }

    if (hit && store.appState.selectedIds.includes(hit.id)) {
      const ids = expandSelectionWithGroups(store.documentData, store.appState.selectedIds);
      ephemeral.selectionMode = 'move';
      ephemeral.moveStartPoint = point;
      ephemeral.moveLastPoint = point;
      ephemeral.transformSnapshot = captureTransformSnapshot(store.documentData, ids);
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
      const ids = expandSelectionWithGroups(store.documentData, [hit.id]);
      ephemeral.selectionMode = 'move';
      ephemeral.moveStartPoint = point;
      ephemeral.moveLastPoint = point;
      ephemeral.transformSnapshot = captureTransformSnapshot(store.documentData, ids);
      ephemeral.moved = false;
    }

    store.notify();
  },

  onPointerMove(context, point, event) {
    const { store, ephemeral } = context;
    const activeLayerId = resolveActiveLayerId(store.documentData, store.appState.activeLayerId);

    if (ephemeral.selectionMode === 'rotate' && ephemeral.rotateCenter && ephemeral.transformSnapshot) {
      const currentPointerAngle = angleFromCenter(ephemeral.rotateCenter, point);
      const step = normalizeAngleDelta(currentPointerAngle - (ephemeral.rotateLastPointerAngle ?? currentPointerAngle));
      ephemeral.rotateAccumulatedAngle = (ephemeral.rotateAccumulatedAngle ?? 0) + step;
      ephemeral.rotateLastPointerAngle = currentPointerAngle;

      const snappedAngle = snapRotationAngle(ephemeral.rotateAccumulatedAngle);
      applyRotation(store.documentData, ephemeral.transformSnapshot, ephemeral.rotateCenter, snappedAngle);
      ephemeral.rotateAppliedAngle = snappedAngle;
      ephemeral.moved = true;
      store.notify();
      return;
    }

    if (ephemeral.selectionMode === 'transform' && ephemeral.transformBaseBounds && ephemeral.transformHandle) {
      let nextPoint = point;
      const { settings } = store.documentData;
      const snappingEnabled = !event?.ctrlKey && !event?.metaKey;
      if (snappingEnabled && settings.snap) {
        nextPoint = snapToGrid(nextPoint, store.documentData);
      }

      const nextBounds = boundsFromHandleDrag(ephemeral.transformBaseBounds, ephemeral.transformHandle.type, nextPoint);

      applyTransform(store.documentData, ephemeral.transformSnapshot ?? {}, ephemeral.transformBaseBounds, nextBounds);
      ephemeral.moved = true;
      store.notify();
      return;
    }

    if (ephemeral.selectionMode === 'move' && ephemeral.moveLastPoint && ephemeral.moveStartPoint && ephemeral.transformSnapshot) {
      let nextPoint = point;
      const { settings } = store.documentData;
      const snappingEnabled = !event?.ctrlKey && !event?.metaKey;
      const rawStartPoint = ephemeral.moveStartPoint;
      const snappedStartPoint = snappingEnabled && settings.snap ? snapToGrid(rawStartPoint, store.documentData) : rawStartPoint;

      if (snappingEnabled && settings.axisSnap) {
        nextPoint = snapToAxis(nextPoint, snappedStartPoint);
      }

      if (snappingEnabled && settings.snap) {
        nextPoint = snapToGrid(nextPoint, store.documentData);
      }

      const dx = nextPoint.x - snappedStartPoint.x;
      const dy = nextPoint.y - snappedStartPoint.y;
      if (dx !== 0 || dy !== 0) {
        ephemeral.moved = true;
        applyTranslation(store.documentData, ephemeral.transformSnapshot, dx, dy);
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
          if (!isShapeOnActiveLayer(activeLayerId, shape)) return false;
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
    if ((ephemeral.selectionMode === 'move' || ephemeral.selectionMode === 'transform' || ephemeral.selectionMode === 'rotate') && ephemeral.moved) {
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
    ephemeral.transformHandle = null;
    ephemeral.transformBaseBounds = null;
    ephemeral.transformSnapshot = null;
    ephemeral.rotateCenter = null;
    ephemeral.rotateLastPointerAngle = null;
    ephemeral.rotateAccumulatedAngle = 0;
    ephemeral.rotateAppliedAngle = 0;
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
    const { ephemeral, ctx, store } = context;
    if (ephemeral.selectionBox) {
      const rect = normalizeRect(ephemeral.selectionBox.start, ephemeral.selectionBox.end);
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
      ctx.setLineDash([4, 4]);
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.restore();
    }

    if (!store.appState.rotateSelection || !store.appState.selectedIds.length) return;

    const bounds = getSelectionBounds(store.documentData, store.appState);
    if (!bounds) return;

    const geometry = getRotateGeometry(bounds);
    const angle = (ephemeral.selectionMode === 'rotate' ? ephemeral.rotateAppliedAngle : 0) ?? 0;
    const radians = (angle * Math.PI) / 180;
    const handle = {
      x: geometry.center.x + Math.cos(radians) * geometry.radius,
      y: geometry.center.y + Math.sin(radians) * geometry.radius,
    };

    ctx.save();
    ctx.strokeStyle = '#0f4c81';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(geometry.center.x, geometry.center.y, geometry.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(geometry.center.x, geometry.center.y);
    ctx.lineTo(handle.x, handle.y);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, ROTATE_HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  },
};
