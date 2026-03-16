export function mountFileMenu({ container, store, canvas }) {
  const wrap = document.createElement('div');
  wrap.className = 'file-menu';

  const button = document.createElement('button');
  button.className = 'menu-trigger';
  button.type = 'button';
  button.textContent = 'File';
  button.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('div');
  panel.className = 'menu-panel file-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="menu-panel-header">
      <h3>File</h3>
      <button type="button" data-action="close-file-menu" class="menu-close">Close</button>
    </div>
    <button class="menu-item" data-file-action="save" type="button">Save Blueprint</button>
    <button class="menu-item" data-file-action="load" type="button">Load Blueprint</button>
    <button class="menu-item" data-file-action="export" type="button">Export PNG</button>
    <input data-file-input type="file" accept="application/json" hidden />
  `;

  wrap.appendChild(button);
  wrap.appendChild(panel);
  container.appendChild(wrap);

  function closePanel() {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  function togglePanel() {
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
  }

  function download(name, text, type = 'application/json') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  button.addEventListener('click', togglePanel);

  panel.addEventListener('click', (event) => {
    if (event.target?.dataset?.action === 'close-file-menu') {
      closePanel();
      return;
    }

    const action = event.target?.dataset?.fileAction;
    if (!action) return;

    if (action === 'save') download('blueprint.json', JSON.stringify(store.documentData, null, 2));

    if (action === 'load') {
      panel.querySelector('[data-file-input]').click();
    }

    if (action === 'export') {
      const anchor = document.createElement('a');
      anchor.href = canvas.toDataURL('image/png');
      anchor.download = 'blueprint.png';
      anchor.click();
    }

    closePanel();
  });

  panel.querySelector('[data-file-input]').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const parsed = JSON.parse(content);
    Object.assign(store.documentData, parsed);
    store.notify();
    event.target.value = '';
    closePanel();
  });

  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) closePanel();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanel();
  });

  return () => {};
}
