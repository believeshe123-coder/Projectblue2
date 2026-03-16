import { deleteSelectedShapes } from '../app/actions.js';
import { getTool } from '../tools/toolRegistry.js';
import { undo, redo } from '../app/history.js';

export function bindKeyboardEvents({ store }) {
  window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      const snapshot = event.shiftKey ? redo() : undo();
      if (snapshot) {
        Object.assign(store.documentData, snapshot);
        store.notify();
      }
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      deleteSelectedShapes();
      return;
    }

    const activeTool = getTool(store.appState.activeTool);
    activeTool?.onKeyDown?.({ store }, event.key, event);
  });
}
