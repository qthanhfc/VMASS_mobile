// Shared screen shell — status bar + top bar + bottom tab bar
// All screens use this wrapper to stay consistent.

const SCREEN_W = 390;
const SCREEN_H = 844;

function SketchStatusBar({ dark = false, lang = 'vi' }) {
  const S = useSketch(dark);
  return (
    <div style={{
      height: 44, padding: '14px 24px 0',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      fontFamily: S.hand, color: S.ink, fontSize: 14, fontWeight: 700,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="16" height="10" viewBox="0 0 16 10"><path d="M1 9h2M5 7h2M9 5h2M13 3h2" stroke={S.ink} strokeWidth="2" strokeLinecap="round"/></svg>
        <span style={{ fontSize: 11 }}>●●●</span>
        <span style={{ border: `1px solid ${S.ink}`, padding: '0 3px', borderRadius: 3, fontSize: 10 }}>85%</span>
      </div>
    </div>
  );
}

// Top app bar — title + optional actions
function SketchTopBar({ title, subtitle, onBack, right, dark = false, big = false }) {
  const S = useSketch(dark);
  return (
    <div style={{
      padding: big ? '12px 18px 8px' : '10px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      borderBottom: big ? 'none' : `1px dashed ${S.inkFaint}`,
    }}>
      {onBack && <SIcon name="chevron_right" size={22} dark={dark} color={S.ink} />}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: S.hand, fontWeight: 700,
          fontSize: big ? 26 : 18, color: S.ink,
          letterSpacing: -0.2, lineHeight: 1.1,
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontFamily: S.hand, fontSize: 13, color: S.inkDim, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

// Bottom tab bar — 4 tabs, with 3 layout variants
// variant 1: flat 4-tab
// variant 2: FAB center (QR scan)
// variant 3: pill-floating
function SketchTabBar({ active = 'home', variant = 1, dark = false, lang = 'vi', onTab, onQr }) {
  const S = useSketch(dark);
  const labels = lang === 'vi'
    ? { home: 'Trang chủ', manage: 'Quản lý', msg: 'Tin nhắn', set: 'Cài đặt', scan: 'Quét' }
    : { home: 'Home', manage: 'Manage', msg: 'Messages', set: 'Settings', scan: 'Scan' };
  const tabs = [
    { k: 'home', icon: 'home', label: labels.home },
    { k: 'manage', icon: 'grid', label: labels.manage },
    { k: 'msg', icon: 'msg', label: labels.msg },
    { k: 'set', icon: 'gear', label: labels.set },
  ];

  if (variant === 2) {
    // FAB center
    const left = tabs.slice(0, 2);
    const right = tabs.slice(2);
    return (
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 0 18px', background: S.paper,
        borderTop: `1.5px solid ${S.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        fontFamily: S.hand,
      }}>
        {left.map(t => <TabItem key={t.k} {...t} active={active === t.k} dark={dark} onClick={() => onTab && onTab(t.k)} />)}
        <div onClick={onQr} style={{
          width: 62, height: 62, borderRadius: '50%',
          background: S.accent,
          border: `2px solid ${S.line}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', marginTop: -26, cursor: 'pointer',
          boxShadow: '2px 3px 0 rgba(0,0,0,0.15)',
        }}>
          <SIcon name="qr" size={26} color="#fff" />
          <span style={{ fontSize: 10, fontWeight: 700, marginTop: 1 }}>{labels.scan}</span>
        </div>
        {right.map(t => <TabItem key={t.k} {...t} active={active === t.k} dark={dark} onClick={() => onTab && onTab(t.k)} />)}
      </div>
    );
  }

  if (variant === 3) {
    // floating pill
    return (
      <div style={{
        position: 'absolute', bottom: 18, left: 12, right: 12,
        background: S.paper,
        border: `1.5px solid ${S.line}`,
        borderRadius: 40,
        padding: '6px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: S.hand,
        boxShadow: '2px 3px 0 rgba(0,0,0,0.12)',
      }}>
        {tabs.slice(0, 2).map(t => <TabItem key={t.k} {...t} active={active === t.k} dark={dark} onClick={() => onTab && onTab(t.k)} compact />)}
        <div onClick={onQr} style={{
          width: 44, height: 44, borderRadius: '50%',
          background: S.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer',
        }}>
          <SIcon name="qr" size={22} color="#fff" />
        </div>
        {tabs.slice(2).map(t => <TabItem key={t.k} {...t} active={active === t.k} dark={dark} onClick={() => onTab && onTab(t.k)} compact />)}
      </div>
    );
  }

  // variant 1: flat
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '8px 0 22px', background: S.paper,
      borderTop: `1.5px solid ${S.line}`,
      display: 'flex', justifyContent: 'space-around',
      fontFamily: S.hand,
    }}>
      {tabs.map(t => <TabItem key={t.k} {...t} active={active === t.k} dark={dark} onClick={() => onTab && onTab(t.k)} />)}
    </div>
  );
}

function TabItem({ icon, label, active, dark, onClick, compact }) {
  const S = useSketch(dark);
  const c = active ? S.accent : S.inkDim;
  return (
    <div onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 2, padding: compact ? '4px 12px' : '0 6px',
      cursor: 'pointer',
      borderRadius: compact ? 999 : 0,
      background: compact && active ? S.accentDim : 'transparent',
    }}>
      <SIcon name={icon} size={22} color={c} />
      {!compact && (
        <span style={{ fontSize: 10.5, color: c, fontWeight: active ? 700 : 500 }}>{label}</span>
      )}
    </div>
  );
}

// Scroll container for screen body (accounts for status + top + tab)
function ScreenBody({ children, dark = false, padding = 12, tabVariant = 1, topOffset = 0 }) {
  const S = useSketch(dark);
  const bottomPad = tabVariant === 3 ? 100 : 90;
  return (
    <div style={{
      position: 'absolute',
      top: 44 + topOffset, left: 0, right: 0, bottom: 0,
      overflowY: 'auto',
      padding,
      paddingBottom: bottomPad,
      background: S.paper,
      fontFamily: S.hand,
      color: S.ink,
    }}>{children}</div>
  );
}

// Outer phone frame — simplified, sketch-style
function SketchPhone({ children, dark = false, label }) {
  const S = useSketch(dark);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {label && (
        <div style={{
          fontFamily: S.hand, fontSize: 13, fontWeight: 700,
          color: Sketch.inkDim, marginBottom: 10, paddingLeft: 4,
        }}>{label}</div>
      )}
      <div style={{
        width: SCREEN_W, height: SCREEN_H,
        borderRadius: 44,
        border: `2.5px solid ${Sketch.line}`,
        background: S.paper,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '3px 5px 0 rgba(0,0,0,0.10)',
      }}>
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 28, borderRadius: 20,
          border: `1.5px solid ${Sketch.line}`,
          background: dark ? '#000' : '#fdfcf8',
          zIndex: 20,
        }} />
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { SketchStatusBar, SketchTopBar, SketchTabBar, TabItem, ScreenBody, SketchPhone, SCREEN_W, SCREEN_H });
