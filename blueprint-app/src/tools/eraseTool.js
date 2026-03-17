import { eraseLinesAlongSegment, patchState } from '../app/actions.js';

function isClickDrawMode(context) {
  return context.store.documentData.settings.drawMode !== 'drag';
}

function beginPreview(context, point) {
  context.ephemeral.preview = { type: 'line', start: point, end: point, phase: 'armed', erase: true };
  patchState({ isDragging: false, dragStart: point });
}

function startErasing(context) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.erase !== true) return;
  if (preview.phase === 'drawing') return;

  preview.phase = 'drawing';
  patchState({ isDragging: true, dragStart: preview.start });
}

function finalizeErase(context, endPoint) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.erase !== true) return;

  eraseLinesAlongSegment(preview.start, endPoint);
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const eraseTool = {
  id: 'erase',

  onPointerDown(context, point) {
    const preview = context.ephemeral.preview;

    if (!preview || preview.erase !== true) {
      beginPreview(context, point);

      if (!isClickDrawMode(context)) {
        startErasing(context);
      }

      return;
    }

    if (isClickDrawMode(context)) {
      finalizeErase(context, point);
      return;
    }

    startErasing(context);
    context.ephemeral.preview.end = point;
    context.store.notify();
  },

  onPointerMove(context, point, event) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.erase !== true) return;

    if (!isClickDrawMode(context)) {
      const isPointerPressed = Boolean(event?.buttons & 1);
      if (isPointerPressed) {
        startErasing(context);
      }
    }

    preview.end = point;
    context.store.notify();
  },

  onPointerUp(context, point) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.erase !== true) return;
    if (isClickDrawMode(context)) return;
    if (preview.phase !== 'drawing') return;

    finalizeErase(context, point);
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
};
