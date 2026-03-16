import { screenToWorld } from './coordinateUtils.js';
import { snapToGrid } from './snapUtils.js';
import { getTool } from '../tools/toolRegistry.js';

function eventPointFromCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function bindPointerEvents({ canvas, store, ephemeral }) {
  const handle = (phase) => (event) => {
    const activeTool = getTool(store.appState.activeTool);
    const screen = eventPointFromCanvas(canvas, event);
    const world = screenToWorld(screen, store.appState);
    const point = store.documentData.settings.snap ? snapToGrid(world, store.documentData) : world;

    const context = {
      canvas,
      ctx: canvas.getContext('2d'),
      store,
      ephemeral,
    };

    if (phase === 'down') activeTool?.onPointerDown?.(context, point, event);
    if (phase === 'move') activeTool?.onPointerMove?.(context, point, event);
    if (phase === 'up') activeTool?.onPointerUp?.(context, point, event);
  };

  canvas.addEventListener('pointerdown', handle('down'));
  canvas.addEventListener('pointermove', handle('move'));
  window.addEventListener('pointerup', handle('up'));
}
