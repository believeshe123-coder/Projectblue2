export function mountFileMenu({ container }) {
  const button = document.createElement('button');
  button.className = 'menu-trigger';
  button.type = 'button';
  button.textContent = 'File';

  button.addEventListener('click', () => {
    window.location.hash = '#file';
  });

  container.appendChild(button);

  return () => {
    const isActive = window.location.hash === '#file';
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  };
}

export function renderFilePage({ container, store, canvas }) {
  container.innerHTML = `
    <div class="route-card">
      <h2>File</h2>
      <p>Manage your blueprint file actions from this page.</p>
      <div class="button-row">
        <button class="menu-item" data-file-action="save" type="button">Save Blueprint</button>
        <button class="menu-item" data-file-action="load" type="button">Load Blueprint</button>
        <button class="menu-item" data-file-action="export" type="button">Export PNG</button>
      </div>
      <input data-file-input type="file" accept="application/json" hidden />
      <div class="button-row">
        <button class="menu-trigger" data-file-action="home" type="button">Back to Home</button>
      </div>
    </div>
  `;

  const fileInput = container.querySelector('[data-file-input]');

  function download(name, text, type = 'application/json') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  container.addEventListener('click', (event) => {
    const actionButton = event.target instanceof Element
      ? event.target.closest('[data-file-action]')
      : null;
    const action = actionButton?.dataset?.fileAction;
    if (!action) return;

    if (action === 'save') {
      download('blueprint.json', JSON.stringify(store.documentData, null, 2));
      return;
    }

    if (action === 'load') {
      fileInput.click();
      return;
    }

    if (action === 'export') {
      const anchor = document.createElement('a');
      anchor.href = canvas.toDataURL('image/png');
      anchor.download = 'blueprint.png';
      anchor.click();
      return;
    }

    if (action === 'home') {
      window.location.hash = '#home';
    }
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const parsed = JSON.parse(content);
    Object.assign(store.documentData, parsed);
    store.notify();
    event.target.value = '';
  });
}
