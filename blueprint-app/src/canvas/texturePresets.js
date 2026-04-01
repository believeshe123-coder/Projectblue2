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
        <g>
          <rect y="0" width="96" height="8" fill="#dadada"/>
          <rect y="8" width="96" height="8" fill="#f2f2f2"/>
          <rect y="16" width="96" height="8" fill="#dadada"/>
          <rect y="24" width="96" height="8" fill="#f2f2f2"/>
          <rect y="32" width="96" height="8" fill="#dadada"/>
          <rect y="40" width="96" height="8" fill="#f2f2f2"/>
          <rect y="48" width="96" height="8" fill="#dadada"/>
          <rect y="56" width="96" height="8" fill="#f2f2f2"/>
          <rect y="64" width="96" height="8" fill="#dadada"/>
          <rect y="72" width="96" height="8" fill="#f2f2f2"/>
          <rect y="80" width="96" height="8" fill="#dadada"/>
          <rect y="88" width="96" height="8" fill="#f2f2f2"/>
        </g>
        <path d="M0 8h96M0 16h96M0 24h96M0 32h96M0 40h96M0 48h96M0 56h96M0 64h96M0 72h96M0 80h96M0 88h96" stroke="#777" stroke-width="0.8"/>
        <path d="M20 0v8M64 8v8M12 16v8M76 24v8M34 32v8M82 40v8M18 48v8M58 56v8M8 64v8M72 72v8M28 80v8M86 88v8" stroke="#787878" stroke-width="0.8"/>
        <path d="M6 4h10M40 12h8M66 20h12M16 28h9M52 36h10M70 44h8M10 52h9M36 60h12M62 68h9M14 76h11M44 84h10M74 92h8" stroke="#9a9a9a" stroke-width="0.7"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-wood-planks-vertical',
    name: 'Wood Floor (Vertical Planks)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="#ffffff" />
        <g>
          <rect x="0" width="8" height="96" fill="#dadada"/>
          <rect x="8" width="8" height="96" fill="#f2f2f2"/>
          <rect x="16" width="8" height="96" fill="#dadada"/>
          <rect x="24" width="8" height="96" fill="#f2f2f2"/>
          <rect x="32" width="8" height="96" fill="#dadada"/>
          <rect x="40" width="8" height="96" fill="#f2f2f2"/>
          <rect x="48" width="8" height="96" fill="#dadada"/>
          <rect x="56" width="8" height="96" fill="#f2f2f2"/>
          <rect x="64" width="8" height="96" fill="#dadada"/>
          <rect x="72" width="8" height="96" fill="#f2f2f2"/>
          <rect x="80" width="8" height="96" fill="#dadada"/>
          <rect x="88" width="8" height="96" fill="#f2f2f2"/>
        </g>
        <path d="M8 0v96M16 0v96M24 0v96M32 0v96M40 0v96M48 0v96M56 0v96M64 0v96M72 0v96M80 0v96M88 0v96" stroke="#777" stroke-width="0.8"/>
        <path d="M0 18h8M8 64h8M16 30h8M24 74h8M32 22h8M40 56h8M48 10h8M56 40h8M64 78h8M72 28h8M80 60h8M88 14h8" stroke="#787878" stroke-width="0.8"/>
        <path d="M4 10v9M12 44v8M20 70v10M28 36v8M36 60v9M44 16v10M52 48v8M60 24v9M68 66v10M76 42v8M84 72v9M92 30v8" stroke="#9a9a9a" stroke-width="0.7"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-wood-planks-diagonal',
    name: 'Wood Floor (Diagonal Planks)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="#ffffff" />
        <g transform="rotate(45 48 48)">
          <rect x="-56" y="-56" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="-48" width="224" height="8" fill="#f2f2f2"/>
          <rect x="-56" y="-40" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="-32" width="224" height="8" fill="#f2f2f2"/>
          <rect x="-56" y="-24" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="-16" width="224" height="8" fill="#f2f2f2"/>
          <rect x="-56" y="-8" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="0" width="224" height="8" fill="#f2f2f2"/>
          <rect x="-56" y="8" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="16" width="224" height="8" fill="#f2f2f2"/>
          <rect x="-56" y="24" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="32" width="224" height="8" fill="#f2f2f2"/>
          <rect x="-56" y="40" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="48" width="224" height="8" fill="#f2f2f2"/>
          <rect x="-56" y="56" width="224" height="8" fill="#dadada"/>
          <rect x="-56" y="64" width="224" height="8" fill="#f2f2f2"/>
        </g>
        <g stroke="#777" stroke-width="0.8" transform="rotate(45 48 48)">
          <path d="M-56 -48h224M-56 -40h224M-56 -32h224M-56 -24h224M-56 -16h224M-56 -8h224M-56 0h224M-56 8h224M-56 16h224M-56 24h224M-56 32h224M-56 40h224M-56 48h224M-56 56h224"/>
        </g>
        <g stroke="#9a9a9a" stroke-width="0.7" transform="rotate(45 48 48)">
          <path d="M-20 -52h10M40 -44h8M96 -36h12M0 -20h10M64 -12h9M114 -4h8M24 12h9M86 20h11M-8 28h8M52 36h10M108 44h9M12 52h10"/>
        </g>
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
          <circle cx="6" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="30" cy="6" r="1.6"/><circle cx="42" cy="6" r="1.6"/><circle cx="54" cy="6" r="1.6"/><circle cx="66" cy="6" r="1.6"/><circle cx="78" cy="6" r="1.6"/><circle cx="90" cy="6" r="1.6"/>
          <circle cx="12" cy="12" r="1.6"/><circle cx="24" cy="12" r="1.6"/><circle cx="36" cy="12" r="1.6"/><circle cx="48" cy="12" r="1.6"/><circle cx="60" cy="12" r="1.6"/><circle cx="72" cy="12" r="1.6"/><circle cx="84" cy="12" r="1.6"/>
          <circle cx="6" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/><circle cx="30" cy="18" r="1.6"/><circle cx="42" cy="18" r="1.6"/><circle cx="54" cy="18" r="1.6"/><circle cx="66" cy="18" r="1.6"/><circle cx="78" cy="18" r="1.6"/><circle cx="90" cy="18" r="1.6"/>
          <circle cx="12" cy="24" r="1.6"/><circle cx="24" cy="24" r="1.6"/><circle cx="36" cy="24" r="1.6"/><circle cx="48" cy="24" r="1.6"/><circle cx="60" cy="24" r="1.6"/><circle cx="72" cy="24" r="1.6"/><circle cx="84" cy="24" r="1.6"/>
          <circle cx="6" cy="30" r="1.6"/><circle cx="18" cy="30" r="1.6"/><circle cx="30" cy="30" r="1.6"/><circle cx="42" cy="30" r="1.6"/><circle cx="54" cy="30" r="1.6"/><circle cx="66" cy="30" r="1.6"/><circle cx="78" cy="30" r="1.6"/><circle cx="90" cy="30" r="1.6"/>
          <circle cx="12" cy="36" r="1.6"/><circle cx="24" cy="36" r="1.6"/><circle cx="36" cy="36" r="1.6"/><circle cx="48" cy="36" r="1.6"/><circle cx="60" cy="36" r="1.6"/><circle cx="72" cy="36" r="1.6"/><circle cx="84" cy="36" r="1.6"/>
          <circle cx="6" cy="42" r="1.6"/><circle cx="18" cy="42" r="1.6"/><circle cx="30" cy="42" r="1.6"/><circle cx="42" cy="42" r="1.6"/><circle cx="54" cy="42" r="1.6"/><circle cx="66" cy="42" r="1.6"/><circle cx="78" cy="42" r="1.6"/><circle cx="90" cy="42" r="1.6"/>
          <circle cx="12" cy="48" r="1.6"/><circle cx="24" cy="48" r="1.6"/><circle cx="36" cy="48" r="1.6"/><circle cx="48" cy="48" r="1.6"/><circle cx="60" cy="48" r="1.6"/><circle cx="72" cy="48" r="1.6"/><circle cx="84" cy="48" r="1.6"/>
          <circle cx="6" cy="54" r="1.6"/><circle cx="18" cy="54" r="1.6"/><circle cx="30" cy="54" r="1.6"/><circle cx="42" cy="54" r="1.6"/><circle cx="54" cy="54" r="1.6"/><circle cx="66" cy="54" r="1.6"/><circle cx="78" cy="54" r="1.6"/><circle cx="90" cy="54" r="1.6"/>
          <circle cx="12" cy="60" r="1.6"/><circle cx="24" cy="60" r="1.6"/><circle cx="36" cy="60" r="1.6"/><circle cx="48" cy="60" r="1.6"/><circle cx="60" cy="60" r="1.6"/><circle cx="72" cy="60" r="1.6"/><circle cx="84" cy="60" r="1.6"/>
          <circle cx="6" cy="66" r="1.6"/><circle cx="18" cy="66" r="1.6"/><circle cx="30" cy="66" r="1.6"/><circle cx="42" cy="66" r="1.6"/><circle cx="54" cy="66" r="1.6"/><circle cx="66" cy="66" r="1.6"/><circle cx="78" cy="66" r="1.6"/><circle cx="90" cy="66" r="1.6"/>
          <circle cx="12" cy="72" r="1.6"/><circle cx="24" cy="72" r="1.6"/><circle cx="36" cy="72" r="1.6"/><circle cx="48" cy="72" r="1.6"/><circle cx="60" cy="72" r="1.6"/><circle cx="72" cy="72" r="1.6"/><circle cx="84" cy="72" r="1.6"/>
          <circle cx="6" cy="78" r="1.6"/><circle cx="18" cy="78" r="1.6"/><circle cx="30" cy="78" r="1.6"/><circle cx="42" cy="78" r="1.6"/><circle cx="54" cy="78" r="1.6"/><circle cx="66" cy="78" r="1.6"/><circle cx="78" cy="78" r="1.6"/><circle cx="90" cy="78" r="1.6"/>
          <circle cx="12" cy="84" r="1.6"/><circle cx="24" cy="84" r="1.6"/><circle cx="36" cy="84" r="1.6"/><circle cx="48" cy="84" r="1.6"/><circle cx="60" cy="84" r="1.6"/><circle cx="72" cy="84" r="1.6"/><circle cx="84" cy="84" r="1.6"/>
          <circle cx="6" cy="90" r="1.6"/><circle cx="18" cy="90" r="1.6"/><circle cx="30" cy="90" r="1.6"/><circle cx="42" cy="90" r="1.6"/><circle cx="54" cy="90" r="1.6"/><circle cx="66" cy="90" r="1.6"/><circle cx="78" cy="90" r="1.6"/><circle cx="90" cy="90" r="1.6"/>
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
        <rect width="8" height="8" fill="#000"/><rect x="16" width="8" height="8" fill="#000"/><rect x="32" width="8" height="8" fill="#000"/><rect x="48" width="8" height="8" fill="#000"/>
        <rect x="8" y="8" width="8" height="8" fill="#000"/><rect x="24" y="8" width="8" height="8" fill="#000"/><rect x="40" y="8" width="8" height="8" fill="#000"/><rect x="56" y="8" width="8" height="8" fill="#000"/>
        <rect y="16" width="8" height="8" fill="#000"/><rect x="16" y="16" width="8" height="8" fill="#000"/><rect x="32" y="16" width="8" height="8" fill="#000"/><rect x="48" y="16" width="8" height="8" fill="#000"/>
        <rect x="8" y="24" width="8" height="8" fill="#000"/><rect x="24" y="24" width="8" height="8" fill="#000"/><rect x="40" y="24" width="8" height="8" fill="#000"/><rect x="56" y="24" width="8" height="8" fill="#000"/>
        <rect y="32" width="8" height="8" fill="#000"/><rect x="16" y="32" width="8" height="8" fill="#000"/><rect x="32" y="32" width="8" height="8" fill="#000"/><rect x="48" y="32" width="8" height="8" fill="#000"/>
        <rect x="8" y="40" width="8" height="8" fill="#000"/><rect x="24" y="40" width="8" height="8" fill="#000"/><rect x="40" y="40" width="8" height="8" fill="#000"/><rect x="56" y="40" width="8" height="8" fill="#000"/>
        <rect y="48" width="8" height="8" fill="#000"/><rect x="16" y="48" width="8" height="8" fill="#000"/><rect x="32" y="48" width="8" height="8" fill="#000"/><rect x="48" y="48" width="8" height="8" fill="#000"/>
        <rect x="8" y="56" width="8" height="8" fill="#000"/><rect x="24" y="56" width="8" height="8" fill="#000"/><rect x="40" y="56" width="8" height="8" fill="#000"/><rect x="56" y="56" width="8" height="8" fill="#000"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
];
