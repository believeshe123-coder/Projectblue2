function inBounds(x, y, size = 10) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function activeCells(shape) {
  const cells = [];
  for (let y = 0; y < 10; y += 1) {
    for (let x = 0; x < 10; x += 1) {
      if (shape.grid?.[y]?.[x]) cells.push({ x, y });
    }
  }
  return cells;
}

export const libraryShape = {
  draw(ctx, shape) {
    const cellSize = shape.cellSize ?? 12;
    const cells = activeCells(shape);
    if (!cells.length) return;

    ctx.save();
    ctx.fillStyle = shape.style?.fill ?? '#0f4c81';
    ctx.strokeStyle = shape.style?.stroke ?? '#1f2937';
    ctx.lineWidth = shape.style?.strokeWidth ?? 1;

    cells.forEach((cell) => {
      const x = shape.x + cell.x * cellSize;
      const y = shape.y + cell.y * cellSize;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeRect(x, y, cellSize, cellSize);
    });

    ctx.restore();
  },

  hitTest(shape, point) {
    const cellSize = shape.cellSize ?? 12;
    const localX = Math.floor((point.x - shape.x) / cellSize);
    const localY = Math.floor((point.y - shape.y) / cellSize);
    if (!inBounds(localX, localY)) return false;
    return Boolean(shape.grid?.[localY]?.[localX]);
  },

  getBounds(shape) {
    const cellSize = shape.cellSize ?? 12;
    return { x: shape.x, y: shape.y, width: cellSize * 10, height: cellSize * 10 };
  },

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },
};
