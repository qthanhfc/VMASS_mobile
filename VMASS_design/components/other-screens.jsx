// Settings + QR scanner + POS modal

function SettingsScreen({ dark = false, lang = 'vi', variant = 1, onToggleDark, onLang }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';

  const groups = [
    {
      title: vi ? 'Tài khoản' : 'Account',
      items: [
        { i: 'user', l: vi ? 'Thông tin cá nhân' : 'Profile', d: 'Minh Nguyễn' },
        { i: 'shop', l: vi ? 'Cửa hàng của tôi' : 'My stores', d: '2 ' + (vi ? 'cửa hàng' : 'stores') },
        { i: 'users', l: vi ? 'Nhân viên & quyền' : 'Staff & roles', d: '12' },
      ],
    },
    {
      title: vi ? 'Bán hàng & In ấn' : 'Sales & Printing',
      items: [
        { i: 'printer', l: vi ? 'Máy in hóa đơn' : 'Receipt printer', d: 'Xprinter XP-80' },
        { i: 'qr', l: vi ? 'Máy quét mã vạch' : 'Barcode scanner', d: vi ? 'Camera điện thoại' : 'Phone camera' },
        { i: 'coin', l: vi ? 'Phương thức thanh toán' : 'Payment methods', d: 'MoMo · VNPay · TM' },
      ],
    },
    {
      title: vi ? 'Tích hợp' : 'Integrations',
      items: [
        { i: 'fb', l: 'Facebook Messenger', d: vi ? 'Đã kết nối' : 'Connected', ok: true },
        { i: 'zalo', l: 'Zalo OA', d: vi ? 'Đã kết nối' : 'Connected', ok: true },
        { i: 'ig', l: 'Instagram', d: vi ? 'Chưa kết nối' : 'Not connected' },
        { i: 'bag', l: 'Shopee · Lazada · TikTok', d: vi ? '1/3 đang đồng bộ' : '1/3 syncing' },
      ],
    },
    {
      title: vi ? 'Giao diện' : 'Appearance',
      items: [
        { i: 'moon', l: vi ? 'Chế độ tối' : 'Dark mode', toggle: true, on: dark, onPress: onToggleDark },
        { i: 'globe', l: vi ? 'Ngôn ngữ' : 'Language', d: vi ? 'Tiếng Việt' : 'English', onPress: onLang },
      ],
    },
    {
      title: vi ? 'Khác' : 'Other',
      items: [
        { i: 'download', l: vi ? 'Sao lưu & xuất dữ liệu' : 'Backup & export' },
        { i: 'bell', l: vi ? 'Thông báo' : 'Notifications', d: vi ? 'Bật' : 'On' },
        { i: 'book', l: vi ? 'Hướng dẫn sử dụng' : 'User guide' },
      ],
    },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 16px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{vi ? 'Cài đặt' : 'Settings'}</div>
      </div>

      {/* Profile header */}
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <SCircle size={54} dark={dark} fill={S.accentDim} style={{ borderColor: S.accent }}>
            <span style={{ color: S.accent, fontWeight: 800, fontSize: 22 }}>MN</span>
          </SCircle>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Minh Nguyễn</div>
            <div style={{ fontSize: 12, color: S.inkDim }}>minh@vmass.vn</div>
            <div style={{ fontSize: 10, color: S.accent, fontWeight: 700, marginTop: 2, fontFamily: Sketch.mono }}>
              ⭐ {vi ? 'Gói PRO · hết hạn 30/06' : 'PRO plan · exp 30/06'}
            </div>
          </div>
          <SIcon name="chevron_right" size={16} color={S.inkFaint}/>
        </SBox>
      </div>

      {/* Groups */}
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: S.inkDim,
            padding: '0 20px 6px', textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{g.title}</div>
          <div style={{ margin: '0 12px' }}>
            <SBox dark={dark} style={{ padding: 0 }}>
              {g.items.map((it, i) => (
                <div key={i} onClick={it.onPress} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
                  cursor: it.onPress || it.toggle ? 'pointer' : 'default',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: S.paperDim, border: `1.5px solid ${S.inkFaint}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <SIcon name={it.i} size={15} dark={dark}/>
                  </div>
                  <span style={{ flex: 1, fontSize: 13 }}>{it.l}</span>
                  {it.ok && <span style={{ fontSize: 10, color: '#7a9e7a', fontWeight: 700 }}>● {vi ? 'ON' : 'ON'}</span>}
                  {it.d && !it.toggle && <span style={{ fontSize: 12, color: S.inkDim, fontFamily: Sketch.mono }}>{it.d}</span>}
                  {it.toggle && (
                    <div style={{
                      width: 40, height: 22, borderRadius: 999,
                      background: it.on ? S.accent : S.inkFaint,
                      border: `1.5px solid ${S.line}`,
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', border: `1.5px solid ${S.line}`,
                        position: 'absolute', top: 1, left: it.on ? 20 : 2,
                        transition: 'all 0.2s',
                      }}/>
                    </div>
                  )}
                  {!it.toggle && !it.ok && <SIcon name="chevron_right" size={14} color={S.inkFaint}/>}
                </div>
              ))}
            </SBox>
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', padding: '10px', fontSize: 11, color: S.inkFaint, fontFamily: Sketch.mono }}>
        VMASS v2.4.1 · Build 2026.04
      </div>
    </ScreenBody>
  );
}

// QR / Barcode scanner overlay
function QrScanScreen({ dark = false, lang = 'vi' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} padding={0} tabVariant={1}>
      <div style={{ position: 'relative', height: '100%', background: '#1a1a1a' }}>
        {/* simulated camera view */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(45deg, #222 0 10px, #2a2a2a 10px 20px)`,
        }}/>
        {/* top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          color: '#fff', fontFamily: Sketch.hand,
        }}>
          <SIcon name="x" size={22} color="#fff"/>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>
            {vi ? 'Quét mã vạch / QR' : 'Scan barcode / QR'}
          </div>
          <SIcon name="flash" size={20} color="#fff"/>
        </div>

        {/* scan frame */}
        <div style={{
          position: 'absolute', top: '32%', left: '50%',
          transform: 'translateX(-50%)',
          width: 240, height: 240,
        }}>
          {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((c) => {
            const isLeft = c.includes('Left');
            const isTop = c.includes('top');
            return (
              <div key={c} style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: 0,
                [isLeft ? 'left' : 'right']: 0,
                width: 40, height: 40,
                borderTop: isTop ? `3px solid ${S.accent}` : 'none',
                borderBottom: !isTop ? `3px solid ${S.accent}` : 'none',
                borderLeft: isLeft ? `3px solid ${S.accent}` : 'none',
                borderRight: !isLeft ? `3px solid ${S.accent}` : 'none',
              }}/>
            );
          })}
          {/* scan line */}
          <div style={{
            position: 'absolute', top: '50%', left: 10, right: 10,
            height: 2, background: S.accent, opacity: 0.8,
            boxShadow: `0 0 12px ${S.accent}`,
          }}/>
          <div style={{
            position: 'absolute', bottom: -40, left: 0, right: 0,
            textAlign: 'center', color: '#fff', fontSize: 13, fontFamily: Sketch.hand,
          }}>{vi ? 'Đặt mã trong khung' : 'Place code inside frame'}</div>
        </div>

        {/* mode toggle */}
        <div style={{
          position: 'absolute', bottom: 130, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 8,
        }}>
          {[vi ? 'Mã vạch' : 'Barcode', 'QR', vi ? 'Hình ảnh' : 'Image'].map((m, i) => (
            <div key={m} style={{
              padding: '8px 16px',
              borderRadius: 999,
              background: i === 0 ? S.accent : 'rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: Sketch.hand,
            }}>{m}</div>
          ))}
        </div>

        {/* recent scans */}
        <div style={{
          position: 'absolute', bottom: 40, left: 16, right: 16,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 14, padding: 12,
          fontFamily: Sketch.hand, color: '#1a1a1a',
          border: `1.5px solid ${Sketch.line}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>
              {vi ? 'Vừa quét' : 'Just scanned'}
            </span>
            <span style={{ fontSize: 10, color: '#888', fontFamily: Sketch.mono }}>8934567812345</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SPlaceholder label="img" w={40} h={40} style={{ padding: 0 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Cà phê G7 (3 trong 1)</div>
              <div style={{ fontSize: 11, color: '#888' }}>25.000 ₫ · {vi ? 'tồn' : 'stock'} 124</div>
            </div>
            <div style={{
              background: Sketch.accent, color: '#fff', borderRadius: 999,
              padding: '6px 12px', fontSize: 12, fontWeight: 700,
            }}>+ {vi ? 'Thêm vào đơn' : 'Add'}</div>
          </div>
        </div>
      </div>
    </ScreenBody>
  );
}

// POS quick-sale screen
function PosScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const cart = [
    { n: 'Cà phê G7', q: 2, p: 25000 },
    { n: 'Bánh Oreo', q: 1, p: 28000 },
    { n: 'Coca-Cola 330ml', q: 3, p: 12000 },
  ];
  const total = cart.reduce((s, i) => s + i.q * i.p, 0);
  return (
    <ScreenBody dark={dark} padding={0} tabVariant={variant}>
      <div style={{ padding: '10px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>
          {vi ? 'Bán hàng nhanh (POS)' : 'Quick POS'}
        </div>
        <SIcon name="user" size={20} dark={dark}/>
      </div>

      {/* Scan / search bar */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} thick style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
          <SIcon name="qr" size={18} color={S.accent}/>
          <span style={{ flex: 1, color: S.inkDim, fontSize: 13 }}>
            {vi ? 'Quét mã hoặc nhập tên SP...' : 'Scan code or enter product...'}
          </span>
          <SIcon name="camera" size={18} color={S.accent}/>
        </SBox>
      </div>

      {/* Category chips */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {['Tất cả', 'Đồ uống', 'Bánh kẹo', 'Đồ khô', 'Gia dụng'].map((c, i) => (
          <div key={c} style={{
            padding: '6px 12px', borderRadius: 999,
            border: `1.5px solid ${i === 0 ? S.line : S.inkFaint}`,
            background: i === 0 ? S.ink : 'transparent',
            color: i === 0 ? S.paper : S.ink,
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          }}>{c}</div>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ padding: '0 12px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {['G7 cà phê', 'Coca 330ml', 'Bánh Oreo', 'Hảo Hảo', 'Pepsi lon', 'Vinamilk 1L'].map((p, i) => (
          <SBox key={i} dark={dark} style={{ padding: 6 }}>
            <SPlaceholder label="" w="100%" h={52} dark={dark} style={{ padding: 0, marginBottom: 4 }}/>
            <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.15, height: 24 }}>{p}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.accent }}>
              {[25, 12, 28, 5, 13, 33][i]}K
            </div>
          </SBox>
        ))}
      </div>

      {/* Cart */}
      <div style={{ padding: '0 12px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, marginBottom: 6 }}>
          🛒 {vi ? 'Giỏ hàng' : 'Cart'} ({cart.length})
        </div>
        <SBox dark={dark} style={{ padding: 0 }}>
          {cart.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
            }}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{c.n}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${S.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>−</span>
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{c.q}</span>
                <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${S.line}`, background: S.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>+</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, minWidth: 58, textAlign: 'right' }}>
                {((c.p * c.q) / 1000).toFixed(0)}K
              </div>
            </div>
          ))}
        </SBox>
      </div>

      {/* Total + pay */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.accentDim} style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
            <span>{vi ? 'Tạm tính' : 'Subtotal'}</span>
            <span>{(total).toLocaleString('vi')} ₫</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: S.inkDim, marginBottom: 6 }}>
            <span>{vi ? 'Giảm giá (VC-MAYXINH)' : 'Discount'}</span>
            <span>− 10.000 ₫</span>
          </div>
          <div style={{ borderTop: `1.5px dashed ${S.line}`, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>{vi ? 'TỔNG' : 'TOTAL'}</span>
            <span style={{ fontSize: 20, color: S.accent }}>{(total - 10000).toLocaleString('vi')} ₫</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <div style={{ flex: 1, padding: '10px', borderRadius: 999, border: `1.5px solid ${S.line}`, textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
              {vi ? 'Tiền mặt' : 'Cash'}
            </div>
            <div style={{ flex: 1, padding: '10px', borderRadius: 999, background: S.ink, color: S.paper, textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
              {vi ? 'QR Chuyển khoản' : 'QR pay'}
            </div>
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, { SettingsScreen, QrScanScreen, PosScreen });
