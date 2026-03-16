import { createCurveShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';

function computeControl(start, end) {
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / len, y: dx / len };
  const bend = Math.min(80, len * 0.25);
  return { x: mx + normal.x * bend, y: my + normal.y * bend };
}

export const curveTool = {
  id: 'curve',

  onPointerDown(context, point) {
    patchState({ isDragging: true, dragStart: point });
    context.ephemeral.preview = { type: 'curve', start: point, end: point, control: point };
  },

  onPointerMove(context, point) {
    if (!context.store.appState.isDragging || !context.ephemeral.preview) return;
    const start = context.ephemeral.preview.start;
    context.ephemeral.preview.end = point;
    context.ephemeral.preview.control = computeControl(start, point);
    context.store.notify();
  },

  onPointerUp(context, point) {
    const { appState, documentData } = context.store;
    if (!appState.dragStart) return;
    const control = computeControl(appState.dragStart, point);

    const shape = createCurveShape({
      layerId: documentData.layers[0].id,
      start: appState.dragStart,
      end: point,
      control,
    });

    addShape(shape);
    setSelection([shape.id]);
    patchState({ isDragging: false, dragStart: null });
    context.ephemeral.preview = null;
  },

  onKeyDown() {},

  drawOverlay(context) {
    const preview = context.ephemeral.preview;
    if (!preview || preview.type !== 'curve') return;
    const { ctx } = context;

    ctx.save();
    ctx.strokeStyle = '#0f4c81';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(preview.start.x, preview.start.y);
    ctx.quadraticCurveTo(preview.control.x, preview.control.y, preview.end.x, preview.end.y);
    ctx.stroke();
    ctx.restore();
  },
};
