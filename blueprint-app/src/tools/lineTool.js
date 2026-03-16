import { createLineShape } from '../document/shapeFactory.js';
import { addShape, patchState, setSelection } from '../app/actions.js';
import { formatMeasurement, shouldRenderDrawingMeasurements } from '../utils/measurement.js';

function drawPreviewMeasurement(ctx, start, end, settings = {}) {
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (length < 0.01) return;

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const label = formatMeasurement(length, settings);

  ctx.save();
  ctx.font = '12px Inter, Segoe UI, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const width = ctx.measureText(label).width + 12;
  const height = 18;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f4c81';
  ctx.lineWidth = 1;
  ctx.fillRect(midX - width / 2, midY - height / 2, width, height);
  ctx.strokeRect(midX - width / 2, midY - height / 2, width, height);

  ctx.fillStyle = '#0f4c81';
  ctx.fillText(label, midX, midY);
  ctx.restore();
}

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

    if (shouldRenderDrawingMeasurements(context.store.documentData.settings)) {
      drawPreviewMeasurement(ctx, preview.start, preview.end, context.store.documentData.settings);
    }
  },
};
