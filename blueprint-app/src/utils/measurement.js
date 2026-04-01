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

export function shouldRenderMeasurements(settings = {}, isPreview = false) {
  return isPreview
    ? shouldRenderDrawingMeasurements(settings)
    : shouldRenderPersistedMeasurements(settings);
}

export function resolveMeasurementLabelStyle(settings = {}) {
  const fontSize = Math.min(48, Math.max(8, Number(settings.measurementLabelSize) || 12));
  const fontFamily = settings.measurementLabelFont || 'Inter, Segoe UI, Tahoma, sans-serif';
  const textColor = settings.measurementLabelColor || '#0f4c81';
  const backgroundColor = settings.measurementLabelBackground || '#ffffff';
  const borderColor = settings.measurementLabelBorderColor || textColor;

  return { fontSize, fontFamily, textColor, backgroundColor, borderColor };
}

export function drawMeasurementLabel(ctx, x, y, text, settings = {}) {
  const style = resolveMeasurementLabelStyle(settings);
  const horizontalPadding = Math.max(6, Math.round(style.fontSize * 0.5));
  const verticalPadding = Math.max(4, Math.round(style.fontSize * 0.25));
  const labelHeight = style.fontSize + verticalPadding * 2;

  ctx.save();
  ctx.font = `${style.fontSize}px ${style.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const width = ctx.measureText(text).width + horizontalPadding * 2;
  ctx.fillStyle = style.backgroundColor;
  ctx.strokeStyle = style.borderColor;
  ctx.lineWidth = 1;
  ctx.fillRect(x - width / 2, y - labelHeight / 2, width, labelHeight);
  ctx.strokeRect(x - width / 2, y - labelHeight / 2, width, labelHeight);

  ctx.fillStyle = style.textColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}
