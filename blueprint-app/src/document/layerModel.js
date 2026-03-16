import { generateId } from '../utils/idGenerator.js';

export function createLayer(name = 'Default Layer') {
  return {
    id: generateId('layer'),
    name,
    visible: true,
    locked: false,
  };
}
