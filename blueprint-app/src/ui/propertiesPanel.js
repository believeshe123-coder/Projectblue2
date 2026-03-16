export function mountPropertiesPanel({ container, store }) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  container.appendChild(panel);

  const render = () => {
    const count = store.appState.selectedIds.length;
    panel.innerHTML = `
      <h2>Properties</h2>
      <p>${count ? `${count} shape(s) selected.` : 'Select a shape to edit properties.'}</p>
      <small>Placeholder panel for future property editors.</small>
    `;
  };

  render();
  return render;
}
