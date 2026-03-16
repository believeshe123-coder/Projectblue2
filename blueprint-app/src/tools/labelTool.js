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
      text: 'Label',
    });
    addShape(shape);
    setSelection([shape.id]);
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
