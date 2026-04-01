import { addShape, patchState, setSelection } from '../app/actions.js';
import { createLibraryShape } from '../document/shapeFactory.js';

export const placeShapeTool = {
  id: 'place-shape',

  onPointerDown(context, point) {
    const templateId = context.store.appState.placeShapeTemplateId;
    if (!templateId) return;

    const template = context.store.library.shapes.find((shape) => shape.id === templateId);
    if (!template) return;

    const shape = createLibraryShape({
      layerId: context.store.documentData.layers[0].id,
      x: point.x,
      y: point.y,
      grid: template.grid,
    });

    addShape(shape);
    setSelection([]);
    patchState({ activeTool: 'select' });
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
