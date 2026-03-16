import { createLineShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

export const lineTool = {
  id: 'line',

  onPointerDown(context, point) {
    patchState({ isDragging: true, dragStart: point });
    context.ephemeral.preview = { type: 'line', start: point, end: point };
  },

  onPointerMove(context, point) {
    if (!context.store.appState.isDragging || !context.ephemeral.preview) return;
    context.ephemeral.preview.end = point;
    context.store.notify();
  },

  onPointerUp(context, point) {
    const { appState, documentData } = context.store;
    if (!appState.dragStart) return;

    const shape = createLineShape({
      layerId: documentData.layers[0].id,
      start: appState.dragStart,
      end: point,
    });

    addShape(shape);
    setSelection([shape.id]);
    patchState({ isDragging: false, dragStart: null });
    context.ephemeral.preview = null;
  },

  onKeyDown() {},

  drawOverlay(context) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'line') return;
    const { ctx } = context;
    ctx.save();
    ctx.strokeStyle = '#0f4c81';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(preview.start.x, preview.start.y);
    ctx.lineTo(preview.end.x, preview.end.y);
    ctx.stroke();
    ctx.restore();
  },
};
