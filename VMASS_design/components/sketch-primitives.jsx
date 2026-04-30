// Sketch primitives — hand-drawn wireframe vibe
// Uses rough-looking borders, handwritten fonts, muted palette

const Sketch = {
  ink: '#1a1a1a',
  inkDim: '#555',
  inkFaint: '#999',
  paper: '#fdfcf8',
  paperDim: '#f4f1e8',
  accent: '#008ecc', // primary blue
  accentDim: '#c4e4f2',
  line: '#2a2a2a',
  hand: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Courier New", monospace',
  sans: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
};

// Dark mode overrides
const SketchDark = {
  ink: '#f4f1e8',
  inkDim: '#b8b4a8',
  inkFaint: '#6a665c',
  paper: '#1a1a1a',
  paperDim: '#252525',
  accent: '#3aaedd',
  accentDim: '#1a4a5e',
  line: '#d4d0c4',
};

function useSketch(dark) {
  return dark ? { ...Sketch, ...SketchDark } : Sketch;
}

// ─────────────────────────────────────────────
// SBox — a sketchy rectangle (dashed or solid)
// ─────────────────────────────────────────────
function SBox({ children, style = {}, dashed = false, thick = false, dark = false, fill, onClick, radius = 14 }) {
  const S = useSketch(dark);
  return (
    <div onClick={onClick} style={{
      border: `${thick ? 2 : 1.5}px ${dashed ? 'dashed' : 'solid'} ${S.line}`,
      borderRadius: radius,
      background: fill || 'transparent',
      padding: 10,
      fontFamily: S.hand,
      color: S.ink,
      boxSizing: 'border-box',
      cursor: onClick ? 'pointer' : undefined,
      ...style,
    }}>{children}</div>
  );
}

// SLine — a horizontal placeholder line (for text/content)
function SLine({ w = '100%', thick = 2, dark = false, style = {} }) {
  const S = useSketch(dark);
  return (
    <div style={{
      width: w, height: thick,
      background: S.inkFaint,
      borderRadius: thick,
      ...style,
    }} />
  );
}

// STextLines — simulate paragraph lines
function STextLines({ n = 3, dark = false, style = {} }) {
  const widths = ['100%', '95%', '70%', '88%', '60%', '92%', '75%'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {Array.from({ length: n }).map((_, i) => (
        <SLine key={i} w={widths[i % widths.length]} dark={dark} />
      ))}
    </div>
  );
}

