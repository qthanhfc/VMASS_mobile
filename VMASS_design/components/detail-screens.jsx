// Detail / Edit / Create screens for Management sections

function ProductEditScreen({ dark = false, lang = 'vi', variant = 1, mode = 'edit' }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      {/* header */}
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {mode === 'create'
              ? (vi ? 'Thêm sản phẩm' : 'New product')
              : (vi ? 'Sửa sản phẩm' : 'Edit product')}
          </div>
          <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>SP-0421 · {vi ? 'Đã lưu 2 phút trước' : 'Saved 2m ago'}</div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Lưu' : 'Save'}
        </div>
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Image gallery */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            📸 {vi ? 'Hình ảnh' : 'Photos'} <span style={{ color: S.inkDim, fontWeight: 400 }}>· 3/8</span>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            <SPlaceholder label="main" w={90} h={90} dark={dark} style={{ flexShrink: 0, padding: 0, border: `2px solid ${S.accent}` }}/>
            <SPlaceholder label="alt 1" w={90} h={90} dark={dark} style={{ flexShrink: 0, padding: 0 }}/>
            <SPlaceholder label="alt 2" w={90} h={90} dark={dark} style={{ flexShrink: 0, padding: 0 }}/>
            <div style={{
              width: 90, height: 90, flexShrink: 0,
              border: `1.5px dashed ${S.line}`, borderRadius: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: S.inkDim, fontSize: 11, gap: 4,
            }}>
              <SIcon name="plus" size={20} dark={dark}/>
              <span>{vi ? 'Thêm' : 'Add'}</span>
            </div>
          </div>
        </SBox>

        {/* Basic info */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            {vi ? 'Thông tin cơ bản' : 'Basic info'}
          </div>
          <FormField label={vi ? 'Tên sản phẩm' : 'Product name'} value="Cà phê G7 (3 trong 1)" dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label="SKU" value="SP-0421" mono dark={dark}/>
            <FormField label={vi ? 'Mã vạch' : 'Barcode'} value="8934567812345" mono dark={dark} scan/>
          </div>
          <FormField label={vi ? 'Danh mục' : 'Category'} value="Đồ uống · Cà phê" dropdown dark={dark}/>
          <FormField label={vi ? 'Thương hiệu' : 'Brand'} value="Trung Nguyên" dropdown dark={dark}/>
        </SBox>

        {/* Pricing */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            💰 {vi ? 'Giá' : 'Pricing'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormField label={vi ? 'Giá nhập' : 'Cost price'} value="18.000 ₫" dark={dark}/>
            <FormField label={vi ? 'Giá bán' : 'Sell price'} value="25.000 ₫" dark={dark} highlight/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Giá KM' : 'Sale price'} value="22.000 ₫" dark={dark}/>
            <FormField label={vi ? 'Đơn vị' : 'Unit'} value="gói" dropdown dark={dark}/>
          </div>
          <div style={{ marginTop: 8, padding: 8, background: S.paperDim, borderRadius: 10, fontSize: 11, color: S.inkDim }}>
            💡 {vi ? 'Lợi nhuận trên 1 sản phẩm' : 'Profit per unit'}: <b style={{ color: S.accent }}>7.000 ₫ (28%)</b>
          </div>
        </SBox>

        {/* Variants */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              🎨 {vi ? 'Biến thể' : 'Variants'}
            </div>
            <span style={{ fontSize: 12, color: S.accent, fontWeight: 700 }}>+ {vi ? 'Thêm' : 'Add'}</span>
          </div>
          {[
            { n: 'Hộp 20 gói', price: '460K', stk: 12 },
            { n: 'Hộp 50 gói', price: '1.1M', stk: 5 },
            { n: 'Lẻ 1 gói', price: '25K', stk: 124 },
          ].map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none', fontSize: 13 }}>
              <span style={{ flex: 1, fontWeight: 600 }}>{v.n}</span>
              <span style={{ color: S.accent, fontWeight: 700 }}>{v.price}</span>
              <span style={{ color: S.inkDim, fontFamily: Sketch.mono, minWidth: 40, textAlign: 'right' }}>·{v.stk}</span>
            </div>
          ))}
        </SBox>

        {/* Inventory */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📦 {vi ? 'Tồn kho' : 'Inventory'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormField label={vi ? 'Tồn hiện tại' : 'On hand'} value="124 gói" mono dark={dark}/>
            <FormField label={vi ? 'Cảnh báo khi dưới' : 'Low stock alert'} value="20 gói" mono dark={dark}/>
          </div>
          <FormField label={vi ? 'Kho' : 'Warehouse'} value="CH Q1 · CH Q7 · Kho tổng" dropdown dark={dark}/>
        </SBox>

        {/* Toggles */}
        <SBox dark={dark}>
          <ToggleRow label={vi ? 'Hiện trên cửa hàng online' : 'Show in online store'} on dark={dark}/>
          <ToggleRow label={vi ? 'Cho phép bán khi hết hàng' : 'Allow overselling'} on={false} dark={dark}/>
          <ToggleRow label={vi ? 'Áp dụng thuế VAT 8%' : 'Apply VAT 8%'} on dark={dark} last/>
        </SBox>

        {/* Danger zone */}
        <SBox dashed dark={dark} style={{ borderColor: '#c97a7a' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#c97a7a', fontSize: 13, fontWeight: 700 }}>
            <SIcon name="trash" size={16} color="#c97a7a"/>
            {vi ? 'Xóa sản phẩm' : 'Delete product'}
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

function FormField({ label, value, dark, mono, dropdown, scan, highlight }) {
  const S = useSketch(dark);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 11, color: S.inkDim, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{
        border: `1.5px solid ${highlight ? S.accent : S.inkFaint}`,
        borderRadius: 10,
        padding: '9px 12px',
        fontSize: 13,
        fontFamily: mono ? Sketch.mono : undefined,
        fontWeight: 600,
        color: S.ink,
        background: highlight ? S.accentDim + (dark ? '' : '40') : 'transparent',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        {scan && <SIcon name="qr" size={16} color={S.accent}/>}
        {dropdown && <SIcon name="chevron_right" size={14} color={S.inkFaint} style={{ transform: 'rotate(90deg)' }}/>}
      </div>
    </div>
  );
}

function ToggleRow({ label, on, dark, last }) {
  const S = useSketch(dark);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '10px 0',
      borderBottom: last ? 'none' : `1px dashed ${S.inkFaint}`,
    }}>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <div style={{
        width: 40, height: 22, borderRadius: 999,
        background: on ? S.accent : S.inkFaint,
        border: `1.5px solid ${S.line}`,
        position: 'relative',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', border: `1.5px solid ${S.line}`,
          position: 'absolute', top: 1, left: on ? 20 : 2,
        }}/>
      </div>
    </div>
  );
}

// ─────────────── Inventory screen ───────────────
function InventoryScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="chevron_right" size={22} dark={dark} style={{ transform: 'rotate(180deg)' }}/>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>{vi ? 'Tồn kho' : 'Inventory'}</div>
        <SIcon name="filter" size={20} dark={dark}/>
        <SIcon name="qr" size={20} color={S.accent}/>
      </div>

      {/* Summary cards */}
      <div style={{ padding: '0 12px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 12, borderColor: S.accent }}>
          <div style={{ color: '#fff', fontSize: 11, opacity: 0.85 }}>{vi ? 'Tổng giá trị' : 'Total value'}</div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginTop: 2 }}>248M ₫</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>1,284 SKU</div>
        </SBox>
        <SBox dark={dark} style={{ padding: 12 }}>
          <div style={{ fontSize: 11, color: S.inkDim }}>{vi ? 'Cần nhập' : 'Need restock'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, color: '#c97a7a' }}>12</div>
          <div style={{ fontSize: 11, color: S.inkDim }}>{vi ? 'SP sắp hết' : 'low items'}</div>
        </SBox>
      </div>

      {/* Warehouse tabs */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {['Tất cả kho', 'CH Q1', 'CH Q7', 'Kho tổng', 'Ký gửi'].map((w, i) => (
          <div key={w} style={{
            padding: '6px 12px', borderRadius: 999,
            border: `1.5px solid ${i === 0 ? S.accent : S.inkFaint}`,
            background: i === 0 ? S.accentDim : 'transparent',
            color: i === 0 ? S.accent : S.inkDim,
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
          }}>{w}</div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 12px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <SBox dark={dark} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#c4e4f2', border: `1.5px solid ${S.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name="upload" size={16} color={S.accent}/>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{vi ? 'Nhập kho' : 'Stock in'}</div>
            <div style={{ fontSize: 10, color: S.inkDim }}>{vi ? 'Tạo phiếu' : 'Create'}</div>
          </div>
        </SBox>
        <SBox dark={dark} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0d4d4', border: `1.5px solid #c97a7a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name="download" size={16} color="#c97a7a"/>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{vi ? 'Xuất kho' : 'Stock out'}</div>
            <div style={{ fontSize: 10, color: S.inkDim }}>{vi ? 'Tạo phiếu' : 'Create'}</div>
          </div>
        </SBox>
        <SBox dark={dark} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f4e5c4', border: `1.5px solid #c4a274`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name="refresh" size={16} color="#c4a274"/>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{vi ? 'Chuyển kho' : 'Transfer'}</div>
            <div style={{ fontSize: 10, color: S.inkDim }}>{vi ? 'Giữa các kho' : 'Between'}</div>
          </div>
        </SBox>
        <SBox dark={dark} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#d4e4c4', border: `1.5px solid #7a9e7a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name="check" size={16} color="#7a9e7a"/>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{vi ? 'Kiểm kê' : 'Stocktake'}</div>
            <div style={{ fontSize: 10, color: S.inkDim }}>{vi ? 'So sánh' : 'Compare'}</div>
          </div>
        </SBox>
      </div>

      {/* Stock list */}
      <div style={{ padding: '0 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>📦 {vi ? 'Danh sách tồn' : 'Stock list'}</div>
        <span style={{ fontSize: 11, color: S.inkDim }}>{vi ? 'Sắp xếp: A-Z' : 'Sort: A-Z'} ↓</span>
      </div>
      <div style={{ padding: '0 12px 20px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {[
            { n: 'Cà phê G7 (3 trong 1)', sku: 'SP-0421', stk: 124, min: 20, unit: 'gói', loc: 'Kệ A3-02', status: 'ok' },
            { n: 'Coca-Cola lon 330ml', sku: 'SP-0305', stk: 88, min: 30, unit: 'lon', loc: 'Kệ B1-14', status: 'ok' },
            { n: 'Pepsi 330ml', sku: 'SP-0307', stk: 3, min: 30, unit: 'lon', loc: 'Kệ B1-15', status: 'low' },
            { n: 'Dầu ăn Neptune 1L', sku: 'SP-0502', stk: 2, min: 10, unit: 'chai', loc: 'Kệ C2-04', status: 'low' },
            { n: 'Bột giặt Omo 800g', sku: 'SP-0701', stk: 1, min: 8, unit: 'gói', loc: 'Kệ D4-11', status: 'low' },
            { n: 'Mì Hảo Hảo tôm chua', sku: 'SP-0118', stk: 42, min: 20, unit: 'gói', loc: 'Kệ A2-08', status: 'ok' },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              background: p.status === 'low' ? (dark ? '#2a1a1a' : '#fcf2ee') : 'transparent',
            }}>
              <SPlaceholder label="" w={38} h={38} dark={dark} style={{ padding: 0, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
                <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>{p.sku} · {p.loc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: p.status === 'low' ? '#c97a7a' : S.ink }}>
                  {p.stk} <span style={{ fontSize: 10, fontWeight: 600, color: S.inkDim }}>{p.unit}</span>
                </div>
                <div style={{ fontSize: 9, color: S.inkDim, fontFamily: Sketch.mono }}>min {p.min}</div>
              </div>
            </div>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────── Staff edit screen ───────────────
function StaffEditScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>{vi ? 'Hồ sơ nhân viên' : 'Staff profile'}</div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Lưu' : 'Save'}
        </div>
      </div>

      {/* Avatar + basic */}
      <div style={{ padding: '4px 12px 12px' }}>
        <SBox dark={dark} style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <SCircle size={64} dark={dark} fill={S.accentDim} style={{ borderColor: S.accent }}>
              <span style={{ color: S.accent, fontWeight: 800, fontSize: 24 }}>TH</span>
            </SCircle>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 24, height: 24, borderRadius: '50%',
              background: S.accent, border: `2px solid ${S.paper}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SIcon name="camera" size={12} color="#fff"/>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Thu Hà Nguyễn</div>
            <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>NV-0012 · {vi ? 'Bắt đầu 01/03/2024' : 'Since 2024-03-01'}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: '#d4e4c4', color: '#5b7a5b', fontWeight: 700 }}>● {vi ? 'Đang làm' : 'Active'}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: S.accentDim, color: S.accent, fontWeight: 700 }}>{vi ? 'Thu ngân' : 'Cashier'}</span>
            </div>
          </div>
        </SBox>
      </div>

      <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Contact */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📱 {vi ? 'Liên hệ' : 'Contact'}
          </div>
          <FormField label={vi ? 'Họ tên' : 'Full name'} value="Nguyễn Thị Thu Hà" dark={dark}/>
          <FormField label={vi ? 'Số điện thoại' : 'Phone'} value="0912 345 678" mono dark={dark}/>
          <FormField label="Email" value="thuha@vmass.vn" mono dark={dark}/>
          <FormField label={vi ? 'Ngày sinh' : 'DOB'} value="12/08/1998" dark={dark}/>
        </SBox>

        {/* Role + store */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            🏪 {vi ? 'Vị trí & chi nhánh' : 'Role & store'}
          </div>
          <FormField label={vi ? 'Chức vụ' : 'Position'} value="Thu ngân" dropdown dark={dark}/>
          <FormField label={vi ? 'Chi nhánh' : 'Store'} value="CH Chính" dropdown dark={dark}/>
          <FormField label={vi ? 'Ca làm việc' : 'Shift'} value="Sáng · 7h-15h" dropdown dark={dark}/>
        </SBox>

        {/* Permissions */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            🔐 {vi ? 'Phân quyền' : 'Permissions'}
          </div>
          <ToggleRow label={vi ? 'Bán hàng (POS)' : 'Sell (POS)'} on dark={dark}/>
          <ToggleRow label={vi ? 'Xem doanh thu' : 'View revenue'} on={false} dark={dark}/>
          <ToggleRow label={vi ? 'Quản lý tồn kho' : 'Manage inventory'} on dark={dark}/>
          <ToggleRow label={vi ? 'Thêm/sửa sản phẩm' : 'Edit products'} on={false} dark={dark}/>
          <ToggleRow label={vi ? 'Duyệt trả hàng' : 'Approve returns'} on={false} dark={dark} last/>
        </SBox>

        {/* Payroll */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            💵 {vi ? 'Lương & hoa hồng' : 'Salary & commission'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FormField label={vi ? 'Lương cơ bản' : 'Base salary'} value="6.500.000 ₫" dark={dark}/>
            <FormField label={vi ? '% hoa hồng' : 'Commission %'} value="2%" dark={dark}/>
          </div>
        </SBox>

        {/* Attendance summary */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              ⏱ {vi ? 'Chấm công tháng này' : 'Attendance this month'}
            </div>
            <span style={{ fontSize: 11, color: S.accent, fontWeight: 700 }}>{vi ? 'Chi tiết' : 'Details'} →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <AttStat label={vi ? 'Ngày làm' : 'Days'} value="22" dark={dark}/>
            <AttStat label={vi ? 'Đi trễ' : 'Late'} value="2" dark={dark} color="#c4a274"/>
            <AttStat label={vi ? 'Nghỉ' : 'Off'} value="1" dark={dark} color="#c97a7a"/>
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

function AttStat({ label, value, dark, color }) {
  const S = useSketch(dark);
  return (
    <div style={{ padding: 8, background: S.paperDim, borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || S.ink }}>{value}</div>
      <div style={{ fontSize: 10, color: S.inkDim }}>{label}</div>
    </div>
  );
}

// ─────────────── Customer edit ───────────────
function CustomerEditScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="x" size={22} dark={dark}/>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>{vi ? 'Khách hàng' : 'Customer'}</div>
        <SIcon name="msg" size={20} dark={dark}/>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {vi ? 'Lưu' : 'Save'}
        </div>
      </div>

      <div style={{ padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* hero */}
        <SBox dark={dark} fill={S.accent} style={{ padding: 14, borderColor: S.accent }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <SCircle size={56} dark={dark} fill="#fff" style={{ borderColor: '#fff' }}>
              <span style={{ color: S.accent, fontWeight: 800, fontSize: 20 }}>LA</span>
            </SCircle>
            <div style={{ flex: 1, color: '#fff' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Nguyễn Thị Lan Anh</div>
              <div style={{ fontSize: 11, opacity: 0.85, fontFamily: Sketch.mono }}>KH-0892 · ⭐ {vi ? 'Khách VIP' : 'VIP'}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{vi ? 'Tổng chi' : 'Spent'}</div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>8.4M</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{vi ? 'Đơn hàng' : 'Orders'}</div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>27</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{vi ? 'Điểm tích' : 'Points'}</div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>840</div>
            </div>
          </div>
        </SBox>

        {/* contact */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            {vi ? 'Thông tin liên hệ' : 'Contact'}
          </div>
          <FormField label={vi ? 'Họ tên' : 'Name'} value="Nguyễn Thị Lan Anh" dark={dark}/>
          <FormField label={vi ? 'SĐT' : 'Phone'} value="0912 888 999" mono dark={dark}/>
          <FormField label={vi ? 'Ngày sinh' : 'Birthday'} value="15/06/1992" dark={dark}/>
          <FormField label={vi ? 'Địa chỉ' : 'Address'} value="123 Nguyễn Huệ, Q.1, TP.HCM" dark={dark}/>
        </SBox>

        {/* tags + groups */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            🏷 {vi ? 'Nhãn phân loại' : 'Tags'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['VIP', 'Mua thường xuyên', 'Ưa cà phê', 'Sinh nhật T6'].map((t, i) => (
              <span key={t} style={{
                padding: '4px 10px', borderRadius: 999,
                background: i === 0 ? S.accent : S.paperDim,
                color: i === 0 ? '#fff' : S.ink,
                fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${i === 0 ? S.accent : S.inkFaint}`,
              }}>{t}</span>
            ))}
            <span style={{ padding: '4px 10px', border: `1.5px dashed ${S.inkFaint}`, borderRadius: 999, fontSize: 11, color: S.inkDim }}>+ {vi ? 'Thêm' : 'Add'}</span>
          </div>
        </SBox>

        {/* Purchase history */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              🧾 {vi ? 'Lịch sử mua' : 'Purchase history'}
            </div>
            <span style={{ fontSize: 11, color: S.accent, fontWeight: 700 }}>{vi ? 'Xem tất cả' : 'See all'} →</span>
          </div>
          {[
            { id: '#HD0892', d: '20/04', amt: '345K', n: '3 SP' },
            { id: '#HD0854', d: '12/04', amt: '1.2M', n: '8 SP' },
            { id: '#HD0812', d: '03/04', amt: '78K', n: '2 SP' },
          ].map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none', fontSize: 12 }}>
              <span style={{ fontFamily: Sketch.mono, fontWeight: 700 }}>{o.id}</span>
              <span style={{ color: S.inkDim }}>{o.d}</span>
              <span style={{ flex: 1, color: S.inkDim }}>{o.n}</span>
              <span style={{ fontWeight: 800, color: S.accent }}>{o.amt}</span>
            </div>
          ))}
        </SBox>

        {/* Notes */}
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📝 {vi ? 'Ghi chú' : 'Notes'}
          </div>
          <div style={{
            border: `1.5px solid ${S.inkFaint}`, borderRadius: 10, padding: 10,
            fontSize: 12, color: S.ink, minHeight: 60,
          }}>
            {vi
              ? 'Thích ship sau 18h · Thường mua cà phê G7 và Oreo · Sinh nhật: 15/06'
              : 'Prefers shipping after 6pm · Usually buys G7 coffee and Oreo'}
          </div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

// ─────────────── Order detail ───────────────
function OrderDetailScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SIcon name="chevron_right" size={22} dark={dark} style={{ transform: 'rotate(180deg)' }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: Sketch.mono }}>#HD0892</div>
          <div style={{ fontSize: 11, color: S.inkDim }}>20/04/2026 · 14:22</div>
        </div>
        <SIcon name="printer" size={20} dark={dark}/>
        <SIcon name="more" size={22} dark={dark}/>
      </div>

      {/* Status timeline */}
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>📍 {vi ? 'Trạng thái' : 'Status'}</span>
            <span style={{ padding: '3px 10px', borderRadius: 999, background: '#d4e4c4', color: '#5b7a5b', fontSize: 11, fontWeight: 800 }}>● {vi ? 'Đã giao' : 'Delivered'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, height: 2, background: S.inkFaint }}/>
            <div style={{ position: 'absolute', top: 10, left: 10, width: '100%', height: 2, background: S.accent }}/>
            {[vi ? 'Đặt' : 'Order', vi ? 'Thanh toán' : 'Paid', vi ? 'Đóng gói' : 'Packed', vi ? 'Giao' : 'Ship', vi ? 'Xong' : 'Done'].map((s, i) => (
              <div key={s} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: S.accent, color: '#fff',
                  border: `2px solid ${S.paper}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, margin: '0 auto',
                }}>✓</div>
                <div style={{ fontSize: 9, color: S.inkDim, marginTop: 3, fontWeight: 600 }}>{s}</div>
              </div>
            ))}
          </div>
        </SBox>
      </div>

      {/* Customer */}
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
          <SCircle size={40} dark={dark} fill={S.accentDim} style={{ borderColor: S.accent }}>
            <span style={{ color: S.accent, fontWeight: 800, fontSize: 14 }}>LA</span>
          </SCircle>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Nguyễn Thị Lan Anh</div>
            <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>0912 888 999 · VIP</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <SCircle size={32} dark={dark} fill={S.accentDim}><SIcon name="msg" size={14} color={S.accent}/></SCircle>
          </div>
        </SBox>
      </div>

      {/* Items */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, marginBottom: 6, textTransform: 'uppercase' }}>
          {vi ? 'Sản phẩm (3)' : 'Items (3)'}
        </div>
        <SBox dark={dark} style={{ padding: 0 }}>
          {[
            { n: 'Cà phê G7 (3 trong 1)', q: 2, p: 25000 },
            { n: 'Bánh Oreo 137g', q: 1, p: 28000 },
            { n: 'Coca-Cola lon 330ml', q: 6, p: 12000 },
          ].map((it, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              alignItems: 'center',
            }}>
              <SPlaceholder label="" w={40} h={40} dark={dark} style={{ padding: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{it.n}</div>
                <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>{(it.p/1000).toFixed(0)}K × {it.q}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{((it.p*it.q)/1000).toFixed(0)}K</div>
            </div>
          ))}
        </SBox>
      </div>

      {/* Summary */}
      <div style={{ padding: '0 12px 20px' }}>
        <SBox dark={dark}>
          <SumRow label={vi ? 'Tạm tính' : 'Subtotal'} value="150.000 ₫"/>
          <SumRow label={vi ? 'Giảm giá (VC-VIP10)' : 'Discount'} value="− 15.000 ₫" color="#c97a7a"/>
          <SumRow label={vi ? 'Phí ship' : 'Shipping'} value="20.000 ₫"/>
          <div style={{ borderTop: `1.5px dashed ${S.line}`, margin: '6px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>{vi ? 'TỔNG' : 'TOTAL'}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: S.accent }}>155.000 ₫</span>
          </div>
          <div style={{ fontSize: 11, color: S.inkDim, marginTop: 4, textAlign: 'right' }}>💳 {vi ? 'Chuyển khoản MB' : 'MB Bank transfer'}</div>
        </SBox>
      </div>
    </ScreenBody>
  );
}

function SumRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || '#1a1a1a' }}>{value}</span>
    </div>
  );
}

Object.assign(window, {
  ProductEditScreen, InventoryScreen, StaffEditScreen,
  CustomerEditScreen, OrderDetailScreen, FormField, ToggleRow,
});
