import { resolveIsometricOrientation, snapPointToIsoAxis } from '../canvas/isoMath.js';
const PROJECTION_MODES = new Set(['orthographic', 'perspective1', 'perspective2', 'perspective3', 'isometric']);

export function resolveProjectionMode(appState) {
  const candidate = appState?.view?.projectionMode;
  return PROJECTION_MODES.has(candidate) ? candidate : 'orthographic';
}

export function screenToWorld(point, appState) {
  return {
    x: (point.x - appState.panX) / appState.zoom,
    y: (point.y - appState.panY) / appState.zoom,
  };
}

export function worldToScreen(point, appState) {
  return {
    x: point.x * appState.zoom + appState.panX,
    y: point.y * appState.zoom + appState.panY,
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
