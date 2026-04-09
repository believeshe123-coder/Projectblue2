import { selectTool } from './selectTool.js';
import { lineTool } from './lineTool.js';
import { penTool } from './penTool.js';
import { roomTool } from './roomTool.js';
import { curveTool } from './curveTool.js';
import { circleTool, ovalTool } from './ellipseTool.js';
import { labelTool } from './labelTool.js';
import { tapeTool } from './tapeTool.js';
import { fillTool } from './fillTool.js';
import { eraseTool } from './eraseTool.js';
import { placeShapeTool } from './placeShapeTool.js';
import { panTool } from './panTool.js';

export const toolRegistry = {
  select: selectTool,
  pan: panTool,
  pen: penTool,
  line: lineTool,
  room: roomTool,
  curve: curveTool,
  circle: circleTool,
  oval: ovalTool,
  label: labelTool,
  tape: tapeTool,
  fill: fillTool,
  erase: eraseTool,
  'place-shape': placeShapeTool,
};

export function getTool(toolId) {
  return toolRegistry[toolId] ?? toolRegistry.select;
}
