import { setActiveTool } from '../app/actions.js';
import { toolRegistry } from '../tools/toolRegistry.js';

export function mountToolbar({ container, store }) {
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

  wrapper.appendChild(buttonWrap);
  container.appendChild(wrapper);

  const refresh = () => {
    container.querySelectorAll('.toolbar-button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.toolId === store.appState.activeTool);
    });
  };

  refresh();
  return refresh;
}
