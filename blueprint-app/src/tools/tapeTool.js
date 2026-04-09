import { createTapeShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';
import { resolveActiveLayerId } from '../document/layerModel.js';

function usesOffsetMode(context) {
  return context.store.documentData.settings.tapeMeasureMode === 'offset-3-point';
}

function usesAngleMode(context) {
  return context.store.documentData.settings.tapeMeasureMode === 'angle-3-point';
}

function isClickDrawMode(context) {
  return context.store.documentData.settings.drawMode !== 'drag';
}

function resolveMeasurementUnitsPerGridOverride(context) {
  const toolStyle = context.store.appState.toolStyle ?? {};
  if (!toolStyle.tapeCustomMeasurementEnabled) return null;
  const parsed = Number(toolStyle.tapeMeasurementUnitsPerGrid);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function beginDirectPreview(context, point) {
  patchState({ isDragging: true, dragStart: point });
  context.ephemeral.preview = { type: 'tape', mode: 'direct', start: point, end: point, phase: 'drawing' };
}

function beginOffsetPreview(context, point) {
  patchState({ isDragging: true, dragStart: point });
  context.ephemeral.preview = {
    type: 'tape',
    mode: 'offset',
    phase: 'set-end',
    start: point,
    end: point,
    offset: point,
  };
}

function beginAnglePreview(context, point) {
  patchState({ isDragging: true, dragStart: point });
  context.ephemeral.preview = {
    type: 'tape',
    mode: 'angle',
    phase: 'set-end',
    start: point,
    end: point,
    offset: point,
  };
}

export function buildTapeShapeArgs(preview, finalPoint) {
  if (preview.mode === 'angle') {
    return {
      start: preview.start,
      end: preview.end,
      mode: 'angle',
      offset: finalPoint ?? preview.offset,
    };
  }

  if (preview.mode === 'offset') {
    return {
      start: preview.start,
      end: preview.end,
      mode: 'offset',
      offset: finalPoint ?? preview.offset,
    };
  }

  return {
    start: preview.start,
    end: finalPoint ?? preview.end,
    mode: 'direct',
    offset: null,
  };
}

function finalizeTape(context, finalPoint) {
  const preview = context.ephemeral.preview;
  const { appState, documentData } = context.store;
  if (!preview || preview.type !== 'tape' || !appState.dragStart) return;

  // In direct mode, finalPoint updates the end. In 3-point offset mode,
  // finalPoint sets only the pull location while preserving the baseline end.
  const shape = createTapeShape({
    layerId: resolveActiveLayerId(documentData, context.store.appState.activeLayerId),
    ...buildTapeShapeArgs(preview, finalPoint),
    style: context.store.appState.toolStyle,
    measurementUnitsPerGrid: resolveMeasurementUnitsPerGridOverride(context),
  });

  addShape(shape);
  setSelection([]);
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const tapeTool = {
  id: 'tape',

  onPointerDown(context, point, event) {
    const preview = context.ephemeral.preview;
    if (usesAngleMode(context)) {
      if (!preview || preview.type !== 'tape' || preview.mode !== 'angle') {
        beginAnglePreview(context, point);
        return;
      }

      if (preview.phase === 'set-end') {
        preview.end = point;
        preview.phase = 'set-offset';
        context.store.notify();
        return;
      }

      finalizeTape(context, point);
      return;
    }

    if (usesOffsetMode(context)) {
      if (!preview || preview.type !== 'tape' || preview.mode !== 'offset') {
        beginOffsetPreview(context, point);
        return;
      }

      if (preview.phase === 'set-end') {
        preview.end = point;
        preview.phase = 'set-offset';
        context.store.notify();
        return;
      }

      finalizeTape(context, point);
      return;
    }

    if (!preview || preview.type !== 'tape' || preview.mode !== 'direct') {
      beginDirectPreview(context, point);
      return;
    }

    if (isClickDrawMode(context)) {
      finalizeTape(context, point);
      return;
    }

    if (event?.buttons & 1) {
      preview.end = point;
      context.store.notify();
    }
  },

  onPointerMove(context, point, event) {
    const preview = context.ephemeral.preview;
    if (!context.store.appState.isDragging || !preview || preview.type !== 'tape') return;

    if (preview.mode === 'angle') {
      if (preview.phase === 'set-end') {
        preview.end = point;
      } else {
        preview.offset = point;
      }
      context.store.notify();
      return;
    }

    if (preview.mode === 'offset') {
      if (preview.phase === 'set-end') {
        preview.end = point;
      } else {
        preview.offset = point;
      }
      context.store.notify();
      return;
    }

    if (!isClickDrawMode(context) && !(event?.buttons & 1)) return;
    preview.end = point;
    context.store.notify();
  },

  onPointerUp(context, point) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'tape') return;
    if (preview.mode === 'offset') return;
    if (isClickDrawMode(context)) return;
    finalizeTape(context, point);
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
  drawOverlay() {},
};
