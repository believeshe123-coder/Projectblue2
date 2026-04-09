import { createEllipseShape } from '../document/shapeFactory.js';
import { resolveActiveLayerId } from '../document/layerModel.js';
import { normalizeRect } from '../utils/geometry.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

function isClickDrawMode(context) {
  return context.store.documentData.settings.drawMode !== 'drag';
}

function lockCircle(start, point) {
  const dx = point.x - start.x;
  const dy = point.y - start.y;
  const size = Math.max(Math.abs(dx), Math.abs(dy));

  return {
    x: start.x + (Math.sign(dx || 1) * size),
    y: start.y + (Math.sign(dy || 1) * size),
  };
}

function resolveEnd(preview, point, forceCircle = false) {
  return forceCircle ? lockCircle(preview.start, point) : point;
}

function beginPreview(context, point, mode) {
  context.ephemeral.preview = {
    type: 'ellipse',
    mode,
    start: point,
    end: point,
    phase: 'armed',
    circle: mode === 'circle',
  };
  patchState({ isDragging: false, dragStart: point });
}

function startDrawing(context) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.type !== 'ellipse') return;
  if (preview.phase === 'drawing') return;

  preview.phase = 'drawing';
  patchState({ isDragging: true, dragStart: preview.start });
}

function finalizeEllipse(context, endPoint, forceCircle = false) {
  const preview = context.ephemeral.preview;
  const { documentData, appState } = context.store;
  if (!preview || preview.type !== 'ellipse') return;

  const normalizedEnd = resolveEnd(preview, endPoint, forceCircle || preview.mode === 'circle');
  const rect = normalizeRect(preview.start, normalizedEnd);
  if (rect.width < 1 || rect.height < 1) {
    patchState({ isDragging: false, dragStart: null });
    context.ephemeral.preview = null;
    return;
  }

  const shape = createEllipseShape({
    layerId: resolveActiveLayerId(documentData, appState.activeLayerId),
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    style: appState.toolStyle,
  });

  addShape(shape);
  setSelection([]);
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

function createEllipseTool({ id, forceCircle }) {
  return {
    id,

    onPointerDown(context, point, event) {
      const preview = context.ephemeral.preview;

      if (!preview || preview.type !== 'ellipse') {
        beginPreview(context, point, forceCircle ? 'circle' : 'oval');
        if (!isClickDrawMode(context)) startDrawing(context);
        return;
      }

      if (isClickDrawMode(context)) {
        finalizeEllipse(context, point, forceCircle || Boolean(event?.shiftKey));
        return;
      }

      startDrawing(context);
      preview.circle = forceCircle || Boolean(event?.shiftKey);
      preview.end = resolveEnd(preview, point, preview.circle);
      context.store.notify();
    },

    onPointerMove(context, point, event) {
      const preview = context.ephemeral.preview;
      if (!preview || preview.type !== 'ellipse') return;
      if (preview.mode === 'circle' && id !== 'circle') return;
      if (preview.mode === 'oval' && id !== 'oval') return;

      if (!isClickDrawMode(context)) {
        const isPointerPressed = Boolean(event?.buttons & 1);
        if (isPointerPressed) {
          startDrawing(context);
        }

        if (!context.store.appState.isDragging) return;
      }

      preview.circle = forceCircle || Boolean(event?.shiftKey);
      preview.end = resolveEnd(preview, point, preview.circle);
      context.store.notify();
    },

    onPointerUp(context, point, event) {
      const preview = context.ephemeral.preview;
      if (!preview || preview.type !== 'ellipse') return;
      if (preview.mode === 'circle' && id !== 'circle') return;
      if (preview.mode === 'oval' && id !== 'oval') return;
      if (isClickDrawMode(context)) return;
      if (preview.phase !== 'drawing') return;

      finalizeEllipse(context, point, forceCircle || Boolean(event?.shiftKey));
    },

    onKeyDown(context, key, event) {
      const pressedKey = event?.key ?? key;
      if (pressedKey !== 'Escape') return;
      context.ephemeral.preview = null;
      patchState({ isDragging: false, dragStart: null });
    },
    drawOverlay() {},
  };
}

export const circleTool = createEllipseTool({ id: 'circle', forceCircle: true });
export const ovalTool = createEllipseTool({ id: 'oval', forceCircle: false });
