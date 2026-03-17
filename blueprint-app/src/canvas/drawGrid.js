export function drawGrid(ctx, canvas, documentData, appState) {
  if (!documentData.settings.showGrid) return;

  const step = documentData.settings.gridSize;
  if (step < 8) return;

  const worldLeft = -appState.panX / appState.zoom;
  const worldTop = -appState.panY / appState.zoom;
  const worldRight = (canvas.width - appState.panX) / appState.zoom;
  const worldBottom = (canvas.height - appState.panY) / appState.zoom;

  const startX = Math.floor(worldLeft / step) * step;
  const startY = Math.floor(worldTop / step) * step;

  ctx.save();
  ctx.translate(appState.panX, appState.panY);
  ctx.scale(appState.zoom, appState.zoom);

  ctx.strokeStyle = '#eef2f7';
  ctx.lineWidth = 1 / appState.zoom;

  for (let x = startX; x <= worldRight; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, worldTop);
    ctx.lineTo(x, worldBottom);
    ctx.stroke();
  }

  for (let y = startY; y <= worldBottom; y += step) {
    ctx.beginPath();
    ctx.moveTo(worldLeft, y);
    ctx.lineTo(worldRight, y);
    ctx.stroke();
  }

  ctx.restore();
}
