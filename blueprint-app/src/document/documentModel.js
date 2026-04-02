import { createLayer } from './layerModel.js';

/** Blueprint document model (persisted data only). */
export function createDocumentModel() {
  return {
    id: 'doc-1',
    name: 'Blueprint',
    version: 1,
    settings: {
      gridSize: 25,
      showGrid: true,
      snap: true,
      halfGridSnap: false,
      snapDebugHalfPoints: false,
      objectSnap: true,
      objectSnapTolerance: 12,
      axisSnap: true,
      angleSnap: false,
      angleSnapIncrement: 15,
      drawMode: 'click',
      units: 'ft',
      unitsPerGrid: 1,
      measurementMode: 'always',
      tapeMeasureMode: 'direct',
      measurementLabelSize: 12,
      measurementLabelColor: '#0f4c81',
      measurementLabelFont: 'Inter, Segoe UI, Tahoma, sans-serif',
      measurementLabelBackground: '#ffffff',
      measurementLabelBorderColor: '#0f4c81',
      showCursorPreview: true,
      selectionOutlineMode: 'always',
      showTapeTool: true,
      showActionToasts: true,
    },
    // Array order represents z-order from bottom (index 0) to top (last index).
    layers: [createLayer()],
    shapes: [],
  };
}
