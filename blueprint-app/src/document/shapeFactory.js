import { generateId } from '../utils/idGenerator.js';

const defaultStyle = {
  stroke: '#1f2937',
  strokeWidth: 2,
  fill: '#0f4c81',
  fillAlpha: 0.12,
  textSize: 14,
  fontFamily: 'Inter, Segoe UI, Tahoma, sans-serif',
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


export function createTapeShape({ layerId, start, end }) {
  return {
    id: generateId('shape'),
    type: 'tape',
    layerId,
    start,
    end,
    style: { ...defaultStyle, stroke: '#0f4c81' },
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
    filled: false,
    visible: true,
    locked: false,
  };
}

export function createLabelShape({ layerId, x, y, text = 'Text' }) {
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


export function createRegionShape({ layerId, points }) {
  return {
    id: generateId('shape'),
    type: 'region',
    layerId,
    points: points.map((point) => ({ x: point.x, y: point.y })),
    style: { ...defaultStyle },
    filled: true,
    visible: true,
    locked: false,
  };
}


export function createLibraryShape({ layerId, x, y, grid }) {
  return {
    id: generateId('shape'),
    type: 'library-shape',
    layerId,
    x,
    y,
    grid: grid.map((row) => row.map((value) => (value ? 1 : 0))),
    cellSize: 12,
    style: { ...defaultStyle, fillAlpha: 1 },
    visible: true,
    locked: false,
  };
}

