// List / overview screens for each management entity
// Products, Customers, Staff, Orders

// ─────────────────────────────────────────────
// Shared list shell — top bar + search + filter chips
// ─────────────────────────────────────────────
function ListHeader({ dark, vi, title, count, actionLabel, onAction }) {
  const S = useSketch(dark);
  return (
    <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <SIcon name="chevron_right" size={22} dark={dark} color={S.ink} style={{ transform: 'rotate(180deg)' }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>{count}</div>
      </div>
      <SIcon name="search" size={20} dark={dark}/>
      <SIcon name="filter" size={18} dark={dark}/>
    </div>
  );
}

function FilterChips({ dark, chips, active = 0 }) {
  const S = useSketch(dark);
  return (
    <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
      {chips.map((c, i) => (
        <div key={i} style={{
          padding: '5px 12px', borderRadius: 999, flexShrink: 0,
          border: `1.5px solid ${i === active ? S.accent : S.line}`,
          background: i === active ? S.accent : 'transparent',
          color: i === active ? '#fff' : S.ink,
          fontSize: 12, fontWeight: 600,
        }}>{c}</div>
      ))}
    </div>
  );
}

function SearchBar({ dark, placeholder, withScan = false }) {
  const S = useSketch(dark);
  return (
    <div style={{ padding: '0 12px 10px' }}>
      <SBox dark={dark} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <SIcon name="search" size={16} dark={dark}/>
        <span style={{ color: S.inkDim, fontSize: 13, flex: 1 }}>{placeholder}</span>
        {withScan && <SIcon name="qr" size={18} color={S.accent}/>}
      </SBox>
    </div>
  );
}

// FAB for creating a new item
function ListFab({ dark, label, bottom = 90 }) {
  const S = useSketch(dark);
  return (
    <div style={{
      position: 'absolute', right: 16, bottom,
      background: S.accent, color: '#fff',
      padding: '10px 16px', borderRadius: 999,
      display: 'flex', alignItems: 'center', gap: 6,
      border: `1.5px solid ${S.line}`,
      boxShadow: '2px 3px 0 rgba(0,0,0,0.12)',
      fontSize: 13, fontWeight: 700,
      zIndex: 5,
    }}>
      <SIcon name="plus" size={16} color="#fff"/>
      <span>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Products list
// ─────────────────────────────────────────────
function ProductsListScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const products = [
    { n: 'Cà phê G7 hòa tan 3in1 (22 gói)', sku: 'SP-0421', p: '55K', stk: 124, cat: vi ? 'Đồ uống' : 'Beverage', hot: true },
    { n: 'Coca-Cola lon 330ml', sku: 'SP-0305', p: '12K', stk: 88, cat: vi ? 'Đồ uống' : 'Beverage' },
    { n: 'Mì Hảo Hảo tôm chua cay', sku: 'SP-0118', p: '5K', stk: 42, cat: vi ? 'Thực phẩm' : 'Food' },
    { n: 'Bánh Oreo vị vani 137g', sku: 'SP-0609', p: '28K', stk: 16, cat: vi ? 'Bánh kẹo' : 'Snacks', low: true },
    { n: 'Sữa tươi Vinamilk không đường 1L', sku: 'SP-0712', p: '32K', stk: 55, cat: vi ? 'Sữa' : 'Dairy' },
    { n: 'Dầu ăn Neptune 1L', sku: 'SP-0803', p: '48K', stk: 8, cat: vi ? 'Gia vị' : 'Condiments', low: true },
    { n: 'Kem đánh răng P/S 180g', sku: 'SP-0915', p: '24K', stk: 31, cat: vi ? 'Chăm sóc cá nhân' : 'Personal' },
    { n: 'Giấy vệ sinh Bless You 10 cuộn', sku: 'SP-1022', p: '65K', stk: 0, cat: vi ? 'Gia dụng' : 'Household', oos: true },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Sản phẩm' : 'Products'}
        count={`1,284 ${vi ? 'SP · 12 sắp hết' : 'items · 12 low stock'}`}/>
      <SearchBar dark={dark} withScan placeholder={vi ? 'Tìm theo tên, SKU, barcode...' : 'Search by name, SKU, barcode...'}/>
      <FilterChips dark={dark} active={0} chips={vi
        ? ['Tất cả', 'Đồ uống', 'Thực phẩm', 'Bánh kẹo', 'Sữa', 'Gia dụng', 'Đang bán', 'Hết hàng']
        : ['All', 'Beverage', 'Food', 'Snacks', 'Dairy', 'Household', 'Active', 'Out of stock']}/>

      {/* Summary strip */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        {[
          { l: vi ? 'Tổng SP' : 'Total', v: '1,284', c: S.ink },
          { l: vi ? 'Đang bán' : 'Active', v: '1,210', c: '#4a9f4a' },
          { l: vi ? 'Sắp hết' : 'Low', v: '12', c: '#d97757' },
          { l: vi ? 'Hết hàng' : 'OOS', v: '62', c: '#c94a4a' },
        ].map((x, i) => (
          <SBox key={i} dark={dark} style={{ padding: '8px 6px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: x.c, fontFamily: Sketch.mono }}>{x.v}</div>
            <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{x.l}</div>
          </SBox>
        ))}
      </div>

      {/* Segment toggle list/grid */}
      <div style={{ padding: '0 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: S.inkDim }}>
          {vi ? 'Sắp xếp: Bán chạy' : 'Sort: Best seller'} ▾
        </div>
        <div style={{ display: 'flex', gap: 2, border: `1.5px solid ${S.line}`, borderRadius: 8, padding: 2 }}>
          <div style={{ padding: '2px 8px', borderRadius: 6, background: S.accent, color: '#fff', fontSize: 10, fontWeight: 700 }}>List</div>
          <div style={{ padding: '2px 8px', borderRadius: 6, color: S.inkDim, fontSize: 10, fontWeight: 700 }}>Grid</div>
        </div>
      </div>

      {/* Product list */}
      <div style={{ padding: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {products.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              opacity: p.oos ? 0.55 : 1,
            }}>
              <SPlaceholder label="" w={48} h={48} dark={dark} style={{ padding: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {p.hot && <span style={{ fontSize: 9, background: '#d97757', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>HOT</span>}
                  <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
                </div>
                <div style={{ fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 2 }}>
                  {p.sku} · {p.cat}
                </div>
                <div style={{ fontSize: 10.5, marginTop: 2, color: p.oos ? '#c94a4a' : (p.low ? '#d97757' : S.inkDim), fontWeight: p.oos || p.low ? 700 : 400 }}>
                  {p.oos ? (vi ? '● Hết hàng' : '● Out of stock') : (
                    <>{vi ? 'Tồn:' : 'Stock:'} <span style={{ fontFamily: Sketch.mono, fontWeight: 700 }}>{p.stk}</span></>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: S.accent, fontFamily: Sketch.mono, letterSpacing: -0.3 }}>{p.p}</div>
                <SIcon name="more" size={14} color={S.inkDim}/>
              </div>
            </div>
          ))}
        </SBox>
        <div style={{ padding: '10px 0 20px', textAlign: 'center', fontSize: 11, color: S.inkDim }}>
          {vi ? 'Tải thêm...' : 'Load more...'} · 1,276 {vi ? 'còn lại' : 'remaining'}
        </div>
      </div>

      <ListFab dark={dark} label={vi ? 'Thêm SP' : 'New item'} bottom={variant === 3 ? 100 : 90}/>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Customers list
// ─────────────────────────────────────────────
function CustomersListScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const customers = [
    { n: 'Nguyễn Thị Lan', phone: '0912 345 678', orders: 42, spent: '18.4M', tier: 'VIP', initial: 'L', c: '#d97757' },
    { n: 'Trần Văn Minh', phone: '0987 654 321', orders: 28, spent: '12.1M', tier: 'Gold', initial: 'M', c: '#d4a574' },
    { n: 'Lê Thị Hoa', phone: '0901 234 567', orders: 15, spent: '5.8M', tier: 'Silver', initial: 'H', c: '#8a8a8a' },
    { n: 'Phạm Đức Anh', phone: '0934 567 890', orders: 8, spent: '3.2M', tier: vi ? 'Thường' : 'Reg.', initial: 'A', c: '#7a9e7a' },
    { n: 'Vũ Thị Mai', phone: '0967 890 123', orders: 3, spent: '850K', tier: vi ? 'Mới' : 'New', initial: 'M', c: '#6b8cae' },
    { n: 'Hoàng Văn Tú', phone: '0945 678 901', orders: 52, spent: '24.7M', tier: 'VIP', initial: 'T', c: '#d97757' },
    { n: 'Đỗ Thị Hương', phone: '0923 456 789', orders: 19, spent: '7.3M', tier: 'Gold', initial: 'H', c: '#d4a574' },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Khách hàng' : 'Customers'}
        count={`892 ${vi ? 'khách · 24 VIP' : 'customers · 24 VIP'}`}/>
      <SearchBar dark={dark} placeholder={vi ? 'Tìm theo tên, SĐT, email...' : 'Search name, phone, email...'}/>

      {/* Hero stats card — dark accent */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 12 }}>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: 6 }}>
            {vi ? 'TỔNG QUAN KHÁCH HÀNG' : 'CUSTOMER OVERVIEW'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { l: vi ? 'Tổng chi tiêu' : 'Total spend', v: '342M' },
              { l: vi ? 'TB/khách' : 'Avg/cust', v: '383K' },
              { l: vi ? 'Mới tháng này' : 'New this mo.', v: '+48' },
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
        ? ['Tất cả', 'VIP', 'Gold', 'Silver', 'Thường', 'Mới', 'Có công nợ']
        : ['All', 'VIP', 'Gold', 'Silver', 'Regular', 'New', 'With debt']}/>

      <div style={{ padding: '0 12px 8px', fontSize: 11, color: S.inkDim }}>
        {vi ? 'Sắp xếp: Chi tiêu cao nhất ▾' : 'Sort: Top spender ▾'}
      </div>

      {/* Customer list */}
      <div style={{ padding: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {customers.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: c.c + '33',
                border: `1.5px solid ${c.c}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, color: c.c,
                flexShrink: 0,
              }}>{c.initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.n}</div>
                  <span style={{
                    fontSize: 8.5, padding: '1px 5px', borderRadius: 3,
                    background: c.c, color: '#fff', fontWeight: 800, letterSpacing: 0.3,
                  }}>{c.tier}</span>
                </div>
                <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 2 }}>{c.phone}</div>
                <div style={{ fontSize: 10, color: S.inkDim, marginTop: 1 }}>
                  {c.orders} {vi ? 'đơn' : 'orders'} · <span style={{ color: S.accent, fontWeight: 700 }}>{c.spent}</span>
                </div>
              </div>
              <SIcon name="chevron_right" size={14} color={S.inkFaint}/>
            </div>
          ))}
        </SBox>
        <div style={{ padding: '10px 0 20px', textAlign: 'center', fontSize: 11, color: S.inkDim }}>
          {vi ? 'Tải thêm...' : 'Load more...'}
        </div>
      </div>

      <ListFab dark={dark} label={vi ? 'Thêm KH' : 'New customer'} bottom={variant === 3 ? 100 : 90}/>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Staff list
// ─────────────────────────────────────────────
function StaffListScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const staff = [
    { n: 'Nguyễn Thị Mai', role: vi ? 'Chủ cửa hàng' : 'Owner', branch: vi ? 'Tất cả CN' : 'All branches', status: 'online', initial: 'M', c: '#008ecc', shift: vi ? 'Toàn thời gian' : 'Full-time' },
    { n: 'Trần Văn Hùng', role: vi ? 'Quản lý' : 'Manager', branch: vi ? 'CN Quận 1' : 'District 1', status: 'online', initial: 'H', c: '#7a9e7a', shift: vi ? 'Ca sáng' : 'Morning' },
    { n: 'Lê Minh Phúc', role: vi ? 'Thu ngân' : 'Cashier', branch: vi ? 'CN Quận 1' : 'District 1', status: 'online', initial: 'P', c: '#d4a574', shift: vi ? 'Ca sáng' : 'Morning' },
    { n: 'Phạm Thị Linh', role: vi ? 'Thu ngân' : 'Cashier', branch: vi ? 'CN Quận 3' : 'District 3', status: 'offline', initial: 'L', c: '#d4a574', shift: vi ? 'Ca chiều' : 'Afternoon' },
    { n: 'Vũ Hoàng Nam', role: vi ? 'Bán hàng' : 'Sales', branch: vi ? 'CN Quận 1' : 'District 1', status: 'break', initial: 'N', c: '#8a8a6a', shift: vi ? 'Ca sáng' : 'Morning' },
    { n: 'Đặng Thu Hà', role: vi ? 'Kho' : 'Warehouse', branch: vi ? 'Kho trung tâm' : 'Central WH', status: 'online', initial: 'H', c: '#b08968', shift: vi ? 'Toàn thời gian' : 'Full-time' },
    { n: 'Bùi Đức Anh', role: vi ? 'Bán hàng' : 'Sales', branch: vi ? 'CN Quận 3' : 'District 3', status: 'offline', initial: 'A', c: '#8a8a6a', shift: vi ? 'Ca chiều' : 'Afternoon' },
  ];
  const statusColor = { online: '#4a9f4a', offline: '#8a8a8a', break: '#d97757' };
  const statusLabel = { online: vi ? 'Đang làm' : 'On duty', offline: vi ? 'Nghỉ' : 'Off', break: vi ? 'Giải lao' : 'Break' };

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Nhân viên' : 'Staff'}
        count={`12 ${vi ? 'nhân viên · 8 đang làm' : 'staff · 8 on duty'}`}/>
      <SearchBar dark={dark} placeholder={vi ? 'Tìm theo tên, chức vụ...' : 'Search name, role...'}/>

      {/* Today's attendance card */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>📅 {vi ? 'Chấm công hôm nay' : 'Attendance today'}</div>
            <span style={{ fontSize: 11, color: S.accent, fontWeight: 700 }}>{vi ? 'Chi tiết →' : 'Detail →'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { l: vi ? 'Đã chấm' : 'Checked in', v: '8', c: '#4a9f4a' },
              { l: vi ? 'Chưa chấm' : 'Not yet', v: '2', c: '#d97757' },
              { l: vi ? 'Nghỉ' : 'Off', v: '2', c: '#8a8a8a' },
              { l: vi ? 'Đi muộn' : 'Late', v: '1', c: '#c94a4a' },
            ].map((x, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: x.c, fontFamily: Sketch.mono }}>{x.v}</div>
                <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{x.l}</div>
              </div>
            ))}
          </div>
        </SBox>
      </div>

      <FilterChips dark={dark} active={0} chips={vi
        ? ['Tất cả', 'Đang làm', 'Quản lý', 'Thu ngân', 'Bán hàng', 'Kho', 'CN Q1', 'CN Q3']
        : ['All', 'On duty', 'Manager', 'Cashier', 'Sales', 'WH', 'D1', 'D3']}/>

      <div style={{ padding: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {staff.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: s.c + '33',
                  border: `1.5px solid ${s.c}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, color: s.c,
                }}>{s.initial}</div>
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 11, height: 11, borderRadius: '50%',
                  background: statusColor[s.status],
                  border: `2px solid ${S.paper}`,
                }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.n}</div>
                <div style={{ fontSize: 10.5, color: S.inkDim, marginTop: 2 }}>
                  {s.role} · <span style={{ fontFamily: Sketch.mono }}>{s.branch}</span>
                </div>
                <div style={{ fontSize: 10, color: statusColor[s.status], fontWeight: 700, marginTop: 1 }}>
                  ● {statusLabel[s.status]} · {s.shift}
                </div>
              </div>
              <SIcon name="more" size={14} color={S.inkFaint}/>
            </div>
          ))}
        </SBox>
      </div>

      <ListFab dark={dark} label={vi ? 'Thêm NV' : 'New staff'} bottom={variant === 3 ? 100 : 90}/>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// Orders list
// ─────────────────────────────────────────────
function OrdersListScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const orders = [
    { id: '#DH-2412-0038', cust: 'Nguyễn Thị Lan', items: 4, total: '524K', status: 'pending', channel: 'Shopee', time: '10:42', c: '#ee4d2d' },
    { id: '#DH-2412-0037', cust: 'Khách lẻ', items: 2, total: '87K', status: 'done', channel: 'POS', time: '10:28', c: '#008ecc' },
    { id: '#DH-2412-0036', cust: 'Trần Văn Minh', items: 8, total: '1.2M', status: 'shipping', channel: 'TikTok Shop', time: '10:15', c: '#1a1a1a' },
    { id: '#DH-2412-0035', cust: 'Lê Thị Hoa', items: 3, total: '245K', status: 'packing', channel: 'Lazada', time: '09:58', c: '#0f146d' },
    { id: '#DH-2412-0034', cust: 'Khách lẻ', items: 1, total: '32K', status: 'done', channel: 'POS', time: '09:44', c: '#008ecc' },
    { id: '#DH-2412-0033', cust: 'Phạm Đức Anh', items: 5, total: '680K', status: 'pending', channel: 'Shopee', time: '09:30', c: '#ee4d2d' },
    { id: '#DH-2412-0032', cust: 'Vũ Thị Mai', items: 2, total: '156K', status: 'cancelled', channel: 'Lazada', time: '09:12', c: '#0f146d' },
    { id: '#DH-2412-0031', cust: 'Hoàng Văn Tú', items: 12, total: '2.1M', status: 'done', channel: 'POS', time: '08:55', c: '#008ecc' },
  ];
  const statusMeta = {
    pending: { l: vi ? 'Chờ xử lý' : 'Pending', c: '#d97757', bg: '#d9775722' },
    packing: { l: vi ? 'Đóng gói' : 'Packing', c: '#6b8cae', bg: '#6b8cae22' },
    shipping: { l: vi ? 'Giao hàng' : 'Shipping', c: '#8a6a9e', bg: '#8a6a9e22' },
    done: { l: vi ? 'Hoàn tất' : 'Done', c: '#4a9f4a', bg: '#4a9f4a22' },
    cancelled: { l: vi ? 'Hủy' : 'Cancelled', c: '#8a8a8a', bg: '#8a8a8a22' },
  };

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <ListHeader dark={dark} vi={vi}
        title={vi ? 'Đơn hàng' : 'Orders'}
        count={`38 ${vi ? 'đơn hôm nay · 8 chờ xử lý' : 'today · 8 pending'}`}/>
      <SearchBar dark={dark} withScan placeholder={vi ? 'Tìm mã đơn, khách, SP...' : 'Search order ID, customer...'}/>

      {/* Today strip */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 8 }}>
        {[
          { l: vi ? 'Tổng đơn' : 'Total', v: '38', c: S.ink },
          { l: vi ? 'Chờ xử lý' : 'Pending', v: '8', c: '#d97757' },
          { l: vi ? 'Đang giao' : 'Shipping', v: '12', c: '#8a6a9e' },
          { l: vi ? 'Doanh thu' : 'Revenue', v: '8.4M', c: S.accent },
        ].map((x, i) => (
          <SBox key={i} dark={dark} style={{ padding: '8px 6px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: x.c, fontFamily: Sketch.mono, letterSpacing: -0.3 }}>{x.v}</div>
            <div style={{ fontSize: 9.5, color: S.inkDim, marginTop: 1 }}>{x.l}</div>
          </SBox>
        ))}
      </div>

      {/* Status tabs */}
      <FilterChips dark={dark} active={1} chips={vi
        ? ['Tất cả (38)', 'Chờ xử lý (8)', 'Đóng gói (6)', 'Đang giao (12)', 'Hoàn tất', 'Hủy']
        : ['All (38)', 'Pending (8)', 'Packing (6)', 'Shipping (12)', 'Done', 'Cancelled']}/>

      {/* Channel filter */}
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        <div style={{ fontSize: 10.5, color: S.inkDim, alignSelf: 'center', flexShrink: 0 }}>
          {vi ? 'Kênh:' : 'Channel:'}
        </div>
        {['Tất cả', 'POS', 'Shopee', 'Lazada', 'TikTok', 'Tiki'].map((c, i) => (
          <div key={i} style={{
            padding: '3px 10px', borderRadius: 6, flexShrink: 0,
            border: `1px solid ${S.inkFaint}`,
            fontSize: 10.5, color: S.inkDim,
          }}>{c}</div>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ padding: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {orders.map((o, i) => {
            const st = statusMeta[o.status];
            return (
              <div key={i} style={{
                padding: '10px 12px',
                borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
                opacity: o.status === 'cancelled' ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, fontFamily: Sketch.mono, color: S.ink }}>{o.id}</div>
                  <div style={{
                    padding: '2px 7px', borderRadius: 4,
                    background: st.bg, color: st.c,
                    fontSize: 9.5, fontWeight: 700, letterSpacing: 0.2,
                  }}>{st.l}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 10, color: S.inkDim, fontFamily: Sketch.mono }}>{o.time}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: o.c,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#fff', fontWeight: 800,
                    flexShrink: 0,
                  }}>{o.channel[0]}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.cust}</div>
                  <div style={{ fontSize: 10, color: S.inkDim }}>· {o.channel}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 10.5, color: S.inkDim }}>
                    {o.items} {vi ? 'sản phẩm' : 'items'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: S.accent, fontFamily: Sketch.mono, letterSpacing: -0.3 }}>{o.total}</div>
                </div>
              </div>
            );
          })}
        </SBox>
        <div style={{ padding: '10px 0 20px', textAlign: 'center', fontSize: 11, color: S.inkDim }}>
          {vi ? 'Tải thêm đơn...' : 'Load more...'}
        </div>
      </div>

      <ListFab dark={dark} label={vi ? 'Tạo đơn' : 'New order'} bottom={variant === 3 ? 100 : 90}/>
    </ScreenBody>
  );
}

Object.assign(window, {
  ProductsListScreen, CustomersListScreen, StaffListScreen, OrdersListScreen,
  ListHeader, FilterChips, SearchBar, ListFab,
});
