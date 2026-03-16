import { getShapeBehavior } from '../shapes/shapeRegistry.js';
import { findShapeAtPoint } from '../interaction/hitTest.js';
import { clearSelection, selectOne, toggleSelection } from '../interaction/selection.js';
import { normalizeRect } from '../utils/geometry.js';
import { pushDocumentHistory } from '../app/actions.js';

function boundsIntersect(a, b) {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

export const selectTool = {
  id: 'select',

  onPointerDown(context, point, event) {
    const { store, ephemeral } = context;
    const hit = findShapeAtPoint(store.documentData, point);
    const multi = event?.ctrlKey || event?.metaKey;

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
    const { ephemeral } = context;
    if (ephemeral.selectionMode === 'move' && ephemeral.moved) {
      pushDocumentHistory();
    }
    ephemeral.selectionMode = null;
    ephemeral.selectionBox = null;
    ephemeral.moveLastPoint = null;
    ephemeral.moved = false;
  },

  onKeyDown() {},

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
