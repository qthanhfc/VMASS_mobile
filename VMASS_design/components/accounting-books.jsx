// Accounting Books — 6 sổ chi tiết theo TT 88/2021/TT-BTC (Hộ kinh doanh)
// S1: Sổ bán hàng · S2: Sổ mua hàng · S3: Sổ thu chi (quỹ tiền mặt)
// S4: Sổ công nợ · S5: Sổ tồn kho · S6: Sổ tiền lương

// ═════════════════════════════════════════════
// Shared book header — sticky filter + period
// ═════════════════════════════════════════════
function BookHeader({ code, title, subtitle, dark, lang, period = 'T12/2025' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <div style={{ padding: '8px 12px 10px' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <SIcon name="chevron_right" size={20} dark={dark} style={{ transform: 'rotate(180deg)', marginTop: 4 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10.5, fontFamily: Sketch.mono, fontWeight: 700,
              padding: '2px 7px', background: S.accent, color: '#fff', borderRadius: 5,
              letterSpacing: 0.5 }}>{code}</span>
            <span style={{ fontSize: 9.5, color: S.inkDim, fontFamily: Sketch.mono }}>TT 88/2021/TT-BTC</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10.5, color: S.inkDim, marginTop: 1 }}>{subtitle}</div>}
        </div>
        <SIcon name="download" size={18} dark={dark} style={{ marginTop: 4 }}/>
        <SIcon name="printer" size={18} dark={dark} style={{ marginTop: 4 }}/>
      </div>

      {/* Period selector + filters */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '7px 10px', borderRadius: 10,
          border: `1.5px solid ${S.line}`, background: S.paperDim,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: S.inkDim }}>{vi ? 'Kỳ:' : 'Period:'}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, fontFamily: Sketch.mono }}>
            01/12 — 31/12/2025
          </span>
          <SIcon name="calendar" size={14} dark={dark}/>
        </div>
        <div style={{ padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${S.line}`,
          background: S.paperDim, fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <SIcon name="filter" size={13} dark={dark}/>
          <span>{vi ? 'Lọc' : 'Filter'}</span>
        </div>
      </div>
    </div>
  );
}

// Summary balance row (Đầu kỳ — Phát sinh — Cuối kỳ)
function BalanceBar({ items, dark }) {
  const S = useSketch(dark);
  return (
    <div style={{ padding: '0 12px 10px' }}>
      <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex' }}>
          {items.map((it, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 8px',
              borderLeft: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              background: it.hl ? S.accentDim + '60' : 'transparent',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: S.inkDim,
                textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{it.l}</div>
              <div style={{ fontSize: it.big ? 15 : 13, fontWeight: 800, fontFamily: Sketch.mono,
                color: it.c || S.ink, letterSpacing: -0.3 }}>{it.v}</div>
              {it.sub && <div style={{ fontSize: 9, color: S.inkDim, marginTop: 1, fontFamily: Sketch.mono }}>{it.sub}</div>}
            </div>
          ))}
        </div>
      </SBox>
    </div>
  );
}

// Compact ledger row — accounting table style
function LedgerRow({ no, date, code, desc, sub, debit, credit, balance, dark, last, type, hl }) {
  const S = useSketch(dark);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 6,
      padding: '10px 10px',
      borderBottom: last ? 'none' : `1px dashed ${S.inkFaint}`,
      background: hl ? S.accentDim + '30' : 'transparent',
      fontSize: 11.5,
    }}>
      <div style={{ width: 22, fontFamily: Sketch.mono, fontSize: 10, color: S.inkDim,
        fontWeight: 700, textAlign: 'center', paddingTop: 1 }}>{no}</div>
      <div style={{ width: 50, flexShrink: 0 }}>
        <div style={{ fontFamily: Sketch.mono, fontSize: 10.5, fontWeight: 700 }}>{date}</div>
        {code && <div style={{ fontFamily: Sketch.mono, fontSize: 9, color: S.accent, fontWeight: 700 }}>{code}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 11.5, lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
        {sub && <div style={{ fontSize: 10, color: S.inkDim, marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      <div style={{ width: 64, textAlign: 'right', flexShrink: 0 }}>
        {debit && <div style={{ fontFamily: Sketch.mono, fontWeight: 700, fontSize: 11.5,
          color: type === 'out' ? '#c94a4a' : S.ink }}>{debit}</div>}
        {credit && <div style={{ fontFamily: Sketch.mono, fontWeight: 700, fontSize: 11.5,
          color: '#4a9f4a' }}>{credit}</div>}
        {balance && <div style={{ fontFamily: Sketch.mono, fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{balance}</div>}
      </div>
    </div>
  );
}

// Column header for ledger
function LedgerHeader({ cols, dark }) {
  const S = useSketch(dark);
  return (
    <div style={{ display: 'flex', gap: 6, padding: '8px 10px',
      borderBottom: `1.5px solid ${S.line}`, background: S.paperDim,
      fontSize: 9.5, fontWeight: 700, color: S.inkDim,
      textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {cols.map((c, i) => (
        <div key={i} style={{
          width: c.w === 'flex' ? undefined : c.w,
          flex: c.w === 'flex' ? 1 : undefined,
          textAlign: c.a || 'left', flexShrink: 0
        }}>{c.l}</div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════
// 1. SỔ BÁN HÀNG (Mẫu S1-HKD)
// ═════════════════════════════════════════════
function SalesBookScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const rows = [
    { d: '01/12', c: 'HD-25120001', n: vi ? 'Bán lẻ POS — Ca sáng' : 'POS retail — AM', s: 'Linh · TM', a: '2.480.000', q: 38 },
    { d: '01/12', c: 'HD-25120002', n: vi ? 'Bán buôn — Quán Cô Hai' : 'Wholesale — Quan Co Hai', s: vi ? 'Chuyển khoản · 45 SP' : 'Transfer · 45 SKUs', a: '8.750.000', vat: '8%' },
    { d: '02/12', c: 'HD-25120003', n: vi ? 'Bán lẻ POS — Ca tối' : 'POS retail — PM', s: 'Hùng · QR MoMo', a: '1.920.000', q: 28 },
    { d: '03/12', c: 'HD-25120004', n: vi ? 'Bán lẻ POS' : 'POS retail', s: 'Linh · TM', a: '3.150.000', q: 52 },
    { d: '04/12', c: 'HD-25120005', n: vi ? 'Đặt hàng Shopee' : 'Shopee order', s: vi ? 'COD · giao GHN' : 'COD · GHN ship', a: '480.000', vat: '8%' },
    { d: '05/12', c: 'HD-25120006', n: vi ? 'Hoàn trả HD-25120002' : 'Refund HD-25120002', s: vi ? 'Lỗi nhà SX' : 'Manufacturer defect', a: '-560.000', refund: true },
    { d: '05/12', c: 'HD-25120007', n: vi ? 'Bán lẻ POS' : 'POS retail', s: 'Linh · QR VNPay', a: '2.180.000', q: 31 },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <BookHeader code="S1-HKD" title={vi ? 'Sổ bán hàng' : 'Sales ledger'}
        subtitle={vi ? 'Chi tiết doanh thu bán hàng & cung cấp dịch vụ' : 'Sales revenue detail'}
        dark={dark} lang={lang}/>

      <BalanceBar dark={dark} items={[
        { l: vi ? 'Số HĐ' : '# Invoices', v: '124', sub: vi ? 'tháng' : 'this mo' },
        { l: vi ? 'DT chưa VAT' : 'Net rev', v: '142.8M', c: S.ink },
        { l: vi ? 'VAT đầu ra' : 'VAT out', v: '11.4M', sub: '8%', c: '#d4a574' },
        { l: vi ? 'Tổng DT' : 'Total', v: '154.2M', big: true, c: S.accent, hl: true },
      ]}/>

      {/* Channel breakdown chips */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[
          { n: vi ? 'Tất cả' : 'All', v: '124', sel: true },
          { n: 'POS', v: '98', c: '#4a9f4a' },
          { n: vi ? 'Bán buôn' : 'Wholesale', v: '14', c: '#d4a574' },
          { n: 'Shopee', v: '8', c: '#ee4d2d' },
          { n: 'Lazada', v: '3', c: '#0f136d' },
          { n: vi ? 'Hoàn' : 'Refund', v: '1', c: '#c94a4a' },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            border: `1.5px solid ${c.sel ? S.accent : S.line}`,
            background: c.sel ? S.accent : 'transparent',
            color: c.sel ? '#fff' : S.ink, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {c.c && !c.sel && <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.c }}/>}
            <span>{c.n}</span>
            <span style={{ fontFamily: Sketch.mono, fontSize: 10, opacity: 0.8 }}>{c.v}</span>
          </div>
        ))}
      </div>

      {/* Ledger table */}
      <div style={{ padding: '0 12px 14px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          <LedgerHeader dark={dark} cols={[
            { l: 'STT', w: 22, a: 'center' },
            { l: vi ? 'Ngày / Số HĐ' : 'Date / No', w: 50 },
            { l: vi ? 'Diễn giải' : 'Description', w: 'flex' },
            { l: vi ? 'Thành tiền' : 'Amount', w: 64, a: 'right' },
          ]}/>
          {rows.map((r, i) => (
            <LedgerRow key={i} no={i + 1} date={r.d} code={r.c}
              desc={r.n}
              sub={`${r.s}${r.q ? ' · ' + r.q + (vi ? ' SP' : ' SKU') : ''}${r.vat ? ' · VAT ' + r.vat : ''}`}
              credit={!r.refund && r.a} debit={r.refund && r.a}
              type={r.refund ? 'out' : null}
              dark={dark} hl={r.refund} last={i === rows.length - 1}/>
          ))}
        </SBox>
      </div>

      {/* Footer total */}
      <div style={{ padding: '0 12px 18px' }}>
        <div style={{ background: S.ink, color: '#fdfcf8', borderRadius: 14, padding: '12px 14px',
          display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {vi ? 'Cộng phát sinh trong kỳ' : 'Period total'}
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.7, marginTop: 2, fontFamily: Sketch.mono }}>
              {vi ? '7 dòng hiển thị · 124 chứng từ' : '7 rows shown · 124 vouchers'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: Sketch.mono, color: S.accent }}>
              154.200.000 ₫
            </div>
            <div style={{ fontSize: 9.5, opacity: 0.7, fontFamily: Sketch.mono }}>
              ↑ 18.4% {vi ? 'so với tháng trước' : 'vs last month'}
            </div>
          </div>
        </div>
      </div>
    </ScreenBody>
  );
}

// ═════════════════════════════════════════════
// 2. SỔ MUA HÀNG (Mẫu S2-HKD)
// ═════════════════════════════════════════════
function PurchaseBookScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const rows = [
    { d: '02/12', c: 'PN-25120001', n: vi ? 'Nhập hàng Acecook' : 'Receive Acecook', s: vi ? 'Acecook VN · 8% VAT' : 'Acecook VN · 8% VAT', a: '32.500.000', paid: true },
    { d: '04/12', c: 'PN-25120002', n: vi ? 'Nhập sữa TH True Milk' : 'Receive TH True Milk', s: vi ? 'TH Food · 30 ngày' : 'TH Food · 30d term', a: '18.750.000', credit: true },
    { d: '08/12', c: 'PN-25120003', n: vi ? 'Nhập cà phê G7' : 'Receive G7 coffee', s: vi ? 'Trung Nguyên · 50% trả trước' : 'Trung Nguyen · 50% prepaid', a: '12.400.000' },
    { d: '11/12', c: 'PN-25120004', n: vi ? 'Nhập nước ngọt Pepsi' : 'Receive Pepsi', s: 'Suntory PepsiCo · 8%', a: '24.800.000', credit: true },
    { d: '15/12', c: 'PN-25120005', n: vi ? 'Mua văn phòng phẩm' : 'Office supplies', s: vi ? 'Tiền mặt · không HĐ' : 'Cash · no invoice', a: '1.250.000', cash: true },
    { d: '18/12', c: 'PN-25120006', n: vi ? 'Nhập bia Heineken' : 'Receive Heineken', s: 'Heineken VN · COD', a: '28.600.000', paid: true },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <BookHeader code="S2-HKD" title={vi ? 'Sổ mua hàng' : 'Purchase ledger'}
        subtitle={vi ? 'Chi tiết hàng hoá, dịch vụ mua vào' : 'Goods & services purchased'}
        dark={dark} lang={lang}/>

      <BalanceBar dark={dark} items={[
        { l: vi ? 'Số PN' : '# Receipts', v: '42' },
        { l: vi ? 'Trị giá HH' : 'Goods val', v: '108.5M' },
        { l: vi ? 'VAT đầu vào' : 'VAT in', v: '8.7M', sub: '8%', c: '#d4a574' },
        { l: vi ? 'Tổng chi' : 'Total', v: '118.3M', big: true, c: '#c94a4a', hl: true },
      ]}/>

      {/* Status chips */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { n: vi ? 'Tất cả' : 'All', v: '42', sel: true },
          { n: vi ? 'Đã thanh toán' : 'Paid', v: '28', c: '#4a9f4a' },
          { n: vi ? 'Công nợ' : 'On credit', v: '12', c: '#d4a574' },
          { n: vi ? 'Trả 1 phần' : 'Partial', v: '2', c: '#b08968' },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            border: `1.5px solid ${c.sel ? S.accent : S.line}`,
            background: c.sel ? S.accent : 'transparent',
            color: c.sel ? '#fff' : S.ink,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {c.c && !c.sel && <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.c }}/>}
            <span>{c.n}</span>
            <span style={{ fontFamily: Sketch.mono, fontSize: 10, opacity: 0.8 }}>{c.v}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 12px 14px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          <LedgerHeader dark={dark} cols={[
            { l: 'STT', w: 22, a: 'center' },
            { l: vi ? 'Ngày / Số PN' : 'Date / No', w: 50 },
            { l: vi ? 'NCC / Diễn giải' : 'Supplier / Desc', w: 'flex' },
            { l: vi ? 'Thành tiền' : 'Amount', w: 64, a: 'right' },
          ]}/>
          {rows.map((r, i) => (
            <LedgerRow key={i} no={i + 1} date={r.d} code={r.c}
              desc={r.n} sub={r.s}
              debit={r.a} type="out"
              balance={r.credit ? (vi ? '⚠ chưa trả' : '⚠ unpaid') : (r.paid ? '✓ ' + (vi ? 'đã trả' : 'paid') : null)}
              dark={dark} last={i === rows.length - 1}/>
          ))}
        </SBox>
      </div>

      {/* Footer total */}
      <div style={{ padding: '0 12px 18px' }}>
        <div style={{ background: S.ink, color: '#fdfcf8', borderRadius: 14, padding: '12px 14px',
          display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {vi ? 'Cộng phát sinh trong kỳ' : 'Period total'}
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.7, marginTop: 2, fontFamily: Sketch.mono }}>
              {vi ? 'Trong đó công nợ:' : 'Of which on credit:'} <b style={{ color: '#d4a574' }}>32.8M ₫</b>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 17, fontWeight: 800, fontFamily: Sketch.mono, color: '#ff8080' }}>
              118.300.000 ₫
            </div>
          </div>
        </div>
      </div>
    </ScreenBody>
  );
}

// ═════════════════════════════════════════════
// 3. SỔ THU CHI (Mẫu S3-HKD — Quỹ tiền mặt)
// ═════════════════════════════════════════════
function CashBookScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const rows = [
    { d: '01/12', c: 'PT-001', n: vi ? 'Thu doanh thu Ca sáng' : 'AM shift cash', s: 'Linh · TM POS', credit: '4.480.000', bal: '85.480.000' },
    { d: '02/12', c: 'PC-001', n: vi ? 'Chi nhập hàng Acecook' : 'Pay Acecook receipt', s: 'PN-25120001', debit: '32.500.000', bal: '52.980.000' },
    { d: '03/12', c: 'PT-002', n: vi ? 'Thu doanh thu' : 'Daily revenue', s: 'Tổng hợp ca · TM+QR', credit: '5.250.000', bal: '58.230.000' },
    { d: '05/12', c: 'PC-002', n: vi ? 'Chi tiền điện T11' : 'Electricity Nov', s: 'EVN HCMC · CK', debit: '2.180.000', bal: '56.050.000' },
    { d: '07/12', c: 'PT-003', n: vi ? 'Thu công nợ khách Cô Hai' : 'Collect from Co Hai', s: 'CK Vietcombank', credit: '8.750.000', bal: '64.800.000' },
    { d: '10/12', c: 'PC-003', n: vi ? 'Chi lương NV tháng 11' : 'Payroll Nov', s: vi ? '12 NV · CK' : '12 staff · transfer', debit: '38.400.000', bal: '26.400.000', big: true },
    { d: '12/12', c: 'PC-004', n: vi ? 'Chi tiền mặt bằng' : 'Rent payment', s: vi ? 'Bà Tâm · Q1' : 'Landlady · D1', debit: '15.000.000', bal: '11.400.000' },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <BookHeader code="S3-HKD" title={vi ? 'Sổ quỹ thu chi' : 'Cash book'}
        subtitle={vi ? 'Chi tiết quỹ tiền mặt & tiền gửi ngân hàng' : 'Cash & bank movements'}
        dark={dark} lang={lang}/>

      {/* Cash balance hero */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 14, borderColor: S.accent }}>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 10.5, opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              💰 {vi ? 'Số dư hiện tại' : 'Current balance'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: Sketch.mono, marginTop: 2, letterSpacing: -0.5 }}>
              11.400.000 ₫
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 10.5 }}>
              <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.18)' }}>
                <div style={{ opacity: 0.8 }}>💵 {vi ? 'Tiền mặt' : 'Cash'}</div>
                <div style={{ fontWeight: 800, fontFamily: Sketch.mono, fontSize: 13 }}>3.200.000</div>
              </div>
              <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.18)' }}>
                <div style={{ opacity: 0.8 }}>🏦 VCB</div>
                <div style={{ fontWeight: 800, fontFamily: Sketch.mono, fontSize: 13 }}>5.800.000</div>
              </div>
              <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.18)' }}>
                <div style={{ opacity: 0.8 }}>📱 MoMo</div>
                <div style={{ fontWeight: 800, fontFamily: Sketch.mono, fontSize: 13 }}>2.400.000</div>
              </div>
            </div>
          </div>
        </SBox>
      </div>

      <BalanceBar dark={dark} items={[
        { l: vi ? 'Đầu kỳ' : 'Opening', v: '81.0M', c: S.inkDim },
        { l: vi ? 'Thu' : 'Income', v: '142.2M', c: '#4a9f4a' },
        { l: vi ? 'Chi' : 'Expense', v: '211.8M', c: '#c94a4a' },
        { l: vi ? 'Cuối kỳ' : 'Closing', v: '11.4M', big: true, c: S.accent, hl: true },
      ]}/>

      <div style={{ padding: '0 12px 14px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          <LedgerHeader dark={dark} cols={[
            { l: 'STT', w: 22, a: 'center' },
            { l: vi ? 'Ngày / Số' : 'Date / No', w: 50 },
            { l: vi ? 'Diễn giải' : 'Description', w: 'flex' },
            { l: vi ? 'Số tiền / Tồn' : 'Amount / Bal', w: 64, a: 'right' },
          ]}/>
          {rows.map((r, i) => (
            <LedgerRow key={i} no={i + 1} date={r.d} code={r.c}
              desc={r.n} sub={r.s}
              debit={r.debit} credit={r.credit} type="out"
              balance={r.bal}
              dark={dark} hl={r.big} last={i === rows.length - 1}/>
          ))}
        </SBox>
      </div>

      {/* FAB ghi sổ */}
      <div style={{ padding: '0 12px 18px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: 14,
          background: '#4a9f4a', color: '#fff', fontSize: 13, fontWeight: 700 }}>
          + {vi ? 'Ghi thu' : 'Record income'}
        </div>
        <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: 14,
          background: '#c94a4a', color: '#fff', fontSize: 13, fontWeight: 700 }}>
          − {vi ? 'Ghi chi' : 'Record expense'}
        </div>
      </div>
    </ScreenBody>
  );
}

// ═════════════════════════════════════════════
// 4. SỔ CÔNG NỢ (Mẫu S4-HKD)
// ═════════════════════════════════════════════
function DebtBookScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const receivables = [
    { n: vi ? 'Quán Cô Hai' : 'Cafe Co Hai', c: 'KH-0042', open: '8.750.000', new: '12.400.000', pay: '8.750.000', bal: '12.400.000', age: 15 },
    { n: vi ? 'NH Phố Cũ' : 'Pho Cu Resto', c: 'KH-0089', open: '0', new: '5.600.000', pay: '0', bal: '5.600.000', age: 8 },
    { n: vi ? 'Cô Mai (chợ Bến Thành)' : 'Ms Mai (Ben Thanh)', c: 'KH-0156', open: '3.200.000', new: '0', pay: '1.500.000', bal: '1.700.000', age: 45, warn: true },
  ];
  const payables = [
    { n: vi ? 'TH True Milk' : 'TH True Milk', c: 'NCC-005', open: '0', new: '18.750.000', pay: '0', bal: '18.750.000', age: 22 },
    { n: 'Suntory PepsiCo', c: 'NCC-008', open: '14.200.000', new: '24.800.000', pay: '14.200.000', bal: '24.800.000', age: 18 },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <BookHeader code="S4-HKD" title={vi ? 'Sổ công nợ' : 'Receivables & payables'}
        subtitle={vi ? 'Chi tiết phải thu — phải trả theo đối tượng' : 'Detail by counterparty'}
        dark={dark} lang={lang}/>

      {/* Net position */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: 12, borderRadius: 14, border: `2px solid #4a9f4a`,
          background: '#4a9f4a15' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            ↗ {vi ? 'Phải thu' : 'Receivable'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: Sketch.mono, color: '#4a9f4a', marginTop: 2 }}>
            19.7M ₫
          </div>
          <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
            {vi ? '3 khách hàng' : '3 customers'}
          </div>
        </div>
        <div style={{ flex: 1, padding: 12, borderRadius: 14, border: `2px solid #c94a4a`,
          background: '#c94a4a15' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            ↙ {vi ? 'Phải trả' : 'Payable'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: Sketch.mono, color: '#c94a4a', marginTop: 2 }}>
            43.6M ₫
          </div>
          <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
            {vi ? '2 nhà cung cấp' : '2 suppliers'}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.paperDim} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: S.inkDim, fontWeight: 700 }}>
                ⚖️ {vi ? 'Vị thế công nợ ròng' : 'Net debt position'}
              </div>
              <div style={{ fontSize: 9, color: S.inkDim, marginTop: 1, fontStyle: 'italic' }}>
                {vi ? 'Phải trả lớn hơn phải thu' : 'Payable exceeds receivable'}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: Sketch.mono, color: '#c94a4a' }}>
              −23.9M
            </div>
          </div>
        </SBox>
      </div>

      {/* Receivables list */}
      <div style={{ padding: '8px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex' }}>
        <span style={{ flex: 1 }}>↗ {vi ? 'Khách hàng phải thu' : 'Receivable'}</span>
        <span style={{ color: S.accent }}>{vi ? 'Xem tất cả' : 'See all'}</span>
      </div>

      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {receivables.map((r, i) => (
            <div key={i} style={{ padding: '11px 12px',
              borderBottom: i < receivables.length - 1 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SCircle size={32} dark={dark} fill={S.accentDim} style={{ borderColor: '#4a9f4a' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#4a9f4a' }}>{r.n.slice(0, 2).toUpperCase()}</span>
                </SCircle>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{r.n}</div>
                  <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>
                    {r.c} · {vi ? 'tuổi nợ' : 'age'} <b style={{ color: r.warn ? '#c94a4a' : S.ink }}>{r.age}{vi ? ' ngày' : 'd'}</b>
                    {r.warn && <span style={{ marginLeft: 4, padding: '0 4px', background: '#c94a4a', color: '#fff', borderRadius: 3, fontSize: 9 }}>⚠ QUÁ HẠN</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono, color: '#4a9f4a' }}>
                    {r.bal} ₫
                  </div>
                </div>
              </div>
              {/* Mini ledger row */}
              <div style={{ display: 'flex', gap: 4, marginTop: 8, fontSize: 9.5,
                fontFamily: Sketch.mono, padding: '6px 0', borderTop: `1px dashed ${S.inkFaint}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: S.inkDim }}>{vi ? 'ĐK:' : 'Open:'}</span> {r.open}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#4a9f4a' }}>+ {r.new}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#c94a4a' }}>− {r.pay}</span>
                </div>
              </div>
            </div>
          ))}
        </SBox>
      </div>

      {/* Payables list */}
      <div style={{ padding: '8px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex' }}>
        <span style={{ flex: 1 }}>↙ {vi ? 'Nhà cung cấp phải trả' : 'Payable'}</span>
        <span style={{ color: S.accent }}>{vi ? 'Xem tất cả' : 'See all'}</span>
      </div>

      <div style={{ padding: '0 12px 18px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          {payables.map((r, i) => (
            <div key={i} style={{ padding: '11px 12px',
              borderBottom: i < payables.length - 1 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SCircle size={32} dark={dark} fill={S.accentDim} style={{ borderColor: '#c94a4a' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#c94a4a' }}>{r.n.slice(0, 2).toUpperCase()}</span>
                </SCircle>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{r.n}</div>
                  <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>
                    {r.c} · {vi ? 'hạn' : 'due'} <b>{30 - r.age}{vi ? ' ngày' : 'd'}</b>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono, color: '#c94a4a' }}>
                    {r.bal} ₫
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8, fontSize: 9.5,
                fontFamily: Sketch.mono, padding: '6px 0', borderTop: `1px dashed ${S.inkFaint}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: S.inkDim }}>{vi ? 'ĐK:' : 'Open:'}</span> {r.open}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#c94a4a' }}>+ {r.new}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#4a9f4a' }}>− {r.pay}</span>
                </div>
              </div>
            </div>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ═════════════════════════════════════════════
// 5. SỔ TỒN KHO (Mẫu S5-HKD — chi tiết vật tư)
// ═════════════════════════════════════════════
function StockBookScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const rows = [
    { d: '— ' + (vi ? 'Tồn đầu kỳ' : 'Opening'), n: vi ? 'Số dư đầu tháng 12' : 'Opening Dec', q: '180', p: '24.000', amt: '4.320.000', open: true },
    { d: '02/12', c: 'PN-001', n: vi ? 'Nhập từ Acecook' : 'Receive Acecook', q: '+500', p: '24.000', amt: '+12.000.000', type: 'in' },
    { d: '03/12', c: 'HD-002', n: vi ? 'Xuất bán POS' : 'POS sale', q: '−42', p: '24.000', amt: '−1.008.000', type: 'out', bal: '638' },
    { d: '05/12', c: 'HD-007', n: vi ? 'Xuất bán buôn' : 'Wholesale', q: '−120', p: '24.000', amt: '−2.880.000', type: 'out', bal: '518' },
    { d: '08/12', c: 'XK-003', n: vi ? 'Chuyển CH Q7' : 'Transfer to Q7', q: '−80', p: '24.000', amt: '−1.920.000', type: 'transfer', bal: '438' },
    { d: '12/12', c: 'KK-001', n: vi ? 'Điều chỉnh kiểm kê' : 'Stock count adj', q: '−5', p: '24.000', amt: '−120.000', type: 'adj', note: vi ? 'Hỏng' : 'Damaged', bal: '433' },
    { d: '15/12', c: 'PN-005', n: vi ? 'Nhập từ Acecook' : 'Receive Acecook', q: '+300', p: '25.500', amt: '+7.650.000', type: 'in', note: vi ? 'Giá tăng 6%' : '+6% price', bal: '733' },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <BookHeader code="S5-HKD" title={vi ? 'Sổ chi tiết tồn kho' : 'Stock ledger'}
        subtitle={vi ? 'Nhập — Xuất — Tồn theo từng SKU' : 'In — Out — Balance per SKU'}
        dark={dark} lang={lang}/>

      {/* SKU selector */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: S.paperDim,
              border: `1.5px solid ${S.inkFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: S.inkFaint, fontStyle: 'italic' }}>[img]</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Mì Hảo Hảo tôm chua cay</div>
              <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                SKU: HH-TCC-75 · {vi ? 'Đơn vị: Gói' : 'Unit: Pack'} · {vi ? 'Acecook VN' : 'Acecook VN'}
              </div>
              <div style={{ fontSize: 10, color: S.accent, fontFamily: Sketch.mono, marginTop: 1, fontWeight: 700 }}>
                {vi ? 'Bình quân gia quyền' : 'Weighted avg'} · 24.430₫/{vi ? 'gói' : 'pack'}
              </div>
            </div>
            <SIcon name="chevron_right" size={14} color={S.inkFaint}/>
          </div>
        </SBox>
      </div>

      <BalanceBar dark={dark} items={[
        { l: vi ? 'Tồn ĐK' : 'Opening', v: '180' },
        { l: vi ? 'Nhập' : 'In', v: '+800', c: '#4a9f4a' },
        { l: vi ? 'Xuất' : 'Out', v: '−247', c: '#c94a4a' },
        { l: vi ? 'Tồn CK' : 'Closing', v: '733', big: true, c: S.accent, hl: true },
      ]}/>

      {/* Type filter */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { n: vi ? 'Tất cả' : 'All', v: '7', sel: true },
          { n: vi ? 'Nhập' : 'In', v: '2', c: '#4a9f4a' },
          { n: vi ? 'Xuất' : 'Out', v: '2', c: '#c94a4a' },
          { n: vi ? 'Chuyển kho' : 'Transfer', v: '1', c: '#d4a574' },
          { n: vi ? 'Điều chỉnh' : 'Adjust', v: '1', c: '#b08968' },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            border: `1.5px solid ${c.sel ? S.accent : S.line}`,
            background: c.sel ? S.accent : 'transparent',
            color: c.sel ? '#fff' : S.ink,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {c.c && !c.sel && <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.c }}/>}
            <span>{c.n}</span>
            <span style={{ fontFamily: Sketch.mono, fontSize: 10, opacity: 0.8 }}>{c.v}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 12px 14px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          <LedgerHeader dark={dark} cols={[
            { l: vi ? 'Ngày / CT' : 'Date / Doc', w: 50 },
            { l: vi ? 'Diễn giải' : 'Description', w: 'flex' },
            { l: vi ? 'SL' : 'Qty', w: 38, a: 'right' },
            { l: vi ? 'Tồn' : 'Bal', w: 36, a: 'right' },
            { l: vi ? 'Trị giá' : 'Value', w: 70, a: 'right' },
          ]}/>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'flex', gap: 6, padding: '10px 10px',
              borderBottom: i < rows.length - 1 ? `1px dashed ${S.inkFaint}` : 'none',
              background: r.open ? S.paperDim : (r.type === 'in' ? '#4a9f4a10' : (r.type === 'out' ? '#c94a4a10' : 'transparent')),
              fontSize: 11,
            }}>
              <div style={{ width: 50, flexShrink: 0 }}>
                <div style={{ fontFamily: Sketch.mono, fontWeight: 700, fontSize: 10.5 }}>{r.d}</div>
                {r.c && <div style={{ fontFamily: Sketch.mono, fontSize: 9, color: S.accent, fontWeight: 700 }}>{r.c}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 11, lineHeight: 1.3,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.n}</div>
                {r.note && <div style={{ fontSize: 9, color: S.inkDim, fontStyle: 'italic' }}>{r.note}</div>}
              </div>
              <div style={{ width: 38, textAlign: 'right', flexShrink: 0,
                fontFamily: Sketch.mono, fontWeight: 800, fontSize: 11.5,
                color: r.type === 'in' ? '#4a9f4a' : (r.type === 'out' || r.type === 'adj' || r.type === 'transfer' ? '#c94a4a' : S.ink) }}>{r.q}</div>
              <div style={{ width: 36, textAlign: 'right', flexShrink: 0,
                fontFamily: Sketch.mono, fontWeight: 700, fontSize: 10.5, color: S.inkDim }}>{r.bal || ''}</div>
              <div style={{ width: 70, textAlign: 'right', flexShrink: 0,
                fontFamily: Sketch.mono, fontSize: 10.5, fontWeight: 700,
                color: r.type === 'in' ? '#4a9f4a' : (r.open ? S.ink : '#c94a4a') }}>{r.amt}</div>
            </div>
          ))}
        </SBox>
      </div>

      {/* Footer total */}
      <div style={{ padding: '0 12px 18px' }}>
        <div style={{ background: S.ink, color: '#fdfcf8', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, opacity: 0.7 }}>
              {vi ? 'Tổng giá trị tồn cuối kỳ' : 'Closing value'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: Sketch.mono, color: S.accent }}>
              17.906.000 ₫
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 9.5, opacity: 0.7, fontFamily: Sketch.mono, paddingTop: 6, borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
            <span>{vi ? 'PP tính giá:' : 'Method:'} <b style={{ color: '#fff' }}>{vi ? 'BQGQ' : 'WAVG'}</b></span>
            <span>·</span>
            <span>{vi ? 'Vòng quay:' : 'Turnover:'} <b style={{ color: '#fff' }}>2.4x/{vi ? 'tháng' : 'mo'}</b></span>
          </div>
        </div>
      </div>
    </ScreenBody>
  );
}

// ═════════════════════════════════════════════
// 6. SỔ TIỀN LƯƠNG (Mẫu S6-HKD)
// ═════════════════════════════════════════════
function PayrollBookScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const staff = [
    { n: 'Nguyễn Thị Linh', r: vi ? 'Thu ngân' : 'Cashier', d: 26, base: 6000, bonus: 800, ot: 450, ded: 510, net: '6.740.000', paid: true },
    { n: 'Trần Văn Hùng', r: vi ? 'Thu ngân' : 'Cashier', d: 24, base: 6000, bonus: 500, ot: 200, ded: 510, net: '6.190.000', paid: true },
    { n: 'Lê Minh Khoa', r: vi ? 'Kho' : 'Warehouse', d: 26, base: 7000, bonus: 600, ot: 800, ded: 595, net: '7.805.000', paid: true },
    { n: 'Phạm Hoài Nam', r: vi ? 'Quản lý' : 'Manager', d: 26, base: 12000, bonus: 2000, ot: 0, ded: 1020, net: '12.980.000', paid: true },
    { n: 'Đỗ Thu Hà', r: vi ? 'Kế toán' : 'Accountant', d: 22, base: 9000, bonus: 500, ot: 0, ded: 765, net: '8.735.000', paid: false },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <BookHeader code="S6-HKD" title={vi ? 'Sổ tiền lương' : 'Payroll ledger'}
        subtitle={vi ? 'Bảng lương chi tiết theo nhân viên' : 'Detail payroll by staff'}
        dark={dark} lang={lang}/>

      <BalanceBar dark={dark} items={[
        { l: vi ? 'Số NV' : 'Staff', v: '5' },
        { l: vi ? 'Tổng cơ bản' : 'Base', v: '40.0M' },
        { l: vi ? 'Khấu trừ' : 'Deduct', v: '3.4M', c: '#c94a4a' },
        { l: vi ? 'Thực lĩnh' : 'Net pay', v: '42.4M', big: true, c: S.accent, hl: true },
      ]}/>

      {/* Period status */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.paperDim} style={{ padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SCircle size={32} dark={dark} fill={'#4a9f4a22'} style={{ borderColor: '#4a9f4a' }}>
              <span style={{ fontSize: 16 }}>✓</span>
            </SCircle>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {vi ? 'Bảng lương T12/2025 đã duyệt' : 'Dec 2025 payroll approved'}
              </div>
              <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                {vi ? 'Duyệt lúc 28/12 14:30 · Minh Nguyễn' : 'Approved 28/12 14:30 · Minh Nguyen'}
              </div>
            </div>
            <div style={{ padding: '4px 8px', borderRadius: 999, background: '#4a9f4a', color: '#fff',
              fontSize: 10, fontWeight: 700, fontFamily: Sketch.mono }}>4/5 {vi ? 'ĐÃ CHI' : 'PAID'}</div>
          </div>
        </SBox>
      </div>

      {/* Payroll table */}
      <div style={{ padding: '0 12px 14px' }}>
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px',
            borderBottom: `1.5px solid ${S.line}`, background: S.paperDim,
            fontSize: 9.5, fontWeight: 700, color: S.inkDim,
            textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <div style={{ flex: 1 }}>{vi ? 'Nhân viên' : 'Staff'}</div>
            <div style={{ width: 28, textAlign: 'center' }}>{vi ? 'Công' : 'Day'}</div>
            <div style={{ width: 72, textAlign: 'right' }}>{vi ? 'Thực lĩnh' : 'Net'}</div>
          </div>
          {staff.map((s, i) => (
            <div key={i} style={{ padding: '10px 10px',
              borderBottom: i < staff.length - 1 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SCircle size={30} dark={dark} fill={S.accentDim} style={{ borderColor: S.accent }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: S.accent }}>{s.n.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                </SCircle>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.n}</div>
                  <div style={{ fontSize: 9.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>{s.r}</div>
                </div>
                <div style={{ width: 28, textAlign: 'center', fontFamily: Sketch.mono, fontSize: 12, fontWeight: 700 }}>{s.d}</div>
                <div style={{ width: 72, textAlign: 'right' }}>
                  <div style={{ fontFamily: Sketch.mono, fontWeight: 800, fontSize: 12, color: S.ink }}>{s.net}</div>
                  <div style={{ fontSize: 9, color: s.paid ? '#4a9f4a' : '#d4a574', fontWeight: 700, marginTop: 1 }}>
                    {s.paid ? '● ' + (vi ? 'ĐÃ CHI' : 'PAID') : '○ ' + (vi ? 'CHỜ' : 'PENDING')}
                  </div>
                </div>
              </div>
              {/* Salary breakdown */}
              <div style={{ display: 'flex', gap: 4, marginTop: 8, fontSize: 9.5,
                fontFamily: Sketch.mono, padding: '6px 8px', background: S.paperDim, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.inkDim, fontSize: 9 }}>{vi ? 'C.bản' : 'Base'}</div>
                  <div style={{ fontWeight: 700 }}>{s.base}K</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.inkDim, fontSize: 9 }}>{vi ? 'Thưởng' : 'Bonus'}</div>
                  <div style={{ fontWeight: 700, color: '#4a9f4a' }}>+{s.bonus}K</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.inkDim, fontSize: 9 }}>OT</div>
                  <div style={{ fontWeight: 700, color: '#4a9f4a' }}>+{s.ot}K</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.inkDim, fontSize: 9 }}>BHXH</div>
                  <div style={{ fontWeight: 700, color: '#c94a4a' }}>−{s.ded}K</div>
                </div>
              </div>
            </div>
          ))}
        </SBox>
      </div>

      {/* Deductions breakdown */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>
        📋 {vi ? 'Cấu thành khấu trừ' : 'Deduction breakdown'}
      </div>
      <div style={{ padding: '0 12px 18px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {[
            { l: vi ? 'BHXH (8%)' : 'Social ins. (8%)', v: '1.920.000' },
            { l: vi ? 'BHYT (1.5%)' : 'Health ins. (1.5%)', v: '360.000' },
            { l: vi ? 'BHTN (1%)' : 'Unemployment (1%)', v: '240.000' },
            { l: vi ? 'TNCN (5%)' : 'PIT (5%)', v: '880.000' },
            { l: vi ? 'TỔNG KHẤU TRỪ' : 'TOTAL DEDUCT', v: '3.400.000', total: true },
          ].map((d, i, a) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              background: d.total ? S.paperDim : 'transparent' }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: d.total ? 800 : 600,
                color: d.total ? S.ink : S.ink }}>{d.l}</span>
              <span style={{ fontFamily: Sketch.mono, fontWeight: 800, fontSize: d.total ? 13 : 12,
                color: '#c94a4a' }}>{d.v} ₫</span>
            </div>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, {
  SalesBookScreen, PurchaseBookScreen, CashBookScreen,
  DebtBookScreen, StockBookScreen, PayrollBookScreen,
  BookHeader, BalanceBar, LedgerRow, LedgerHeader,
});
