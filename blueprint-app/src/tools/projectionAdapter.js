import { createProjectionContext } from '../canvas/projection.js';

export function toCanonicalPoint(context, point) {
  const projection = createProjectionContext(context.store.appState);
  return projection.unprojectPoint(point);
}

export function fromCanonicalPoint(context, point) {
  const projection = createProjectionContext(context.store.appState);
  return projection.projectPoint(point);
}
