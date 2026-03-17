import { createTapeShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

export const tapeTool = {
  id: 'tape',

  onPointerDown(context, point) {
    patchState({ isDragging: true, dragStart: point });
    context.ephemeral.preview = { type: 'tape', start: point, end: point };
  },

  onPointerMove(context, point) {
    const preview = context.ephemeral.preview;
    if (!context.store.appState.isDragging || !preview || preview.type !== 'tape') return;

    preview.end = point;
    context.store.notify();
  },

  onPointerUp(context, point) {
    const preview = context.ephemeral.preview;
    const { appState, documentData } = context.store;
    if (!preview || preview.type !== 'tape' || !appState.dragStart) return;

    const shape = createTapeShape({
      layerId: documentData.layers[0].id,
      start: preview.start,
      end: point,
    });

    addShape(shape);
    setSelection([shape.id]);
    patchState({ isDragging: false, dragStart: null });
    context.ephemeral.preview = null;
  },

  onKeyDown(context, key, event) {
    const pressedKey = event?.key ?? key;
    if (pressedKey !== 'Escape') return;
    context.ephemeral.preview = null;
    patchState({ isDragging: false, dragStart: null });
  },
  drawOverlay() {},
};
