import { lineShape } from './lineShape.js';
import { roomShape } from './roomShape.js';
import { labelShape } from './labelShape.js';
import { curveShape } from './curveShape.js';

export const shapeRegistry = {
  line: lineShape,
  room: roomShape,
  curve: curveShape,
  label: labelShape,
};

export function getShapeBehavior(type) {
  return shapeRegistry[type];
}
