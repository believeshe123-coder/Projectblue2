import { createLabelShape } from '../document/shapeFactory.js';
import { addShape, setSelection } from '../app/actions.js';

export const labelTool = {
  id: 'label',

  onPointerDown(context, point) {
    const { documentData } = context.store;
    const shape = createLabelShape({
      layerId: documentData.layers[0].id,
      x: point.x,
      y: point.y,
      text: 'Text',
    });
    addShape(shape);
    setSelection([shape.id]);
    context.ephemeral.editingLabelId = shape.id;
    context.ephemeral.editingLabelDirty = false;
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
