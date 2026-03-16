import { findShapeAtPoint } from '../interaction/hitTest.js';
import { clearSelection, selectOne, toggleSelection } from '../interaction/selection.js';

export const selectTool = {
  id: 'select',

  onPointerDown(context, point, event) {
    const { store } = context;
    const hit = findShapeAtPoint(store.documentData, point);

    if (!hit) {
      clearSelection(store.appState);
    } else if (event?.shiftKey) {
      toggleSelection(store.appState, hit.id);
    } else {
      selectOne(store.appState, hit.id);
    }
    store.notify();
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
