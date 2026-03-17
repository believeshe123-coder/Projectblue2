import { selectTool } from './selectTool.js';
import { lineTool } from './lineTool.js';
import { roomTool } from './roomTool.js';
import { curveTool } from './curveTool.js';
import { labelTool } from './labelTool.js';
import { tapeTool } from './tapeTool.js';
import { fillTool } from './fillTool.js';
import { eraseTool } from './eraseTool.js';
import { placeShapeTool } from './placeShapeTool.js';

export const toolRegistry = {
  select: selectTool,
  line: lineTool,
  room: roomTool,
  curve: curveTool,
  label: labelTool,
  tape: tapeTool,
  fill: fillTool,
  erase: eraseTool,
  'place-shape': placeShapeTool,
};

export function getTool(toolId) {
  return toolRegistry[toolId] ?? toolRegistry.select;
}
