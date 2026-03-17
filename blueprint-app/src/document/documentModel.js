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
      snapDebugHalfPoints: false,
      axisSnap: true,
      drawMode: 'click',
      units: 'ft',
      unitsPerGrid: 1,
      measurementMode: 'always',
      showCursorPreview: true,
      selectionOutlineMode: 'always',
      showTapeTool: true,
      showActionToasts: true,
    },
    layers: [],
    shapes: [],
  };
}
