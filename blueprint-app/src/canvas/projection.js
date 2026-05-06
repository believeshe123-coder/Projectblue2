import { resolveProjectionMode } from '../interaction/coordinateUtils.js';
import { isoProject, isoUnproject } from './isoMath.js';

function projectIsometric(point) {
  return isoProject(point);
}

function unprojectIsometric(point) {
  return isoUnproject(point);
}

function projectPerspective(point, mode) {
  const strength = mode === 'perspective1' ? 0.0007 : mode === 'perspective2' ? 0.001 : 0.0013;
  const depth = 1 / Math.max(0.45, 1 + point.y * strength);
  return { x: point.x * depth, y: point.y * depth };
}

function unprojectPerspective(point, mode) {
  const strength = mode === 'perspective1' ? 0.0007 : mode === 'perspective2' ? 0.001 : 0.0013;
  const depth = Math.max(0.45, 1 + point.y * strength);
  return { x: point.x * depth, y: point.y * depth };
}

export function createProjectionContext(appState) {
  const mode = resolveProjectionMode(appState);
  return {
    mode,
    projectPoint(point) {
      if (!point) return point;
      if (mode === 'isometric') return projectIsometric(point);
      if (mode.startsWith('perspective')) return projectPerspective(point, mode);
      return point;
    },
    unprojectPoint(point) {
      if (!point) return point;
      if (mode === 'isometric') return unprojectIsometric(point);
      if (mode.startsWith('perspective')) return unprojectPerspective(point, mode);
      return point;
    },
  };
}
