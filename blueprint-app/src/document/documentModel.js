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
      axisSnap: true,
      units: 'ft',
      showMeasurements: true,
      showCursorPreview: true,
    },
    layers: [],
    shapes: [],
  };
}
