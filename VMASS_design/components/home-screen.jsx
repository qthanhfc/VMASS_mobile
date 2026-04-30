// Home screen — dashboard with KPIs, chart, top products, alerts
// 3 layout variants

function HomeScreen({ variant = 1, dark = false, lang = 'vi', density = 'comfy' }) {
  const S = useSketch(dark);
  const t = lang === 'vi' ? viStrings : enStrings;
  const gap = density === 'compact' ? 8 : 12;

  return (
    <ScreenBody dark={dark} tabVariant={variant} padding={0}>
      {/* Greeting header */}
      <div style={{ padding: '10px 16px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: S.inkDim }}>{t.hello}, Minh 👋</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>VMASS {t.dashboard}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <SCircle size={36} dark={dark}><SIcon name="search" size={18} dark={dark}/></SCircle>
            <SCircle size={36} dark={dark} fill={S.accentDim}><SIcon name="bell" size={18} dark={dark}/></SCircle>
          </div>
        </div>
        {/* store + date chip */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <SBox dark={dark} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <SIcon name="shop" size={13} dark={dark}/> {t.storeA}
          </SBox>
          <SBox dark={dark} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <SIcon name="calendar" size={13} dark={dark}/> {t.today}
          </SBox>
        </div>
      </div>

      <div style={{ padding: `${gap}px 12px 20px`, display: 'flex', flexDirection: 'column', gap }}>
        {/* Revenue hero card */}
        <SBox dark={dark} fill={S.accent} style={{ padding: 14, borderColor: S.accent }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: '#fff', opacity: 0.85 }}>{t.revenueToday}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 2, color: '#fff' }}>12.450.000 ₫</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12 }}>
                <SIcon name="trend_up" size={14} color="#fff" />
                <span style={{ color: '#fff', fontWeight: 700 }}>+18.2%</span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{t.vsYesterday}</span>
              </div>
            </div>
            <SIcon name="money" size={32} color="#fff" />
          </div>
          {/* mini chart */}
          <div style={{ marginTop: 10 }}>
            <SScribble w={330} h={48} kind="area" accent dark={dark} onDark />
          </div>
        </SBox>

        {/* quick KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
          <KpiCard dark={dark} icon="cart" label={t.orders} value="38" trend="+5" />
          <KpiCard dark={dark} icon="users" label={t.newCustomer} value="7" trend="+2" />
          <KpiCard dark={dark} icon="box" label={t.itemsSold} value="142" trend="+23" />
          <KpiCard dark={dark} icon="coin" label={t.profit} value="3.2M" trend="+12%" />
        </div>

        {/* Goal bar */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
            <span>🎯 {t.monthlyGoal}</span>
            <span style={{ color: S.accent }}>62%</span>
          </div>
          <div style={{ fontSize: 11, color: S.inkDim, marginTop: 2 }}>186M / 300M ₫</div>
          <div style={{ marginTop: 8, height: 8, border: `1.5px solid ${S.line}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: '62%', height: '100%', background: S.accent }}/>
          </div>
        </SBox>

        {/* Revenue chart */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>📈 {t.revenueChart}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['7N', '30N', '12T'].map((p, i) => (
                <span key={p} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 999,
                  border: `1.5px solid ${i === 0 ? S.accent : S.inkFaint}`,
                  color: i === 0 ? S.accent : S.inkDim,
                  fontWeight: 700,
                }}>{p}</span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <SScribble w={330} h={80} kind="bars" accent dark={dark} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: S.inkDim, marginTop: 2, fontFamily: S.mono }}>
            {['T2','T3','T4','T5','T6','T7','CN'].map(d => <span key={d}>{d}</span>)}
          </div>
        </SBox>

        {/* Top products */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>🔥 {t.topProducts}</div>
            <span style={{ fontSize: 12, color: S.accent, fontWeight: 700 }}>{t.seeAll}</span>
          </div>
          {[
            { name: 'Cà phê hòa tan G7', sku: 'SP-0421', sold: 48, rev: '1.2M' },
            { name: 'Mì Hảo Hảo tôm chua', sku: 'SP-0118', sold: 37, rev: '185K' },
            { name: 'Sữa Vinamilk 1L', sku: 'SP-0302', sold: 29, rev: '812K' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                background: S.accentDim, color: S.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, flexShrink: 0,
              }}>{i + 1}</div>
              <SPlaceholder label="img" w={36} h={36} dark={dark} style={{ padding: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: S.inkDim, fontFamily: S.mono }}>{p.sku} · đã bán {p.sold}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.accent }}>{p.rev}</div>
            </div>
          ))}
        </SBox>

        {/* Low stock alert */}
        <SBox dark={dark} style={{ borderColor: S.accent, borderStyle: 'dashed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <SIcon name="warn" size={18} color={S.accent}/>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{t.lowStock}</span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, padding: '1px 8px', borderRadius: 999,
              background: S.accent, color: '#fff', fontWeight: 700,
            }}>5 SP</span>
          </div>
          {['Pepsi 330ml — còn 3', 'Dầu ăn Neptune — còn 2', 'Bột giặt Omo 800g — còn 1'].map((s, i) => (
            <div key={i} style={{ fontSize: 12, padding: '4px 0', borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none', display: 'flex', justifyContent: 'space-between' }}>
              <span>{s}</span>
              <span style={{ color: S.accent, fontWeight: 700 }}>{t.restock} →</span>
            </div>
          ))}
        </SBox>

        {/* Recent orders */}
        <SBox dark={dark}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>🧾 {t.recentOrders}</div>
            <span style={{ fontSize: 12, color: S.accent, fontWeight: 700 }}>{t.seeAll}</span>
          </div>
          {[
            { id: '#HD0892', who: 'Nguyễn Thị Lan', amt: '345K', time: '14:22' },
            { id: '#HD0891', who: 'Khách vãng lai', amt: '89K', time: '14:08' },
            { id: '#HD0890', who: 'Trần Văn Hải', amt: '1.2M', time: '13:47' },
          ].map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: i > 0 ? `1px dashed ${S.inkFaint}` : 'none', fontSize: 12 }}>
              <span style={{ fontFamily: S.mono, fontWeight: 700 }}>{o.id}</span>
              <span style={{ flex: 1 }}>{o.who}</span>
              <span style={{ color: S.inkDim, fontFamily: S.mono }}>{o.time}</span>
              <span style={{ fontWeight: 700 }}>{o.amt}</span>
            </div>
          ))}
        </SBox>
      </div>
    </ScreenBody>
  );
}

function KpiCard({ icon, label, value, trend, dark }) {
  const S = useSketch(dark);
  return (
    <SBox dark={dark} style={{ padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <SIcon name={icon} size={18} dark={dark}/>
        <span style={{ fontSize: 10, color: S.accent, fontWeight: 700 }}>{trend}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: S.inkDim }}>{label}</div>
    </SBox>
  );
}

const viStrings = {
  hello: 'Xin chào',
  dashboard: 'Dashboard',
  storeA: 'CH Quận 1',
  today: 'Hôm nay',
  revenueToday: 'Doanh thu hôm nay',
  vsYesterday: 'so với hôm qua',
  orders: 'Đơn hàng',
  newCustomer: 'KH mới',
  itemsSold: 'Sản phẩm bán',
  profit: 'Lợi nhuận',
  monthlyGoal: 'Mục tiêu tháng 4',
  revenueChart: 'Doanh thu 7 ngày',
  topProducts: 'Bán chạy nhất',
  seeAll: 'Xem tất cả',
  lowStock: 'Tồn kho thấp',
  restock: 'Nhập',
  recentOrders: 'Đơn hàng gần đây',
};
const enStrings = {
  hello: 'Hello',
  dashboard: 'Dashboard',
  storeA: 'Store #1',
  today: 'Today',
  revenueToday: 'Revenue today',
  vsYesterday: 'vs yesterday',
  orders: 'Orders',
  newCustomer: 'New cust.',
  itemsSold: 'Items sold',
  profit: 'Profit',
  monthlyGoal: 'April goal',
  revenueChart: '7-day revenue',
  topProducts: 'Top sellers',
  seeAll: 'See all',
  lowStock: 'Low stock',
  restock: 'Restock',
  recentOrders: 'Recent orders',
};

Object.assign(window, { HomeScreen, viStrings, enStrings });
