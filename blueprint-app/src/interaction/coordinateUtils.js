import { resolveIsometricOrientation, snapPointToIsoAxis } from '../canvas/isoMath.js';
const PROJECTION_MODES = new Set(['orthographic', 'perspective1', 'perspective2', 'perspective3', 'isometric']);


function toRadians(degrees = 0) {
  return (degrees * Math.PI) / 180;
}

function rotatePoint(point, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

function resolveCanvasRotationRadians(appState) {
  return toRadians(appState?.view?.canvasRotationDeg ?? 0);
}


export function resolveProjectionMode(appState) {
  const candidate = appState?.view?.projectionMode;
  return PROJECTION_MODES.has(candidate) ? candidate : 'orthographic';
}

export function screenToWorld(point, appState) {
  const localPoint = {
    x: (point.x - appState.panX) / appState.zoom,
    y: (point.y - appState.panY) / appState.zoom,
  };
  return rotatePoint(localPoint, -resolveCanvasRotationRadians(appState));
}

export function worldToScreen(point, appState) {
  const rotatedPoint = rotatePoint(point, resolveCanvasRotationRadians(appState));
  return {
    x: rotatedPoint.x * appState.zoom + appState.panX,
    y: rotatedPoint.y * appState.zoom + appState.panY,
  };
}

export function projectWorldToScreen(point, appState) {
  return worldToScreen(point, appState);
}

export function unprojectScreenToWorld(point, appState) {
  return screenToWorld(point, appState);
}

export function alignPointToProjectionAxis(point, anchorPoint, appState, settings = {}) {
  if (!anchorPoint) return point;
  const mode = resolveProjectionMode(appState);
  const dx = point.x - anchorPoint.x;
  const dy = point.y - anchorPoint.y;

  if (mode === 'isometric') {
    const orientation = resolveIsometricOrientation(settings);
    return snapPointToIsoAxis(point, anchorPoint, orientation);
  }

  if (mode.startsWith('perspective')) {
    const horizonY = anchorPoint.y;
    const horizontal = { x: point.x, y: horizonY };
    const vertical = { x: anchorPoint.x, y: point.y };
    const hDistance = Math.abs(point.y - horizonY);
    const vDistance = Math.abs(point.x - anchorPoint.x);
    return hDistance <= vDistance ? horizontal : vertical;
  }

  return point;
}
