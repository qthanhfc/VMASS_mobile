// Management tab — hub of CRUD sections

function ManageScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const sections = [
    { icon: 'box', label: vi ? 'Sản phẩm' : 'Products', count: '1,284', color: '#008ecc' },
    { icon: 'users', label: vi ? 'Khách hàng' : 'Customers', count: '892', color: '#7a9e7a' },
    { icon: 'truck', label: vi ? 'Nhà cung cấp' : 'Suppliers', count: '24', color: '#6b8cae' },
    { icon: 'shop', label: vi ? 'Tồn kho' : 'Inventory', count: '8 kho', color: '#b08968' },
    { icon: 'cart', label: vi ? 'Đơn hàng' : 'Orders', count: '38', color: '#c97a7a' },
    { icon: 'refresh', label: vi ? 'Trả hàng' : 'Returns', count: '3', color: '#9e8ab8' },
    { icon: 'user', label: vi ? 'Nhân viên' : 'Staff', count: '12', color: '#5b8a7a' },
    { icon: 'tag', label: vi ? 'Khuyến mãi' : 'Promotions', count: '7', color: '#d4a574' },
    { icon: 'money', label: vi ? 'Hóa đơn / Công nợ' : 'Invoices / AR', count: '15M', color: '#a87c8a' },
    { icon: 'book', label: vi ? 'Sổ sách kế toán' : 'Bookkeeping', count: '', color: '#8a8a6a' },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 16px 8px' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{vi ? 'Quản lý' : 'Manage'}</div>
        <div style={{ fontSize: 12, color: S.inkDim, marginTop: 2 }}>
          {vi ? 'Thêm, sửa, xóa dữ liệu' : 'Add, edit, delete data'}
        </div>
      </div>

      {/* search */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
          <SIcon name="search" size={16} dark={dark}/>
          <span style={{ color: S.inkDim, fontSize: 13 }}>{vi ? 'Tìm kiếm...' : 'Search...'}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <SIcon name="qr" size={18} color={S.accent}/>
          </div>
        </SBox>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {vi ? 'Tác vụ nhanh' : 'Quick actions'}
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {[
            { i: 'plus', l: vi ? 'Thêm SP' : 'Add item' },
            { i: 'cart', l: 'POS' },
            { i: 'printer', l: vi ? 'In HĐ' : 'Print' },
            { i: 'download', l: 'Excel' },
            { i: 'upload', l: vi ? 'Nhập kho' : 'Stock in' },
          ].map((a, i) => (
            <SBox key={i} dark={dark} style={{
              padding: '10px 14px', minWidth: 70, flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <SIcon name={a.i} size={20} dark={dark}/>
              <span style={{ fontSize: 11 }}>{a.l}</span>
            </SBox>
          ))}
        </div>
      </div>

      {/* Feature cards: Bookkeeping & E-commerce */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {vi ? 'Dành cho hộ kinh doanh' : 'For business owners'}
        </div>

        {/* Bookkeeping / Tax card */}
        <SBox dark={dark} fill={S.accent} style={{ padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <SIcon name="book" size={22} color="#fff"/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {vi ? 'Sổ sách kế toán thuế' : 'Tax bookkeeping'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 1.35 }}>
                {vi ? 'Hộ kinh doanh · Theo TT 88/2021/TT-BTC' : 'Sole proprietorship · per Circular 88/2021'}
              </div>
            </div>
            <SIcon name="chevron_right" size={16} color="rgba(255,255,255,0.8)"/>
          </div>

          {/* Mini stats row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {[
              { l: vi ? 'Doanh thu Q4' : 'Q4 revenue', v: '420M', c: '#fff' },
              { l: vi ? 'Thuế phải nộp' : 'Tax due', v: '6.3M', c: '#ffd54a' },
              { l: vi ? 'Hạn nộp' : 'Due', v: '30/12', c: '#fff' },
            ].map((x, i) => (
              <div key={i} style={{
                flex: 1, padding: '8px 10px', borderRadius: 10,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: x.c, fontFamily: Sketch.mono, letterSpacing: -0.5 }}>{x.v}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>{x.l}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              vi ? 'Sổ bán hàng' : 'Sales book',
              vi ? 'Sổ mua hàng' : 'Purchase book',
              vi ? 'Tờ khai thuế' : 'Tax form',
              vi ? 'Hóa đơn điện tử' : 'E-invoice',
            ].map((l, i) => (
              <div key={i} style={{
                padding: '4px 9px', borderRadius: 999,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.4)',
                fontSize: 10.5, color: '#fff', fontWeight: 600,
              }}>{l}</div>
            ))}
          </div>
        </SBox>

        {/* E-commerce platforms card */}
        <SBox dark={dark} style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: S.accentDim,
              border: `1.5px solid ${S.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <SIcon name="globe" size={22} color={S.accent}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {vi ? 'Sàn thương mại điện tử' : 'E-commerce platforms'}
              </div>
              <div style={{ fontSize: 11, color: S.inkDim, marginTop: 2, lineHeight: 1.35 }}>
                {vi ? 'Đồng bộ đơn hàng & tồn kho đa kênh' : 'Sync orders & stock across channels'}
              </div>
            </div>
            <span style={{ fontSize: 11, color: S.accent, fontWeight: 700 }}>+ {vi ? 'Kết nối' : 'Connect'}</span>
          </div>

          {/* Platform rows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { n: 'Shopee', c: '#ee4d2d', orders: 42, connected: true, pending: 3 },
              { n: 'Lazada', c: '#0f146d', orders: 18, connected: true, pending: 0 },
              { n: 'TikTok Shop', c: '#1a1a1a', orders: 27, connected: true, pending: 5 },
              { n: 'Tiki', c: '#189eff', orders: 0, connected: false, pending: 0 },
            ].map((p, i) => (
              <div key={i} style={{
                padding: '8px 10px',
                border: `1.5px solid ${p.connected ? S.line : S.inkFaint}`,
                borderRadius: 10,
                background: p.connected ? S.paper : 'transparent',
                opacity: p.connected ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    background: p.c,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fff', fontWeight: 800,
                  }}>{p.n[0]}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{p.n}</span>
                  {p.connected ? (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#4a9f4a',
                    }}/>
                  ) : (
                    <span style={{ fontSize: 9, color: S.inkDim, fontFamily: Sketch.mono }}>OFF</span>
                  )}
                </div>
                {p.connected ? (
                  <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono }}>
                    <span style={{ color: S.ink, fontWeight: 700 }}>{p.orders}</span> {vi ? 'đơn' : 'orders'}
                    {p.pending > 0 && (
                      <span style={{ color: '#d97757', fontWeight: 700 }}> · {p.pending} {vi ? 'chờ' : 'pending'}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 10.5, color: S.inkDim }}>
                    {vi ? 'Chưa kết nối' : 'Not connected'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${S.inkFaint}`,
          }}>
            <div style={{ fontSize: 11, color: S.inkDim }}>
              {vi ? 'Tổng đơn hôm nay' : 'Total orders today'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: S.accent, fontFamily: Sketch.mono }}>
              87 <span style={{ fontSize: 10, color: '#d97757', fontWeight: 700 }}>· 8 {vi ? 'cần xử lý' : 'to handle'}</span>
            </div>
          </div>
        </SBox>
      </div>

      {/* Sections grid */}
      <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {sections.map((s, i) => (
          <SBox key={i} dark={dark} style={{ padding: 12, position: 'relative' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: s.color + '33',
              border: `1.5px solid ${s.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <SIcon name={s.icon} size={18} color={s.color}/>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: S.inkDim, marginTop: 2, fontFamily: Sketch.mono }}>{s.count}</div>
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <SIcon name="chevron_right" size={14} color={S.inkFaint}/>
            </div>
          </SBox>
        ))}
      </div>

      {/* Featured: product list preview */}
      <div style={{ padding: '16px 12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>📦 {vi ? 'Sản phẩm gần đây' : 'Recent products'}</div>
          <span style={{ fontSize: 12, color: S.accent, fontWeight: 700 }}>{vi ? 'Thêm mới +' : 'Add +'}</span>
        </div>
        <SBox dark={dark} style={{ padding: 0 }}>
          {[
            { n: 'Cà phê G7 (3 trong 1)', sku: 'SP-0421', p: '25K', stk: 124 },
            { n: 'Coca-Cola lon 330ml', sku: 'SP-0305', p: '12K', stk: 88 },
            { n: 'Mì Hảo Hảo tôm chua', sku: 'SP-0118', p: '5K', stk: 42 },
            { n: 'Bánh Oreo 137g', sku: 'SP-0609', p: '28K', stk: 16 },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
            }}>
              <SPlaceholder label="" w={40} h={40} dark={dark} style={{ padding: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
                <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>{p.sku} · tồn {p.stk}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.accent }}>{p.p}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <SIcon name="edit" size={12} color={S.inkDim}/>
                  <SIcon name="trash" size={12} color={S.inkDim}/>
                </div>
              </div>
            </div>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, { ManageScreen });
