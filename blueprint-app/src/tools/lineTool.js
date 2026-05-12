import { createLineShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';
import { resolveActiveLayerId } from '../document/layerModel.js';

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

function finalizeLine(context) {
  const preview = context.ephemeral.preview;
  const { documentData } = context.store;
  if (!preview || preview.type !== 'line') return;

  const shape = createLineShape({
    layerId: resolveActiveLayerId(documentData, context.store.appState.activeLayerId),
    start: preview.start,
    end: preview.end,
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
    const drawPoint = point;
    const preview = context.ephemeral.preview;

    if (!preview || preview.type !== 'line') {
      beginPreview(context, drawPoint);

      if (!isClickDrawMode(context)) {
        startDrawing(context);
      }

      return;
    }

    if (isClickDrawMode(context)) {
      preview.end = drawPoint;
      finalizeLine(context);
      return;
    }

    startDrawing(context);
    context.ephemeral.preview.end = drawPoint;
    context.store.notify();
  },

  onPointerMove(context, point, event) {
    const drawPoint = point;
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'line') return;

    if (!isClickDrawMode(context)) {
      const isPointerPressed = Boolean(event?.buttons & 1);
      if (isPointerPressed) {
        startDrawing(context);
      }
    }

    preview.end = drawPoint;
    context.store.notify();
  },

  onPointerUp(context, point) {
    const drawPoint = point;
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'line') return;
    if (isClickDrawMode(context)) return;
    if (preview.phase !== 'drawing') return;

    preview.end = drawPoint;
    finalizeLine(context);
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
  drawOverlay() {},
};
