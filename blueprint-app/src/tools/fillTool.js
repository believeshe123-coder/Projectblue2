import { pushDocumentHistory, setSelection } from '../app/actions.js';
import { findShapeAtPoint } from '../interaction/hitTest.js';
import { createRegionShape } from '../document/shapeFactory.js';

function isClosedShape(shape) {
  return shape?.type === 'room' || shape?.type === 'region';
}

function pointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && (point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || Number.EPSILON) + a.x);
    if (intersects) inside = !inside;
  }

  return inside;
}

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area / 2);
}

function canonicalCycleKey(cycle) {
  const vertices = cycle.slice(0, -1);
  const keys = vertices.map((vertex) => vertex.key);
  const rotations = [];

  for (let i = 0; i < keys.length; i += 1) {
    rotations.push([...keys.slice(i), ...keys.slice(0, i)].join('>'));
  }

  const reversed = [...keys].reverse();
  for (let i = 0; i < reversed.length; i += 1) {
    rotations.push([...reversed.slice(i), ...reversed.slice(0, i)].join('>'));
  }

  return rotations.sort()[0];
}

function buildLineGraph(documentData) {
  const byKey = new Map();
  const adjacency = new Map();

  const upsertVertex = (point) => {
    const key = `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
    if (!byKey.has(key)) {
      byKey.set(key, { key, x: point.x, y: point.y });
      adjacency.set(key, new Set());
    }
    return byKey.get(key);
  };

  for (const shape of documentData.shapes) {
    if (shape.type !== 'line' || !shape.visible || shape.locked) continue;
    const start = upsertVertex(shape.start);
    const end = upsertVertex(shape.end);
    if (start.key === end.key) continue;
    adjacency.get(start.key).add(end.key);
    adjacency.get(end.key).add(start.key);
  }

  return { byKey, adjacency };
}

function findClosedPolygons(documentData, point) {
  const { byKey, adjacency } = buildLineGraph(documentData);
  const vertices = [...byKey.values()];
  const seenCycles = new Set();
  const polygons = [];
  const maxDepth = 18;

  const dfs = (startKey, currentKey, path) => {
    if (path.length > maxDepth) return;

    const neighbors = adjacency.get(currentKey) ?? [];
    for (const nextKey of neighbors) {
      if (nextKey === startKey && path.length >= 3) {
        const cycle = [...path, byKey.get(startKey)];
        const key = canonicalCycleKey(cycle);
        if (seenCycles.has(key)) continue;
        seenCycles.add(key);

        const polygon = cycle.slice(0, -1).map(({ x, y }) => ({ x, y }));
        const area = polygonArea(polygon);
        if (area < 1) continue;
        if (!pointInPolygon(point, polygon)) continue;

        polygons.push({ points: polygon, area });
        continue;
      }

      if (path.some((vertex) => vertex.key === nextKey)) continue;

      dfs(startKey, nextKey, [...path, byKey.get(nextKey)]);
    }
  };

  for (const start of vertices) {
    dfs(start.key, start.key, [start]);
  }

  polygons.sort((a, b) => a.area - b.area);
  return polygons;
}

function polygonEquals(a, b) {
  if (a.length !== b.length) return false;

  const aKeys = a.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`);
  const bKeys = b.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`);

  for (let shift = 0; shift < bKeys.length; shift += 1) {
    let matchesForward = true;
    let matchesReverse = true;

    for (let i = 0; i < aKeys.length; i += 1) {
      if (aKeys[i] !== bKeys[(i + shift) % bKeys.length]) {
        matchesForward = false;
      }

      const reverseIndex = (shift - i + bKeys.length) % bKeys.length;
      if (aKeys[i] !== bKeys[reverseIndex]) {
        matchesReverse = false;
      }

      if (!matchesForward && !matchesReverse) break;
    }

    if (matchesForward || matchesReverse) return true;
  }

  return false;
}

function findMatchingRegion(documentData, polygon) {
  return documentData.shapes.find((shape) => (
    shape.type === 'region'
    && shape.visible
    && Array.isArray(shape.points)
    && polygonEquals(shape.points, polygon)
  ));
}

function addRegionShapeAtBack(store, shape) {
  store.documentData.shapes.unshift(shape);
}

export const fillTool = {
  id: 'fill',

  onPointerDown(context, point) {
    const { store } = context;
    const hit = findShapeAtPoint(store.documentData, point);

    if (hit && isClosedShape(hit)) {
      if (hit.filled === true) {
        setSelection([hit.id]);
        return;
      }

      hit.filled = true;
      setSelection([hit.id]);
      pushDocumentHistory();
      store.notify();
      return;
    }

    const polygons = findClosedPolygons(store.documentData, point);
    const target = polygons[0];
    if (!target) return;

    const existing = findMatchingRegion(store.documentData, target.points);
    if (existing) {
      setSelection([existing.id]);
      store.notify();
      return;
    }

    const region = createRegionShape({
      layerId: store.documentData.layers[0].id,
      points: target.points,
    });

    addRegionShapeAtBack(store, region);
    setSelection([region.id]);
    pushDocumentHistory();
    store.notify();
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
