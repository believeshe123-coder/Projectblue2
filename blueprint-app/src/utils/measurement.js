export function resolveMeasurementMode(settings = {}) {
  if (settings.measurementMode) return settings.measurementMode;
  return settings.showMeasurements === false ? 'off' : 'always';
}

export function pixelsToUnits(pixels, settings = {}) {
  const gridSize = Number(settings.gridSize) || 25;
  const unitsPerGrid = Number(settings.unitsPerGrid) || 1;
  return (pixels / gridSize) * unitsPerGrid;
}

export function formatMeasurement(pixels, settings = {}) {
  const units = settings.units || 'ft';
  const converted = pixelsToUnits(pixels, settings);
  return `${converted.toFixed(1)} ${units}`;
}

export function shouldRenderPersistedMeasurements(settings = {}) {
  return resolveMeasurementMode(settings) === 'always';
}

export function shouldRenderDrawingMeasurements(settings = {}) {
  const mode = resolveMeasurementMode(settings);
  return mode === 'always' || mode === 'drawing';
}
