import { generateId } from '../utils/idGenerator.js';

const defaultStyle = {
  stroke: '#1f2937',
  strokeWidth: 2,
  fill: '#0f4c81',
  fillAlpha: 0.12,
  textSize: 14,
  fontFamily: 'Inter, Segoe UI, Tahoma, sans-serif',
  textureColorMode: 'original',
  textureScale: 1,
};

export function createLineShape({ layerId, start, end, style = {} }) {
  return {
    id: generateId('shape'),
    type: 'line',
    layerId,
    start,
    end,
    style: { ...defaultStyle, ...style },
    visible: true,
    locked: false,
  };
}

export function createCurveShape({ layerId, start, end, control, style = {} }) {
  return {
    id: generateId('shape'),
    type: 'curve',
    layerId,
    start,
    end,
    control,
    style: { ...defaultStyle, ...style },
    visible: true,
    locked: false,
  };
}

export function createEllipseShape({ layerId, x, y, width, height, style = {} }) {
  return {
    id: generateId('shape'),
    type: 'ellipse',
    layerId,
    x,
    y,
    width,
    height,
    style: { ...defaultStyle, ...style },
    visible: true,
    locked: false,
  };
}

export function createPenShape({ layerId, points, style = {} }) {
  return {
    id: generateId('shape'),
    type: 'pen',
    layerId,
    points: points.map((point) => ({ x: point.x, y: point.y })),
    style: { ...defaultStyle, ...style },
    visible: true,
    locked: false,
  };
}


export function createTapeShape({
  layerId,
  start,
  end,
  mode = 'direct',
  offset = null,
  style = {},
  measurementUnitsPerGrid = null,
}) {
  const measurementOverride = Number(measurementUnitsPerGrid);
  const normalizedMeasurementOverride = Number.isFinite(measurementOverride) && measurementOverride > 0
    ? measurementOverride
    : null;

  return {
    id: generateId('shape'),
    type: 'tape',
    layerId,
    start,
    end,
    mode,
    offset,
    measurementUnitsPerGrid: normalizedMeasurementOverride,
    style: { ...defaultStyle, stroke: '#0f4c81', ...style },
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

export function createLabelShape({ layerId, x, y, text = 'Text', style = {} }) {
  return {
    id: generateId('shape'),
    type: 'label',
    layerId,
    x,
    y,
    text,
    angle: 0,
    style: { ...defaultStyle, fill: '#1f2937', ...style },
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
