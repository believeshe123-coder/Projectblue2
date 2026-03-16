import { drawGrid } from './drawGrid.js';
import { drawShapes } from './drawShapes.js';
import { drawSelection } from './drawSelection.js';

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
  drawSelection(ctx, documentData, appState.selectedIds);

  activeTool?.drawOverlay?.(interactionContext);

  ctx.restore();
}
