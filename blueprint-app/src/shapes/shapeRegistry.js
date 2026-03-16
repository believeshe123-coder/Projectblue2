import { lineShape } from './lineShape.js';
import { roomShape } from './roomShape.js';
import { labelShape } from './labelShape.js';

export const shapeRegistry = {
  line: lineShape,
  room: roomShape,
  label: labelShape,
};

export function getShapeBehavior(type) {
  return shapeRegistry[type];
}
