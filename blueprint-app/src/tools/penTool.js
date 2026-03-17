import { addShape, patchState, setSelection } from '../app/actions.js';
import { createLineShape } from '../document/shapeFactory.js';

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

  preview.points.push(point);
}

function finalizeStroke(context) {
  const preview = context.ephemeral.preview;
  const layerId = context.store.documentData.layers[0]?.id;
  if (!preview || preview.type !== 'pen' || !layerId) return;

  const strokeSegmentIds = [];
  for (let index = 1; index < preview.points.length; index += 1) {
    const start = preview.points[index - 1];
    const end = preview.points[index];
    if (samePoint(start, end)) continue;

    const segment = createLineShape({ layerId, start, end });
    addShape(segment);
    strokeSegmentIds.push(segment.id);
  }

  if (strokeSegmentIds.length) {
    setSelection(strokeSegmentIds);
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
