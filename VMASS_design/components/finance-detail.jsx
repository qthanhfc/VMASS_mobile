// Finance detail drilldowns from Home cards
// - RevenueDetailScreen: bán hàng vs khác, breakdown, daily rows
// - ExpenseDetailScreen: COGS, vận hành, lương, marketing, khác
// - ChartDetailScreen: full chart + time range selector + comparison

// ═════════════════════════════════════════════
// Shared header for finance detail screens
// ═════════════════════════════════════════════
function FinanceHeader({ title, subtitle, dark, lang, kind = 'revenue' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const color = kind === 'revenue' ? '#4a9f4a' : (kind === 'expense' ? '#c94a4a' : S.accent);
  return (
    <div style={{ padding: '8px 12px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <SIcon name="chevron_right" size={20} dark={dark} style={{ transform: 'rotate(180deg)', marginTop: 4 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }}/>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: S.inkDim,
              textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {kind === 'revenue' ? (vi ? 'Doanh thu' : 'Revenue')
                : kind === 'expense' ? (vi ? 'Chi phí' : 'Expense')
                : (vi ? 'Biểu đồ' : 'Analytics')}
            </span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: S.inkDim, marginTop: 1 }}>{subtitle}</div>}
        </div>
        <SIcon name="download" size={18} dark={dark} style={{ marginTop: 4 }}/>
        <SIcon name="more" size={18} dark={dark} style={{ marginTop: 4 }}/>
      </div>
    </div>
  );
}

// Period chip selector — shared across the 3 screens
function PeriodChips({ active = 'month', dark, lang }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const periods = [
    { k: 'today', l: vi ? 'Hôm nay' : 'Today' },
    { k: 'week', l: vi ? 'Tuần này' : 'This week' },
    { k: 'month', l: vi ? 'Tháng này' : 'This month' },
    { k: 'quarter', l: vi ? 'Quý này' : 'Quarter' },
    { k: 'year', l: vi ? 'Năm' : 'Year' },
    { k: 'custom', l: vi ? 'Tuỳ chọn' : 'Custom' },
  ];
  return (
    <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
      {periods.map(p => (
        <div key={p.k} style={{
          padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
          border: `1.5px solid ${p.k === active ? S.accent : S.line}`,
          background: p.k === active ? S.accent : 'transparent',
          color: p.k === active ? '#fff' : S.ink, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {p.k === 'custom' && <SIcon name="calendar" size={11} color={p.k === active ? '#fff' : S.ink}/>}
          <span>{p.l}</span>
        </div>
      ))}
    </div>
  );
}

// Big hero number with delta
function HeroAmount({ amount, currency = '₫', delta, label, sub, dark, color }) {
  const S = useSketch(dark);
  const isPositive = delta && delta.startsWith('+');
  const deltaColor = isPositive ? '#4a9f4a' : '#c94a4a';
  return (
    <div style={{ padding: '0 12px 12px' }}>
      <SBox dark={dark} fill={color || S.accent} style={{ padding: 16, borderColor: color || S.accent }}>
        <div style={{ color: '#fff' }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, fontFamily: Sketch.mono, marginTop: 4, letterSpacing: -0.8, lineHeight: 1 }}>
            {amount} <span style={{ fontSize: 18, opacity: 0.85 }}>{currency}</span>
          </div>
          {sub && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, fontFamily: Sketch.mono }}>{sub}</div>}
          {delta && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
              padding: '4px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 999,
              fontSize: 11, fontWeight: 700, fontFamily: Sketch.mono }}>
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{delta}</span>
              <span style={{ opacity: 0.75 }}>{(lang => lang === 'vi' ? 'so với kỳ trước' : 'vs previous')('vi')}</span>
            </div>
          )}
        </div>
      </SBox>
    </div>
  );
}

