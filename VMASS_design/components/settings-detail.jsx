// Settings detail screens — Roles, Profile, Stores, Receipt template, Scanner, POS config

// Reusable settings header
function SetHeader({ title, subtitle, dark, lang, onSave, saveLabel }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <SIcon name="chevron_right" size={22} dark={dark} style={{ transform: 'rotate(180deg)' }}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: S.inkDim }}>{subtitle}</div>}
      </div>
      {onSave !== false && (
        <div style={{ padding: '6px 14px', borderRadius: 999, background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          {saveLabel || (vi ? 'Lưu' : 'Save')}
        </div>
      )}
    </div>
  );
}

function SetGroup({ title, children, dark }) {
  const S = useSketch(dark);
  return (
    <div style={{ marginBottom: 10 }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: S.inkDim,
          padding: '0 20px 6px', textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</div>
      )}
      <div style={{ margin: '0 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {children}
        </SBox>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 1. Phân quyền (Roles & Permissions)
// ─────────────────────────────────────────────
function RolesScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';

  const roles = [
    { n: vi ? 'Chủ cửa hàng' : 'Owner', c: '#008ecc', users: 1, perm: vi ? 'Toàn quyền' : 'Full access', locked: true },
    { n: vi ? 'Quản lý' : 'Manager', c: '#7a9e7a', users: 2, perm: vi ? '12/14 quyền' : '12/14 perms' },
    { n: vi ? 'Thu ngân' : 'Cashier', c: '#d4a574', users: 6, perm: vi ? '6/14 quyền' : '6/14 perms' },
    { n: vi ? 'Kho' : 'Warehouse', c: '#b08968', users: 2, perm: vi ? '4/14 quyền' : '4/14 perms' },
    { n: vi ? 'Kế toán' : 'Accountant', c: '#8a6a9e', users: 1, perm: vi ? '7/14 quyền' : '7/14 perms' },
  ];

  const permGroups = [
    {
      g: vi ? 'Bán hàng' : 'Sales',
      items: [
        { l: vi ? 'Mở ca / Đóng ca' : 'Open / Close shift', on: true },
        { l: vi ? 'Tạo đơn POS' : 'Create POS order', on: true },
        { l: vi ? 'Áp khuyến mãi tay' : 'Apply manual discount', on: false, hot: true },
        { l: vi ? 'Hủy đơn' : 'Void order', on: false, hot: true },
      ],
    },
    {
      g: vi ? 'Sản phẩm & Tồn kho' : 'Products & Stock',
      items: [
        { l: vi ? 'Xem sản phẩm' : 'View products', on: true },
        { l: vi ? 'Sửa giá' : 'Edit price', on: false, hot: true },
        { l: vi ? 'Điều chỉnh tồn' : 'Adjust stock', on: true },
      ],
    },
    {
      g: vi ? 'Tài chính' : 'Financial',
      items: [
        { l: vi ? 'Xem doanh thu' : 'View revenue', on: false },
        { l: vi ? 'Ghi sổ thu/chi' : 'Record income/expense', on: false },
        { l: vi ? 'Xuất báo cáo' : 'Export reports', on: false },
      ],
    },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <SetHeader title={vi ? 'Phân quyền' : 'Roles & permissions'}
        subtitle={vi ? '5 vai trò · 12 nhân viên' : '5 roles · 12 staff'} dark={dark} lang={lang}/>

      {/* Roles list */}
      <div style={{ padding: '0 12px 10px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px dashed ${S.inkFaint}`,
            display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>
              👥 {vi ? 'Vai trò' : 'Roles'} <span style={{ color: S.inkDim, fontWeight: 400 }}>· {roles.length}</span>
            </div>
            <div style={{ fontSize: 11, color: S.accent, fontWeight: 700,
              border: `1.5px solid ${S.accent}`, borderRadius: 999, padding: '4px 10px' }}>
              + {vi ? 'Thêm vai trò' : 'New role'}
            </div>
          </div>
          {roles.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px', borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
              background: i === 1 ? S.accentDim + '40' : 'transparent' }}>
              <div style={{ width: 6, height: 36, borderRadius: 3, background: r.c, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {r.n} {r.locked && <span style={{ fontSize: 10 }}>🔒</span>}
                </div>
                <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>
                  {r.users} {vi ? 'người' : 'users'} · {r.perm}
                </div>
              </div>
              <SIcon name="chevron_right" size={14} color={S.inkFaint}/>
            </div>
          ))}
        </SBox>
      </div>

      {/* Permission matrix for selected role */}
      <div style={{ padding: '6px 20px 4px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🔧 {vi ? 'Quyền của' : 'Permissions of'} «{vi ? 'Quản lý' : 'Manager'}»</span>
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {permGroups.map((pg, gi) => (
          <SBox key={gi} dark={dark} style={{ padding: 0 }}>
            <div style={{ padding: '10px 12px', borderBottom: `1px dashed ${S.inkFaint}`,
              fontSize: 12, fontWeight: 700, color: S.ink, background: S.paperDim }}>
              {pg.g}
            </div>
            {pg.items.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px',
                borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none' }}>
                <div style={{ flex: 1, fontSize: 12.5 }}>
                  {p.l}
                  {p.hot && <span style={{ fontSize: 9, marginLeft: 6, padding: '1px 5px',
                    background: '#c97a7a', color: '#fff', borderRadius: 4, fontWeight: 700 }}>
                    {vi ? 'NHẠY CẢM' : 'SENSITIVE'}
                  </span>}
                </div>
                <div style={{ width: 40, height: 22, borderRadius: 999,
                  background: p.on ? S.accent : S.inkFaint,
                  border: `1.5px solid ${S.line}`, position: 'relative' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', border: `1.5px solid ${S.line}`,
                    position: 'absolute', top: 1, left: p.on ? 20 : 2 }}/>
                </div>
              </div>
            ))}
          </SBox>
        ))}
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// 2. Thông tin cá nhân (Profile)
// ─────────────────────────────────────────────
function ProfileScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <SetHeader title={vi ? 'Thông tin cá nhân' : 'Profile'} dark={dark} lang={lang}/>

      {/* Avatar */}
      <div style={{ padding: '10px 12px 14px', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <SCircle size={88} dark={dark} fill={S.accentDim} style={{ borderColor: S.accent, borderWidth: 2.5 }}>
            <span style={{ color: S.accent, fontWeight: 800, fontSize: 32 }}>MN</span>
          </SCircle>
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: '50%',
            background: S.accent, border: `2.5px solid ${S.paper}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name="camera" size={14} color="#fff"/>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>Minh Nguyễn</div>
        <div style={{ fontSize: 11, color: S.accent, fontFamily: Sketch.mono, fontWeight: 700, marginTop: 2 }}>
          ⭐ {vi ? 'Chủ cửa hàng · Gói PRO' : 'Owner · PRO'}
        </div>
      </div>

      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            👤 {vi ? 'Thông tin cơ bản' : 'Basic info'}
          </div>
          <FormField label={vi ? 'Họ và tên' : 'Full name'} value="Nguyễn Văn Minh" dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Ngày sinh' : 'Date of birth'} value="15/03/1988" mono dark={dark}/>
            <FormField label={vi ? 'Giới tính' : 'Gender'} value={vi ? 'Nam' : 'Male'} dropdown dark={dark}/>
          </div>
          <FormField label={vi ? 'Số CCCD' : 'ID number'} value="079088xxxxxxx" mono dark={dark}/>
        </SBox>

        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            📞 {vi ? 'Liên hệ' : 'Contact'}
          </div>
          <FormField label="Email" value="minh@vmass.vn" mono dark={dark}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <FormField label={vi ? 'Điện thoại' : 'Phone'} value="0903 456 789" mono dark={dark}/>
            <FormField label="Zalo" value="@minhnguyen" dark={dark}/>
          </div>
          <FormField label={vi ? 'Địa chỉ' : 'Address'} value="123 Nguyễn Huệ, Q.1, TP.HCM" dark={dark}/>
        </SBox>

        <SBox dark={dark}>
          <div style={{ fontSize: 12, fontWeight: 700, color: S.inkDim, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            🔒 {vi ? 'Bảo mật' : 'Security'}
          </div>
          <ToggleRow label={vi ? 'Xác thực 2 lớp' : '2-factor authentication'} on={true} dark={dark}/>
          <ToggleRow label={vi ? 'Đăng nhập bằng vân tay' : 'Fingerprint login'} on={true} dark={dark}/>
          <ToggleRow label={vi ? 'Khóa khi không sử dụng 5 phút' : 'Auto-lock after 5min'} on={false} dark={dark} last/>
        </SBox>

        <div style={{ padding: '12px 14px', textAlign: 'center', border: `1.5px solid ${S.line}`,
          borderRadius: 14, background: S.paperDim, fontSize: 13, fontWeight: 700, color: S.ink, margin: '0 0' }}>
          🔑 {vi ? 'Đổi mật khẩu' : 'Change password'}
        </div>
        <div style={{ padding: '12px 14px', textAlign: 'center', border: `1.5px solid #c97a7a`,
          borderRadius: 14, background: '#c97a7a22', fontSize: 13, fontWeight: 700, color: '#c94a4a' }}>
          ⎋ {vi ? 'Đăng xuất' : 'Sign out'}
        </div>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// 3. Cửa hàng của tôi (My stores)
// ─────────────────────────────────────────────
function StoresScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  const stores = [
    { n: vi ? 'CH Q1 — Nguyễn Huệ' : 'Q1 — Nguyen Hue',
      addr: vi ? '123 Nguyễn Huệ, Q.1, TP.HCM' : '123 Nguyen Hue, D1, HCMC',
      staff: 8, sales: '42M', primary: true, open: true },
    { n: vi ? 'CH Q7 — Phú Mỹ Hưng' : 'Q7 — Phu My Hung',
      addr: vi ? '88 Tôn Dật Tiên, Q.7, TP.HCM' : '88 Ton Dat Tien, D7, HCMC',
      staff: 4, sales: '28M', open: true },
  ];
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <SetHeader title={vi ? 'Cửa hàng của tôi' : 'My stores'}
        subtitle={vi ? '2 cửa hàng đang hoạt động' : '2 active stores'} dark={dark} lang={lang} onSave={false}/>

      {/* Business profile card */}
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 14, borderColor: S.accent }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
              border: '2px dashed rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: Sketch.mono }}>VM</div>
            <div style={{ flex: 1, color: '#fff' }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>HKD Minh Nguyễn</div>
              <div style={{ fontSize: 11, opacity: 0.85, fontFamily: Sketch.mono }}>MST: 0123456789-001</div>
              <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2 }}>{vi ? 'Hộ kinh doanh · Đa ngành hàng' : 'Sole proprietor · Multi-category'}</div>
            </div>
            <SIcon name="chevron_right" size={16} color="#fff"/>
          </div>
        </SBox>
      </div>

      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex' }}>
        <span style={{ flex: 1 }}>🏪 {vi ? 'Chi nhánh' : 'Branches'}</span>
        <span style={{ color: S.accent }}>+ {vi ? 'Thêm chi nhánh' : 'Add'}</span>
      </div>

      <div style={{ padding: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stores.map((s, i) => (
          <SBox key={i} dark={dark} style={{
            padding: 0, overflow: 'hidden',
            borderColor: s.primary ? S.accent : S.line,
          }}>
            {/* Storefront image */}
            <div style={{ height: 80, background: S.paperDim, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderBottom: `1.5px dashed ${S.inkFaint}`,
              fontSize: 11, color: S.inkFaint, fontStyle: 'italic' }}>
              [{vi ? 'ảnh cửa hàng' : 'storefront photo'}]
              {s.primary && (
                <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px',
                  background: S.accent, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6 }}>
                  ⭐ {vi ? 'CHÍNH' : 'PRIMARY'}
                </div>
              )}
              <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px',
                background: s.open ? '#4a9f4a' : '#888', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6 }}>
                ● {s.open ? (vi ? 'Đang mở' : 'Open') : (vi ? 'Đóng' : 'Closed')}
              </div>
            </div>

            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: S.inkDim, marginTop: 2 }}>📍 {s.addr}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: S.inkDim }}>👥 <b style={{ color: S.ink, fontFamily: Sketch.mono }}>{s.staff}</b> {vi ? 'NV' : 'staff'}</div>
                <div style={{ fontSize: 11, color: S.inkDim }}>💰 <b style={{ color: S.accent, fontFamily: Sketch.mono }}>{s.sales}</b> {vi ? '/tháng' : '/mo'}</div>
                <div style={{ flex: 1 }}/>
                <div style={{ fontSize: 11, color: S.accent, fontWeight: 700 }}>{vi ? 'Cài đặt' : 'Settings'} →</div>
              </div>
            </div>
          </SBox>
        ))}
      </div>

      {/* Operating hours */}
      <SetGroup title={vi ? '⏰ Giờ mở cửa mặc định' : '⏰ Default hours'} dark={dark}>
        {[
          { d: vi ? 'Thứ 2 - Thứ 6' : 'Mon - Fri', h: '07:00 — 22:00', on: true },
          { d: vi ? 'Thứ 7' : 'Saturday', h: '08:00 — 23:00', on: true },
          { d: vi ? 'Chủ nhật' : 'Sunday', h: vi ? 'Đóng cửa' : 'Closed', on: false, last: true },
        ].map((d, i) => (
          <div key={i} style={{ padding: '11px 14px', display: 'flex', alignItems: 'center',
            borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none' }}>
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{d.d}</span>
            <span style={{ fontSize: 12, color: d.on ? S.ink : S.inkDim,
              fontFamily: Sketch.mono, fontWeight: 700 }}>{d.h}</span>
            <SIcon name="chevron_right" size={14} color={S.inkFaint} style={{ marginLeft: 8 }}/>
          </div>
        ))}
      </SetGroup>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// 4. Mẫu hóa đơn bán hàng (Receipt template)
// ─────────────────────────────────────────────
function ReceiptTemplateScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <SetHeader title={vi ? 'Mẫu hóa đơn' : 'Receipt template'} dark={dark} lang={lang}/>

      {/* Live preview */}
      <div style={{ padding: '4px 12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.inkDim,
          padding: '0 8px 6px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          📄 {vi ? 'Xem trước hóa đơn' : 'Live preview'}
        </div>
        {/* Receipt mock */}
        <div style={{ background: '#fefdf8', border: `1.5px solid ${S.line}`, borderRadius: 14,
          padding: '16px 14px', fontFamily: Sketch.mono, color: '#1a1a1a',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'relative' }}>
          {/* Tear edge */}
          <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 6,
            background: 'repeating-linear-gradient(90deg, #fefdf8 0 6px, transparent 6px 12px)' }}/>

          <div style={{ textAlign: 'center', borderBottom: '1px dashed #888', paddingBottom: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, margin: '0 auto 4px', borderRadius: 8,
              border: '2px dashed #888', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800 }}>VM</div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>HKD MINH NGUYỄN</div>
            <div style={{ fontSize: 9 }}>123 Nguyễn Huệ, Q.1, TP.HCM</div>
            <div style={{ fontSize: 9 }}>SĐT: 0903.456.789 · MST: 0123456789</div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, textAlign: 'center', letterSpacing: 1, marginBottom: 6 }}>
            HÓA ĐƠN BÁN HÀNG
          </div>
          <div style={{ fontSize: 9, display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Số: HD-25120842</span><span>12/12/25 14:23</span>
          </div>

          <div style={{ borderTop: '1px dashed #888', borderBottom: '1px dashed #888', padding: '6px 0' }}>
            <div style={{ display: 'flex', fontSize: 9, fontWeight: 700, marginBottom: 4 }}>
              <span style={{ flex: 1 }}>SP</span>
              <span style={{ width: 28, textAlign: 'right' }}>SL</span>
              <span style={{ width: 50, textAlign: 'right' }}>T.TIỀN</span>
            </div>
            {[
              { n: 'Cà phê G7 3in1', q: 2, t: '50.000' },
              { n: 'Mì Hảo Hảo tôm', q: 5, t: '22.500' },
              { n: 'Sữa TH 1L', q: 1, t: '32.000' },
            ].map((it, i) => (
              <div key={i} style={{ display: 'flex', fontSize: 9.5, padding: '2px 0' }}>
                <span style={{ flex: 1 }}>{it.n}</span>
                <span style={{ width: 28, textAlign: 'right' }}>{it.q}</span>
                <span style={{ width: 50, textAlign: 'right' }}>{it.t}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, padding: '6px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tạm tính:</span><span>104.500₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Giảm (DRINK20):</span><span>-10.000₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: 12, fontWeight: 800, borderTop: '1px solid #1a1a1a', marginTop: 4, paddingTop: 4 }}>
              <span>TỔNG:</span><span>94.500₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>Khách trả (TM):</span><span>100.000₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tiền thừa:</span><span>5.500₫</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #888', paddingTop: 8, textAlign: 'center', fontSize: 9 }}>
            <div style={{ width: 60, height: 60, margin: '0 auto 4px', border: '1.5px solid #1a1a1a',
              background: 'repeating-linear-gradient(45deg, #1a1a1a 0 2px, #fefdf8 2px 4px)' }}/>
            <div style={{ fontWeight: 700 }}>Cảm ơn quý khách! ❤</div>
            <div>Hotline CSKH: 1900.6868</div>
            <div style={{ fontSize: 8, color: '#888', marginTop: 4 }}>NV: Linh · Ca sáng</div>
          </div>
        </div>
      </div>

      {/* Template chooser */}
      <SetGroup title={vi ? '🎨 Chọn mẫu' : '🎨 Choose template'} dark={dark}>
        {[
          { n: vi ? 'Tối giản (đang dùng)' : 'Minimal (current)', d: vi ? 'Mã QR + logo nhỏ' : 'QR + small logo', sel: true },
          { n: vi ? 'Cổ điển' : 'Classic', d: vi ? 'Khung viền · text đậm' : 'Bordered · bold text' },
          { n: vi ? 'Thương hiệu nổi bật' : 'Brand-focused', d: vi ? 'Logo lớn · banner màu' : 'Big logo · color banner' },
          { n: vi ? 'Dài cho nhà hàng' : 'Long for restaurants', d: vi ? 'Bàn / món / ghi chú' : 'Table / dish / notes', last: true },
        ].map((t, i) => (
          <div key={i} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
            borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
            background: t.sel ? S.accentDim + '40' : 'transparent' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%',
              border: `2px solid ${t.sel ? S.accent : S.line}`,
              background: t.sel ? S.accent : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0 }}>
              {t.sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }}/>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t.n}</div>
              <div style={{ fontSize: 11, color: S.inkDim, marginTop: 1 }}>{t.d}</div>
            </div>
            <div style={{ width: 36, height: 50, border: `1.5px solid ${S.inkFaint}`, borderRadius: 4,
              background: '#fefdf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, color: S.inkFaint, fontFamily: Sketch.mono }}>mini</div>
          </div>
        ))}
      </SetGroup>

      {/* Customize */}
      <SetGroup title={vi ? '⚙️ Tuỳ chỉnh' : '⚙️ Customize'} dark={dark}>
        <ToggleRow label={vi ? 'In logo cửa hàng' : 'Print store logo'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'In mã QR thanh toán' : 'Print QR payment code'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'In tên nhân viên / ca' : 'Print staff / shift'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'In thông tin khách hàng' : 'Print customer info'} on={false} dark={dark}/>
        <ToggleRow label={vi ? 'In số điểm tích luỹ' : 'Print loyalty points'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'In 2 liên (KH + nội bộ)' : 'Print 2 copies (cust + internal)'} on={false} dark={dark} last/>
      </SetGroup>

      <div style={{ padding: '0 12px 16px' }}>
        <FormField label={vi ? 'Lời cảm ơn cuối hóa đơn' : 'Footer thank-you message'}
          value="Cảm ơn quý khách! ❤ — Hotline CSKH: 1900.6868" dark={dark}/>
      </div>

      {/* Test print */}
      <div style={{ padding: '0 12px 20px', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: '12px', textAlign: 'center', border: `1.5px solid ${S.line}`,
          borderRadius: 14, fontSize: 13, fontWeight: 700, background: S.paperDim }}>
          <SIcon name="printer" size={16} dark={dark} style={{ verticalAlign: 'middle', marginRight: 6 }}/>
          {vi ? 'In thử' : 'Test print'}
        </div>
        <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: 14,
          background: S.accent, color: '#fff', fontSize: 13, fontWeight: 700 }}>
          ✓ {vi ? 'Áp dụng' : 'Apply'}
        </div>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// 5. Máy quét mã vạch (Scanner config)
// ─────────────────────────────────────────────
function ScannerConfigScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <SetHeader title={vi ? 'Máy quét mã vạch' : 'Barcode scanner'} dark={dark} lang={lang} onSave={false}/>

      {/* Active device hero */}
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} fill={S.accent} style={{ padding: 16, borderColor: S.accent }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
              border: '2px dashed rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name="qr" size={26} color="#fff"/>
            </div>
            <div style={{ flex: 1, color: '#fff' }}>
              <div style={{ fontSize: 10.5, opacity: 0.85, fontWeight: 600 }}>{vi ? 'ĐANG SỬ DỤNG' : 'CURRENTLY USING'}</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{vi ? 'Camera điện thoại' : 'Phone camera'}</div>
              <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 1 }}>iPhone · {vi ? 'Camera sau' : 'Rear cam'} · 12MP</div>
            </div>
            <div style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.7)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              ● {vi ? 'Sẵn sàng' : 'Ready'}
            </div>
          </div>
        </SBox>
      </div>

      {/* Available devices */}
      <SetGroup title={vi ? '📡 Thiết bị quét' : '📡 Scanner devices'} dark={dark}>
        {[
          { i: 'qr', n: vi ? 'Camera điện thoại' : 'Phone camera', d: vi ? 'Tích hợp · miễn phí' : 'Built-in · free', sel: true, st: 'connected' },
          { i: 'qr', n: 'Honeywell Voyager 1450g', d: 'USB · 1D + 2D', st: 'connected' },
          { i: 'qr', n: 'Symbol DS2208', d: vi ? 'Bluetooth · không kết nối' : 'Bluetooth · not connected', st: 'off' },
          { i: 'qr', n: vi ? 'Tìm thiết bị mới...' : 'Search new device...', plus: true, last: true },
        ].map((d, i) => (
          <div key={i} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
            borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none',
            background: d.sel ? S.accentDim + '40' : 'transparent' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10,
              background: d.plus ? 'transparent' : S.paperDim,
              border: d.plus ? `1.5px dashed ${S.line}` : `1.5px solid ${S.inkFaint}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SIcon name={d.plus ? 'plus' : d.i} size={15} color={d.plus ? S.accent : (d.sel ? S.accent : S.ink)}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: d.plus ? S.accent : S.ink }}>{d.n}</div>
              {d.d && <div style={{ fontSize: 10.5, color: S.inkDim, marginTop: 1 }}>{d.d}</div>}
            </div>
            {d.st === 'connected' && <span style={{ fontSize: 10, color: '#4a9f4a', fontWeight: 700 }}>● {vi ? 'KẾT NỐI' : 'ONLINE'}</span>}
            {d.st === 'off' && <span style={{ fontSize: 10, color: S.inkFaint, fontWeight: 700 }}>○ OFF</span>}
            {!d.plus && d.sel && <SIcon name="check" size={16} color={S.accent}/>}
          </div>
        ))}
      </SetGroup>

      {/* Behavior */}
      <SetGroup title={vi ? '⚡ Hành vi sau khi quét' : '⚡ After scan'} dark={dark}>
        <ToggleRow label={vi ? 'Tự động thêm vào giỏ POS' : 'Auto-add to POS cart'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Phát âm thanh khi quét thành công' : 'Beep on success'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Rung điện thoại' : 'Vibrate phone'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Quét liên tục (không cần bấm)' : 'Continuous scan'} on={false} dark={dark} last/>
      </SetGroup>

      {/* Supported formats */}
      <SetGroup title={vi ? '🏷️ Loại mã hỗ trợ' : '🏷️ Supported formats'} dark={dark}>
        <div style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { n: 'EAN-13', on: true },
            { n: 'EAN-8', on: true },
            { n: 'UPC-A', on: true },
            { n: 'CODE 128', on: true },
            { n: 'CODE 39', on: false },
            { n: 'QR Code', on: true },
            { n: 'Data Matrix', on: false },
            { n: 'PDF417', on: false },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
              fontFamily: Sketch.mono,
              border: `1.5px solid ${f.on ? S.accent : S.line}`,
              background: f.on ? S.accent : 'transparent',
              color: f.on ? '#fff' : S.inkDim,
            }}>{f.n}</div>
          ))}
        </div>
      </SetGroup>

      {/* Test scan area */}
      <div style={{ padding: '4px 12px 18px' }}>
        <div style={{ position: 'relative', height: 140, borderRadius: 14,
          background: '#1a1a1a', border: `2px solid ${S.line}`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 16, border: '2px dashed rgba(255,255,255,0.4)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '70%', height: 2, background: S.accent,
              boxShadow: `0 0 12px ${S.accent}` }}/>
          </div>
          <div style={{ position: 'absolute', top: 8, left: 12, right: 12, color: 'rgba(255,255,255,0.85)',
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📷 {vi ? 'Khu vực thử quét' : 'Test scan area'}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: Sketch.mono, opacity: 0.7 }}>{vi ? 'Đặt mã trong khung' : 'Place code in frame'}</span>
          </div>
        </div>
      </div>
    </ScreenBody>
  );
}

// ─────────────────────────────────────────────
// 6. Cấu hình POS (POS configuration)
// ─────────────────────────────────────────────
function PosConfigScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';
  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <SetHeader title={vi ? 'Cấu hình POS' : 'POS configuration'} dark={dark} lang={lang}/>

      {/* Layout preview */}
      <div style={{ padding: '6px 12px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: S.inkDim,
          padding: '0 8px 6px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          🖼️ {vi ? 'Bố cục bàn phím POS' : 'POS layout preview'}
        </div>
        <SBox dark={dark} style={{ padding: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {['Cà phê', 'Trà', 'Nước ngọt', 'Bánh mì', 'Mì tôm', 'Sữa', 'Bia', '+ Tạo'].map((c, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 10,
                background: i === 7 ? 'transparent' : (i === 0 ? S.accent : S.paperDim),
                border: i === 7 ? `1.5px dashed ${S.line}` : `1.5px solid ${i === 0 ? S.accent : S.inkFaint}`,
                color: i === 0 ? '#fff' : (i === 7 ? S.inkDim : S.ink),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10.5, fontWeight: 700, textAlign: 'center', padding: 4,
              }}>{c}</div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: S.inkDim, marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
            {vi ? 'Kéo thả để sắp xếp · Bấm để sửa' : 'Drag to reorder · Tap to edit'}
          </div>
        </SBox>
      </div>

      {/* Display */}
      <SetGroup title={vi ? '🎨 Hiển thị' : '🎨 Display'} dark={dark}>
        <div style={{ padding: '10px 14px', borderBottom: `1px dashed ${S.inkFaint}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{vi ? 'Bố cục danh mục' : 'Category layout'}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { l: vi ? '4 cột' : '4 cols', sel: true },
              { l: vi ? '5 cột' : '5 cols' },
              { l: vi ? '6 cột' : '6 cols' },
              { l: vi ? 'Danh sách' : 'List' },
            ].map((c, i) => (
              <div key={i} style={{ flex: 1, padding: '6px', textAlign: 'center', borderRadius: 8,
                fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${c.sel ? S.accent : S.line}`,
                background: c.sel ? S.accentDim : 'transparent',
                color: c.sel ? S.accent : S.ink }}>{c.l}</div>
            ))}
          </div>
        </div>
        <ToggleRow label={vi ? 'Hiển thị ảnh sản phẩm' : 'Show product images'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Hiển thị tồn kho' : 'Show stock count'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Hiển thị giá vốn (chỉ chủ)' : 'Show cost price (owner only)'} on={false} dark={dark} last/>
      </SetGroup>

      {/* Behavior */}
      <SetGroup title={vi ? '⚙️ Hành vi bán hàng' : '⚙️ Sales behavior'} dark={dark}>
        <ToggleRow label={vi ? 'Tự động in hóa đơn khi thanh toán' : 'Auto-print on payment'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Mở ngăn kéo tiền tự động' : 'Auto-open cash drawer'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Hiển thị màn hình khách hàng' : 'Show customer display'} on={false} dark={dark}/>
        <ToggleRow label={vi ? 'Yêu cầu chọn khách trước khi tính' : 'Require customer pick'} on={false} dark={dark}/>
        <ToggleRow label={vi ? 'Cho phép giảm giá thủ công' : 'Allow manual discount'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Cho phép bán âm tồn kho' : 'Allow negative stock'} on={false} dark={dark} last/>
      </SetGroup>

      {/* Payment methods */}
      <div style={{ padding: '4px 20px 6px', fontSize: 11, fontWeight: 700, color: S.inkDim,
        textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex' }}>
        <span style={{ flex: 1 }}>💳 {vi ? 'Phương thức thanh toán' : 'Payment methods'}</span>
        <span style={{ color: S.accent }}>+ {vi ? 'Thêm' : 'Add'}</span>
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <SBox dark={dark} style={{ padding: 0 }}>
          {[
            { n: vi ? 'Tiền mặt' : 'Cash', i: 'money', sub: vi ? 'Mặc định · luôn bật' : 'Default · always on', on: true, locked: true, c: '#4a9f4a' },
            { n: 'MoMo', i: 'qr', sub: 'QR · 0903 456 789', on: true, c: '#d82d8b' },
            { n: 'VNPay QR', i: 'qr', sub: vi ? 'Liên kết Vietcombank' : 'Linked Vietcombank', on: true, c: '#005baa' },
            { n: vi ? 'Thẻ tín dụng' : 'Credit card', i: 'card', sub: 'POS Sumup · Visa/Master', on: true, c: '#1a1a1a' },
            { n: vi ? 'Chuyển khoản' : 'Bank transfer', i: 'card', sub: 'VCB · 0071 0000 123456', on: false, c: '#6b8cae' },
          ].map((p, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
              borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: p.c + '22',
                border: `1.5px solid ${p.c}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SIcon name={p.i} size={15} color={p.c}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {p.n} {p.locked && <span style={{ fontSize: 10 }}>🔒</span>}
                </div>
                <div style={{ fontSize: 10.5, color: S.inkDim, fontFamily: Sketch.mono, marginTop: 1 }}>{p.sub}</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 999,
                background: p.on ? S.accent : S.inkFaint,
                border: `1.5px solid ${S.line}`, position: 'relative',
                opacity: p.locked ? 0.6 : 1 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', border: `1.5px solid ${S.line}`,
                  position: 'absolute', top: 1, left: p.on ? 20 : 2 }}/>
              </div>
            </div>
          ))}
        </SBox>
      </div>

      {/* Tax */}
      <SetGroup title={vi ? '🧾 Thuế & Hóa đơn' : '🧾 Tax & Invoice'} dark={dark}>
        <div style={{ padding: '10px 14px', borderBottom: `1px dashed ${S.inkFaint}`,
          display: 'flex', alignItems: 'center' }}>
          <span style={{ flex: 1, fontSize: 12.5 }}>{vi ? 'VAT mặc định' : 'Default VAT'}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['0%', '5%', '8%', '10%'].map((v, i) => (
              <div key={i} style={{ padding: '4px 10px', borderRadius: 8,
                fontSize: 11, fontWeight: 700, fontFamily: Sketch.mono,
                border: `1.5px solid ${i === 2 ? S.accent : S.line}`,
                background: i === 2 ? S.accent : 'transparent',
                color: i === 2 ? '#fff' : S.ink }}>{v}</div>
            ))}
          </div>
        </div>
        <ToggleRow label={vi ? 'Giá đã bao gồm VAT' : 'Prices include VAT'} on={true} dark={dark}/>
        <ToggleRow label={vi ? 'Tự xuất hóa đơn điện tử' : 'Auto-issue e-invoice'} on={true} dark={dark} last/>
      </SetGroup>

      {/* Reset */}
      <div style={{ padding: '4px 12px 18px' }}>
        <div style={{ padding: '12px 14px', textAlign: 'center', border: `1.5px solid #c97a7a`,
          borderRadius: 14, background: '#c97a7a22', fontSize: 12.5, fontWeight: 700, color: '#c94a4a' }}>
          ⟲ {vi ? 'Khôi phục cấu hình mặc định' : 'Reset to defaults'}
        </div>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, {
  RolesScreen, ProfileScreen, StoresScreen,
  ReceiptTemplateScreen, ScannerConfigScreen, PosConfigScreen,
  SetHeader, SetGroup,
});
