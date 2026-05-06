const PROJECTION_MODES = new Set(['orthographic', 'perspective1', 'perspective2', 'perspective3', 'isometric']);

function resolveProjectionMode(appState) {
  const candidate = appState?.view?.projectionMode;
  return PROJECTION_MODES.has(candidate) ? candidate : 'orthographic';
}

function getWorldBounds(canvas, appState) {
  return {
    worldLeft: -appState.panX / appState.zoom,
    worldTop: -appState.panY / appState.zoom,
    worldRight: (canvas.width - appState.panX) / appState.zoom,
    worldBottom: (canvas.height - appState.panY) / appState.zoom,
  };
}

function withWorldTransform(ctx, appState, draw) {
  ctx.save();
  ctx.translate(appState.panX, appState.panY);
  ctx.scale(appState.zoom, appState.zoom);
  ctx.strokeStyle = '#eef2f7';
  ctx.lineWidth = 1 / appState.zoom;
  draw();
  ctx.restore();
}

function drawOrthographicGrid(ctx, canvas, documentData, appState) {
  const step = documentData.settings.gridSize;
  if (step < 8) return;
  const { worldLeft, worldTop, worldRight, worldBottom } = getWorldBounds(canvas, appState);
  const startX = Math.floor(worldLeft / step) * step;
  const startY = Math.floor(worldTop / step) * step;

  withWorldTransform(ctx, appState, () => {
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
  });
}

function drawOnePointPerspectiveGrid(ctx, canvas, documentData, appState) {
  const step = documentData.settings.gridSize;
  if (step < 8) return;
  const { worldLeft, worldTop, worldRight, worldBottom } = getWorldBounds(canvas, appState);
  const horizonY = worldTop + (worldBottom - worldTop) * 0.35;
  const vp = { x: (worldLeft + worldRight) / 2, y: horizonY };
  const startX = Math.floor(worldLeft / step) * step;
  const startY = Math.floor(worldTop / step) * step;
  withWorldTransform(ctx, appState, () => {
    for (let y = startY; y <= worldBottom; y += step) {
      ctx.beginPath(); ctx.moveTo(worldLeft, y); ctx.lineTo(worldRight, y); ctx.stroke();
    }
    for (let x = startX; x <= worldRight; x += step) {
      ctx.beginPath(); ctx.moveTo(x, worldBottom); ctx.lineTo(vp.x, vp.y); ctx.stroke();
    }
  });
}

function drawTwoPointPerspectiveGrid(ctx, canvas, documentData, appState) {
  const step = documentData.settings.gridSize;
  if (step < 8) return;
  const { worldLeft, worldTop, worldRight, worldBottom } = getWorldBounds(canvas, appState);
  const horizonY = worldTop + (worldBottom - worldTop) * 0.35;
  const leftVp = { x: worldLeft - (worldRight - worldLeft) * 0.4, y: horizonY };
  const rightVp = { x: worldRight + (worldRight - worldLeft) * 0.4, y: horizonY };
  const start = Math.floor(worldLeft / step) * step;
  withWorldTransform(ctx, appState, () => {
    for (let x = start; x <= worldRight; x += step) {
      ctx.beginPath(); ctx.moveTo(x, worldBottom); ctx.lineTo(leftVp.x, leftVp.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, worldBottom); ctx.lineTo(rightVp.x, rightVp.y); ctx.stroke();
    }
  });
}

function drawThreePointPerspectiveGrid(ctx, canvas, documentData, appState) {
  drawTwoPointPerspectiveGrid(ctx, canvas, documentData, appState);
  const step = documentData.settings.gridSize;
  const { worldLeft, worldTop, worldRight, worldBottom } = getWorldBounds(canvas, appState);
  const bottomVp = { x: (worldLeft + worldRight) / 2, y: worldBottom + (worldBottom - worldTop) * 0.5 };
  const startY = Math.floor(worldTop / step) * step;
  withWorldTransform(ctx, appState, () => {
    for (let y = startY; y <= worldBottom; y += step) {
      ctx.beginPath(); ctx.moveTo(worldLeft, y); ctx.lineTo(bottomVp.x, bottomVp.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(worldRight, y); ctx.lineTo(bottomVp.x, bottomVp.y); ctx.stroke();
    }
  });
}

function drawIsometricGrid(ctx, canvas, documentData, appState) {
  const step = documentData.settings.gridSize;
  if (step < 8) return;
  const { worldLeft, worldTop, worldRight, worldBottom } = getWorldBounds(canvas, appState);
  const width = worldRight - worldLeft;
  const height = worldBottom - worldTop;
  const diagonalSpan = Math.ceil((width + height) / step) + 2;
  const start = Math.floor((worldLeft - worldBottom) / step) * step;
  const startAlt = Math.floor((worldLeft + worldTop) / step) * step;

  withWorldTransform(ctx, appState, () => {
    for (let i = -1; i <= diagonalSpan; i += 1) {
      const offsetA = start + i * step;
      ctx.beginPath();
      ctx.moveTo(offsetA + worldTop, worldTop);
      ctx.lineTo(offsetA + worldBottom, worldBottom);
      ctx.stroke();

      const offsetB = startAlt + i * step;
      ctx.beginPath();
      ctx.moveTo(offsetB - worldTop, worldTop);
      ctx.lineTo(offsetB - worldBottom, worldBottom);
      ctx.stroke();
    }
  });
}

const projectionGridStrategies = {
  orthographic: drawOrthographicGrid,
  perspective1: drawOnePointPerspectiveGrid,
  perspective2: drawTwoPointPerspectiveGrid,
  perspective3: drawThreePointPerspectiveGrid,
  isometric: drawIsometricGrid,
};

export function drawGrid(ctx, canvas, documentData, appState) {
  if (!documentData.settings.showGrid) return;
  const mode = resolveProjectionMode(appState);
  const drawModeGrid = projectionGridStrategies[mode] ?? drawOrthographicGrid;
  drawModeGrid(ctx, canvas, documentData, appState);
}
