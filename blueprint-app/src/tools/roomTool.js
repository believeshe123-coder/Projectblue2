import { createRoomShape } from '../document/shapeFactory.js';
import { normalizeRect } from '../utils/geometry.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

export const roomTool = {
  id: 'room',

  onPointerDown(context, point) {
    patchState({ isDragging: true, dragStart: point });
    context.ephemeral.preview = { type: 'room', start: point, end: point };
  },

  onPointerMove(context, point) {
    if (!context.store.appState.isDragging || !context.ephemeral.preview) return;
    context.ephemeral.preview.end = point;
    context.store.notify();
  },

  onPointerUp(context, point) {
    const { appState, documentData } = context.store;
    if (!appState.dragStart) return;
    const rect = normalizeRect(appState.dragStart, point);

    const shape = createRoomShape({
      layerId: documentData.layers[0].id,
      ...rect,
    });

    addShape(shape);
    setSelection([shape.id]);
    patchState({ isDragging: false, dragStart: null });
    context.ephemeral.preview = null;
  },

  onKeyDown() {},

  drawOverlay(context) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'room') return;
    const { ctx } = context;
    const rect = normalizeRect(preview.start, preview.end);

    ctx.save();
    ctx.strokeStyle = '#0f4c81';
    ctx.fillStyle = 'rgba(15, 76, 129, 0.08)';
    ctx.setLineDash([5, 3]);
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  },
};
