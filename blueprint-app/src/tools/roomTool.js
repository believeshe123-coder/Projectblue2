import { createLineShape } from '../document/shapeFactory.js';
import { normalizeRect } from '../utils/geometry.js';
import { patchState, pushDocumentHistory, setSelection } from '../app/actions.js';

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

function resolveRoomEnd(preview, point, forceSquare = false) {
  return forceSquare ? lockSquare(preview.start, point) : point;
}

function beginPreview(context, point) {
  context.ephemeral.preview = { type: 'room', start: point, end: point, phase: 'armed', square: false };
  patchState({ isDragging: false, dragStart: point });
}

function startDrawing(context) {
  const preview = context.ephemeral.preview;
  if (!preview || preview.type !== 'room') return;
  if (preview.phase === 'drawing') return;

  preview.phase = 'drawing';
  patchState({ isDragging: true, dragStart: preview.start });
}

function finalizeRoom(context, endPoint, forceSquare = false) {
  const preview = context.ephemeral.preview;
  const { documentData, appState } = context.store;
  if (!preview || preview.type !== 'room') return;

  const rect = normalizeRect(preview.start, resolveRoomEnd(preview, endPoint, forceSquare));
  if (rect.width < 1 || rect.height < 1) {
    patchState({ isDragging: false, dragStart: null });
    context.ephemeral.preview = null;
    return;
  }

  const layerId = documentData.layers[0].id;
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  const created = [
    createLineShape({ layerId, start: corners[0], end: corners[1] }),
    createLineShape({ layerId, start: corners[1], end: corners[2] }),
    createLineShape({ layerId, start: corners[2], end: corners[3] }),
    createLineShape({ layerId, start: corners[3], end: corners[0] }),
  ];

  for (const shape of created) {
    documentData.shapes.push(shape);
  }

  setSelection(created.map((shape) => shape.id));
  appState.transformSelection = false;
  appState.rotateSelection = false;
  pushDocumentHistory();
  patchState({ isDragging: false, dragStart: null });
  context.ephemeral.preview = null;
}

export const roomTool = {
  id: 'room',

  onPointerDown(context, point, event) {
    const preview = context.ephemeral.preview;

    if (!preview || preview.type !== 'room') {
      beginPreview(context, point);

      if (!isClickDrawMode(context)) {
        startDrawing(context);
      }

      return;
    }

    if (isClickDrawMode(context)) {
      finalizeRoom(context, point, Boolean(event?.shiftKey));
      return;
    }

    startDrawing(context);
    preview.square = Boolean(event?.shiftKey);
    preview.end = resolveRoomEnd(preview, point, preview.square);
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

    preview.square = Boolean(event?.shiftKey);
    preview.end = resolveRoomEnd(preview, point, preview.square);
    context.store.notify();
  },

  onPointerUp(context, point, event) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'room') return;
    if (isClickDrawMode(context)) return;

    finalizeRoom(context, point, Boolean(event?.shiftKey));
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
  drawOverlay() {},
};
