// Edit / Create screens for: Inventory adjust, Supplier, Return, Promotion, Bookkeeping entry

// ─────────────────────────────────────────────
// Inventory Adjust (Điều chỉnh tồn kho)
// ─────────────────────────────────────────────
function InventoryEditScreen({ dark = false, lang = 'vi', variant = 1, mode = 'adjust' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const title = mode === 'receive'
    ? (vi ? 'Nhập kho' : 'Receive stock')
    : mode === 'transfer'
    ? (vi ? 'Chuyển kho' : 'Transfer stock')
    : (vi ? 'Điều chỉnh tồn kho' : 'Adjust stock');
  const items = [
    { n: 'Cà phê G7 3in1', sku: 'SP-0421', cur: 48, adj: +24, unit: vi ? 'gói' : 'pack' },
    { n: 'Mì Hảo Hảo tôm chua cay', sku: 'SP-0158', cur: 120, adj: +50, unit: vi ? 'gói' : 'pack' },
    { n: 'Sữa TH true milk 1L', sku: 'SP-0622', cur: 18, adj: -2, unit: vi ? 'hộp' : 'box', note: vi ? 'Hỏng' : 'Damaged' },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>
            {mode === 'receive' ? 'PN-2512-042' : mode === 'transfer' ? 'PC-2512-018' : 'DC-2512-007'} · {vi ? 'Nháp' : 'Draft'}
          </div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Lưu' : 'Save'}
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6 }}>
        {[
          { k: 'receive', l: vi ? 'Nhập kho' : 'Receive', i: 'download' },
          { k: 'transfer', l: vi ? 'Chuyển kho' : 'Transfer', i: 'truck' },
          { k: 'adjust', l: vi ? 'Điều chỉnh' : 'Adjust', i: 'edit' },
        ].map((t) => (
          <div key={t.k} style={{
            flex: 1, padding: '8px 6px', textAlign: 'center', borderRadius: 10,
            background: mode === t.k ? S.accent : 'transparent',
            color: mode === t.k ? '#fff' : S.ink,
            border: mode === t.k ? 'none' : `1.5px solid ${S.line}`,
            fontSize: 11.5, fontWeight: 700,
          }}>{t.l}</div>
        ))}
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Header info */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            {vi ? 'Thông tin phiếu' : 'Document info'}
          </div>
          <FormField label={vi ? 'Ngày' : 'Date'} value="12/12/2025" dark={dark} mono/>
          {mode === 'receive' && (
            <>
              <FormField label={vi ? 'Nhà cung cấp' : 'Supplier'} value="Công ty TNHH Trung Nguyên" dropdown dark={dark}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                <FormField label={vi ? 'Hóa đơn NCC' : 'Invoice #'} value="HD-NCC-1812" mono dark={dark}/>
                <FormField label={vi ? 'Kho nhập' : 'To warehouse'} value="Kho tổng" dropdown dark={dark}/>
              </div>
            </>
          )}
          {mode === 'transfer' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
              <FormField label={vi ? 'Kho xuất' : 'From'} value="Kho tổng" dropdown dark={dark}/>
              <FormField label={vi ? 'Kho nhận' : 'To'} value="CH Q1" dropdown dark={dark} highlight/>
            </div>
          )}
          {mode === 'adjust' && (
            <>
              <FormField label={vi ? 'Kho' : 'Warehouse'} value="Kho tổng" dropdown dark={dark}/>
              <FormField label={vi ? 'Lý do' : 'Reason'} value={vi ? 'Kiểm kê cuối tháng' : 'Month-end count'} dropdown dark={dark}/>
            </>
          )}
        </SBox>

        {/* Scan / add */}
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderRight: `1px dashed ${S.inkFaint}` }}>
              <SIcon name="qr" size={22} color={S.accent}/>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>{vi ? 'Quét mã vạch' : 'Scan barcode'}</div>
            </div>
            <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
              <SIcon name="plus" size={22} color={S.accent}/>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>{vi ? 'Chọn sản phẩm' : 'Pick product'}</div>
            </div>
          </div>
        </SBox>

        {/* Items list */}
        <SBox dark={dark} style={{ padding: 0 }}>
          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center',
            borderBottom: `1px dashed ${S.inkFaint}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>
              📦 {vi ? 'Danh sách sản phẩm' : 'Items'} <span style={{ color: S.inkDim, fontWeight: 400 }}>· {items.length}</span>
            </div>
            <div style={{ fontSize: 11, color: S.accent, fontWeight: 700 }}>
              {vi ? 'Tổng SL:' : 'Total qty:'} {items.reduce((s, i) => s + Math.abs(i.adj), 0)}
            </div>
          </div>
          {items.map((it, i) => (
            <div key={i} style={{ padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                <SPlaceholder label="img" w={40} h={40} dark={dark} style={{ flexShrink: 0, padding: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.n}</div>
                  <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                    {it.sku} · {vi ? 'tồn' : 'stock'} {it.cur}
                  </div>
                  {it.note && <div style={{ fontSize: 10, color: '#c97a7a', marginTop: 2, fontStyle: 'italic' }}>"{it.note}"</div>}
                </div>
                <SIcon name="x" size={14} color={S.inkFaint}/>
              </div>
              {/* Qty stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10.5, color: S.inkDim, flex: 1 }}>
                  {mode === 'adjust'
                    ? (vi ? 'Điều chỉnh' : 'Adjust')
                    : (vi ? 'Số lượng' : 'Quantity')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${S.line}`, borderRadius: 8 }}>
                  <div style={{ padding: '4px 10px', fontSize: 14, fontWeight: 800, borderRight: `1.5px solid ${S.line}` }}>−</div>
                  <div style={{ padding: '4px 14px', fontSize: 13, fontWeight: 800, fontFamily: Sketch.mono,
                    color: it.adj < 0 ? '#c94a4a' : S.accent, minWidth: 50, textAlign: 'center' }}>
                    {it.adj > 0 ? '+' : ''}{it.adj}
                  </div>
                  <div style={{ padding: '4px 10px', fontSize: 14, fontWeight: 800, borderLeft: `1.5px solid ${S.line}` }}>+</div>
                </div>
                <div style={{ fontSize: 10.5, color: S.inkDim, minWidth: 32 }}>{it.unit}</div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: Sketch.mono, minWidth: 34, textAlign: 'right',
                  color: it.adj < 0 ? '#c94a4a' : '#4a9f4a' }}>→{it.cur + it.adj}</div>
              </div>
            </div>
          ))}
        </SBox>

        {/* Totals (for receive) */}
        {mode === 'receive' && (
          <SBox dark={dark} fill={S.accent} style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)' }}>{vi ? 'Tổng tiền nhập' : 'Total cost'}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono, letterSpacing: -0.5 }}>2.684.000 ₫</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                <div>{items.length} {vi ? 'SP · 74 đv' : 'items · 74 units'}</div>
                <div style={{ marginTop: 2 }}>VAT 8% · 214.720 ₫</div>
              </div>
            </div>
          </SBox>
        )}

        {/* Note */}
        <SBox dark={dark}>
          <div style={{ fontSize: 11, color: S.inkDim, marginBottom: 4, fontWeight: 600 }}>{vi ? 'Ghi chú' : 'Notes'}</div>
          <div style={{ minHeight: 50, border: `1.5px dashed ${S.inkFaint}`, borderRadius: 10, padding: 8,
            fontSize: 11.5, color: S.inkDim, fontStyle: 'italic' }}>
            {vi ? 'Ghi chú nội bộ...' : 'Internal notes...'}
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Supplier Edit
// ─────────────────────────────────────────────
function SupplierEditScreen({ dark = false, lang = 'vi', variant = 1, mode = 'edit' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {mode === 'create' ? (vi ? 'Thêm nhà cung cấp' : 'New supplier') : (vi ? 'Hồ sơ nhà cung cấp' : 'Supplier profile')}
          </div>
          <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>NCC-001 · {vi ? 'Hoạt động' : 'Active'}</div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Lưu' : 'Save'}
        </div>
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Logo + name */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: '#d9775733',
              border: `2px dashed #d97757`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#d97757' }}>TN</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Công ty TNHH Trung Nguyên</div>
              <div style={{ fontSize: 11, color: S.inkDim, marginTop: 2 }}>{vi ? 'Tải logo' : 'Upload logo'}</div>
            </div>
          </div>
        </SBox>

        {/* Basic info */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            {vi ? 'Thông tin chung' : 'Basic info'}
          </div>
          <FormField label={vi ? 'Tên nhà cung cấp' : 'Supplier name'} value="Công ty TNHH Trung Nguyên" dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Mã NCC' : 'Code'} value="NCC-001" mono dark={dark}/>
            <FormField label={vi ? 'Mã số thuế' : 'Tax ID'} value="0301234567" mono dark={dark}/>
          </div>
          <FormField label={vi ? 'Ngành hàng' : 'Category'} value={vi ? 'Đồ uống · Cà phê' : 'Beverage · Coffee'} dropdown dark={dark}/>
        </SBox>

        {/* Contact */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📞 {vi ? 'Liên hệ' : 'Contact'}
          </div>
          <FormField label={vi ? 'Người liên hệ' : 'Contact person'} value="Anh Nguyễn Văn Hùng" dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Điện thoại' : 'Phone'} value="0903 456 789" mono dark={dark}/>
            <FormField label="Email" value="sales@trungnguyen.com" mono dark={dark}/>
          </div>
          <FormField label={vi ? 'Địa chỉ' : 'Address'} value="82 Bùi Thị Xuân, Q.1, TP.HCM" dark={dark}/>
        </SBox>

        {/* Payment terms */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            💳 {vi ? 'Thanh toán & công nợ' : 'Payment & credit'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormField label={vi ? 'Điều khoản' : 'Terms'} value={vi ? '30 ngày (Net 30)' : 'Net 30'} dropdown dark={dark}/>
            <FormField label={vi ? 'Hạn mức công nợ' : 'Credit limit'} value="50.000.000 ₫" dark={dark}/>
          </div>
          <FormField label={vi ? 'Số tài khoản ngân hàng' : 'Bank account'} value="Vietcombank · 0071 0000 123456" mono dark={dark}/>
          <div style={{ marginTop: 10, padding: 10, background: '#d9775722', borderRadius: 10,
            border: `1.5px solid #d97757`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10.5, color: S.inkDim, fontWeight: 600 }}>{vi ? 'Công nợ hiện tại' : 'Current debt'}</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: Sketch.mono, color: '#d97757' }}>12.400.000 ₫</div>
            </div>
            <div style={{ padding: '6px 10px', borderRadius: 8, background: '#d97757', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              {vi ? 'Thanh toán' : 'Pay now'}
            </div>
          </div>
        </SBox>

        {/* Purchase history */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📦 {vi ? 'Lịch sử giao dịch' : 'Purchase history'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            {[
              { l: vi ? 'Tổng đơn' : 'Total POs', v: '42', c: S.ink },
              { l: vi ? 'Giá trị' : 'Value', v: '186M', c: S.accent },
              { l: vi ? 'Đơn gần nhất' : 'Last PO', v: '3d', c: S.inkDim },
            ].map((x, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '8px 4px', background: S.paperDim, borderRadius: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: x.c, fontFamily: Sketch.mono }}>{x.v}</div>
                <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{x.l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: S.accent, fontWeight: 700, textAlign: 'center' }}>
            {vi ? 'Xem tất cả đơn nhập →' : 'See all POs →'}
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Return Edit (Yêu cầu trả hàng)
// ─────────────────────────────────────────────
function ReturnEditScreen({ dark = false, lang = 'vi', variant = 1, mode = 'create' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const items = [
    { n: 'Áo thun unisex size M', sku: 'SP-1120', qty: 1, price: '285K', reason: vi ? 'Lỗi đường may' : 'Stitching defect', selected: true },
    { n: 'Quần jeans slim fit', sku: 'SP-1145', qty: 1, price: '420K', reason: '', selected: false },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{vi ? 'Yêu cầu trả hàng' : 'Return request'}</div>
          <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>
            #TH-2412-009 · {vi ? 'Chờ duyệt' : 'Pending'}
          </div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Tạo' : 'Create'}
        </div>
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Original order */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            🧾 {vi ? 'Đơn hàng gốc' : 'Original order'}
          </div>
          <FormField label={vi ? 'Tìm đơn gốc (mã / SĐT khách)' : 'Find order'} value="DH-2412-0842" mono scan dark={dark} highlight/>
          <div style={{ marginTop: 8, padding: 10, background: S.paperDim, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: S.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>NL</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Nguyễn Thị Lan</div>
              <div style={{ fontSize: 10.5, color: S.inkDim }}>0908 123 456 · {vi ? 'mua 3 ngày trước' : '3 days ago'}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: Sketch.mono, color: S.accent }}>705K</div>
          </div>
        </SBox>

        {/* Items to return */}
        <SBox dark={dark} style={{ padding: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px dashed ${S.inkFaint}` }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              🛍️ {vi ? 'Chọn sản phẩm trả' : 'Items to return'}
            </div>
          </div>
          {items.map((it, i) => (
            <div key={i} style={{ padding: '10px 12px', display: 'flex', gap: 10,
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              opacity: it.selected ? 1 : 0.55 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6,
                border: `1.5px solid ${it.selected ? S.accent : S.line}`,
                background: it.selected ? S.accent : 'transparent',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, flexShrink: 0, marginTop: 4 }}>
                {it.selected && '✓'}
              </div>
              <SPlaceholder label="img" w={44} h={44} dark={dark} style={{ flexShrink: 0, padding: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{it.n}</div>
                <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>{it.sku}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: S.inkDim }}>SL: <b style={{ color: S.ink, fontFamily: Sketch.mono }}>{it.qty}</b></span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: S.accent, fontFamily: Sketch.mono, marginLeft: 'auto' }}>{it.price}</span>
                </div>
              </div>
            </div>
          ))}
        </SBox>

        {/* Return reason */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            ❓ {vi ? 'Lý do trả hàng' : 'Return reason'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            {(vi
              ? ['Lỗi sản phẩm', 'Không vừa ý', 'Sai mẫu/size', 'Hết hạn', 'Khác...']
              : ['Defective', 'Not satisfied', 'Wrong size', 'Expired', 'Other...']
            ).map((r, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, textAlign: 'center',
                border: `1.5px solid ${i === 0 ? S.accent : S.line}`,
                background: i === 0 ? S.accentDim : 'transparent',
                color: i === 0 ? S.accent : S.ink,
              }}>{r}</div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: S.inkDim, marginBottom: 4, fontWeight: 600 }}>{vi ? 'Mô tả chi tiết' : 'Details'}</div>
          <div style={{ minHeight: 60, border: `1.5px solid ${S.line}`, borderRadius: 10, padding: 8,
            fontSize: 11.5, color: S.ink }}>
            {vi ? 'Đường may gấu áo bị bung, khách yêu cầu trả.' : 'Hem stitching came loose, customer requests return.'}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <SPlaceholder label="photo 1" w={60} h={60} dark={dark} style={{ flexShrink: 0, padding: 0 }}/>
            <SPlaceholder label="photo 2" w={60} h={60} dark={dark} style={{ flexShrink: 0, padding: 0 }}/>
            <div style={{ width: 60, height: 60, border: `1.5px dashed ${S.line}`, borderRadius: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: S.inkDim, fontSize: 10, gap: 3 }}>
              <SIcon name="plus" size={18} dark={dark}/>
              <span>{vi ? 'Ảnh' : 'Add'}</span>
            </div>
          </div>
        </SBox>

        {/* Refund method */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            💸 {vi ? 'Hình thức hoàn' : 'Refund method'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { l: vi ? 'Tiền mặt' : 'Cash', i: 'money', sel: true },
              { l: vi ? 'Chuyển khoản' : 'Transfer', i: 'card' },
              { l: vi ? 'Đổi hàng' : 'Exchange', i: 'refresh' },
            ].map((m, i) => (
              <div key={i} style={{
                padding: '10px 6px', borderRadius: 10, textAlign: 'center',
                border: `1.5px solid ${m.sel ? S.accent : S.line}`,
                background: m.sel ? S.accentDim : 'transparent',
              }}>
                <SIcon name={m.i} size={18} color={m.sel ? S.accent : S.ink}/>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3, color: m.sel ? S.accent : S.ink }}>{m.l}</div>
              </div>
            ))}
          </div>
        </SBox>

        {/* Summary */}
        <SBox dark={dark} fill={S.accent} style={{ padding: 14 }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 4 }}>
            {vi ? 'TỔNG HOÀN KHÁCH' : 'TOTAL REFUND'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono, letterSpacing: -1 }}>285.000 ₫</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>1 {vi ? 'sản phẩm' : 'item'}</div>
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Promotion Edit
// ─────────────────────────────────────────────
function PromotionEditScreen({ dark = false, lang = 'vi', variant = 1, mode = 'create' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const title = mode === 'create' ? (vi ? 'Tạo khuyến mãi' : 'New promotion') : (vi ? 'Sửa khuyến mãi' : 'Edit promotion');
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>KM-012 · {vi ? 'Nháp' : 'Draft'}</div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Lưu' : 'Save'}
        </div>
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Preview banner */}
        <SBox dark={dark} style={{ padding: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg, #008ecc 0%, #d97757 100%)' }}>
          <div style={{ padding: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 54, height: 54, borderRadius: 12, background: 'rgba(255,255,255,0.25)',
              border: '2px dashed rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono }}>20%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.85 }}>🎁 {vi ? 'XEM TRƯỚC' : 'PREVIEW'}</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
                {vi ? 'Giảm 20% toàn bộ đồ uống' : '20% off all beverages'}
              </div>
              <div style={{ fontSize: 10.5, fontFamily: Sketch.mono, opacity: 0.85, marginTop: 2 }}>DRINK20 · {vi ? 'hết 31/12' : 'ends 31/12'}</div>
            </div>
          </div>
        </SBox>

        {/* Basic */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            {vi ? 'Thông tin chương trình' : 'Program info'}
          </div>
          <FormField label={vi ? 'Tên chương trình' : 'Name'} value="Giảm 20% toàn bộ đồ uống" dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Mã KM' : 'Code'} value="DRINK20" mono dark={dark}/>
            <FormField label={vi ? 'Ưu tiên' : 'Priority'} value={vi ? 'Cao' : 'High'} dropdown dark={dark}/>
          </div>
        </SBox>

        {/* Discount type */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            💰 {vi ? 'Kiểu giảm giá' : 'Discount type'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
            {[
              { l: vi ? 'Giảm %' : '% off', v: '20%', sel: true },
              { l: vi ? 'Giảm tiền' : 'Flat', v: '₫' },
              { l: 'BOGO', v: 'X+Y' },
              { l: 'Combo', v: '◇' },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '10px 4px', borderRadius: 10, textAlign: 'center',
                border: `1.5px solid ${t.sel ? S.accent : S.line}`,
                background: t.sel ? S.accentDim : 'transparent',
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: Sketch.mono, color: t.sel ? S.accent : S.ink }}>{t.v}</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>{t.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormField label={vi ? 'Giá trị giảm' : 'Discount value'} value="20 %" mono dark={dark} highlight/>
            <FormField label={vi ? 'Giảm tối đa' : 'Max discount'} value="100.000 ₫" mono dark={dark}/>
          </div>
          <div style={{ marginTop: 8 }}>
            <FormField label={vi ? 'Đơn tối thiểu' : 'Min order'} value="50.000 ₫" dark={dark}/>
          </div>
        </SBox>

        {/* Schedule */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📅 {vi ? 'Thời gian' : 'Schedule'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormField label={vi ? 'Bắt đầu' : 'Start'} value="15/12/2025 00:00" mono dark={dark}/>
            <FormField label={vi ? 'Kết thúc' : 'End'} value="31/12/2025 23:59" mono dark={dark}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Lượt dùng tối đa' : 'Max uses'} value="500" mono dark={dark}/>
            <FormField label={vi ? 'Mỗi khách / lần' : 'Per customer'} value="3" mono dark={dark}/>
          </div>
        </SBox>

        {/* Apply to */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            🎯 {vi ? 'Áp dụng cho' : 'Apply to'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            {[
              { l: vi ? 'Tất cả SP' : 'All products' },
              { l: vi ? 'Theo danh mục' : 'By category', sel: true },
              { l: vi ? 'SP cụ thể' : 'Specific SKUs' },
              { l: vi ? 'Hạng KH' : 'Customer tier' },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '9px 8px', borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${t.sel ? S.accent : S.line}`,
                background: t.sel ? S.accentDim : 'transparent',
                color: t.sel ? S.accent : S.ink,
              }}>{t.l}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[vi ? 'Đồ uống' : 'Beverage', vi ? 'Cà phê' : 'Coffee', vi ? 'Nước ngọt' : 'Soft drinks'].map((c, i) => (
              <div key={i} style={{ padding: '6px 10px', borderRadius: 999, background: S.accent,
                color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                {c} <span style={{ fontSize: 14, fontWeight: 800 }}>×</span>
              </div>
            ))}
            <div style={{ padding: '6px 10px', borderRadius: 999, border: `1.5px dashed ${S.line}`,
              fontSize: 11, fontWeight: 700, color: S.inkDim }}>+ {vi ? 'Thêm danh mục' : 'Add category'}</div>
          </div>
        </SBox>

        {/* Channels */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            🌐 {vi ? 'Kênh áp dụng' : 'Sales channels'}
          </div>
          <ToggleRow label={vi ? 'Tại cửa hàng (POS)' : 'In-store (POS)'} on={true} dark={dark}/>
          <ToggleRow label="Shopee" on={true} dark={dark}/>
          <ToggleRow label="TikTok Shop" on={true} dark={dark}/>
          <ToggleRow label="Website / App" on={false} dark={dark}/>
          <ToggleRow label={vi ? 'Kết hợp với KM khác' : 'Stack with other promos'} on={false} dark={dark} last/>
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Bookkeeping Entry (Ghi sổ thu/chi)
// ─────────────────────────────────────────────
function BookkeepingEditScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{vi ? 'Ghi sổ kế toán' : 'New ledger entry'}</div>
          <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>PT-2512-108 · {vi ? 'Sổ thu chi' : 'Cash book'}</div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Ghi sổ' : 'Record'}
        </div>
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Type toggle — Thu / Chi */}
        <SBox dark={dark} style={{ padding: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRadius: 10,
              background: '#4a9f4a', color: '#fff', fontSize: 14, fontWeight: 800 }}>
              ↓ {vi ? 'Phiếu thu' : 'Income'}
            </div>
            <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRadius: 10,
              background: 'transparent', color: S.inkDim, fontSize: 14, fontWeight: 800,
              border: `1.5px solid ${S.line}` }}>
              ↑ {vi ? 'Phiếu chi' : 'Expense'}
            </div>
          </div>
        </SBox>

        {/* Amount — big */}
        <SBox dark={dark} fill="#4a9f4a" style={{ padding: 16, textAlign: 'center', borderColor: '#4a9f4a' }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 4 }}>
            {vi ? 'SỐ TIỀN' : 'AMOUNT'}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono, letterSpacing: -1.5 }}>
            +2.500.000 ₫
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontStyle: 'italic' }}>
            {vi ? 'Hai triệu năm trăm nghìn đồng' : 'Two million five hundred thousand VND'}
          </div>
        </SBox>

        {/* Category selector */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📂 {vi ? 'Loại khoản thu' : 'Income category'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { i: 'cart', l: vi ? 'Bán hàng' : 'Sales', sel: true, c: '#4a9f4a' },
              { i: 'refresh', l: vi ? 'Hoàn NCC' : 'Supplier refund', c: '#6b8cae' },
              { i: 'coin', l: vi ? 'Thu nợ' : 'Receivable', c: '#d4a574' },
              { i: 'tag', l: vi ? 'Khuyến mãi' : 'Rebate', c: '#8a6a9e' },
              { i: 'box', l: vi ? 'Thanh lý' : 'Liquidation', c: '#b08968' },
              { i: 'plus', l: vi ? 'Khác' : 'Other', c: S.inkDim },
            ].map((c, i) => (
              <div key={i} style={{
                padding: '10px 6px', borderRadius: 10, textAlign: 'center',
                border: `1.5px solid ${c.sel ? c.c : S.line}`,
                background: c.sel ? c.c + '22' : 'transparent',
              }}>
                <SIcon name={c.i} size={18} color={c.sel ? c.c : S.ink}/>
                <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 3, color: c.sel ? c.c : S.ink }}>{c.l}</div>
              </div>
            ))}
          </div>
        </SBox>

        {/* Detail */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            {vi ? 'Chi tiết' : 'Details'}
          </div>
          <FormField label={vi ? 'Diễn giải' : 'Description'} value={vi ? 'Thu tiền bán ca sáng 12/12' : 'Morning shift sales 12/12'} dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Ngày' : 'Date'} value="12/12/2025" mono dark={dark}/>
            <FormField label={vi ? 'Hình thức' : 'Method'} value={vi ? 'Tiền mặt' : 'Cash'} dropdown dark={dark}/>
          </div>
          <FormField label={vi ? 'Liên kết đơn hàng' : 'Linked order'} value="DH-2412-0842, DH-2412-0843, DH-2412-0844..." dark={dark} scan/>
        </SBox>

        {/* Account & party */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            💼 {vi ? 'Đối tượng & tài khoản' : 'Party & account'}
          </div>
          <FormField label={vi ? 'Người nộp' : 'Payer'} value={vi ? 'Khách lẻ (tổng hợp ca)' : 'Walk-in (shift summary)'} dropdown dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Tài khoản thu' : 'Account'} value="111 — Tiền mặt" dropdown dark={dark}/>
            <FormField label={vi ? 'Ca làm việc' : 'Shift'} value={vi ? 'Ca sáng — NV Linh' : 'AM — Linh'} dropdown dark={dark}/>
          </div>
        </SBox>

        {/* Tax + attachment */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📎 {vi ? 'Hóa đơn & thuế' : 'Invoice & tax'}
          </div>
          <ToggleRow label={vi ? 'Xuất hóa đơn điện tử' : 'Issue e-invoice'} on={true} dark={dark}/>
          <ToggleRow label={vi ? 'Tính vào doanh thu chịu thuế' : 'Include in taxable revenue'} on={true} dark={dark}/>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, padding: 14, border: `1.5px dashed ${S.line}`, borderRadius: 10, textAlign: 'center' }}>
              <SIcon name="camera" size={18} color={S.accent}/>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{vi ? 'Chụp phiếu' : 'Snap receipt'}</div>
            </div>
            <div style={{ flex: 1, padding: 14, border: `1.5px dashed ${S.line}`, borderRadius: 10, textAlign: 'center' }}>
              <SIcon name="upload" size={18} color={S.accent}/>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{vi ? 'Tải file' : 'Upload'}</div>
            </div>
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, {
  InventoryEditScreen, SupplierEditScreen, ReturnEditScreen,
  PromotionEditScreen, BookkeepingEditScreen,
});
