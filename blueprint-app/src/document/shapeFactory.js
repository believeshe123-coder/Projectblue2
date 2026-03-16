import { generateId } from '../utils/idGenerator.js';

const defaultStyle = {
  stroke: '#1f2937',
  strokeWidth: 2,
  fill: 'rgba(15, 76, 129, 0.12)',
  textSize: 14,
};

export function createLineShape({ layerId, start, end }) {
  return {
    id: generateId('shape'),
    type: 'line',
    layerId,
    start,
    end,
    style: { ...defaultStyle },
    visible: true,
    locked: false,
  };
}

export function createCurveShape({ layerId, start, end, control }) {
  return {
    id: generateId('shape'),
    type: 'curve',
    layerId,
    start,
    end,
    control,
    style: { ...defaultStyle },
    visible: true,
    locked: false,
  };
}

export function createRoomShape({ layerId, x, y, width, height }) {
  return {
    id: generateId('shape'),
    type: 'room',
    layerId,
    x,
    y,
    width,
    height,
    style: { ...defaultStyle },
    visible: true,
    locked: false,
  };
}

export function createLabelShape({ layerId, x, y, text = 'Label' }) {
  return {
    id: generateId('shape'),
    type: 'label',
    layerId,
    x,
    y,
    text,
    style: { ...defaultStyle, fill: '#1f2937' },
    visible: true,
    locked: false,
  };
}
