import { patchState, upsertLibraryShape, upsertLibraryTexture } from '../app/actions.js';
import { generateId } from '../utils/idGenerator.js';
import { cloneShapeGrid, cloneTextureGrid } from '../app/libraryStore.js';

function createEmptyGrid() {
  return Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
}

function gridEditor({ title, initialName = '', initialGrid = createEmptyGrid(), onSave, includeUpload = false, initialDataUrl = '' }) {
  const overlay = document.createElement('div');
  overlay.className = 'library-editor-overlay';
  overlay.innerHTML = `
    <div class="library-editor-dialog">
      <h3>${title}</h3>
      <label>Name <input id="lib-name" type="text" value="${initialName}" /></label>
      ${includeUpload ? '<label>Upload image <input id="lib-image" type="file" accept="image/*" /></label><div class="texture-upload-preview-wrap"><img id="texture-upload-preview" alt="texture upload preview" /></div>' : ''}
      <div class="library-tools">
        <button type="button" data-tool="pen">Pen</button>
        <button type="button" data-tool="line">Line</button>
        <button type="button" data-tool="rect">Rectangle</button>
        <button type="button" data-tool="erase">Erase</button>
      </div>
      <canvas id="lib-grid" width="240" height="240"></canvas>
      <div class="button-row">
        <button id="lib-save" type="button">Save</button>
        <button id="lib-cancel" type="button">Cancel</button>
      </div>
    </div>
  `;

  const canvas = overlay.querySelector('#lib-grid');
  const ctx = canvas.getContext('2d');
  const size = 10;
  const cell = canvas.width / size;
  let tool = 'pen';
  let drawing = false;
  let lineStart = null;
  const grid = initialGrid.map((row) => row.map((v) => (v ? 1 : 0)));
  let dataUrl = initialDataUrl;

  const imageInput = overlay.querySelector('#lib-image');
  const imgPreview = overlay.querySelector('#texture-upload-preview');
  if (imgPreview && dataUrl) imgPreview.src = dataUrl;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        ctx.fillStyle = grid[y][x] ? '#0f4c81' : '#ffffff';
        ctx.fillRect(x * cell, y * cell, cell, cell);
        ctx.strokeStyle = '#d5dbe5';
        ctx.strokeRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  function setCell(x, y, value) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    grid[y][x] = value;
  }

  function canvasCell(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor((event.clientX - rect.left) / cell),
      y: Math.floor((event.clientY - rect.top) / cell),
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
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  overlay.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      tool = button.dataset.tool;
      overlay.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('active', b === button));
    });
  });
  overlay.querySelector('[data-tool="pen"]').classList.add('active');

  canvas.addEventListener('pointerdown', (event) => {
    drawing = true;
    const pos = canvasCell(event);
    if (tool === 'line' || tool === 'rect') {
      lineStart = pos;
      return;
    }
    setCell(pos.x, pos.y, tool === 'erase' ? 0 : 1);
    draw();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drawing || tool === 'line' || tool === 'rect') return;
    const pos = canvasCell(event);
    setCell(pos.x, pos.y, tool === 'erase' ? 0 : 1);
    draw();
  });

  window.addEventListener('pointerup', (event) => {
    if (!drawing) return;
    drawing = false;
    if (!lineStart) return;

    const pos = canvasCell(event);
    if (tool === 'line') {
      drawLine(lineStart, pos, 1);
    }

    if (tool === 'rect') {
      const minX = Math.min(lineStart.x, pos.x);
      const maxX = Math.max(lineStart.x, pos.x);
      const minY = Math.min(lineStart.y, pos.y);
      const maxY = Math.max(lineStart.y, pos.y);
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) setCell(x, y, 1);
      }
    }

    lineStart = null;
    draw();
  });

  imageInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (imgPreview) imgPreview.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });

  overlay.querySelector('#lib-save').addEventListener('click', () => {
    const name = overlay.querySelector('#lib-name').value.trim() || title;
    onSave({ name, grid, dataUrl });
    overlay.remove();
  });

  overlay.querySelector('#lib-cancel').addEventListener('click', () => overlay.remove());

  draw();
  document.body.appendChild(overlay);
}

