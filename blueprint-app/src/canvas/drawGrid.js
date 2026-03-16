export function drawGrid(ctx, canvas, documentData, appState) {
  const grid = documentData.settings.gridSize;
  const step = grid * appState.zoom;
  if (step < 8) return;

  ctx.save();
  ctx.strokeStyle = '#eef2f7';
  ctx.lineWidth = 1;

  for (let x = appState.panX % step; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = appState.panY % step; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}
