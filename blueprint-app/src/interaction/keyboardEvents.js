import { deleteSelectedShapes, performRedo, performUndo } from '../app/actions.js';
import { getTool } from '../tools/toolRegistry.js';
import { selectTool } from '../tools/selectTool.js';

function isLabelEditingKey(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return event.key.length === 1 || event.key === 'Enter' || event.key === 'Escape' || event.key === 'Backspace' || event.key === 'Delete';
}

export function bindKeyboardEvents({ store, ephemeral }) {
  window.addEventListener('keydown', (event) => {
    if (ephemeral?.labelInputActive) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      if (event.shiftKey) {
        performRedo();
      } else {
        performUndo();
      }
      return;
    }

    if (event.key === 'Delete') {
      if (ephemeral) {
        ephemeral.editingLabelId = null;
        ephemeral.editingLabelDirty = false;
      }
      deleteSelectedShapes();
      return;
    }

    if (ephemeral?.editingLabelId && isLabelEditingKey(event)) {
      selectTool.onKeyDown?.({ store, ephemeral }, event.key, event);
      return;
    }

    if (event.key === 'Backspace') {
      deleteSelectedShapes();
      return;
    }

    const activeTool = getTool(store.appState.activeTool);
    activeTool?.onKeyDown?.({ store, ephemeral }, event.key, event);
  });
}
