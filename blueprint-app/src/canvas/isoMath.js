export const ISO_COS = 0.5;
export const ISO_SIN = 0.8660254037844386; // sqrt(3)/2
export const ISO_TAN = 1.7320508075688772; // sqrt(3)

export function resolveIsometricOrientation(settings = {}) {
  return settings?.isometricOrientation === 'horizontal' ? 'horizontal' : 'vertical';
}

export function isoProject(point) {
  return { x: point.x - point.y * ISO_COS, y: point.y * ISO_SIN };
}

export function isoUnproject(point) {
  return { x: point.x + point.y / ISO_TAN, y: point.y / ISO_SIN };
}

export function isoAxisDirections(orientation = 'vertical') {
  if (orientation === 'horizontal') {
    return [
      { x: 0, y: 1 },
      { x: ISO_SIN, y: ISO_COS },
      { x: ISO_SIN, y: -ISO_COS },
    ];
  }
  return [
    { x: 1, y: 0 },
    { x: ISO_COS, y: ISO_SIN },
    { x: -ISO_COS, y: ISO_SIN },
  ];
}

export function snapPointToIsoAxis(point, anchorPoint, orientation = 'vertical') {
  const axes = isoAxisDirections(orientation);
  const dx = point.x - anchorPoint.x;
  const dy = point.y - anchorPoint.y;
  let best = axes[0];
  let bestDot = -Infinity;
  for (const axis of axes) {
    const dot = Math.abs(dx * axis.x + dy * axis.y);
    if (dot > bestDot) {
      bestDot = dot;
      best = axis;
    }
  }
  const projection = dx * best.x + dy * best.y;
  return { x: anchorPoint.x + best.x * projection, y: anchorPoint.y + best.y * projection };
}
