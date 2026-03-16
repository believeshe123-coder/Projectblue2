/** Snapshot stack placeholder for future robust command-based history. */
const stack = [];
let index = -1;

export function pushHistory(snapshot) {
  stack.splice(index + 1);
  stack.push(structuredClone(snapshot));
  index = stack.length - 1;
}

export function undo() {
  if (index <= 0) return null;
  index -= 1;
  return structuredClone(stack[index]);
}

export function redo() {
  if (index >= stack.length - 1) return null;
  index += 1;
  return structuredClone(stack[index]);
}
