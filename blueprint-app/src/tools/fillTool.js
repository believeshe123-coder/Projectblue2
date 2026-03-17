import { pushDocumentHistory, setSelection } from '../app/actions.js';
import { findShapeAtPoint } from '../interaction/hitTest.js';

function isClosedShape(shape) {
  return shape?.type === 'room';
}

export const fillTool = {
  id: 'fill',

  onPointerDown(context, point) {
    const { store } = context;
    const hit = findShapeAtPoint(store.documentData, point);
    if (!hit || !isClosedShape(hit)) return;

    if (hit.filled === true) {
      setSelection([hit.id]);
      return;
    }

    hit.filled = true;
    setSelection([hit.id]);
    pushDocumentHistory();
    store.notify();
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
