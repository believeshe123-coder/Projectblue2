let nextId = 1;

export function generateId(prefix = 'id') {
  return `${prefix}-${nextId++}`;
}

function parseTrailingIdNumber(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/-(\d+)$/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function seedIdGeneratorFromDocument(documentData) {
  let highest = 0;
  const consider = (candidateId) => {
    const parsed = parseTrailingIdNumber(candidateId);
    if (parsed != null && parsed > highest) highest = parsed;
  };

  for (const layer of documentData?.layers ?? []) {
    consider(layer?.id);
  }

  for (const shape of documentData?.shapes ?? []) {
    consider(shape?.id);
  }

  nextId = highest + 1;
}
