import { createLabelShape } from '../document/shapeFactory.js';
import { addShape, setSelection } from '../app/actions.js';
import { resolveActiveLayerId } from '../document/layerModel.js';

export const labelTool = {
  id: 'label',

  onPointerDown(context, point) {
    const { documentData } = context.store;
    const shape = createLabelShape({
      layerId: resolveActiveLayerId(documentData, context.store.appState.activeLayerId),
      x: point.x,
      y: point.y,
      text: 'Text',
      style: context.store.appState.toolStyle,
    });
    addShape(shape);
    setSelection([]);
    context.ephemeral.editingLabelId = shape.id;
    context.ephemeral.editingLabelDirty = false;
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
