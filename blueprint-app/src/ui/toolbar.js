import { setActiveTool } from '../app/actions.js';
import { toolRegistry } from '../tools/toolRegistry.js';

function download(name, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function mountToolbar({ container, store, canvas }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'panel';
  wrapper.innerHTML = '<h2>Tools</h2>';

  const buttonWrap = document.createElement('div');
  buttonWrap.className = 'toolbar-buttons';

  Object.keys(toolRegistry).forEach((toolId) => {
    const btn = document.createElement('button');
    btn.className = 'toolbar-button';
    btn.dataset.toolId = toolId;
    btn.textContent = toolId[0].toUpperCase() + toolId.slice(1);
    btn.addEventListener('click', () => setActiveTool(toolId));
    buttonWrap.appendChild(btn);
  });

  const fileWrap = document.createElement('div');
  fileWrap.className = 'toolbar-buttons';
  fileWrap.innerHTML = `
    <h2>File</h2>
    <button class="toolbar-button" data-file-action="save" type="button">Save Blueprint</button>
    <button class="toolbar-button" data-file-action="load" type="button">Load Blueprint</button>
    <button class="toolbar-button" data-file-action="export" type="button">Export PNG</button>
    <input data-file-input type="file" accept="application/json" style="display:none" />
  `;

  fileWrap.addEventListener('click', (event) => {
    const action = event.target?.dataset?.fileAction;
    if (!action) return;

    if (action === 'save') {
      download('blueprint.json', JSON.stringify(store.documentData, null, 2));
    }

    if (action === 'load') {
      fileWrap.querySelector('[data-file-input]').click();
    }

    if (action === 'export') {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'blueprint.png';
      a.click();
    }
  });

  fileWrap.querySelector('[data-file-input]').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const parsed = JSON.parse(content);
    Object.assign(store.documentData, parsed);
    store.notify();
    event.target.value = '';
  });

  wrapper.appendChild(buttonWrap);
  wrapper.appendChild(fileWrap);
  container.appendChild(wrapper);

  const refresh = () => {
    container.querySelectorAll('.toolbar-button[data-tool-id]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.toolId === store.appState.activeTool);
    });
  };

  refresh();
  return refresh;
}
