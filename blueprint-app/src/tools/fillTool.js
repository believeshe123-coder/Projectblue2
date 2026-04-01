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

function edgeKey(a, b) {
  return `${a}>${b}`;
}

function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function pointOnQuadratic(t, p0, p1, p2) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function sampleCurvePoints(shape, samples = 24) {
  const points = [];
  for (let index = 0; index <= samples; index += 1) {
    points.push(pointOnQuadratic(index / samples, shape.start, shape.control, shape.end));
  }
  return points;
}

function reversePoints(points) {
  return [...points].reverse().map((point) => ({ x: point.x, y: point.y }));
}

function buildBoundaryGraph(documentData) {
  const byKey = new Map();
  const adjacency = new Map();
  const directedPaths = new Map();
  const pairPaths = new Map();

  const upsertVertex = (point) => {
    const key = `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
    if (!byKey.has(key)) {
      byKey.set(key, { key, x: point.x, y: point.y });
      adjacency.set(key, new Set());
    }
    return byKey.get(key);
  };

  const addEdgePath = (from, to, points) => {
    adjacency.get(from.key).add(to.key);
    adjacency.get(to.key).add(from.key);

    directedPaths.set(edgeKey(from.key, to.key), points);
    directedPaths.set(edgeKey(to.key, from.key), reversePoints(points));

    const pKey = pairKey(from.key, to.key);
    if (!pairPaths.has(pKey)) pairPaths.set(pKey, []);
    pairPaths.get(pKey).push({ from: from.key, to: to.key, points });
  };

  for (const shape of documentData.shapes) {
    if (!shape.visible || shape.locked) continue;

    if (shape.type === 'line' || shape.type === 'curve') {
      const start = upsertVertex(shape.start);
      const end = upsertVertex(shape.end);
      if (start.key === end.key) continue;

      const pathPoints = shape.type === 'curve'
        ? sampleCurvePoints(shape)
        : [{ x: shape.start.x, y: shape.start.y }, { x: shape.end.x, y: shape.end.y }];

      addEdgePath(start, end, pathPoints);
      continue;
    }

    if (shape.type !== 'pen' || !Array.isArray(shape.points) || shape.points.length < 2) continue;
    for (let index = 1; index < shape.points.length; index += 1) {
      const startPoint = shape.points[index - 1];
      const endPoint = shape.points[index];
      const start = upsertVertex(startPoint);
      const end = upsertVertex(endPoint);
      if (start.key === end.key) continue;
      addEdgePath(start, end, [startPoint, endPoint]);
    }
  }

  return { byKey, adjacency, directedPaths, pairPaths };
}

function pathToPolygon(path, graph) {
  const polygon = [];

  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index].key;
    const to = path[index + 1].key;

    const directed = graph.directedPaths.get(edgeKey(from, to));
    let points = directed;

    if (!points) {
      const candidates = graph.pairPaths.get(pairKey(from, to)) ?? [];
      const matched = candidates.find((candidate) => candidate.from === from && candidate.to === to)
        ?? candidates[0];
      if (!matched) return [];
      points = matched.from === from ? matched.points : reversePoints(matched.points);
    }

    for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
      if (index > 0 && pointIndex === 0) continue;
      polygon.push(points[pointIndex]);
    }
  }

  return polygon;
}

function findClosedPolygons(documentData, point) {
  const graph = buildBoundaryGraph(documentData);
  const { byKey, adjacency } = graph;
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

        const polygon = pathToPolygon(cycle, graph);
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

function getActiveFillStyle(store) {
  const selectedId = store.appState.selectedIds[0];
  const selectedShape = store.documentData.shapes.find((shape) => shape.id === selectedId);
  const selectedStyle = selectedShape?.style ?? {};
  const configured = store.appState.fillStyle ?? {};

  return {
    fill: selectedStyle.fill ?? configured.fill ?? '#0f4c81',
    fillAlpha: Number.isFinite(selectedStyle.fillAlpha)
      ? selectedStyle.fillAlpha
      : (Number.isFinite(configured.fillAlpha) ? configured.fillAlpha : 0.12),
    fillMode: selectedStyle.fillMode ?? configured.fillMode ?? 'color',
    textureId: selectedStyle.textureId ?? configured.textureId ?? null,
    textureColorMode: selectedStyle.textureColorMode ?? configured.textureColorMode ?? 'original',
    textureScale: Number.isFinite(selectedStyle.textureScale)
      ? selectedStyle.textureScale
      : (Number.isFinite(configured.textureScale) ? configured.textureScale : 1),
  };
}

export const fillTool = {
  id: 'fill',

  onPointerDown(context, point) {
    const { store } = context;
    const activeFillStyle = getActiveFillStyle(store);
    const polygons = findClosedPolygons(store.documentData, point);
    const target = polygons[0];
    if (target) {
      const existing = findMatchingRegion(store.documentData, target.points);
      if (existing) {
        existing.filled = true;
        existing.style = { ...existing.style, ...activeFillStyle };
        setSelection([existing.id]);
        pushDocumentHistory();
        store.notify();
        return;
      }

      const region = createRegionShape({
        layerId: store.documentData.layers[0].id,
        points: target.points,
      });
      region.style = { ...region.style, ...activeFillStyle };

      addRegionShapeAtBack(store, region);
      setSelection([region.id]);
      pushDocumentHistory();
      store.notify();
      return;
    }

    const hit = findShapeAtPoint(store.documentData, point);
    if (!(hit && isClosedShape(hit))) return;

    hit.filled = true;
    hit.style = { ...hit.style, ...activeFillStyle };
    setSelection([hit.id]);
    pushDocumentHistory();
    store.notify();
  },

  onPointerMove() {},
  onPointerUp() {},
  onKeyDown() {},
  drawOverlay() {},
};
