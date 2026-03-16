export function renderFilePage({ container, store }) {
  container.innerHTML = `
    <div class="route-card">
      <h2>File</h2>
      <p>Save your blueprint from this page.</p>
      <div class="button-row">
        <button class="menu-item" data-file-action="save" type="button">Save Blueprint</button>
      </div>
    </div>
  `;

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
    }
  });
}
