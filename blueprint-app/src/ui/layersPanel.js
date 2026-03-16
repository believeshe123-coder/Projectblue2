export function mountLayersPanel({ container, store }) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  container.appendChild(panel);

  const render = () => {
    panel.innerHTML = `
      <h2>Layers</h2>
      <ul>
        ${store.documentData.layers
          .map((layer) => `<li>${layer.name}${layer.locked ? ' (locked)' : ''}</li>`)
          .join('')}
      </ul>
      <small>Placeholder for future layer controls.</small>
    `;
  };

  render();
  return render;
}
