export function screenToWorld(point, appState) {
  return {
    x: (point.x - appState.panX) / appState.zoom,
    y: (point.y - appState.panY) / appState.zoom,
  };
}

export function worldToScreen(point, appState) {
  return {
    x: point.x * appState.zoom + appState.panX,
    y: point.y * appState.zoom + appState.panY,
  };
}
