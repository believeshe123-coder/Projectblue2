import { drawGrid } from './drawGrid.js';
import { drawShapes } from './drawShapes.js';
import { drawSelection } from './drawSelection.js';

function drawCursorPreview(sourceCanvas, interactionContext) {
  const previewCanvas = interactionContext?.previewCanvas;
  if (!previewCanvas) return;

  const previewCtx = previewCanvas.getContext('2d');
  const cursor = interactionContext?.ephemeral?.cursorScreen;
  const radius = previewCanvas.width / 2;
  const zoomFactor = 3;

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.save();
  previewCtx.beginPath();
  previewCtx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
  previewCtx.clip();

  // Keep preview background opaque even before pointer movement.
  previewCtx.fillStyle = '#ffffff';
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

  if (cursor) {
    const sourceSize = (radius * 2) / zoomFactor;
    const sx = Math.max(0, Math.min(sourceCanvas.width - sourceSize, cursor.x - sourceSize / 2));
    const sy = Math.max(0, Math.min(sourceCanvas.height - sourceSize, cursor.y - sourceSize / 2));

    previewCtx.drawImage(sourceCanvas, sx, sy, sourceSize, sourceSize, 0, 0, previewCanvas.width, previewCanvas.height);
  }

  previewCtx.restore();

  previewCtx.save();
  previewCtx.lineWidth = 2;
  previewCtx.strokeStyle = '#0f4c81';
  previewCtx.beginPath();
  previewCtx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
  previewCtx.stroke();

  previewCtx.strokeStyle = 'rgba(15, 76, 129, 0.8)';
  previewCtx.lineWidth = 1;
  previewCtx.beginPath();
  previewCtx.moveTo(radius - 10, radius);
  previewCtx.lineTo(radius + 10, radius);
  previewCtx.moveTo(radius, radius - 10);
  previewCtx.lineTo(radius, radius + 10);
  previewCtx.stroke();

  previewCtx.fillStyle = '#0f4c81';
  previewCtx.beginPath();
  previewCtx.arc(radius, radius, 2.5, 0, Math.PI * 2);
  previewCtx.fill();
  previewCtx.restore();
}

/**
 * Render pipeline only reads document/app state and never mutates it.
 */
export function renderCanvas({ ctx, canvas, documentData, appState, activeTool, interactionContext }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid(ctx, canvas, documentData, appState);

  ctx.save();
  ctx.translate(appState.panX, appState.panY);
  ctx.scale(appState.zoom, appState.zoom);

  drawShapes(ctx, documentData);
  drawSelection(ctx, documentData, appState);

  activeTool?.drawOverlay?.(interactionContext);

  ctx.restore();

  drawCursorPreview(canvas, interactionContext);
}