function drawGridPreview(canvas, grid) {
  const ctx = canvas.getContext('2d');
  const size = 10;
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

export function renderLibraryPage({ container, store }) {
  container.innerHTML = `
    <article class="route-card">
      <h2>Library</h2>
      <p>Save and reuse custom shapes and textures.</p>
      <div class="button-row">
        <button id="new-shape" type="button">Make New Shape</button>
        <button id="new-texture" type="button">New Texture</button>
      </div>
      <h3>Shapes</h3>
      <div id="shape-list" class="library-list"></div>
      <h3>Textures</h3>
      <div id="texture-list" class="library-list"></div>
    </article>
  `;

  const shapeList = container.querySelector('#shape-list');
  const textureList = container.querySelector('#texture-list');

  function refreshLists() {
    shapeList.innerHTML = '';
    textureList.innerHTML = '';

    store.library.shapes.forEach((shape) => {
      const row = document.createElement('div');
      row.className = 'library-item';
      row.innerHTML = `
        <canvas width="60" height="60"></canvas>
        <div>
          <strong>${shape.name}</strong>
          <div class="button-row">
            <button type="button" data-edit="${shape.id}">Edit</button>
            <button type="button" data-place="${shape.id}">Use in canvas</button>
          </div>
        </div>
      `;
      drawGridPreview(row.querySelector('canvas'), shape.grid);
      shapeList.appendChild(row);
    });

    if (!store.library.shapes.length) {
      shapeList.innerHTML = '<p>No shapes saved yet.</p>';
    }

    store.library.textures.forEach((texture) => {
      const row = document.createElement('div');
      row.className = 'library-item';
      row.innerHTML = `
        <canvas width="60" height="60"></canvas>
        <div>
          <strong>${texture.name}</strong>
          <div class="button-row">
            <button type="button" data-edit-texture="${texture.id}">Edit</button>
          </div>
        </div>
      `;
      const previewCanvas = row.querySelector('canvas');
      if (texture.kind === 'image' && texture.dataUrl) {
        const img = new Image();
        img.onload = () => {
          const ctx = previewCanvas.getContext('2d');
          ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
        };
        img.src = texture.dataUrl;
      } else {
        drawGridPreview(previewCanvas, texture.grid);
      }
      textureList.appendChild(row);
    });

    if (!store.library.textures.length) {
      textureList.innerHTML = '<p>No textures saved yet.</p>';
    }

    shapeList.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = store.library.shapes.find((shape) => shape.id === button.dataset.edit);
        if (!entry) return;
        gridEditor({
          title: 'Edit Shape',
          initialName: entry.name,
          initialGrid: cloneShapeGrid(entry.grid),
          onSave: ({ name, grid }) => {
            upsertLibraryShape({ ...entry, name, grid: cloneShapeGrid(grid), updatedAt: Date.now() });
          },
        });
      });
    });

    shapeList.querySelectorAll('[data-place]').forEach((button) => {
      button.addEventListener('click', () => {
        patchState({ activeTool: 'place-shape', placeShapeTemplateId: button.dataset.place });
        window.location.hash = '#home';
      });
    });

    textureList.querySelectorAll('[data-edit-texture]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = store.library.textures.find((texture) => texture.id === button.dataset.editTexture);
        if (!entry) return;
        gridEditor({
          title: 'Edit Texture',
          initialName: entry.name,
          initialGrid: cloneTextureGrid(entry.grid),
          includeUpload: true,
          initialDataUrl: entry.dataUrl ?? '',
          onSave: ({ name, grid, dataUrl }) => {
            upsertLibraryTexture({
              ...entry,
              name,
              kind: dataUrl ? 'image' : 'drawn',
              dataUrl: dataUrl || '',
              grid: cloneTextureGrid(grid),
              updatedAt: Date.now(),
            });
          },
        });
      });
    });
  }

  container.querySelector('#new-shape').addEventListener('click', () => {
    gridEditor({
      title: 'New Shape',
      onSave: ({ name, grid }) => {
        upsertLibraryShape({ id: generateId('lib-shape'), name, grid: cloneShapeGrid(grid), updatedAt: Date.now() });
      },
    });
  });

  container.querySelector('#new-texture').addEventListener('click', () => {
    gridEditor({
      title: 'New Texture',
      includeUpload: true,
      onSave: ({ name, grid, dataUrl }) => {
        upsertLibraryTexture({
          id: generateId('lib-texture'),
          name,
          kind: dataUrl ? 'image' : 'drawn',
          dataUrl: dataUrl || '',
          grid: cloneTextureGrid(grid),
          updatedAt: Date.now(),
        });
      },
    });
  });

  refreshLists();
}
