import { getShapeBehavior } from '../shapes/shapeRegistry.js';
import { getSelectionBounds } from '../interaction/selection.js';

function resolveSelectionOutlineMode(settings) {
  if (settings.selectionOutlineMode === 'off') return 'off';
  if (settings.selectionOutlineMode === 'selection-tool') return 'selection-tool';
  if (settings.selectionOutlineMode === 'always') return 'always';

  // Backward compatibility with older documents that saved a boolean toggle.
  if (settings.showSelectionOutline === false) return 'off';
  return 'always';
}

function selectionCorners(bounds) {
  const x = bounds.x - 4;
  const y = bounds.y - 4;
  const width = bounds.width + 8;
  const height = bounds.height + 8;
  return [
    { x, y: y + height / 2 },
    { x: x + width, y: y + height / 2 },
    { x: x + width / 2, y },
    { x: x + width / 2, y: y + height },
  ];
}

export function drawSelection(ctx, documentData, appState) {
  const mode = resolveSelectionOutlineMode(documentData.settings);

  if (mode === 'off') return;
  if (mode === 'selection-tool' && appState.activeTool !== 'select') return;

  const selectedIds = appState.selectedIds ?? [];
  if (!selectedIds.length) return;

  ctx.save();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);

  for (const id of selectedIds) {
    const shape = documentData.shapes.find((item) => item.id === id);
    if (!shape) continue;
    const behavior = getShapeBehavior(shape.type);
    if (!behavior?.getBounds) continue;
    const b = behavior.getBounds(shape);
    ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
  }

  if (appState.transformSelection) {
    const bounds = getSelectionBounds(documentData, appState);
    if (bounds) {
      const corners = selectionCorners(bounds);
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2563eb';
      for (const corner of corners) {
        ctx.beginPath();
        ctx.rect(corner.x - 5, corner.y - 5, 10, 10);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
