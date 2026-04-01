function svgDataUrl(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const BUILT_IN_TEXTURES = [
  {
    id: 'builtin-wood-planks',
    name: 'Wood Floor (Planks)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="#ffffff" />
        <rect y="0" width="96" height="24" fill="#d9d9d9"/>
        <rect y="24" width="96" height="24" fill="#f2f2f2"/>
        <rect y="48" width="96" height="24" fill="#d9d9d9"/>
        <rect y="72" width="96" height="24" fill="#f2f2f2"/>
        <path d="M0 24h96M0 48h96M0 72h96" stroke="#777" stroke-width="1"/>
        <path d="M20 0v24M72 24v24M36 48v24M82 72v24" stroke="#777" stroke-width="1"/>
        <path d="M8 10h18M44 34h22M12 58h16M52 84h20" stroke="#9a9a9a" stroke-width="1"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-carpet-loop',
    name: 'Carpet (Loop)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="#ffffff" />
        <g fill="#8f8f8f" opacity="0.9">
          <circle cx="12" cy="12" r="3"/><circle cx="36" cy="12" r="3"/><circle cx="60" cy="12" r="3"/><circle cx="84" cy="12" r="3"/>
          <circle cx="24" cy="24" r="3"/><circle cx="48" cy="24" r="3"/><circle cx="72" cy="24" r="3"/>
          <circle cx="12" cy="36" r="3"/><circle cx="36" cy="36" r="3"/><circle cx="60" cy="36" r="3"/><circle cx="84" cy="36" r="3"/>
          <circle cx="24" cy="48" r="3"/><circle cx="48" cy="48" r="3"/><circle cx="72" cy="48" r="3"/>
          <circle cx="12" cy="60" r="3"/><circle cx="36" cy="60" r="3"/><circle cx="60" cy="60" r="3"/><circle cx="84" cy="60" r="3"/>
          <circle cx="24" cy="72" r="3"/><circle cx="48" cy="72" r="3"/><circle cx="72" cy="72" r="3"/>
          <circle cx="12" cy="84" r="3"/><circle cx="36" cy="84" r="3"/><circle cx="60" cy="84" r="3"/><circle cx="84" cy="84" r="3"/>
        </g>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-checker-bw',
    name: 'Checker (B/W)',
    kind: 'image',
    tintable: false,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#fff"/>
        <rect width="16" height="16" fill="#000"/><rect x="32" width="16" height="16" fill="#000"/>
        <rect x="16" y="16" width="16" height="16" fill="#000"/><rect x="48" y="16" width="16" height="16" fill="#000"/>
        <rect y="32" width="16" height="16" fill="#000"/><rect x="32" y="32" width="16" height="16" fill="#000"/>
        <rect x="16" y="48" width="16" height="16" fill="#000"/><rect x="48" y="48" width="16" height="16" fill="#000"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
];
