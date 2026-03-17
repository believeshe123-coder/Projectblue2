export function colorWithAlpha(color, alpha = 1, fallback = '#0f4c81') {
  const normalizedAlpha = Math.min(1, Math.max(0, Number.isFinite(alpha) ? alpha : 1));
  const source = typeof color === 'string' && color.trim() ? color.trim() : fallback;

  const parser = document.createElement('canvas').getContext('2d');
  if (!parser) return `rgba(15, 76, 129, ${normalizedAlpha})`;

  parser.fillStyle = '#000000';
  parser.fillStyle = source;
  const parsed = parser.fillStyle;
  const rgbMatch = typeof parsed === 'string' ? parsed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i) : null;

  if (!rgbMatch) return `rgba(15, 76, 129, ${normalizedAlpha})`;
  const [, r, g, b] = rgbMatch;
  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
}
