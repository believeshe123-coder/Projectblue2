import { createCurveShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';
import { resolveActiveLayerId } from '../document/layerModel.js';
import { toCanonicalPoint } from './projectionAdapter.js';

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
    layerId: resolveActiveLayerId(documentData, context.store.appState.activeLayerId),
    start: preview.start,
    control: preview.control,
    end: endPoint,
    style: context.store.appState.toolStyle,
  });

  addShape(shape);
  setSelection([]);
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const curveTool = {
  id: 'curve',

  onPointerDown(context, point) {
    const canonicalPoint = toCanonicalPoint(context, point);
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'curve') {
      beginPreview(context, canonicalPoint);
      return;
    }

    if (preview.phase === 'set-mid') {
      setControlPoint(context, canonicalPoint);
      context.store.notify();
      return;
    }

    finalizeCurve(context, canonicalPoint);
  },

  onPointerMove(context, point) {
    const canonicalPoint = toCanonicalPoint(context, point);
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'curve') return;

    if (preview.phase === 'set-mid') {
      preview.control = canonicalPoint;
      preview.end = canonicalPoint;
    } else {
      preview.end = canonicalPoint;
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