// SPlaceholder — striped box with monospace caption
function SPlaceholder({ label, w = '100%', h = 80, dark = false, style = {}, radius = 10 }) {
  const S = useSketch(dark);
  return (
    <div style={{
      width: w, height: h,
      border: `1.5px dashed ${S.line}`,
      borderRadius: radius,
      background: `repeating-linear-gradient(-45deg, transparent 0, transparent 6px, ${S.paperDim} 6px, ${S.paperDim} 9px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: S.mono, fontSize: 10, color: S.inkDim,
      textAlign: 'center', padding: 4, boxSizing: 'border-box',
      ...style,
    }}>{label}</div>
  );
}

// SCircle
function SCircle({ size = 40, label, dark = false, fill, style = {} }) {
  const S = useSketch(dark);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `1.5px solid ${S.line}`,
      background: fill || 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: S.hand, fontSize: Math.max(10, size * 0.4),
      color: S.ink, flexShrink: 0,
      ...style,
    }}>{label}</div>
  );
}

// SButton — sketchy button
function SButton({ children, primary = false, small = false, dark = false, style = {}, onClick }) {
  const S = useSketch(dark);
  return (
    <button onClick={onClick} style={{
      border: `${primary ? 2 : 1.5}px solid ${S.line}`,
      borderRadius: 999,
      background: primary ? S.accent : 'transparent',
      color: primary ? '#fff' : S.ink,
      fontFamily: S.hand,
      fontSize: small ? 13 : 15,
      padding: small ? '4px 12px' : '8px 18px',
      cursor: 'pointer',
      fontWeight: 700,
      ...style,
    }}>{children}</button>
  );
}

// SIcon — hand-drawn icon glyph (uses unicode-ish shapes)
// Most icons are drawn as simple SVG paths to keep the sketch vibe
function SIcon({ name, size = 22, dark = false, color }) {
  const S = useSketch(dark);
  const c = color || S.ink;
  const sw = 1.8;
  const icons = {
    home: <><path d="M3 11L12 3l9 8v10a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z" /></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    msg: <><path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H9l-5 4v-4H5a2 2 0 01-2-2z"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></>,
    qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h4M14 20h3M20 14v7"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    bell: <><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8zM9 19a3 3 0 006 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>,
    box: <><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v9l9 5M21 8v9l-9 5M3 8l9 5M21 8l-9 5"/></>,
    cart: <><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M2 3h3l3 13h12l2-9H6"/></>,
    chart: <><path d="M3 3v18h18M8 14l3-3 3 3 5-5"/></>,
    arrow_up: <><path d="M12 5v14M5 12l7-7 7 7"/></>,
    arrow_down: <><path d="M12 19V5M5 12l7 7 7-7"/></>,
    arrow_right: <><path d="M5 12h14M12 5l7 7-7 7"/></>,
    chevron_right: <><path d="M9 6l6 6-6 6"/></>,
    check: <><path d="M5 13l4 4L20 6"/></>,
    x: <><path d="M6 6l12 12M18 6L6 18"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    money: <><rect x="2" y="6" width="20" height="12" rx="1"/><circle cx="12" cy="12" r="3"/></>,
    warn: <><path d="M12 3L2 20h20L12 3zM12 10v5M12 18v0"/></>,
    camera: <><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7l2-3h4l2 3"/></>,
    tag: <><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9z"/><circle cx="7" cy="7" r="1.5"/></>,
    truck: <><rect x="1" y="7" width="13" height="10"/><path d="M14 10h5l3 4v3h-8M5 20a2 2 0 100-4 2 2 0 000 4zM18 20a2 2 0 100-4 2 2 0 000 4z"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="6" r="2.5"/><path d="M22 19c0-3-2-5-5-5"/></>,
    fb: <><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></>,
    zalo: <><circle cx="12" cy="12" r="9"/><path d="M7 10h10M7 14h6" strokeWidth="1.5"/></>,
    ig: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill={c}/></>,
    sms: <><path d="M3 6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-7l-5 4v-4H5a2 2 0 01-2-2z"/></>,
    printer: <><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></>,
    filter: <><path d="M3 4h18l-7 9v7l-4-2v-5z"/></>,
    moon: <><path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></>,
    flash: <><path d="M13 2L4 14h7l-2 8 9-12h-7z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    trend_up: <><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></>,
    trend_down: <><path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/></>,
    refresh: <><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"/></>,
    bag: <><path d="M6 7h12l-1 14H7zM9 7V5a3 3 0 016 0v2"/></>,
    heart: <><path d="M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11z"/></>,
    star: <><path d="M12 2l3 7h7l-6 4 2 8-6-4-6 4 2-8-6-4h7z"/></>,
    edit: <><path d="M4 20h4l11-11-4-4L4 16v4zM14 6l4 4"/></>,
    trash: <><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M5 6l1 14a1 1 0 001 1h10a1 1 0 001-1l1-14"/></>,
    upload: <><path d="M12 16V4M5 11l7-7 7 7M3 20h18"/></>,
    download: <><path d="M12 4v12M5 13l7 7 7-7M3 20h18"/></>,
    shop: <><path d="M3 7l2-4h14l2 4M3 7v12a1 1 0 001 1h16a1 1 0 001-1V7M3 7h18M9 14h6"/></>,
    coin: <><circle cx="12" cy="12" r="9"/><path d="M12 6v12M9 9h4a2 2 0 010 4h-2a2 2 0 000 4h4"/></>,
    pin: <><circle cx="12" cy="10" r="3"/><path d="M12 21s-7-7-7-11a7 7 0 0114 0c0 4-7 11-7 11z"/></>,
    book: <><path d="M4 5a2 2 0 012-2h14v18H6a2 2 0 01-2-2zM20 17H6"/></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></>,
    send: <><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></>,
    more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  };
  const content = icons[name] || icons.box;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {content}
    </svg>
  );
}

// Scribble signature — a wavy line to mock a chart or signature
function SScribble({ w = 200, h = 60, dark = false, kind = 'chart', accent = false, onDark = false }) {
  const S = useSketch(dark);
  const c = onDark ? 'rgba(255,255,255,0.95)' : (accent ? S.accent : S.ink);
  const fillC = onDark ? 'rgba(255,255,255,0.25)' : (accent ? S.accentDim : 'none');
  let path = '';
  if (kind === 'chart') {
    // random-ish up-trending squiggle
    const pts = [0.6, 0.5, 0.7, 0.55, 0.45, 0.6, 0.4, 0.5, 0.3, 0.35, 0.25, 0.15];
    path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${p * h}`).join(' ');
  } else if (kind === 'area') {
    const pts = [0.7, 0.55, 0.75, 0.6, 0.5, 0.65, 0.45, 0.55, 0.35, 0.4, 0.3, 0.2];
    path = 'M 0 ' + h + ' ' + pts.map((p, i) => `L ${(i / (pts.length - 1)) * w} ${p * h}`).join(' ') + ` L ${w} ${h} Z`;
  } else if (kind === 'bars') {
    // handled below
  }
  if (kind === 'bars') {
    const bars = [0.5, 0.75, 0.4, 0.9, 0.6, 0.3, 0.65];
    return (
      <svg width={w} height={h} style={{ overflow: 'visible' }}>
        {bars.map((b, i) => {
          const bw = (w - 10) / bars.length - 4;
          const bh = b * h;
          return <rect key={i} x={5 + i * (bw + 4)} y={h - bh} width={bw} height={bh} fill={accent ? S.accent : S.line} opacity={0.8} />;
        })}
      </svg>
    );
  }
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <path d={path} stroke={c} strokeWidth={2} fill={fillC} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Sketchy annotation arrow — points at something with a label
function SAnnotation({ children, style = {}, rotate = 0 }) {
  return (
    <div style={{
      position: 'absolute',
      fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 13, color: '#008ecc',
      transform: `rotate(${rotate}deg)`,
      fontWeight: 700,
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, { SBox, SLine, STextLines, SPlaceholder, SCircle, SButton, SIcon, SScribble, SAnnotation, Sketch, useSketch });
