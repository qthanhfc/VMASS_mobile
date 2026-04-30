// More list / overview screens: Suppliers, Returns, Promotions, Bookkeeping, Tax, E-commerce

// ─────────────────────────────────────────────
// Suppliers (Nhà cung cấp)
// ─────────────────────────────────────────────
function SuppliersListScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const suppliers = [
    { n: 'Công ty TNHH Trung Nguyên', code: 'NCC-001', cat: vi ? 'Đồ uống' : 'Beverage', orders: 42, debt: '12.4M', status: 'active', c: '#d97757' },
    { n: 'Masan Consumer', code: 'NCC-002', cat: vi ? 'Thực phẩm' : 'Food', orders: 58, debt: '0', status: 'active', c: '#7a9e7a' },
    { n: 'Vinamilk', code: 'NCC-003', cat: vi ? 'Sữa' : 'Dairy', orders: 31, debt: '3.8M', status: 'active', c: '#6b8cae' },
    { n: 'Unilever Việt Nam', code: 'NCC-004', cat: vi ? 'Gia dụng' : 'Household', orders: 24, debt: '5.2M', status: 'active', c: '#8a6a9e' },
    { n: 'Mondelez Kinh Đô', code: 'NCC-005', cat: vi ? 'Bánh kẹo' : 'Snacks', orders: 18, debt: '0', status: 'active', c: '#d4a574' },
    { n: 'Nestlé Việt Nam', code: 'NCC-006', cat: vi ? 'Đồ uống' : 'Beverage', orders: 15, debt: '2.1M', status: 'paused', c: '#b08968' },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Nhà cung cấp' : 'Suppliers'}
        count={`24 NCC · ${vi ? 'Công nợ' : 'AP'} 23.5M`}/>
      <SearchBar dark={dark} placeholder={vi ? 'Tìm NCC, mã số thuế...' : 'Search suppliers...'}/>

      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        {[
          { l: vi ? 'Tổng NCC' : 'Total', v: '24', c: S.ink },
          { l: vi ? 'Đang hoạt động' : 'Active', v: '22', c: '#4a9f4a' },
          { l: vi ? 'Công nợ' : 'Debt', v: '23.5M', c: '#d97757' },
          { l: vi ? 'Đơn nhập' : 'POs', v: '188', c: S.accent },
        ].map((x, i) => (
          <SBox key={i} dark={dark} style={{ padding: '8px 6px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: x.c, fontFamily: Sketch.mono, letterSpacing: -0.3 }}>{x.v}</div>
            <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{x.l}</div>
          </SBox>
        ))}
      </div>

      <FilterChips dark={dark} active={0} chips={vi
        ? ['Tất cả', 'Đồ uống', 'Thực phẩm', 'Sữa', 'Gia dụng', 'Bánh kẹo', 'Có công nợ']
        : ['All', 'Beverage', 'Food', 'Dairy', 'Household', 'Snacks', 'With debt']}/>

      <div style={{ padding: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {suppliers.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              opacity: s.status === 'paused' ? 0.6 : 1 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.c + '33',
                border: `1.5px solid ${s.c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SIcon name="truck" size={20} color={s.c}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.n}</div>
                <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 2 }}>{s.code} · {s.cat}</div>
                <div style={{ fontSize: 10, marginTop: 1 }}>
                  <span style={{ color: S.inkDim }}>{s.orders} {vi ? 'đơn nhập' : 'POs'} · </span>
                  <span style={{ color: s.debt === '0' ? '#4a9f4a' : '#d97757', fontWeight: 700 }}>
                    {vi ? 'nợ' : 'debt'} {s.debt}
                  </span>
                </div>
              </div>
              <SIcon name="chevron_right" size={14} color={S.inkFaint}/>
            </div>
          ))}
        </SBox>
      </div>
      <ListFab dark={dark} label={vi ? 'Thêm NCC' : 'New supplier'} bottom={variant === 3 ? 100 : 90}/>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Returns (Trả hàng)
// ─────────────────────────────────────────────
function ReturnsListScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const returns = [
    { id: '#TH-2412-008', cust: 'Nguyễn Thị Lan', items: 1, amt: '285K', reason: vi ? 'Lỗi sản phẩm' : 'Defective', status: 'pending', time: 'Hôm nay 10:42' },
    { id: '#TH-2412-007', cust: 'Trần Văn Minh', items: 2, amt: '120K', reason: vi ? 'Không vừa ý' : 'Not satisfied', status: 'approved', time: 'Hôm nay 09:15' },
    { id: '#TH-2412-006', cust: 'Lê Thị Hoa', items: 1, amt: '45K', reason: vi ? 'Sai mẫu' : 'Wrong item', status: 'refunded', time: 'Hôm qua 16:20' },
    { id: '#TH-2412-005', cust: 'Phạm Đức Anh', items: 3, amt: '540K', reason: vi ? 'Hết hạn' : 'Expired', status: 'pending', time: 'Hôm qua 14:08' },
    { id: '#TH-2412-004', cust: 'Khách lẻ', items: 1, amt: '28K', reason: vi ? 'Đổi size' : 'Size exchange', status: 'rejected', time: '2 ngày trước' },
  ];
  const sm = {
    pending: { l: vi ? 'Chờ duyệt' : 'Pending', c: '#d97757', bg: '#d9775722' },
    approved: { l: vi ? 'Đã duyệt' : 'Approved', c: '#6b8cae', bg: '#6b8cae22' },
    refunded: { l: vi ? 'Hoàn tiền' : 'Refunded', c: '#4a9f4a', bg: '#4a9f4a22' },
    rejected: { l: vi ? 'Từ chối' : 'Rejected', c: '#8a8a8a', bg: '#8a8a8a22' },
  };
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Trả hàng / Hoàn tiền' : 'Returns / Refunds'}
        count={`3 ${vi ? 'yêu cầu chờ duyệt' : 'pending requests'}`}/>
      <SearchBar dark={dark} placeholder={vi ? 'Tìm mã trả hàng, đơn gốc...' : 'Search return ID...'}/>

      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        {[
          { l: vi ? 'Chờ duyệt' : 'Pending', v: '3', c: '#d97757' },
          { l: vi ? 'Đã duyệt' : 'Approved', v: '8', c: '#6b8cae' },
          { l: vi ? 'Hoàn tiền tháng' : 'Refunded', v: '2.1M', c: '#4a9f4a' },
          { l: vi ? 'Tỷ lệ trả' : 'Return rate', v: '1.8%', c: S.accent },
        ].map((x, i) => (
          <SBox key={i} dark={dark} style={{ padding: '8px 6px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: x.c, fontFamily: Sketch.mono, letterSpacing: -0.3 }}>{x.v}</div>
            <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{x.l}</div>
          </SBox>
        ))}
      </div>

      <FilterChips dark={dark} active={1} chips={vi
        ? ['Tất cả', 'Chờ duyệt (3)', 'Đã duyệt', 'Hoàn tiền', 'Từ chối']
        : ['All', 'Pending (3)', 'Approved', 'Refunded', 'Rejected']}/>

      <div style={{ padding: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {returns.map((r, i) => {
            const st = sm[r.status];
            return (
              <div key={i} style={{ padding: '10px 12px',
                borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, fontFamily: Sketch.mono }}>{r.id}</div>
                  <div style={{ padding: '2px 7px', borderRadius: 4, background: st.bg, color: st.c, fontSize: 9.5, fontWeight: 700 }}>{st.l}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 10, color: S.inkDim }}>{r.time}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{r.cust}</div>
                <div style={{ fontSize: 10.5, color: S.inkDim, marginBottom: 3 }}>
                  <span style={{ fontStyle: 'italic' }}>"{r.reason}"</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 10.5, color: S.inkDim }}>{r.items} {vi ? 'SP trả' : 'items'}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#d97757', fontFamily: Sketch.mono }}>-{r.amt}</div>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <div style={{ flex: 1, padding: '5px 0', textAlign: 'center', borderRadius: 8,
                      background: '#4a9f4a', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                      {vi ? '✓ Duyệt' : '✓ Approve'}
                    </div>
                    <div style={{ flex: 1, padding: '5px 0', textAlign: 'center', borderRadius: 8,
                      border: `1.5px solid ${S.line}`, fontSize: 11, fontWeight: 700 }}>
                      {vi ? '✕ Từ chối' : '✕ Reject'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </SBox>
      </div>
      <ListFab dark={dark} label={vi ? 'Tạo yêu cầu' : 'New return'} bottom={variant === 3 ? 100 : 90}/>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Promotions (Khuyến mãi)
// ─────────────────────────────────────────────
function PromotionsListScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const promos = [
    { n: vi ? 'Giảm 20% toàn bộ đồ uống' : '20% off beverages', code: 'DRINK20', type: 'percent', val: '20%', used: 142, limit: 500, status: 'active', end: '31/12', c: '#d97757' },
    { n: vi ? 'Mua 2 tặng 1 mì Hảo Hảo' : 'Buy 2 get 1 Hảo Hảo', code: 'BOGO-MI', type: 'bogo', val: 'B2G1', used: 38, limit: 100, status: 'active', end: '25/12', c: '#7a9e7a' },
    { n: vi ? 'Giảm 50K đơn từ 500K' : '50K off orders 500K+', code: 'SAVE50', type: 'flat', val: '-50K', used: 89, limit: 200, status: 'active', end: '28/12', c: '#6b8cae' },
    { n: vi ? 'Flash sale 12.12' : 'Flash sale 12.12', code: 'FLASH1212', type: 'percent', val: '30%', used: 0, limit: 1000, status: 'scheduled', end: '12/12', c: '#8a6a9e' },
    { n: vi ? 'Combo bánh kẹo Tết' : 'Tet snack combo', code: 'TET2026', type: 'combo', val: 'Combo', used: 0, limit: 300, status: 'scheduled', end: '15/01', c: '#d4a574' },
    { n: vi ? 'Khuyến mãi khai trương' : 'Grand opening', code: 'OPEN10', type: 'percent', val: '10%', used: 256, limit: 300, status: 'ended', end: '30/11', c: '#8a8a8a' },
  ];
  const sm = {
    active: { l: vi ? 'Đang chạy' : 'Active', c: '#4a9f4a' },
    scheduled: { l: vi ? 'Đã lên lịch' : 'Scheduled', c: '#6b8cae' },
    ended: { l: vi ? 'Đã kết thúc' : 'Ended', c: '#8a8a8a' },
  };
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Khuyến mãi' : 'Promotions'}
        count={`7 ${vi ? 'chương trình · 3 đang chạy' : 'programs · 3 active'}`}/>
      <SearchBar dark={dark} placeholder={vi ? 'Tìm theo tên, mã KM...' : 'Search by name, code...'}/>

      {/* Hero card */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 12 }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 6 }}>
            🎁 {vi ? 'HIỆU QUẢ KHUYẾN MÃI THÁNG' : 'PROMO IMPACT THIS MONTH'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { l: vi ? 'Đã dùng' : 'Used', v: '269' },
              { l: vi ? 'Tiết kiệm' : 'Discounted', v: '14.2M' },
              { l: vi ? 'DT nhờ KM' : 'Rev. from', v: '86M' },
            ].map((x, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono, letterSpacing: -0.5 }}>{x.v}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>{x.l}</div>
              </div>
            ))}
          </div>
        </SBox>
      </div>

      <FilterChips dark={dark} active={0} chips={vi
        ? ['Tất cả', 'Đang chạy', 'Đã lên lịch', 'Đã kết thúc', 'Giảm %', 'Giảm tiền', 'Mua X tặng Y']
        : ['All', 'Active', 'Scheduled', 'Ended', '% off', 'Flat', 'BOGO']}/>

      <div style={{ padding: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {promos.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              opacity: p.status === 'ended' ? 0.55 : 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: p.c + '22',
                border: `1.5px dashed ${p.c}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SIcon name="tag" size={14} color={p.c}/>
                <div style={{ fontSize: 11, fontWeight: 800, color: p.c, fontFamily: Sketch.mono, marginTop: 1 }}>{p.val}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
                <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 2 }}>{p.code} · {vi ? 'hết' : 'ends'} {p.end}</div>
                {/* progress bar */}
                <div style={{ marginTop: 4, height: 4, background: S.inkFaint, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (p.used/p.limit)*100)}%`, height: '100%', background: p.c }}/>
                </div>
                <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 2 }}>
                  <span style={{ color: sm[p.status].c, fontWeight: 700 }}>● {sm[p.status].l}</span>
                  {' · '}
                  <span style={{ fontFamily: Sketch.mono }}>{p.used}/{p.limit}</span>
                </div>
              </div>
            </div>
          ))}
        </SBox>
      </div>
      <ListFab dark={dark} label={vi ? 'Tạo KM' : 'New promo'} bottom={variant === 3 ? 100 : 90}/>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Bookkeeping (Sổ sách kế toán)
// ─────────────────────────────────────────────
function BookkeepingScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const books = [
    { icon: 'cart', n: vi ? 'Sổ bán hàng' : 'Sales book', cnt: '1,248 ' + (vi ? 'giao dịch' : 'entries'), amt: '420M', c: '#4a9f4a' },
    { icon: 'truck', n: vi ? 'Sổ mua hàng' : 'Purchase book', cnt: '188 ' + (vi ? 'đơn nhập' : 'POs'), amt: '268M', c: '#6b8cae' },
    { icon: 'money', n: vi ? 'Sổ thu chi' : 'Cash book', cnt: '342 ' + (vi ? 'khoản' : 'txns'), amt: '+152M', c: '#d4a574' },
    { icon: 'coin', n: vi ? 'Sổ công nợ' : 'Receivables', cnt: vi ? '18 khách nợ' : '18 debtors', amt: '15M', c: '#d97757' },
    { icon: 'box', n: vi ? 'Sổ hàng tồn kho' : 'Stock ledger', cnt: '1,284 SKU', amt: '248M', c: '#b08968' },
    { icon: 'user', n: vi ? 'Sổ tiền lương' : 'Payroll', cnt: '12 NV', amt: '86M', c: '#8a6a9e' },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Sổ sách kế toán' : 'Bookkeeping'}
        count={vi ? 'Tháng 12/2025 · TT 88/2021' : 'Dec 2025 · Circular 88/2021'}/>

      {/* Period selector */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SIcon name="calendar" size={16} dark={dark} color={S.accent}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{vi ? 'Kỳ báo cáo' : 'Period'}</div>
            <div style={{ fontSize: 10.5, color: S.inkDim }}>01/12 — 31/12/2025</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${S.line}`, fontSize: 10, fontWeight: 700 }}>{vi ? 'Tháng' : 'Month'}</div>
            <div style={{ padding: '4px 8px', borderRadius: 6, background: S.accent, color: '#fff', fontSize: 10, fontWeight: 700 }}>{vi ? 'Quý' : 'Qtr'}</div>
            <div style={{ padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${S.line}`, fontSize: 10, fontWeight: 700 }}>{vi ? 'Năm' : 'Year'}</div>
          </div>
        </SBox>
      </div>

      {/* P&L summary hero */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 14 }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 6 }}>
            📊 {vi ? 'BÁO CÁO KẾT QUẢ KINH DOANH' : 'PROFIT & LOSS'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{vi ? 'Lợi nhuận ròng' : 'Net profit'}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono, letterSpacing: -1 }}>+62.4M</div>
            </div>
            <div style={{ fontSize: 11, color: '#ffd54a', fontWeight: 700 }}>▲ 18.2%</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { l: vi ? 'Doanh thu' : 'Revenue', v: '420M' },
              { l: vi ? 'Giá vốn' : 'COGS', v: '268M' },
              { l: vi ? 'Chi phí' : 'Expenses', v: '89.6M' },
              { l: vi ? 'Thuế TNCN' : 'Tax', v: '6.3M' },
            ].map((x, i) => (
              <div key={i} style={{ padding: '6px 8px', borderRadius: 8,
                background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)' }}>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.85)' }}>{x.l}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono }}>{x.v}</div>
              </div>
            ))}
          </div>
        </SBox>
      </div>

      {/* Ledger list */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📒 {vi ? 'Các sổ chi tiết' : 'Detail books'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {books.map((b, i) => (
            <SBox key={i} dark={dark} style={{ padding: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: b.c + '33',
                border: `1.5px solid ${b.c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <SIcon name={b.icon} size={16} color={b.c}/>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{b.n}</div>
              <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 2 }}>{b.cnt}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: b.c, fontFamily: Sketch.mono, marginTop: 3, letterSpacing: -0.3 }}>{b.amt}</div>
            </SBox>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 12px 20px', display: 'flex', gap: 8 }}>
        <SBox dark={dark} style={{ flex: 1, padding: 10, textAlign: 'center' }}>
          <SIcon name="download" size={18} dark={dark} color={S.accent}/>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{vi ? 'Xuất Excel' : 'Export Excel'}</div>
        </SBox>
        <SBox dark={dark} style={{ flex: 1, padding: 10, textAlign: 'center' }}>
          <SIcon name="printer" size={18} dark={dark} color={S.accent}/>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{vi ? 'In báo cáo' : 'Print'}</div>
        </SBox>
        <SBox dark={dark} style={{ flex: 1, padding: 10, textAlign: 'center' }}>
          <SIcon name="upload" size={18} dark={dark} color={S.accent}/>
          <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{vi ? 'Nộp thuế' : 'File tax'}</div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Tax (Thuế)
// ─────────────────────────────────────────────
function TaxScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const filings = [
    { p: vi ? 'Quý 4/2025' : 'Q4/2025', due: '30/01/2026', vat: '4.2M', pit: '2.1M', total: '6.3M', status: 'draft', daysLeft: 37 },
    { p: vi ? 'Quý 3/2025' : 'Q3/2025', due: '30/10/2025', vat: '3.8M', pit: '1.9M', total: '5.7M', status: 'filed', filedOn: '28/10' },
    { p: vi ? 'Quý 2/2025' : 'Q2/2025', due: '30/07/2025', vat: '3.5M', pit: '1.75M', total: '5.25M', status: 'filed', filedOn: '29/07' },
    { p: vi ? 'Quý 1/2025' : 'Q1/2025', due: '30/04/2025', vat: '2.9M', pit: '1.45M', total: '4.35M', status: 'filed', filedOn: '25/04' },
  ];
  const sm = {
    draft: { l: vi ? 'Chưa nộp' : 'Draft', c: '#d97757', bg: '#d9775722' },
    filed: { l: vi ? 'Đã nộp' : 'Filed', c: '#4a9f4a', bg: '#4a9f4a22' },
    overdue: { l: vi ? 'Quá hạn' : 'Overdue', c: '#c94a4a', bg: '#c94a4a22' },
  };
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Kê khai thuế' : 'Tax filing'}
        count={vi ? 'Hộ kinh doanh · MST 8112345678' : 'Sole prop · TIN 8112345678'}/>

      {/* Current period due — big alert card */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: 14, border: `2px solid #d97757`, background: '#d9775711' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SIcon name="warn" size={18} color="#d97757"/>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#d97757', letterSpacing: 0.3 }}>
              {vi ? 'TỜ KHAI QUÝ 4/2025' : 'Q4/2025 FILING'}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#d97757', fontWeight: 700 }}>
              {vi ? 'Còn 37 ngày' : '37 days left'}
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: S.ink, fontFamily: Sketch.mono, letterSpacing: -0.8 }}>
            6.300.000₫
          </div>
          <div style={{ fontSize: 11, color: S.inkDim, marginTop: 2 }}>
            {vi ? 'Tổng thuế phải nộp · Hạn 30/01/2026' : 'Total tax due · Due 30/01/2026'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
            <div style={{ padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${S.line}`, background: S.paper }}>
              <div style={{ fontSize: 9.5, color: S.inkDim }}>{vi ? 'Thuế GTGT (1%)' : 'VAT (1%)'}</div>
              <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono }}>4.200.000₫</div>
            </div>
            <div style={{ padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${S.line}`, background: S.paper }}>
              <div style={{ fontSize: 9.5, color: S.inkDim }}>{vi ? 'Thuế TNCN (0.5%)' : 'PIT (0.5%)'}</div>
              <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono }}>2.100.000₫</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <div style={{ flex: 2, padding: '8px 0', textAlign: 'center', borderRadius: 8,
              background: S.accent, color: '#fff', fontSize: 12, fontWeight: 700 }}>
              {vi ? '📤 Nộp tờ khai ngay' : '📤 File now'}
            </div>
            <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8,
              border: `1.5px solid ${S.line}`, fontSize: 12, fontWeight: 700 }}>
              {vi ? 'Xem' : 'Review'}
            </div>
          </div>
        </SBox>
      </div>

      {/* Yearly summary */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        {[
          { l: vi ? 'DT 2025' : 'Rev 2025', v: '1.58B', c: S.ink },
          { l: vi ? 'Thuế cả năm' : 'Total tax', v: '21.6M', c: '#d97757' },
          { l: vi ? 'Đã nộp' : 'Paid', v: '15.3M', c: '#4a9f4a' },
        ].map((x, i) => (
          <SBox key={i} dark={dark} style={{ padding: '8px 6px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: x.c, fontFamily: Sketch.mono, letterSpacing: -0.3 }}>{x.v}</div>
            <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{x.l}</div>
          </SBox>
        ))}
      </div>

      {/* Filing history */}
      <div style={{ padding: '0 12px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📋 {vi ? 'Lịch sử tờ khai' : 'Filing history'}</div>
        <SBox dark={dark} style={{ padding: 0 }}>
          {filings.map((f, i) => {
            const st = sm[f.status];
            return (
              <div key={i} style={{ padding: '10px 12px',
                borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{f.p}</div>
                  <div style={{ padding: '2px 7px', borderRadius: 4, background: st.bg, color: st.c, fontSize: 9.5, fontWeight: 700 }}>{st.l}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800, fontFamily: Sketch.mono, color: st.c }}>{f.total}</div>
                </div>
                <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono }}>
                  GTGT {f.vat} · TNCN {f.pit} · {f.status === 'filed' ? `${vi ? 'nộp' : 'filed'} ${f.filedOn}` : `${vi ? 'hạn' : 'due'} ${f.due}`}
                </div>
              </div>
            );
          })}
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// E-commerce channels (Thương mại điện tử)
// ─────────────────────────────────────────────
function EcommerceScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const platforms = [
    { n: 'Shopee', c: '#ee4d2d', connected: true, orders: 42, revenue: '4.2M', pending: 3, rating: 4.8, shop: 'vmass.store' },
    { n: 'TikTok Shop', c: '#1a1a1a', connected: true, orders: 27, revenue: '2.8M', pending: 5, rating: 4.7, shop: '@vmass' },
    { n: 'Lazada', c: '#0f146d', connected: true, orders: 18, revenue: '1.9M', pending: 0, rating: 4.9, shop: 'VMASS Official' },
    { n: 'Tiki', c: '#189eff', connected: false },
    { n: 'Sendo', c: '#d0021b', connected: false },
    { n: 'Facebook Shop', c: '#1877f2', connected: true, orders: 12, revenue: '890K', pending: 2, rating: null, shop: 'fb.com/vmass' },
  ];
  const connected = platforms.filter(p => p.connected);
  const totalOrders = connected.reduce((s, p) => s + (p.orders || 0), 0);
  const totalPending = connected.reduce((s, p) => s + (p.pending || 0), 0);
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Thương mại điện tử' : 'E-commerce'}
        count={`${connected.length}/${platforms.length} ${vi ? 'sàn đã kết nối' : 'channels connected'}`}/>

      {/* Aggregate hero */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 14 }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 6 }}>
            🌐 {vi ? 'TỔNG HỢP ĐA KÊNH HÔM NAY' : 'OMNI-CHANNEL TODAY'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{vi ? 'Tổng đơn sàn' : 'Total orders'}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono, letterSpacing: -1 }}>{totalOrders}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{vi ? 'Cần xử lý' : 'To handle'}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#ffd54a', fontFamily: Sketch.mono }}>{totalPending}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.14)' }}>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.85)' }}>{vi ? 'DT sàn hôm nay' : 'Revenue'}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono }}>9.8M</div>
            </div>
            <div style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.14)' }}>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.85)' }}>{vi ? 'Đồng bộ kho' : 'Stock sync'}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#4adf6a', fontFamily: Sketch.mono }}>● {vi ? 'Bình thường' : 'OK'}</div>
            </div>
          </div>
        </SBox>
      </div>

      <FilterChips dark={dark} active={0} chips={vi
        ? ['Tất cả', 'Đã kết nối', 'Chưa kết nối', 'Có đơn chờ']
        : ['All', 'Connected', 'Not connected', 'Has pending']}/>

      {/* Platforms list */}
      <div style={{ padding: '0 12px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{vi ? 'Sàn thương mại' : 'Platforms'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {platforms.map((p, i) => (
            <SBox key={i} dark={dark} style={{ padding: 12, opacity: p.connected ? 1 : 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: p.connected ? 8 : 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: p.c,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#fff', fontWeight: 800, flexShrink: 0 }}>{p.n[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.n}</div>
                  <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                    {p.connected ? p.shop : (vi ? 'Chưa kết nối' : 'Not connected')}
                  </div>
                </div>
                {p.connected ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4a9f4a', fontWeight: 700 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4a9f4a' }}/>
                      {vi ? 'Đã KN' : 'ON'}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '5px 12px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 11, fontWeight: 700 }}>
                    + {vi ? 'Kết nối' : 'Connect'}
                  </div>
                )}
              </div>
              {p.connected && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6,
                  paddingTop: 8, borderTop: `1px dashed ${S.inkFaint}` }}>
                  <div>
                    <div style={{ fontSize: 9, color: S.inkDim }}>{vi ? 'Đơn' : 'Orders'}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono }}>{p.orders}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: S.inkDim }}>{vi ? 'Doanh thu' : 'Revenue'}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono, color: S.accent }}>{p.revenue}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: S.inkDim }}>{vi ? 'Chờ' : 'Pending'}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono, color: p.pending > 0 ? '#d97757' : S.ink }}>{p.pending}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: S.inkDim }}>{vi ? 'Đánh giá' : 'Rating'}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono }}>
                      {p.rating ? `★ ${p.rating}` : '—'}
                    </div>
                  </div>
                </div>
              )}
            </SBox>
          ))}
        </div>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, {
  SuppliersListScreen, ReturnsListScreen, PromotionsListScreen,
  BookkeepingScreen, TaxScreen, EcommerceScreen,
});
