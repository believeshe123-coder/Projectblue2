import { createCurveShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

function beginPreview(context, point) {
  context.ephemeral.preview = {
    type: 'curve',
    start: point,
    control: point,
    end: point,
    phase: 'set-mid',
  };
  patchState({ isDragging: false, dragStart: point });
}

function setControlPoint(context, point) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.type !== 'curve') return;

  preview.control = point;
  preview.end = point;
  preview.phase = 'set-end';
  patchState({ isDragging: false, dragStart: preview.start });
}

function finalizeCurve(context, endPoint) {
  const preview = context.ephemeral.preview;
  const { documentData } = context.store;
  if (!preview || preview.type !== 'curve') return;

  const shape = createCurveShape({
    layerId: documentData.layers[0].id,
    start: preview.start,
    control: preview.control,
    end: endPoint,
  });

  addShape(shape);
  setSelection([shape.id]);
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const curveTool = {
  id: 'curve',

  onPointerDown(context, point) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'curve') {
      beginPreview(context, point);
      return;
    }

    if (preview.phase === 'set-mid') {
      setControlPoint(context, point);
      context.store.notify();
      return;
    }

    finalizeCurve(context, point);
  },

  onPointerMove(context, point) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'curve') return;

    if (preview.phase === 'set-mid') {
      preview.control = point;
      preview.end = point;
    } else {
      preview.end = point;
    }

    context.store.notify();
  },

  onPointerUp() {},

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
  drawOverlay() {},
};
