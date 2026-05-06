import {
  patchState,
  PROJECTION_MODES,
  selectProjectionMode,
  setActiveTool,
  setProjectionMode,
} from '../app/actions.js';
import { toolRegistry } from '../tools/toolRegistry.js';

const TOOL_LABELS = {
  select: 'Select',
  pan: 'Pan',
  pen: 'Pen',
  line: 'Line',
  room: 'Room',
  curve: 'Curve',
  circle: 'Circle',
  oval: 'Oval',
  label: 'Label',
  tape: 'Measure',
  fill: 'Fill',
  erase: 'Erase',
  'place-shape': 'Place Shape',
};

export function mountToolbar({ container, store }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'panel';
  wrapper.innerHTML = '<h2>View</h2>';

  const projectionTabs = document.createElement('div');
  projectionTabs.className = 'toolbar-buttons projection-tabs';
  wrapper.appendChild(projectionTabs);

  const projectionLabels = {
    orthographic: 'Blueprint',
    perspective1: 'Perspective 1',
    perspective2: 'Perspective 2',
    perspective3: 'Perspective 3',
    isometric: 'Isometric',
  };

  const renderProjectionTabs = () => {
    const advancedEnabled = store.appState.featureFlags?.enableAdvancedProjectionModes === true;
    projectionTabs.innerHTML = '';

    PROJECTION_MODES
      .filter((mode) => advancedEnabled || mode === 'orthographic')
      .forEach((mode) => {
        const btn = document.createElement('button');
        btn.className = 'toolbar-button';
        btn.dataset.projectionMode = mode;
        btn.textContent = projectionLabels[mode] ?? mode;
        btn.addEventListener('click', () => setProjectionMode(mode));
        projectionTabs.appendChild(btn);
      });
  };

  const toolsHeader = document.createElement('h2');
  toolsHeader.textContent = 'Tools';
  wrapper.appendChild(toolsHeader);

  const buttonWrap = document.createElement('div');
  buttonWrap.className = 'toolbar-buttons';

  wrapper.appendChild(buttonWrap);
  container.appendChild(wrapper);

  const renderButtons = () => {
    const showTape = store.documentData.settings.showTapeTool !== false;
    buttonWrap.innerHTML = '';

    Object.keys(toolRegistry)
      .filter((toolId) => showTape || toolId !== 'tape')
      .forEach((toolId) => {
        const btn = document.createElement('button');
        btn.className = 'toolbar-button';
        btn.dataset.toolId = toolId;
        btn.textContent = TOOL_LABELS[toolId] ?? (toolId[0].toUpperCase() + toolId.slice(1));
        btn.addEventListener('click', () => {
          if (toolId === 'place-shape') {
            if (!store.library.shapes.length) {
              window.alert('No saved shapes yet. Create one in Library first.');
              return;
            }

            const options = store.library.shapes.map((shape, index) => `${index + 1}. ${shape.name}`).join('\n');
            const choice = window.prompt(`Pick shape number:\n${options}`);
            const index = Number.parseInt(choice, 10) - 1;
            const selected = store.library.shapes[index];
            if (!selected) return;
            patchState({ placeShapeTemplateId: selected.id });
          }

          setActiveTool(toolId);
        });
        buttonWrap.appendChild(btn);
      });
  };

  const refresh = () => {
    renderProjectionTabs();
    renderButtons();
    const activeProjection = selectProjectionMode();
    container.querySelectorAll('.toolbar-button[data-projection-mode]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.projectionMode === activeProjection);
    });
    container.querySelectorAll('.toolbar-button[data-tool-id]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.toolId === store.appState.activeTool);
    });
  };

  refresh();
  return refresh;
}
