const MAX_HISTORY_ITEMS = 10;

const stack = [];
let index = -1;

export function pushHistory(snapshot) {
  stack.splice(index + 1);
  stack.push(structuredClone(snapshot));

  if (stack.length > MAX_HISTORY_ITEMS) {
    const overflowCount = stack.length - MAX_HISTORY_ITEMS;
    stack.splice(0, overflowCount);
  }

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
