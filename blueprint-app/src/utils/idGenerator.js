let nextId = 1;

export function generateId(prefix = 'id') {
  return `${prefix}-${nextId++}`;
}
