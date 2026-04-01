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
        <defs>
          <clipPath id="tileClip"><rect width="96" height="96"/></clipPath>
        </defs>
        <rect width="96" height="96" fill="#f6f6f6" />
        <g clip-path="url(#tileClip)" stroke-linecap="butt">
          <g stroke="#dddddd" stroke-width="8">
            <path d="M-96 0L0 96"/><path d="M-80 0L16 96"/><path d="M-64 0L32 96"/><path d="M-48 0L48 96"/><path d="M-32 0L64 96"/><path d="M-16 0L80 96"/><path d="M0 0L96 96"/>
            <path d="M16 0L112 96"/><path d="M32 0L128 96"/><path d="M48 0L144 96"/><path d="M64 0L160 96"/><path d="M80 0L176 96"/><path d="M96 0L192 96"/>
          </g>
          <g stroke="#f0f0f0" stroke-width="8">
            <path d="M-88 0L8 96"/><path d="M-72 0L24 96"/><path d="M-56 0L40 96"/><path d="M-40 0L56 96"/><path d="M-24 0L72 96"/><path d="M-8 0L88 96"/>
            <path d="M8 0L104 96"/><path d="M24 0L120 96"/><path d="M40 0L136 96"/><path d="M56 0L152 96"/><path d="M72 0L168 96"/><path d="M88 0L184 96"/>
          </g>
          <g stroke="#777" stroke-width="0.85">
            <path d="M-92 0L4 96"/><path d="M-84 0L12 96"/><path d="M-76 0L20 96"/><path d="M-68 0L28 96"/><path d="M-60 0L36 96"/><path d="M-52 0L44 96"/><path d="M-44 0L52 96"/><path d="M-36 0L60 96"/>
            <path d="M-28 0L68 96"/><path d="M-20 0L76 96"/><path d="M-12 0L84 96"/><path d="M-4 0L92 96"/><path d="M4 0L100 96"/><path d="M12 0L108 96"/><path d="M20 0L116 96"/><path d="M28 0L124 96"/>
            <path d="M36 0L132 96"/><path d="M44 0L140 96"/><path d="M52 0L148 96"/><path d="M60 0L156 96"/><path d="M68 0L164 96"/><path d="M76 0L172 96"/><path d="M84 0L180 96"/><path d="M92 0L188 96"/>
          </g>
          <g stroke="#9c9c9c" stroke-width="0.7">
            <path d="M-64 12h10"/><path d="M-22 22h9"/><path d="M18 30h11"/><path d="M56 44h10"/><path d="M92 58h8"/><path d="M132 74h9"/>
            <path d="M-36 54h9"/><path d="M2 66h10"/><path d="M42 76h9"/><path d="M80 86h10"/>
          </g>
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
        <defs>
          <filter id="loopNoise" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1" exponent="1.4" offset="0"/>
              <feFuncG type="gamma" amplitude="1" exponent="1.4" offset="0"/>
              <feFuncB type="gamma" amplitude="1" exponent="1.4" offset="0"/>
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="96" height="96" fill="#f6f6f6"/>
        <rect width="96" height="96" filter="url(#loopNoise)" opacity="0.35"/>
        <g stroke="#8d8d8d" stroke-linecap="round" fill="#8d8d8d">
          <path d="M4 9l3 1" stroke-width="0.8" opacity="0.4"/><path d="M12 19l2 -1" stroke-width="0.7" opacity="0.32"/><path d="M22 8l3 0" stroke-width="0.75" opacity="0.42"/>
          <path d="M29 22l2 1" stroke-width="0.8" opacity="0.35"/><path d="M38 11l2 0" stroke-width="0.7" opacity="0.36"/><path d="M46 17l3 -1" stroke-width="0.9" opacity="0.4"/>
          <path d="M55 8l2 1" stroke-width="0.75" opacity="0.34"/><path d="M63 21l3 0" stroke-width="0.8" opacity="0.38"/><path d="M71 10l2 -1" stroke-width="0.7" opacity="0.33"/>
          <path d="M81 18l3 1" stroke-width="0.85" opacity="0.43"/><path d="M89 7l2 0" stroke-width="0.75" opacity="0.31"/>
          <circle cx="8" cy="34" r="0.9" opacity="0.45"/><circle cx="17" cy="41" r="1" opacity="0.36"/><circle cx="26" cy="31" r="0.8" opacity="0.32"/>
          <circle cx="35" cy="39" r="1" opacity="0.4"/><circle cx="44" cy="33" r="0.9" opacity="0.35"/><circle cx="52" cy="43" r="1" opacity="0.42"/>
          <circle cx="61" cy="30" r="0.8" opacity="0.3"/><circle cx="69" cy="40" r="0.95" opacity="0.38"/><circle cx="78" cy="33" r="0.9" opacity="0.34"/>
          <circle cx="87" cy="42" r="1" opacity="0.41"/><path d="M6 58l3 -1" stroke-width="0.85" opacity="0.39"/><path d="M15 67l2 1" stroke-width="0.7" opacity="0.33"/>
          <path d="M24 55l2 0" stroke-width="0.8" opacity="0.37"/><path d="M33 70l3 -1" stroke-width="0.85" opacity="0.43"/><path d="M41 59l2 1" stroke-width="0.7" opacity="0.31"/>
          <path d="M50 69l3 0" stroke-width="0.9" opacity="0.42"/><path d="M59 57l2 -1" stroke-width="0.75" opacity="0.34"/><path d="M67 66l2 1" stroke-width="0.8" opacity="0.39"/>
          <path d="M76 54l3 0" stroke-width="0.85" opacity="0.35"/><path d="M84 68l2 -1" stroke-width="0.75" opacity="0.32"/><circle cx="92" cy="60" r="0.9" opacity="0.37"/>
          <circle cx="10" cy="83" r="1" opacity="0.43"/><circle cx="19" cy="76" r="0.9" opacity="0.34"/><circle cx="28" cy="86" r="0.8" opacity="0.31"/>
          <circle cx="37" cy="79" r="0.95" opacity="0.39"/><circle cx="46" cy="88" r="0.9" opacity="0.35"/><circle cx="54" cy="80" r="1" opacity="0.4"/>
          <circle cx="63" cy="90" r="0.85" opacity="0.36"/><circle cx="72" cy="82" r="1" opacity="0.42"/><circle cx="81" cy="89" r="0.9" opacity="0.33"/><circle cx="90" cy="78" r="0.95" opacity="0.38"/>
        </g>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },

  {
    id: 'builtin-tile-ceramic-square',
    name: 'Ceramic Tile (Square)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <pattern id="ceramicSq" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="#ebebeb"/>
            <rect x="2.5" y="2.5" width="19" height="19" rx="1.5" ry="1.5" fill="#f8f8f8"/>
            <rect x="5" y="5" width="14" height="14" rx="1" ry="1" fill="#e3e3e3" opacity="0.35"/>
            <path d="M0 0H24V24H0Z" fill="none" stroke="#9a9a9a" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="96" height="96" fill="url(#ceramicSq)"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-tile-large-format',
    name: 'Tile (Large Format)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <pattern id="largeFormat" width="48" height="32" patternUnits="userSpaceOnUse">
            <rect width="48" height="32" fill="#f2f2f2"/>
            <rect x="2" y="2" width="44" height="28" rx="1.5" ry="1.5" fill="#e7e7e7"/>
            <path d="M0 0H48V32H0Z" fill="none" stroke="#8f8f8f" stroke-width="1"/>
            <path d="M6 10h10M20 22h14M35 14h8" stroke="#b3b3b3" stroke-width="0.8" stroke-linecap="round"/>
          </pattern>
        </defs>
        <rect width="96" height="96" fill="#f5f5f5"/>
        <rect width="96" height="96" fill="url(#largeFormat)"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-herringbone',
    name: 'Wood (Herringbone)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <pattern id="herringbone" width="32" height="32" patternUnits="userSpaceOnUse">
            <rect width="32" height="32" fill="#f3f3f3"/>
            <path d="M0 32L16 16L24 24L8 40Z" fill="#d9d9d9"/>
            <path d="M0 16L16 0L24 8L8 24Z" fill="#e8e8e8"/>
            <path d="M16 32L32 16L40 24L24 40Z" fill="#ececec"/>
            <path d="M16 16L32 0L40 8L24 24Z" fill="#dbdbdb"/>
            <path d="M0 0L16 16L8 24L-8 8Z" fill="#e4e4e4"/>
            <path d="M16 0L32 16L24 24L8 8Z" fill="#d6d6d6"/>
            <path d="M0 32L16 16M16 32L32 16M0 16L16 0M16 16L32 0M0 0L16 16M16 0L32 16" stroke="#8f8f8f" stroke-width="0.9"/>
          </pattern>
        </defs>
        <rect width="96" height="96" fill="url(#herringbone)"/>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-stone-speckle',
    name: 'Stone (Speckle)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <filter id="stoneNoise" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="19" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
        </defs>
        <rect width="96" height="96" fill="#ececec"/>
        <rect width="96" height="96" filter="url(#stoneNoise)" opacity="0.28"/>
        <g fill="#9c9c9c" opacity="0.38">
          <circle cx="10" cy="12" r="1.3"/><circle cx="26" cy="18" r="1.1"/><circle cx="43" cy="10" r="1.4"/><circle cx="62" cy="22" r="1.2"/><circle cx="84" cy="14" r="1.1"/>
          <circle cx="14" cy="44" r="1.2"/><circle cx="33" cy="36" r="1.3"/><circle cx="52" cy="48" r="1.1"/><circle cx="70" cy="40" r="1.4"/><circle cx="88" cy="46" r="1.2"/>
          <circle cx="8" cy="74" r="1.2"/><circle cx="25" cy="82" r="1.1"/><circle cx="45" cy="70" r="1.3"/><circle cx="63" cy="84" r="1.1"/><circle cx="82" cy="76" r="1.2"/>
        </g>
      </svg>
    `),
    grid: [],
    updatedAt: 0,
  },
  {
    id: 'builtin-hex-tile',
    name: 'Tile (Hex)',
    kind: 'image',
    tintable: true,
    dataUrl: svgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <pattern id="hexPattern" width="24" height="20.784" patternUnits="userSpaceOnUse">
            <rect width="24" height="20.784" fill="#f4f4f4"/>
            <path d="M6 0L18 0L24 10.392L18 20.784L6 20.784L0 10.392Z" fill="#e8e8e8"/>
            <path d="M6 0L18 0L24 10.392L18 20.784L6 20.784L0 10.392Z" fill="none" stroke="#909090" stroke-width="0.9"/>
            <path d="M3 10.392L9 10.392M15 10.392L21 10.392" stroke="#b1b1b1" stroke-width="0.7" stroke-linecap="round"/>
          </pattern>
        </defs>
        <rect width="96" height="96" fill="url(#hexPattern)"/>
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
