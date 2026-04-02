import { createLineShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

function isClickDrawMode(context) {
  return context.store.documentData.settings.drawMode !== 'drag';
}

function beginPreview(context, point) {
  context.ephemeral.preview = { type: 'line', start: point, end: point, phase: 'armed' };
  patchState({ isDragging: false, dragStart: point });
}

function startDrawing(context) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.type !== 'line') return;
  if (preview.phase === 'drawing') return;

  preview.phase = 'drawing';
  patchState({ isDragging: true, dragStart: preview.start });
}

function finalizeLine(context, endPoint) {
  const preview = context.ephemeral.preview;
  const { documentData } = context.store;
  if (!preview || preview.type !== 'line') return;

  const shape = createLineShape({
    layerId: documentData.layers[0].id,
    start: preview.start,
    end: endPoint,
    style: context.store.appState.toolStyle,
  });

  addShape(shape);
  setSelection([]);
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const lineTool = {
  id: 'line',

  onPointerDown(context, point) {
    const preview = context.ephemeral.preview;

    if (!preview || preview.type !== 'line') {
      beginPreview(context, point);

      if (!isClickDrawMode(context)) {
        startDrawing(context);
      }

      return;
    }

    if (isClickDrawMode(context)) {
      finalizeLine(context, point);
      return;
    }

    startDrawing(context);
    context.ephemeral.preview.end = point;
    context.store.notify();
  },

  onPointerMove(context, point, event) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'line') return;

    if (!isClickDrawMode(context)) {
      const isPointerPressed = Boolean(event?.buttons & 1);
      if (isPointerPressed) {
        startDrawing(context);
      }
    }

    preview.end = point;
    context.store.notify();
  },

  onPointerUp(context, point) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'line') return;
    if (isClickDrawMode(context)) return;
    if (preview.phase !== 'drawing') return;

    finalizeLine(context, point);
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
  drawOverlay() {},
};
