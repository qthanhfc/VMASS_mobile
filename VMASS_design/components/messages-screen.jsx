// Messages tab — unified inbox (FB, Zalo, IG, SMS, staff, system)

function MessagesScreen({ dark = false, lang = 'vi', variant = 1 }) {
  const S = useSketch(dark);
  const vi = lang === 'vi';

  const channels = [
    { k: 'all', i: null, l: vi ? 'Tất cả' : 'All', c: 24 },
    { k: 'fb', i: 'fb', l: 'Facebook', c: 8, color: '#1877F2' },
    { k: 'zalo', i: 'zalo', l: 'Zalo', c: 6, color: '#0068FF' },
    { k: 'ig', i: 'ig', l: 'Instagram', c: 3, color: '#E4405F' },
    { k: 'sms', i: 'sms', l: 'SMS', c: 2, color: '#34c759' },
    { k: 'staff', i: 'users', l: vi ? 'Nội bộ' : 'Staff', c: 4, color: '#8a8a6a' },
    { k: 'sys', i: 'bell', l: vi ? 'Hệ thống' : 'System', c: 1, color: '#008ecc' },
  ];

  const threads = [
    { src: 'fb', name: 'Lan Anh Nguyen', preview: 'Shop ơi còn size M không ạ?', time: '14:22', unread: 2, color: '#1877F2' },
    { src: 'zalo', name: 'Minh Trần', preview: 'Đơn #HD0891 mình cần đổi size', time: '13:47', unread: 1, color: '#0068FF' },
    { src: 'sys', name: vi ? 'Cảnh báo tồn kho' : 'Stock alert', preview: vi ? '5 sản phẩm sắp hết hàng' : '5 items running low', time: '12:00', unread: 1, color: '#008ecc', pin: true },
    { src: 'ig', name: '@huyentran.94', preview: '🔥🔥 sản phẩm đẹp quá', time: '11:18', unread: 0, color: '#E4405F' },
    { src: 'staff', name: vi ? 'Thu Hà (CH Q1)' : 'Thu Ha', preview: vi ? 'Chị ơi em xin nghỉ chiều nay' : 'Can I take the afternoon off?', time: '10:05', unread: 0, color: '#8a8a6a' },
    { src: 'fb', name: 'Pham Duc', preview: 'Có ship COD Hà Nội không?', time: 'Hqua', unread: 0, color: '#1877F2' },
    { src: 'sms', name: '+84 912 345 678', preview: 'Ok em chuyển khoản rồi nhé', time: 'Hqua', unread: 0, color: '#34c759' },
    { src: 'zalo', name: 'Thanh Nga', preview: 'Còn hàng không shop?', time: '2/4', unread: 0, color: '#0068FF' },
  ];

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      <div style={{ padding: '10px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{vi ? 'Tin nhắn' : 'Messages'}</div>
          <div style={{ fontSize: 12, color: S.inkDim }}>24 {vi ? 'chưa đọc' : 'unread'}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <SCircle size={36} dark={dark}><SIcon name="search" size={18} dark={dark}/></SCircle>
          <SCircle size={36} dark={dark}><SIcon name="edit" size={16} dark={dark}/></SCircle>
        </div>
      </div>

      {/* Channel filter chips */}
      <div style={{ padding: '0 12px 10px' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {channels.map((c, i) => (
            <div key={c.k} style={{
              padding: '6px 12px',
              border: `1.5px solid ${i === 0 ? S.line : S.inkFaint}`,
              borderRadius: 999,
              background: i === 0 ? S.accent : 'transparent',
              color: i === 0 ? '#fff' : S.ink,
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {c.i && <SIcon name={c.i} size={12} color={i === 0 ? '#fff' : c.color}/>}
              {c.l}
              <span style={{ fontSize: 10, opacity: 0.8 }}>· {c.c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Thread list */}
      <div style={{ padding: '0 0 20px' }}>
        {threads.map((t, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '10px 14px',
            borderTop: `1px dashed ${S.inkFaint}`,
            background: t.unread > 0 ? S.paperDim : 'transparent',
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <SCircle size={44} dark={dark} fill={t.color + '22'} style={{ borderColor: t.color }}>
                <span style={{ color: t.color, fontWeight: 800, fontSize: 16 }}>
                  {t.name[0]}
                </span>
              </SCircle>
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 18, height: 18, borderRadius: '50%',
                background: S.paper,
                border: `1.5px solid ${S.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SIcon name={t.src === 'sys' ? 'bell' : t.src === 'staff' ? 'users' : t.src} size={10} color={t.color}/>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: t.unread > 0 ? 800 : 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {t.pin && <span style={{ fontSize: 10 }}>📌</span>}
                  {t.name}
                </div>
                <div style={{ fontSize: 11, color: S.inkDim, fontFamily: Sketch.mono }}>{t.time}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <div style={{
                  fontSize: 12, color: t.unread > 0 ? S.ink : S.inkDim,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 240, fontWeight: t.unread > 0 ? 600 : 400,
                }}>{t.preview}</div>
                {t.unread > 0 && (
                  <div style={{
                    minWidth: 18, height: 18, borderRadius: 999,
                    background: S.accent, color: '#fff',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 5px',
                  }}>{t.unread}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScreenBody>
  );
}

Object.assign(window, { MessagesScreen });
