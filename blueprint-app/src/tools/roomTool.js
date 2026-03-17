import { createRoomShape } from '../document/shapeFactory.js';
import { normalizeRect } from '../utils/geometry.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

function isClickDrawMode(context) {
  return context.store.documentData.settings.drawMode !== 'drag';
}

function lockSquare(start, point) {
  const dx = point.x - start.x;
  const dy = point.y - start.y;
  const size = Math.max(Math.abs(dx), Math.abs(dy));

  return {
    x: start.x + Math.sign(dx || 1) * size,
    y: start.y + Math.sign(dy || 1) * size,
  };
}

function beginPreview(context, point) {
  context.ephemeral.preview = { type: 'room', start: point, end: point, phase: 'armed' };
  patchState({ isDragging: false, dragStart: point });
}

function startDrawing(context) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.type !== 'room') return;
  if (preview.phase === 'drawing') return;

  preview.phase = 'drawing';
  patchState({ isDragging: true, dragStart: preview.start });
}

function finalizeRoom(context, endPoint) {
  const preview = context.ephemeral.preview;
  const { documentData } = context.store;
  if (!preview || preview.type !== 'room') return;

  const squareEnd = lockSquare(preview.start, endPoint);
  const rect = normalizeRect(preview.start, squareEnd);

  const shape = createRoomShape({
    layerId: documentData.layers[0].id,
    ...rect,
  });

  addShape(shape);
  setSelection([shape.id]);
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const roomTool = {
  id: 'room',

  onPointerDown(context, point) {
    const preview = context.ephemeral.preview;

    if (!preview || preview.type !== 'room') {
      beginPreview(context, point);

      if (!isClickDrawMode(context)) {
        startDrawing(context);
      }

      return;
    }

    if (isClickDrawMode(context)) {
      finalizeRoom(context, point);
      return;
    }

    startDrawing(context);
    preview.end = lockSquare(preview.start, point);
    context.store.notify();
  },

  onPointerMove(context, point, event) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'room') return;

    if (!isClickDrawMode(context)) {
      const isPointerPressed = Boolean(event?.buttons & 1);
      if (isPointerPressed) {
        startDrawing(context);
      }

      if (!context.store.appState.isDragging) return;
    }

    preview.end = lockSquare(preview.start, point);
    context.store.notify();
  },

  onPointerUp(context, point) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'room') return;
    if (isClickDrawMode(context)) return;

    finalizeRoom(context, point);
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
  drawOverlay() {},
};
