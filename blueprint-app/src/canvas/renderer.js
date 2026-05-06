import { drawGrid } from './drawGrid.js';
import { drawShapes } from './drawShapes.js';
import { drawSelection } from './drawSelection.js';
import { getShapeBehavior } from '../shapes/shapeRegistry.js';
import { resolveActiveLayerId } from '../document/layerModel.js';
import { createProjectionContext } from './projection.js';

const GUIDE_COLOR = 'rgba(238, 242, 247, 0.9)';
const GUIDE_ACCENT_COLOR = 'rgba(15, 76, 129, 0.35)';

function resolveProjectionMode(appState) {
  const mode = appState?.view?.projectionMode;
  return ['orthographic', 'perspective1', 'perspective2', 'perspective3', 'isometric'].includes(mode)
    ? mode
    : 'orthographic';
}

function drawProjectionOverlay(ctx, canvas, appState) {
  const mode = resolveProjectionMode(appState);
  if (mode === 'orthographic') return;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = GUIDE_COLOR;
  ctx.fillStyle = GUIDE_ACCENT_COLOR;

  if (mode === 'isometric') {
    const cx = canvas.width - 88;
    const cy = 80;
    const axis = 36;
    const angle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - axis);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * axis, cy + Math.sin(angle) * axis);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - Math.cos(angle) * axis, cy + Math.sin(angle) * axis);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const horizonY = canvas.height * 0.35;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(canvas.width, horizonY);
  ctx.stroke();

  const vanishingPoints = [];
  if (mode === 'perspective1') {
    vanishingPoints.push({ x: canvas.width / 2, y: horizonY });
  }
  if (mode === 'perspective2') {
    vanishingPoints.push({ x: canvas.width * 0.18, y: horizonY });
    vanishingPoints.push({ x: canvas.width * 0.82, y: horizonY });
  }
  if (mode === 'perspective3') {
    vanishingPoints.push({ x: canvas.width * 0.2, y: horizonY });
    vanishingPoints.push({ x: canvas.width * 0.8, y: horizonY });
    vanishingPoints.push({ x: canvas.width / 2, y: canvas.height * 0.85 });
  }

  vanishingPoints.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

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

function previewToShape(preview, layerId = 'layer-1') {
  if (!preview?.type) return null;

  if ((preview.type === 'line' || preview.type === 'tape') && preview.start && preview.end) {
    const isErasePreview = preview.erase === true;
    return {
      type: preview.type,
      layerId,
      start: preview.start,
      end: preview.end,
      mode: preview.mode === 'offset' ? 'offset' : 'direct',
      offset: preview.mode === 'offset' ? (preview.offset ?? preview.end) : null,
      style: {
        stroke: isErasePreview ? '#dc2626' : '#1f2937',
        strokeWidth: 2,
        lineType: isErasePreview ? 'dotted' : 'solid',
      },
      visible: true,
      locked: false,
    };
  }

  if (preview.type === 'curve' && preview.start && preview.control && preview.end) {
    return {
      type: 'curve',
      layerId,
      start: preview.start,
      control: preview.control,
      end: preview.end,
      style: { stroke: '#1f2937', strokeWidth: 2, lineType: 'solid' },
      visible: true,
      locked: false,
    };
  }

  if (preview.type === 'room' && preview.start && preview.end) {
    const x = Math.min(preview.start.x, preview.end.x);
    const y = Math.min(preview.start.y, preview.end.y);
    return {
      type: 'room',
      layerId,
      x,
      y,
      width: Math.abs(preview.end.x - preview.start.x),
      height: Math.abs(preview.end.y - preview.start.y),
      style: { stroke: '#1f2937', strokeWidth: 2, fill: '#0f4c81', fillAlpha: 0.12, lineType: 'solid' },
      filled: false,
      visible: true,
      locked: false,
    };
  }

  if (preview.type === 'ellipse' && preview.start && preview.end) {
    const x = Math.min(preview.start.x, preview.end.x);
    const y = Math.min(preview.start.y, preview.end.y);
    return {
      type: 'ellipse',
      layerId,
      x,
      y,
      width: Math.abs(preview.end.x - preview.start.x),
      height: Math.abs(preview.end.y - preview.start.y),
      style: { stroke: '#1f2937', strokeWidth: 2, lineType: 'solid' },
      visible: true,
      locked: false,
    };
  }

  return null;
}


function drawPenPreview(ctx, preview, layerId, settings) {
  if (preview?.type !== 'pen' || !Array.isArray(preview.points) || preview.points.length < 2) return;

  const behavior = getShapeBehavior('pen');
  if (!behavior?.draw) return;

  const style = { stroke: '#1f2937', strokeWidth: 2, lineType: 'solid' };
  behavior.draw(ctx, {
    type: 'pen',
    layerId,
    points: preview.points,
    style,
    visible: true,
    locked: false,
  }, { settings });
}

function drawPreviewShape(ctx, interactionContext) {
  const preview = interactionContext?.ephemeral?.preview;
  const { documentData, appState } = interactionContext?.store ?? {};
  const layerId = resolveActiveLayerId(documentData, appState?.activeLayerId);
  const settings = documentData?.settings ?? {};

  ctx.save();
  ctx.globalAlpha = 0.7;

  if (preview?.type === 'pen') {
    drawPenPreview(ctx, preview, layerId, settings);
    ctx.restore();
    return;
  }

  const shape = previewToShape(preview, layerId);
  if (!shape) {
    ctx.restore();
    return;
  }

  const behavior = getShapeBehavior(shape.type);
  if (!behavior?.draw) {
    ctx.restore();
    return;
  }

  behavior.draw(ctx, shape, { settings, isPreview: true });
  ctx.restore();
}

export function renderCanvas({ ctx, canvas, documentData, appState, activeTool, interactionContext }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid(ctx, canvas, documentData, appState);
  drawProjectionOverlay(ctx, canvas, appState);

  ctx.save();
  ctx.translate(appState.panX, appState.panY);
  ctx.scale(appState.zoom, appState.zoom);

  const projection = createProjectionContext(appState);
  drawShapes(ctx, documentData, { library: interactionContext?.store?.library, projection });
  drawPreviewShape(ctx, interactionContext);
  drawSelection(ctx, documentData, appState);

  activeTool?.drawOverlay?.(interactionContext);

  ctx.restore();

  drawCursorPreview(canvas, interactionContext);
}
