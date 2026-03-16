import { selectTool } from './selectTool.js';
import { lineTool } from './lineTool.js';
import { roomTool } from './roomTool.js';

export const toolRegistry = {
  select: selectTool,
  line: lineTool,
  room: roomTool,
};

export function getTool(toolId) {
  return toolRegistry[toolId] ?? toolRegistry.select;
}