// Mini bar chart row (proportion bar)
function BreakdownRow({ icon, label, amount, pct, color, dark, sub, last }) {
  const S = useSketch(dark);
  return (
    <div style={{ padding: '12px 12px',
      borderBottom: last ? 'none' : `1px dashed ${S.inkFaint}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (
          <SCircle size={36} dark={dark} fill={(color || S.accent) + '20'} style={{ borderColor: color || S.accent }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
          </SCircle>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{label}</span>
          </div>
          {sub && <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono }}>{amount}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: color || S.accent, fontFamily: Sketch.mono }}>{pct}%</div>
        </div>
      </div>
      <div style={{ height: 6, marginTop: 8, background: S.paperDim, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color || S.accent, borderRadius: 3 }}/>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// REVENUE DETAIL
// ═════════════════════════════════════════════
function RevenueDetailScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';

  const sales = [
    { i: '🛒', l: vi ? 'Bán lẻ POS' : 'POS retail', a: '98.4M', p: 64, c: '#4a9f4a', s: vi ? '124 đơn · TB 793K/đơn' : '124 orders · avg 793K' },
    { i: '🚚', l: vi ? 'Bán buôn' : 'Wholesale', a: '38.2M', p: 25, c: '#d4a574', s: vi ? '14 đơn · 3 khách lớn' : '14 orders · 3 key accts' },
    { i: '📦', l: 'Shopee', a: '8.6M', p: 5.6, c: '#ee4d2d', s: vi ? '32 đơn · phí sàn 8%' : '32 orders · 8% fee' },
    { i: '🛍️', l: 'Lazada', a: '4.2M', p: 2.7, c: '#0f136d', s: vi ? '11 đơn' : '11 orders' },
    { i: '⚡', l: 'TikTok Shop', a: '2.8M', p: 1.8, c: '#000', s: vi ? '8 đơn · livestream' : '8 orders · livestream' },
    { i: '🔄', l: vi ? 'Hoàn / Trả' : 'Refunds', a: '−1.8M', p: -1.2, c: '#c94a4a', s: vi ? '3 đơn hoàn lại' : '3 refunds' },
  ];
  const other = [
    { i: '💰', l: vi ? 'Thu công nợ KH' : 'AR collection', a: '8.75M', s: vi ? '2 khách · CK Vietcombank' : '2 customers · transfer' },
    { i: '🏷️', l: vi ? 'Thanh lý tài sản' : 'Asset disposal', a: '1.2M', s: vi ? 'Kệ trưng bày cũ' : 'Old display rack' },
    { i: '💸', l: vi ? 'Thu lãi NH' : 'Interest income', a: '180K', s: vi ? 'Vietcombank · KKH' : 'Vietcombank · savings' },
    { i: '🎁', l: vi ? 'Hoa hồng môi giới' : 'Referral commission', a: '450K', s: vi ? 'Giới thiệu NCC mới' : 'Refer new supplier' },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <FinanceHeader kind="revenue"
        title={vi ? 'Chi tiết doanh thu' : 'Revenue detail'}
        subtitle={vi ? 'Bán hàng & các nguồn thu khác' : 'Sales & other income'}
        dark={dark} lang={lang}/>

      <PeriodChips active="month" dark={dark} lang={lang}/>

      <HeroAmount label={vi ? 'TỔNG DOANH THU THÁNG 12' : 'TOTAL REVENUE — DEC'}
        amount="160.78" sub="M ₫ · 195 chứng từ" delta="+18.4%"
        color="#4a9f4a" dark={dark}/>

      {/* Split: sales vs other */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: 12, borderRadius: 14, border: `2px solid #4a9f4a`,
          background: '#4a9f4a12' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            💼 {vi ? 'Từ bán hàng' : 'From sales'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: Sketch.mono, color: '#4a9f4a', marginTop: 2 }}>
            150.2M
          </div>
          <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>93.4%</div>
        </div>
        <div style={{ flex: 1, padding: 12, borderRadius: 14, border: `2px solid ${S.accent}`,
          background: S.accentDim + '40' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            💎 {vi ? 'Thu khác' : 'Other income'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: Sketch.mono, color: S.accent, marginTop: 2 }}>
            10.58M
          </div>
          <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>6.6%</div>
        </div>
      </div>

      {/* Mini trend chart */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1, fontSize: 11.5, fontWeight: 700 }}>
              📈 {vi ? 'Xu hướng 30 ngày' : '30-day trend'}
            </div>
            <div style={{ fontSize: 10, color: S.accent, fontFamily: Sketch.mono, fontWeight: 700 }}>
              {vi ? 'Xem chi tiết →' : 'View chart →'}
            </div>
          </div>
          <svg viewBox="0 0 280 60" style={{ width: '100%', height: 60 }}>
            <polyline fill="none" stroke="#4a9f4a" strokeWidth="2"
              points="0,45 10,42 20,38 30,40 40,35 50,30 60,32 70,28 80,25 90,28 100,22 110,18 120,20 130,15 140,18 150,12 160,16 170,10 180,14 190,8 200,12 210,6 220,10 230,5 240,8 250,4 260,7 270,5 280,3"/>
            <polyline fill="#4a9f4a18" stroke="none"
              points="0,45 10,42 20,38 30,40 40,35 50,30 60,32 70,28 80,25 90,28 100,22 110,18 120,20 130,15 140,18 150,12 160,16 170,10 180,14 190,8 200,12 210,6 220,10 230,5 240,8 250,4 260,7 270,5 280,3 280,60 0,60"/>
          </svg>
        </SBox>
      </div>

      {/* Sales breakdown */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>
        💼 {vi ? 'Doanh thu bán hàng' : 'Sales revenue'} · 150.2M ₫
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {sales.map((r, i) => (
            <BreakdownRow key={i} {...r} amount={r.a + ' ₫'} pct={r.p} sub={r.s} dark={dark}
              last={i === sales.length - 1}/>
          ))}
        </SBox>
      </div>

      {/* Other income */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>
        💎 {vi ? 'Thu nhập khác' : 'Other income'} · 10.58M ₫
      </div>
      <div style={{ padding: '0 12px 18px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {other.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px',
              borderBottom: i < other.length - 1 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <SCircle size={32} dark={dark} fill={S.paperDim}>
                <span style={{ fontSize: 14 }}>{r.i}</span>
              </SCircle>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{r.l}</div>
                <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>{r.s}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono, color: S.accent }}>{r.a} ₫</div>
            </div>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ═════════════════════════════════════════════
// EXPENSE DETAIL
// ═════════════════════════════════════════════
function ExpenseDetailScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';

  const cogs = [
    { i: '📦', l: vi ? 'Nhập hàng Acecook' : 'Acecook receipt', a: '32.5M', p: 27, c: '#c94a4a', s: vi ? 'PN-001 · đã trả' : 'PN-001 · paid' },
    { i: '📦', l: vi ? 'Sữa TH True Milk' : 'TH True Milk', a: '18.75M', p: 16, c: '#c94a4a', s: vi ? 'PN-002 · công nợ' : 'PN-002 · credit' },
    { i: '📦', l: 'Suntory PepsiCo', a: '24.8M', p: 21, c: '#c94a4a', s: vi ? 'PN-004 · công nợ' : 'PN-004 · credit' },
    { i: '📦', l: 'Heineken VN', a: '28.6M', p: 24, c: '#c94a4a', s: vi ? 'PN-006 · đã trả' : 'PN-006 · paid' },
    { i: '📦', l: vi ? 'Trung Nguyên cà phê' : 'Trung Nguyen coffee', a: '12.4M', p: 10, c: '#c94a4a', s: 'PN-003' },
  ];
  const opex = [
    { i: '🏠', l: vi ? 'Mặt bằng Q1' : 'Rent — D1', a: '15.0M', p: 36, c: '#b08968', s: vi ? 'Bà Tâm · cố định' : 'Fixed monthly' },
    { i: '⚡', l: vi ? 'Điện, nước, internet' : 'Utilities', a: '3.2M', p: 7.6, c: '#d4a574', s: vi ? 'EVN + Viettel' : 'Power + ISP' },
    { i: '👥', l: vi ? 'Lương + phụ cấp' : 'Payroll', a: '42.4M', p: 24, c: '#8a8a6a', s: vi ? '5 NV · BHXH đầy đủ' : '5 staff · full ins.' },
    { i: '📣', l: vi ? 'Marketing & quảng cáo' : 'Marketing', a: '8.6M', p: 20, c: '#d4708a', s: vi ? 'FB Ads + KOL' : 'FB Ads + KOL' },
    { i: '🚛', l: vi ? 'Vận chuyển' : 'Logistics', a: '2.4M', p: 5.7, c: '#7a9a8a', s: vi ? 'GHN + nội bộ' : 'GHN + in-house' },
    { i: '🛠️', l: vi ? 'Bảo trì, sửa chữa' : 'Maintenance', a: '1.8M', p: 4.3, c: '#9a8a7a', s: vi ? 'Máy POS + tủ lạnh' : 'POS + fridge' },
    { i: '📝', l: vi ? 'Văn phòng phẩm, khác' : 'Office misc.', a: '1.05M', p: 2.5, c: '#a8a8a8', s: vi ? 'Tiền mặt nhỏ' : 'Petty cash' },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <FinanceHeader kind="expense"
        title={vi ? 'Chi tiết chi phí' : 'Expense detail'}
        subtitle={vi ? 'Giá vốn & chi phí vận hành' : 'COGS & operating expenses'}
        dark={dark} lang={lang}/>

      <PeriodChips active="month" dark={dark} lang={lang}/>

      <HeroAmount label={vi ? 'TỔNG CHI PHÍ THÁNG 12' : 'TOTAL EXPENSE — DEC'}
        amount="192.95" sub={vi ? 'M ₫ · 88 chứng từ' : 'M ₫ · 88 vouchers'} delta="+12.1%"
        color="#c94a4a" dark={dark}/>

      {/* Profit position */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.paperDim} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: S.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                💰 {vi ? 'Lợi nhuận gộp' : 'Gross profit'}
              </div>
              <div style={{ fontSize: 9.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                {vi ? 'DT 160.78M − Chi 192.95M' : 'Rev 160.78M − Exp 192.95M'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: Sketch.mono, color: '#c94a4a' }}>−32.17M</div>
              <div style={{ fontSize: 9.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                {vi ? 'Tạm lỗ tháng — vốn nhập hàng cao' : 'Loss — high inventory build'}
              </div>
            </div>
          </div>
        </SBox>
      </div>

      {/* Split: COGS vs Opex */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: 12, borderRadius: 14, border: `2px solid #c94a4a`,
          background: '#c94a4a12' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            📦 {vi ? 'Giá vốn (COGS)' : 'COGS'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: Sketch.mono, color: '#c94a4a', marginTop: 2 }}>
            117.05M
          </div>
          <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>60.7%</div>
        </div>
        <div style={{ flex: 1, padding: 12, borderRadius: 14, border: `2px solid #b08968`,
          background: '#b0896812' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            🏢 {vi ? 'Vận hành' : 'Operating'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: Sketch.mono, color: '#b08968', marginTop: 2 }}>
            75.9M
          </div>
          <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>39.3%</div>
        </div>
      </div>

      {/* COGS breakdown */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>
        📦 {vi ? 'Chi phí bán hàng (COGS)' : 'Cost of goods sold'} · 117.05M ₫
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {cogs.map((r, i) => (
            <BreakdownRow key={i} {...r} amount={r.a + ' ₫'} pct={r.p} sub={r.s} dark={dark}
              last={i === cogs.length - 1}/>
          ))}
        </SBox>
      </div>

      {/* Opex breakdown */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>
        🏢 {vi ? 'Chi phí vận hành (OPEX)' : 'Operating expenses'} · 75.9M ₫
      </div>
      <div style={{ padding: '0 12px 18px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {opex.map((r, i) => (
            <BreakdownRow key={i} {...r} amount={r.a + ' ₫'} pct={r.p} sub={r.s} dark={dark}
              last={i === opex.length - 1}/>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ═════════════════════════════════════════════
// CHART DETAIL — biểu đồ doanh thu/chi phí + so sánh
// ═════════════════════════════════════════════
function ChartDetailScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';

  // 30 days of mock data (rev / exp pairs)
  const days = [
    { d: 1, r: 4.2, e: 3.8 }, { d: 2, r: 5.1, e: 4.0 }, { d: 3, r: 4.8, e: 3.6 },
    { d: 4, r: 6.2, e: 8.5 }, { d: 5, r: 5.6, e: 4.2 }, { d: 6, r: 7.4, e: 4.5 },
    { d: 7, r: 8.1, e: 4.8 }, { d: 8, r: 5.2, e: 3.9 }, { d: 9, r: 4.9, e: 3.7 },
    { d: 10, r: 6.8, e: 12.5 }, { d: 11, r: 5.4, e: 4.1 }, { d: 12, r: 6.1, e: 4.4 },
    { d: 13, r: 7.2, e: 4.6 }, { d: 14, r: 8.5, e: 4.9 }, { d: 15, r: 4.6, e: 4.0 },
    { d: 16, r: 5.8, e: 4.2 }, { d: 17, r: 6.4, e: 4.5 }, { d: 18, r: 7.8, e: 4.7 },
    { d: 19, r: 5.5, e: 4.0 }, { d: 20, r: 6.2, e: 4.3 }, { d: 21, r: 7.1, e: 4.5 },
    { d: 22, r: 8.4, e: 4.8 }, { d: 23, r: 5.8, e: 4.1 }, { d: 24, r: 5.2, e: 3.9 },
    { d: 25, r: 4.6, e: 11.0 }, { d: 26, r: 5.0, e: 4.2 }, { d: 27, r: 6.3, e: 4.5 },
    { d: 28, r: 7.5, e: 4.6 }, { d: 29, r: 4.4, e: 3.8 }, { d: 30, r: 5.2, e: 4.0 },
  ];
  const maxV = 13;
  const chartW = 360;
  const chartH = 200;

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <FinanceHeader kind="chart"
        title={vi ? 'Biểu đồ doanh thu & chi phí' : 'Revenue & expense chart'}
        subtitle={vi ? 'So sánh theo thời gian — 30 ngày qua' : 'Time-series comparison — last 30d'}
        dark={dark} lang={lang}/>

      <PeriodChips active="month" dark={dark} lang={lang}/>

      {/* Date range picker row */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10,
          border: `1.5px solid ${S.line}`, background: S.paperDim,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <SIcon name="calendar" size={14} dark={dark}/>
          <span style={{ fontSize: 11, color: S.inkDim }}>{vi ? 'Từ' : 'From'}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, fontFamily: Sketch.mono }}>01/12/2025</span>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10,
          border: `1.5px solid ${S.line}`, background: S.paperDim,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <SIcon name="calendar" size={14} dark={dark}/>
          <span style={{ fontSize: 11, color: S.inkDim }}>{vi ? 'Đến' : 'To'}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, fontFamily: Sketch.mono }}>30/12/2025</span>
        </div>
      </div>

      {/* Granularity + chart type */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', gap: 4, padding: 3, background: S.paperDim,
          border: `1.5px solid ${S.line}`, borderRadius: 10 }}>
          {[
            { k: 'day', l: vi ? 'Ngày' : 'Day', sel: true },
            { k: 'week', l: vi ? 'Tuần' : 'Week' },
            { k: 'month', l: vi ? 'Tháng' : 'Month' },
          ].map(s => (
            <div key={s.k} style={{
              flex: 1, padding: '5px 0', textAlign: 'center', borderRadius: 7,
              background: s.sel ? S.ink : 'transparent',
              color: s.sel ? '#fdfcf8' : S.ink,
              fontSize: 11, fontWeight: 700,
            }}>{s.l}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: S.paperDim,
          border: `1.5px solid ${S.line}`, borderRadius: 10 }}>
          {[
            { k: 'bar', i: '▮▮', sel: true },
            { k: 'line', i: '⤴' },
          ].map(s => (
            <div key={s.k} style={{
              padding: '5px 10px', borderRadius: 7,
              background: s.sel ? S.ink : 'transparent',
              color: s.sel ? '#fdfcf8' : S.ink,
              fontSize: 11, fontWeight: 700, fontFamily: Sketch.mono,
            }}>{s.i}</div>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12,
          border: `1.5px solid #4a9f4a`, background: '#4a9f4a12' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            ● {vi ? 'Doanh thu' : 'Revenue'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: Sketch.mono, color: '#4a9f4a', marginTop: 2 }}>
            160.78M
          </div>
          <div style={{ fontSize: 9.5, color: '#4a9f4a', fontFamily: Sketch.mono, marginTop: 1, fontWeight: 700 }}>
            ↑ +18.4%
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12,
          border: `1.5px solid #c94a4a`, background: '#c94a4a12' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            ● {vi ? 'Chi phí' : 'Expense'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: Sketch.mono, color: '#c94a4a', marginTop: 2 }}>
            192.95M
          </div>
          <div style={{ fontSize: 9.5, color: '#c94a4a', fontFamily: Sketch.mono, marginTop: 1, fontWeight: 700 }}>
            ↑ +12.1%
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12,
          border: `1.5px solid ${S.accent}`, background: S.accentDim + '40' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            ● {vi ? 'Lợi nhuận' : 'Profit'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: Sketch.mono, color: '#c94a4a', marginTop: 2 }}>
            −32.17M
          </div>
          <div style={{ fontSize: 9.5, color: '#c94a4a', fontFamily: Sketch.mono, marginTop: 1, fontWeight: 700 }}>
            {vi ? 'tạm lỗ' : 'loss'}
          </div>
        </div>
      </div>

      {/* MAIN CHART */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: 14 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, background: '#4a9f4a', borderRadius: 3 }}/>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{vi ? 'Doanh thu' : 'Revenue'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, background: '#c94a4a', borderRadius: 3 }}/>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{vi ? 'Chi phí' : 'Expense'}</span>
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ fontSize: 9.5, color: S.inkDim, fontFamily: Sketch.mono }}>{vi ? 'Triệu ₫' : 'M ₫'}</div>
          </div>

          {/* SVG bar chart */}
          <svg viewBox={`0 0 ${chartW} ${chartH + 24}`} style={{ width: '100%', height: 'auto' }}>
            {/* Y-axis grid */}
            {[0, 3, 6, 9, 12].map(v => {
              const y = chartH - (v / maxV) * chartH;
              return (
                <g key={v}>
                  <line x1={26} y1={y} x2={chartW} y2={y} stroke={S.inkFaint} strokeDasharray="2 3"/>
                  <text x={22} y={y + 3} fontSize="8" fontFamily={Sketch.mono} fill={S.inkDim} textAnchor="end">{v}</text>
                </g>
              );
            })}
            {/* Bars */}
            {days.map((dt, i) => {
              const barW = (chartW - 30) / days.length;
              const x = 30 + i * barW;
              const rH = (dt.r / maxV) * chartH;
              const eH = (dt.e / maxV) * chartH;
              const innerBarW = barW * 0.36;
              const gap = barW * 0.08;
              return (
                <g key={i}>
                  <rect x={x + gap} y={chartH - rH} width={innerBarW} height={rH} fill="#4a9f4a"/>
                  <rect x={x + gap + innerBarW + 1} y={chartH - eH} width={innerBarW} height={eH} fill="#c94a4a"/>
                  {(i % 5 === 0 || i === days.length - 1) && (
                    <text x={x + barW / 2} y={chartH + 14} fontSize="8" fontFamily={Sketch.mono}
                      fill={S.inkDim} textAnchor="middle">{dt.d}/12</text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Highlighted point */}
          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 10, background: S.paperDim,
            border: `1px dashed ${S.inkFaint}`, fontSize: 10.5, fontFamily: Sketch.mono }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 800 }}>14/12/2025</span>
              <span style={{ color: S.inkDim }}>· {vi ? 'ngày bán cao nhất' : 'peak sales'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span><span style={{ color: '#4a9f4a' }}>●</span> DT: <b>8.5M</b></span>
              <span><span style={{ color: '#c94a4a' }}>●</span> CP: <b>4.9M</b></span>
              <span style={{ color: '#4a9f4a' }}>↑ +3.6M</span>
            </div>
          </div>
        </SBox>
      </div>

      {/* Comparison block */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>
        ⚖️ {vi ? 'So sánh với kỳ trước' : 'Compared to previous'}
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { l: vi ? 'Doanh thu' : 'Revenue', cur: '160.78M', prev: '135.8M', delta: '+18.4%', up: true, c: '#4a9f4a' },
            { l: vi ? 'Chi phí' : 'Expense', cur: '192.95M', prev: '172.1M', delta: '+12.1%', up: true, c: '#c94a4a', warn: true },
            { l: vi ? 'Số đơn' : 'Orders', cur: '195', prev: '168', delta: '+16.1%', up: true, c: S.accent },
            { l: vi ? 'TB/đơn' : 'AOV', cur: '825K', prev: '808K', delta: '+2.1%', up: true, c: S.accent },
            { l: vi ? 'Biên LN' : 'Margin', cur: '−20.0%', prev: '−21.4%', delta: '+1.4pp', up: true, c: S.accent },
          ].map((r, i, a) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 12px',
              borderBottom: i < a.length - 1 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{r.l}</div>
                <div style={{ fontSize: 9.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                  {vi ? 'kỳ trước:' : 'prev:'} {r.prev}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono }}>{r.cur}</div>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: Sketch.mono, marginTop: 1,
                  color: r.warn ? '#c94a4a' : (r.up ? '#4a9f4a' : '#c94a4a') }}>
                  {r.up ? '↑' : '↓'} {r.delta}
                </div>
              </div>
            </div>
          ))}
        </SBox>
      </div>

      {/* Top categories */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>
        🏆 {vi ? 'Top ngành hàng bán chạy' : 'Top selling categories'}
      </div>
      <div style={{ padding: '0 12px 18px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { l: vi ? 'Đồ uống' : 'Beverages', a: '52.4M', p: 33, c: '#008ecc' },
            { l: vi ? 'Bia & rượu' : 'Beer & wine', a: '38.6M', p: 24, c: '#d4a574' },
            { l: vi ? 'Thực phẩm khô' : 'Dry food', a: '32.8M', p: 20, c: '#b08968' },
            { l: vi ? 'Sữa & sản phẩm sữa' : 'Dairy', a: '21.2M', p: 13, c: '#8a8a6a' },
            { l: vi ? 'Bánh kẹo' : 'Snacks', a: '15.8M', p: 10, c: '#7a9a8a' },
          ].map((r, i, a) => (
            <BreakdownRow key={i} icon={null} label={r.l} amount={r.a + ' ₫'} pct={r.p} color={r.c}
              dark={dark} last={i === a.length - 1}
              sub={vi ? 'Rank #' + (i + 1) : 'Rank #' + (i + 1)}/>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, {
  RevenueDetailScreen, ExpenseDetailScreen, ChartDetailScreen,
  FinanceHeader, PeriodChips, HeroAmount, BreakdownRow,
});
