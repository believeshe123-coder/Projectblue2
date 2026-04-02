import { addShape, patchState, setSelection } from '../app/actions.js';
import { createPenShape } from '../document/shapeFactory.js';
import { resolveActiveLayerId } from '../document/layerModel.js';

function samePoint(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function beginStroke(context, point) {
  context.ephemeral.preview = {
    type: 'pen',
    points: [point],
    phase: 'drawing',
  };
  patchState({ isDragging: true, dragStart: point });
}

function appendPoint(context, point) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.type !== 'pen') return;

  const lastPoint = preview.points[preview.points.length - 1];
  if (samePoint(lastPoint, point)) return;
  if (lastPoint && Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < 2) return;

  preview.points.push(point);
}

function finalizeStroke(context) {
  const preview = context.ephemeral.preview;
  const layerId = resolveActiveLayerId(
    context.store.documentData,
    context.store.appState.activeLayerId,
  );
  if (!preview || preview.type !== 'pen' || !layerId) return;

  if (preview.points.length >= 2) {
    const stroke = createPenShape({
      layerId,
      points: preview.points,
      style: context.store.appState.toolStyle,
    });
    addShape(stroke);
    setSelection([]);
  }

  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const penTool = {
  id: 'pen',

  onPointerDown(context, point) {
    beginStroke(context, point);
  },

  onPointerMove(context, point, event) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'pen') return;
    if (!(event?.buttons & 1)) return;

    appendPoint(context, point);
  },

  onPointerUp(context, point) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'pen') return;

    appendPoint(context, point);
    finalizeStroke(context);
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },

  drawOverlay() {},
};
