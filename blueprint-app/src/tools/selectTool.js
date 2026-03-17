import { getShapeBehavior } from '../shapes/shapeRegistry.js';
import { findShapeAtPoint } from '../interaction/hitTest.js';
import { clearSelection, selectOne, toggleSelection } from '../interaction/selection.js';
import { normalizeRect } from '../utils/geometry.js';
import { pushDocumentHistory } from '../app/actions.js';

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

export const selectTool = {
  id: 'select',

  onPointerDown(context, point, event) {
    const { store, ephemeral } = context;
    const hit = findShapeAtPoint(store.documentData, point);
    const multi = event?.ctrlKey || event?.metaKey;

    if (!hit || hit.type !== 'label' || multi) {
      finishLabelEditing(context);
    }

    if (hit && store.appState.selectedIds.includes(hit.id)) {
      ephemeral.selectionMode = 'move';
      ephemeral.moveLastPoint = point;
      ephemeral.moved = false;
      return;
    }

    if (!hit) {
      if (!multi) clearSelection(store.appState);
      ephemeral.selectionMode = 'box';
      ephemeral.selectionBox = { start: point, end: point };
    } else if (multi) {
      toggleSelection(store.appState, hit.id);
    } else {
      selectOne(store.appState, hit.id);
      ephemeral.selectionMode = 'move';
      ephemeral.moveLastPoint = point;
      ephemeral.moved = false;
    }

    store.notify();
  },

  onPointerMove(context, point) {
    const { store, ephemeral } = context;

    if (ephemeral.selectionMode === 'move' && ephemeral.moveLastPoint) {
      const dx = point.x - ephemeral.moveLastPoint.x;
      const dy = point.y - ephemeral.moveLastPoint.y;
      if (dx !== 0 || dy !== 0) {
        ephemeral.moved = true;
        const selected = new Set(store.appState.selectedIds);
        for (const shape of store.documentData.shapes) {
          if (!selected.has(shape.id)) continue;
          const behavior = getShapeBehavior(shape.type);
          behavior?.move?.(shape, dx, dy);
        }
        ephemeral.moveLastPoint = point;
        store.notify();
      }
      return;
    }

    if (ephemeral.selectionMode === 'box' && ephemeral.selectionBox) {
      ephemeral.selectionBox.end = point;
      const rect = normalizeRect(ephemeral.selectionBox.start, ephemeral.selectionBox.end);

      const ids = store.documentData.shapes
        .filter((shape) => {
          const bounds = getShapeBehavior(shape.type)?.getBounds?.(shape);
          return bounds ? boundsIntersect(bounds, rect) : false;
        })
        .map((shape) => shape.id);

      store.appState.selectedIds = ids;
      store.notify();
    }
  },

  onPointerUp(context) {
    const { store, ephemeral } = context;
    if (ephemeral.selectionMode === 'move' && ephemeral.moved) {
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
    ephemeral.moveLastPoint = null;
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
