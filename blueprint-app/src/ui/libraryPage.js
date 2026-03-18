const DEFAULT_GRID_SIZE = 10;
const TEXTURE_TILE_SIZE = 2;
const TEXTURE_PREVIEW_SIZE = 10;

function createEmptyGrid(size = DEFAULT_GRID_SIZE) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

function normalizeGridSize(grid, size) {
  if (!Array.isArray(grid) || !grid.length) return createEmptyGrid(size);
  const normalized = createEmptyGrid(size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      normalized[y][x] = grid?.[y]?.[x] ? 1 : 0;
    }
  }
  return normalized;
}

function gridEditor({ title, store, initialName = '', initialGrid = null, onSave, includeUpload = false, initialDataUrl = '' }) {
  const overlay = document.createElement('div');
  overlay.className = 'library-editor-overlay';
  overlay.innerHTML = `
    <div class="library-editor-dialog">
      <h3>${title}</h3>
      <label>Name <input id="lib-name" type="text" value="${initialName}" /></label>
      ${includeUpload ? '<label>Upload image <input id="lib-image" type="file" accept="image/*" /></label><div class="texture-upload-preview-wrap"><img id="texture-upload-preview" alt="texture upload preview" /></div>' : ''}
      <div class="library-editor-layout">
        <div class="library-tools" aria-label="Editor tools">
          <button type="button" data-tool="select">Select</button>
          <button type="button" data-tool="pen">Pen</button>
          <button type="button" data-tool="line">Line</button>
          <button type="button" data-tool="room">Room</button>
          <button type="button" data-tool="curve">Curve</button>
          <button type="button" data-tool="label">Label</button>
          <button type="button" data-tool="tape">Measure</button>
          <button type="button" data-tool="fill">Fill</button>
          <button type="button" data-tool="erase">Erase</button>
          <button type="button" data-tool="place-shape">Place Shape</button>
        </div>
        <canvas id="lib-grid" width="240" height="240"></canvas>
        ${includeUpload ? '<div class="texture-repeat-preview"><h4>Repeat Preview (10x10)</h4><canvas id="lib-texture-repeat-preview" width="240" height="240"></canvas></div>' : ''}
      </div>
      <p class="library-tool-hint" id="lib-tool-hint"></p>
      <div class="button-row">
        <button id="lib-save" type="button">Save</button>
        <button id="lib-cancel" type="button">Cancel</button>
      </div>
    </div>
  `;

  const canvas = overlay.querySelector('#lib-grid');
  const ctx = canvas.getContext('2d');
  const repeatPreviewCanvas = overlay.querySelector('#lib-texture-repeat-preview');
  const repeatPreviewCtx = repeatPreviewCanvas?.getContext('2d');
  const hint = overlay.querySelector('#lib-tool-hint');
  const size = includeUpload ? TEXTURE_TILE_SIZE : DEFAULT_GRID_SIZE;
  const previewSize = includeUpload ? TEXTURE_PREVIEW_SIZE : size;
  const cell = canvas.width / size;
  const texturePaintCanvas = includeUpload ? document.createElement('canvas') : null;
  const texturePaintCtx = texturePaintCanvas?.getContext('2d');

  if (texturePaintCanvas) {
    texturePaintCanvas.width = canvas.width;
    texturePaintCanvas.height = canvas.height;
  }

  const grid = normalizeGridSize(initialGrid, size);

  let tool = 'pen';
  let drawing = false;
  let dragCell = null;
  let lineStart = null;
  let lineStartPoint = null;
  let roomStart = null;
  let curveStart = null;
  let curveControl = null;
  let hoverCell = null;
  let penTrail = [];
  let dataUrl = initialDataUrl;
  let repeatImage = null;
  let repeatImageUrl = '';
  let strokeActive = false;

  const TOOL_HINTS = {
    select: 'Select: inspect only (no drawing).',
    pen: 'Pen: drag to draw freehand.',
    line: 'Line: click once to start, click again to finish.',
    room: 'Room: drag to draw a filled rectangle.',
    curve: 'Curve: click start, click control, click end.',
    label: 'Label: click to place one pixel.',
    tape: 'Measure: preview only in this editor.',
    fill: 'Fill: click a cell to flood-fill connected area.',
    erase: 'Erase: drag to erase freehand.',
    'place-shape': 'Place Shape: pick a saved shape and click to stamp it.',
  };

  const imageInput = overlay.querySelector('#lib-image');
  const imgPreview = overlay.querySelector('#texture-upload-preview');
  if (imgPreview && dataUrl) imgPreview.src = dataUrl;

  function setHint() {
    hint.textContent = TOOL_HINTS[tool] ?? '';
  }

  function drawTextureRepeatPreview() {
    if (!repeatPreviewCanvas || !repeatPreviewCtx) return;

    repeatPreviewCtx.clearRect(0, 0, repeatPreviewCanvas.width, repeatPreviewCanvas.height);

    if (includeUpload && texturePaintCanvas) {
      const pattern = repeatPreviewCtx.createPattern(texturePaintCanvas, 'repeat');
      if (!pattern) return;
      repeatPreviewCtx.fillStyle = pattern;
      repeatPreviewCtx.fillRect(0, 0, repeatPreviewCanvas.width, repeatPreviewCanvas.height);
      return;
    }

    if (dataUrl) {
      if (repeatImageUrl !== dataUrl) {
        repeatImage = new Image();
        repeatImageUrl = dataUrl;
        repeatImage.onload = () => drawTextureRepeatPreview();
        repeatImage.src = dataUrl;
        return;
      }

      if (repeatImage?.complete) {
        const pattern = repeatPreviewCtx.createPattern(repeatImage, 'repeat');
        if (!pattern) return;
        repeatPreviewCtx.fillStyle = pattern;
        repeatPreviewCtx.fillRect(0, 0, repeatPreviewCanvas.width, repeatPreviewCanvas.height);
      }
      return;
    }

    const previewCell = repeatPreviewCanvas.width / previewSize;
    for (let y = 0; y < previewSize; y += 1) {
      for (let x = 0; x < previewSize; x += 1) {
        const value = grid[y % size][x % size];
        repeatPreviewCtx.fillStyle = value ? '#0f4c81' : '#ffffff';
        repeatPreviewCtx.fillRect(x * previewCell, y * previewCell, previewCell, previewCell);
        repeatPreviewCtx.strokeStyle = '#d5dbe5';
        repeatPreviewCtx.strokeRect(x * previewCell, y * previewCell, previewCell, previewCell);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (includeUpload && texturePaintCanvas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(texturePaintCanvas, 0, 0);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          ctx.strokeStyle = '#d5dbe5';
          ctx.strokeRect(x * cell, y * cell, cell, cell);
        }
      }

      drawToolPreview();
      drawTextureRepeatPreview();
      return;
    }

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        ctx.fillStyle = grid[y][x] ? '#0f4c81' : '#ffffff';
        ctx.fillRect(x * cell, y * cell, cell, cell);
        ctx.strokeStyle = '#d5dbe5';
        ctx.strokeRect(x * cell, y * cell, cell, cell);
      }
    }

    drawToolPreview();

    drawTextureRepeatPreview();
  }

  function cellCenter(point) {
    return {
      x: (point.x * cell) + (cell / 2),
      y: (point.y * cell) + (cell / 2),
    };
  }

  function drawToolPreview() {
    if (!hoverCell) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(15, 76, 129, 0.85)';
    ctx.lineWidth = 2;

    if (tool === 'line' && lineStart) {
      const start = includeUpload && lineStartPoint ? lineStartPoint : cellCenter(lineStart);
      const end = includeUpload ? penTrail[0] ?? start : cellCenter(hoverCell);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    if (tool === 'room' && roomStart) {
      const minX = Math.min(roomStart.x, hoverCell.x) * cell;
      const minY = Math.min(roomStart.y, hoverCell.y) * cell;
      const width = (Math.abs(hoverCell.x - roomStart.x) + 1) * cell;
      const height = (Math.abs(hoverCell.y - roomStart.y) + 1) * cell;
      ctx.strokeRect(minX, minY, width, height);
    }

    if (tool === 'curve' && curveStart) {
      const start = cellCenter(curveStart);
      const control = cellCenter(curveControl ?? hoverCell);
      const end = cellCenter(hoverCell);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
      ctx.stroke();
    }

    if ((tool === 'pen' || tool === 'erase') && penTrail.length > 1) {
      ctx.strokeStyle = tool === 'erase' ? 'rgba(220, 38, 38, 0.8)' : 'rgba(15, 76, 129, 0.9)';
      ctx.lineWidth = Math.max(2, cell * 0.12);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(penTrail[0].x, penTrail[0].y);
      for (let index = 1; index < penTrail.length; index += 1) {
        ctx.lineTo(penTrail[index].x, penTrail[index].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function setCell(x, y, value) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    grid[y][x] = value;
  }

  function startTextureStroke(point) {
    if (!texturePaintCtx) return;
    texturePaintCtx.save();
    texturePaintCtx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
    texturePaintCtx.strokeStyle = '#0f4c81';
    texturePaintCtx.lineWidth = Math.max(2, canvas.width * 0.02);
    texturePaintCtx.lineJoin = 'round';
    texturePaintCtx.lineCap = 'round';
    texturePaintCtx.beginPath();
    texturePaintCtx.moveTo(point.x, point.y);
    texturePaintCtx.lineTo(point.x, point.y);
    texturePaintCtx.stroke();
    texturePaintCtx.restore();
    penTrail = [point];
    strokeActive = true;
  }

  function continueTextureStroke(point) {
    if (!texturePaintCtx || !strokeActive) return;
    const previous = penTrail[penTrail.length - 1] ?? point;
    texturePaintCtx.save();
    texturePaintCtx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
    texturePaintCtx.strokeStyle = '#0f4c81';
    texturePaintCtx.lineWidth = Math.max(2, canvas.width * 0.02);
    texturePaintCtx.lineJoin = 'round';
    texturePaintCtx.lineCap = 'round';
    texturePaintCtx.beginPath();
    texturePaintCtx.moveTo(previous.x, previous.y);
    texturePaintCtx.lineTo(point.x, point.y);
    texturePaintCtx.stroke();
    texturePaintCtx.restore();
    penTrail.push(point);
  }

  function endTextureStroke() {
    strokeActive = false;
  }

  function drawTextureLine(a, b) {
    if (!texturePaintCtx) return;
    texturePaintCtx.save();
    texturePaintCtx.globalCompositeOperation = 'source-over';
    texturePaintCtx.strokeStyle = '#0f4c81';
    texturePaintCtx.lineWidth = Math.max(2, canvas.width * 0.02);
    texturePaintCtx.lineJoin = 'round';
    texturePaintCtx.lineCap = 'round';
    texturePaintCtx.beginPath();
    texturePaintCtx.moveTo(a.x, a.y);
    texturePaintCtx.lineTo(b.x, b.y);
    texturePaintCtx.stroke();
    texturePaintCtx.restore();
  }

  function canvasCell(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor((event.clientX - rect.left) / cell),
      y: Math.floor((event.clientY - rect.top) / cell),
    };
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(canvas.height, event.clientY - rect.top)),
    };
  }

  function drawLine(a, b, value) {
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    const sx = a.x < b.x ? 1 : -1;
    const sy = a.y < b.y ? 1 : -1;
    let err = dx - dy;
    let x = a.x;
    let y = a.y;

    while (true) {
      setCell(x, y, value);
      if (x === b.x && y === b.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  function drawRect(a, b, value) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        setCell(x, y, value);
      }
    }
  }

  function drawCurve(a, c, b, value) {
    const steps = 40;
    let previous = a;
    for (let index = 1; index <= steps; index += 1) {
      const t = index / steps;
      const mt = 1 - t;
      const point = {
        x: Math.round((mt * mt * a.x) + (2 * mt * t * c.x) + (t * t * b.x)),
        y: Math.round((mt * mt * a.y) + (2 * mt * t * c.y) + (t * t * b.y)),
      };
      drawLine(previous, point, value);
      previous = point;
    }
  }

  function floodFill(originX, originY, value) {
    if (originX < 0 || originY < 0 || originX >= size || originY >= size) return;
    const target = grid[originY][originX];
    if (target === value) return;

    const queue = [{ x: originX, y: originY }];
    while (queue.length) {
      const point = queue.pop();
      if (point.x < 0 || point.y < 0 || point.x >= size || point.y >= size) continue;
      if (grid[point.y][point.x] !== target) continue;
      grid[point.y][point.x] = value;
      queue.push({ x: point.x + 1, y: point.y });
      queue.push({ x: point.x - 1, y: point.y });
      queue.push({ x: point.x, y: point.y + 1 });
      queue.push({ x: point.x, y: point.y - 1 });
    }
  }

  function stampShape(pos) {
    if (!store?.library?.shapes?.length) {
      window.alert('No saved shapes yet. Create one first.');
      return;
    }

    const options = store.library.shapes.map((shape, index) => `${index + 1}. ${shape.name}`).join('\n');
    const choice = window.prompt(`Pick shape number to stamp:
${options}`);
    const selectedIndex = Number.parseInt(choice, 10) - 1;
    const selected = store.library.shapes[selectedIndex];
    if (!selected) return;

    const shapeSize = selected.grid?.length || 0;
    const anchorOffset = Math.floor(shapeSize / 2);
    selected.grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        setCell(pos.x + x - anchorOffset, pos.y + y - anchorOffset, 1);
      });
    });
  }

  function resetToolState() {
    drawing = false;
    dragCell = null;
    lineStart = null;
    lineStartPoint = null;
    roomStart = null;
    curveStart = null;
    curveControl = null;
    penTrail = [];
    strokeActive = false;
  }

  function loadTexturePaintFromDataUrl(url) {
    if (!texturePaintCtx || !texturePaintCanvas) return;
    texturePaintCtx.clearRect(0, 0, texturePaintCanvas.width, texturePaintCanvas.height);
    if (!url) return;
    const image = new Image();
    image.onload = () => {
      texturePaintCtx.clearRect(0, 0, texturePaintCanvas.width, texturePaintCanvas.height);
      texturePaintCtx.drawImage(image, 0, 0, texturePaintCanvas.width, texturePaintCanvas.height);
      draw();
    };
    image.src = url;
  }

  if (includeUpload && texturePaintCanvas) {
    if (initialDataUrl) {
      loadTexturePaintFromDataUrl(initialDataUrl);
    } else if (Array.isArray(initialGrid)) {
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          if (!grid[y][x]) continue;
          texturePaintCtx.fillStyle = '#0f4c81';
          texturePaintCtx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
  }

  overlay.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      tool = button.dataset.tool;
      resetToolState();
      overlay.querySelectorAll('[data-tool]').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
      setHint();
      draw();
    });
  });
  overlay.querySelector('[data-tool="pen"]').classList.add('active');
  setHint();

  canvas.addEventListener('pointerdown', (event) => {
    const pos = canvasCell(event);
    drawing = true;

    if (tool === 'select' || tool === 'tape') return;

    if (tool === 'line') {
      if (includeUpload) {
        const point = canvasPoint(event);
        if (lineStartPoint) {
          drawTextureLine(lineStartPoint, point);
          lineStartPoint = null;
          lineStart = null;
          penTrail = [];
        } else {
          lineStartPoint = point;
          lineStart = pos;
          penTrail = [point];
        }
        draw();
        return;
      }

      if (lineStart) {
        drawLine(lineStart, pos, 1);
        lineStart = null;
      } else {
        lineStart = pos;
      }
      draw();
      return;
    }

    if (tool === 'curve') {
      if (!curveStart) {
        curveStart = pos;
      } else if (!curveControl) {
        curveControl = pos;
      } else {
        drawCurve(curveStart, curveControl, pos, 1);
        curveStart = null;
        curveControl = null;
      }
      draw();
      return;
    }

    if (tool === 'room') {
      roomStart = pos;
      dragCell = pos;
      return;
    }

    if (tool === 'fill') {
      floodFill(pos.x, pos.y, 1);
      draw();
      return;
    }

    if (tool === 'place-shape') {
      stampShape(pos);
      draw();
      return;
    }

    if (tool === 'label') {
      setCell(pos.x, pos.y, 1);
      draw();
      return;
    }

    if (includeUpload) {
      startTextureStroke(canvasPoint(event));
      draw();
      return;
    }

    dragCell = pos;
    penTrail = [canvasPoint(event)];
    setCell(pos.x, pos.y, tool === 'erase' ? 0 : 1);
    draw();
  });

  canvas.addEventListener('pointermove', (event) => {
    const pos = canvasCell(event);
    hoverCell = pos;

    if (!drawing) {
      draw();
      return;
    }

    if (tool === 'pen' || tool === 'erase') {
      const point = canvasPoint(event);
      if (includeUpload) {
        continueTextureStroke(point);
        draw();
        return;
      }

      penTrail.push(point);
      if (dragCell) {
        drawLine(dragCell, pos, tool === 'erase' ? 0 : 1);
      } else {
        setCell(pos.x, pos.y, tool === 'erase' ? 0 : 1);
      }
      dragCell = pos;
      draw();
      return;
    }

    if (tool === 'line' || tool === 'room' || tool === 'curve') {
      if (tool === 'line' && includeUpload && lineStartPoint) {
        penTrail = [canvasPoint(event)];
      }
      draw();
    }
  });

  canvas.addEventListener('pointerleave', () => {
    hoverCell = null;
    if (!drawing) penTrail = [];
    draw();
  });

  function onPointerUp(event) {
    if (!drawing) return;
    drawing = false;
    const pos = canvasCell(event);

    if (tool === 'room' && roomStart) {
      drawRect(roomStart, pos, 1);
      roomStart = null;
      draw();
    }

    dragCell = null;
    endTextureStroke();
    penTrail = [];
  }

  window.addEventListener('pointerup', onPointerUp);

  imageInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dataUrl = typeof reader.result === 'string' ? reader.result : '';
      repeatImage = null;
      repeatImageUrl = '';
      if (imgPreview) imgPreview.src = dataUrl;
      if (includeUpload) {
        loadTexturePaintFromDataUrl(dataUrl);
        draw();
      } else {
        drawTextureRepeatPreview();
      }
    };
    reader.readAsDataURL(file);
  });

  function closeEditor() {
    window.removeEventListener('pointerup', onPointerUp);
    overlay.remove();
  }

  overlay.querySelector('#lib-save').addEventListener('click', () => {
    const name = overlay.querySelector('#lib-name').value.trim() || title;
    if (includeUpload && texturePaintCanvas) {
      dataUrl = texturePaintCanvas.toDataURL('image/png');
    }
    onSave({ name, grid, dataUrl });
    closeEditor();
  });

  overlay.querySelector('#lib-cancel').addEventListener('click', closeEditor);

  draw();
  document.body.appendChild(overlay);
}

function drawGridPreview(canvas, grid) {
  const ctx = canvas.getContext('2d');
  const size = Math.max(1, Array.isArray(grid) ? grid.length : DEFAULT_GRID_SIZE);
  const cell = canvas.width / size;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      ctx.fillStyle = grid?.[y]?.[x] ? '#0f4c81' : '#ffffff';
      ctx.fillRect(x * cell, y * cell, cell, cell);
      ctx.strokeStyle = '#d5dbe5';
      ctx.strokeRect(x * cell, y * cell, cell, cell);
    }
  }
}

export function renderLibraryPage({ container }) {
  container.innerHTML = `
    <article class="route-card">
      <h2>Library</h2>
      <p>Library is temporarily disabled.</p>
      <p>No shapes or textures are available right now.</p>
    </article>
  `;
}
