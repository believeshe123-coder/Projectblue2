export const panTool = {
  id: 'pan',
  onPointerDown(context, _point, event) {
    if (event?.button !== 0) return;
    context.ephemeral.panSession = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPanX: context.store.appState.panX,
      startPanY: context.store.appState.panY,
    };
    context.canvas.style.cursor = 'grabbing';
  },
  onPointerMove(context, _point, event) {
    const session = context.ephemeral.panSession;
    if (!session) return;
    if (!(event?.buttons & 1)) return;

    context.store.appState.panX = session.startPanX + (event.clientX - session.startClientX);
    context.store.appState.panY = session.startPanY + (event.clientY - session.startClientY);
    context.store.notify();
  },
  onPointerUp(context) {
    if (!context.ephemeral.panSession) return;
    context.ephemeral.panSession = null;
    context.canvas.style.cursor = 'grab';
  },
  onKeyDown() {},
  drawOverlay() {},
};
