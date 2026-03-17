import { lineShape } from './lineShape.js';
import { roomShape } from './roomShape.js';
import { labelShape } from './labelShape.js';
import { curveShape } from './curveShape.js';
import { tapeShape } from './tapeShape.js';
import { regionShape } from './regionShape.js';
import { libraryShape } from './libraryShape.js';

export const shapeRegistry = {
  line: lineShape,
  room: roomShape,
  curve: curveShape,
  label: labelShape,
  tape: tapeShape,
  region: regionShape,
  'library-shape': libraryShape,
};

export function getShapeBehavior(type) {
  return shapeRegistry[type];
}
