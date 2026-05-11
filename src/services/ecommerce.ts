import { request } from './http';
import { getCurrentUserProfile } from './profile';
import { API_BASE_URL } from './config';

export type EcommercePlatformKey =
  | 'shopee'
  | 'tiktok'
  | 'lazada'
  | 'tiki'
  | 'sendo'
  | 'facebook';

export type EcommercePlatformSummary = {
  key: EcommercePlatformKey;
  name: string;
  connected: boolean;
  shop: string;
  orders: number;
  pending: number;
  revenue: number;
  rating: number | null;
  connectionCount: number;
  supportsConnect: boolean;
  supportsDisconnect: boolean;
  supportsSync: boolean;
  syncLabel?: string;
  metaIds: string[];
};

type ShopeeShop = {
  shop_id?: string | number;
  shop_name?: string;
};

type TiktokShop = {
  shop_id?: string | number;
  shop_name?: string;
  shop_region?: string;
};

type FacebookPage = {
  page_id?: string;
  page_name?: string;
};

type ShopeeOrdersResponse = {
  data?: Array<{
    order_status?: string;
    order_sn?: string | number;
    order_sn_display?: string | number;
    total_amount?: string | number;
    total_price?: string | number;
  }>;
  total?: number;
};

type FacebookUnreadResponse = {
  data?: {
    total_unread?: number;
    unread_count?: number;
  };
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pendingStatusSet = new Set([
  'UNPAID',
  'READY_TO_SHIP',
  'PROCESSED',
  'TO_CONFIRM_RECEIVE',
  'IN_CANCEL',
  'INVOICE_PENDING',
]);

async function getUserId() {
  const profile = await getCurrentUserProfile();
  const id = profile.id;
  if (id === null || id === undefined || id === '') {
    throw new Error('Không tìm thấy user_id để tải dữ liệu TMĐT.');
  }
  return String(id);
}

function basePlatform(
  key: EcommercePlatformKey,
  name: string,
  connected = false,
): EcommercePlatformSummary {
  return {
    key,
    name,
    connected,
    shop: connected ? '-' : 'Chưa kết nối',
    orders: 0,
    pending: 0,
    revenue: 0,
    rating: null,
    connectionCount: 0,
    supportsConnect: key === 'shopee' || key === 'tiktok' || key === 'facebook',
    supportsDisconnect: key === 'shopee' || key === 'tiktok' || key === 'facebook',
    supportsSync: key === 'shopee' || key === 'tiktok' || key === 'facebook',
    metaIds: [],
  };
}

export async function listEcommercePlatforms() {
  const userId = await getUserId();
  const defaults: Record<EcommercePlatformKey, EcommercePlatformSummary> = {
    shopee: basePlatform('shopee', 'Shopee'),
    tiktok: basePlatform('tiktok', 'TikTok Shop'),
    lazada: basePlatform('lazada', 'Lazada'),
    tiki: basePlatform('tiki', 'Tiki'),
    sendo: basePlatform('sendo', 'Sendo'),
    facebook: basePlatform('facebook', 'Facebook Shop'),
  };

  const tasks = await Promise.allSettled([
    request<{ data?: ShopeeShop[] }>({
      method: 'GET',
      path: `/api/shopee/shops?user_id=${encodeURIComponent(userId)}`,
    }),
    request<{ data?: TiktokShop[] }>({
      method: 'GET',
      path: `/api/tiktok/shops?user_id=${encodeURIComponent(userId)}`,
    }),
    request<{ data?: FacebookPage[] }>({
      method: 'GET',
      path: `/api/facebook/pages?user_id=${encodeURIComponent(userId)}`,
    }),
    request<ShopeeOrdersResponse>({
      method: 'GET',
      path: `/api/shopee/orders?user_id=${encodeURIComponent(userId)}&page=1&limit=100`,
    }),
    request<FacebookUnreadResponse>({
      method: 'GET',
      path: `/api/facebook/conversations/unread-count?user_id=${encodeURIComponent(userId)}`,
    }),
  ]);

  const shopeeShopsResult = tasks[0].status === 'fulfilled' ? tasks[0].value.data || [] : [];
  const tiktokShopsResult = tasks[1].status === 'fulfilled' ? tasks[1].value.data || [] : [];
  const facebookPagesResult = tasks[2].status === 'fulfilled' ? tasks[2].value.data || [] : [];
  const shopeeOrdersResult = tasks[3].status === 'fulfilled' ? tasks[3].value : {};
  const facebookUnreadResult = tasks[4].status === 'fulfilled' ? tasks[4].value : {};

  if (shopeeShopsResult.length > 0) {
    const topShopNames = shopeeShopsResult
      .map((shop) => String(shop.shop_name || '').trim())
      .filter(Boolean)
      .slice(0, 2);
    const shopeeOrders = shopeeOrdersResult.data || [];
    const pending = shopeeOrders.reduce((sum, order) => {
      const status = String(order.order_status || '').toUpperCase();
      return pendingStatusSet.has(status) ? sum + 1 : sum;
    }, 0);
    const revenue = shopeeOrders.reduce(
      (sum, order) => sum + toNumber(order.total_amount || order.total_price),
      0,
    );

    defaults.shopee = {
      ...defaults.shopee,
      connected: true,
      shop: topShopNames.length
        ? topShopNames.join(', ') + (shopeeShopsResult.length > 2 ? '...' : '')
        : `Đã kết nối ${shopeeShopsResult.length} shop`,
      orders: toNumber(shopeeOrdersResult.total) || shopeeOrders.length,
      pending,
      revenue,
      connectionCount: shopeeShopsResult.length,
      metaIds: shopeeShopsResult
        .map((shop) => String(shop.shop_id || '').trim())
        .filter(Boolean),
    };
  }

  if (tiktokShopsResult.length > 0) {
    const names = tiktokShopsResult
      .map((shop) => String(shop.shop_name || '').trim())
      .filter(Boolean);
    defaults.tiktok = {
      ...defaults.tiktok,
      connected: true,
      shop: names.length ? names.slice(0, 2).join(', ') + (names.length > 2 ? '...' : '') : 'TikTok Shop',
      connectionCount: tiktokShopsResult.length,
      syncLabel: 'Đồng bộ qua TikTok API',
      metaIds: tiktokShopsResult
        .map((shop) => String(shop.shop_id || '').trim())
        .filter(Boolean),
    };
  }

  if (facebookPagesResult.length > 0) {
    const names = facebookPagesResult
      .map((page) => String(page.page_name || '').trim())
      .filter(Boolean);
    const unread =
      toNumber(facebookUnreadResult.data?.total_unread) ||
      toNumber(facebookUnreadResult.data?.unread_count);
    defaults.facebook = {
      ...defaults.facebook,
      connected: true,
      shop: names.length ? names.slice(0, 2).join(', ') + (names.length > 2 ? '...' : '') : 'Fanpage',
      pending: unread,
      connectionCount: facebookPagesResult.length,
      syncLabel: 'Đồng bộ hội thoại Facebook',
      metaIds: facebookPagesResult
        .map((page) => String(page.page_id || '').trim())
        .filter(Boolean),
    };
  }

  const items = Object.values(defaults);
  const connectedItems = items.filter((item) => item.connected);

  return {
    items,
    totals: {
      connected: connectedItems.length,
      total: items.length,
      orders: connectedItems.reduce((sum, item) => sum + item.orders, 0),
      pending: connectedItems.reduce((sum, item) => sum + item.pending, 0),
      revenue: connectedItems.reduce((sum, item) => sum + item.revenue, 0),
    },
  };
}

export async function connectPlatform(key: EcommercePlatformKey) {
  const userId = await getUserId();
  const redirectUrl = 'vmass://manage/ecommerce';
  const encodedUserId = encodeURIComponent(userId);
  const encodedRedirect = encodeURIComponent(redirectUrl);

  if (key === 'shopee') {
    return { url: `${API_BASE_URL}/api/shopee/login?user_id=${encodedUserId}&redirect_url=${encodedRedirect}` };
  }

  if (key === 'tiktok') {
    return { url: `${API_BASE_URL}/api/tiktok/login?user_id=${encodedUserId}&redirect_url=${encodedRedirect}` };
  }

  if (key === 'facebook') {
    return { url: `${API_BASE_URL}/api/facebook/login?user_id=${encodedUserId}&redirect_url=${encodedRedirect}` };
  }

  throw new Error('Sàn này chưa hỗ trợ kết nối trực tiếp trên mobile.');
}

export async function disconnectPlatform(
  key: EcommercePlatformKey,
  connectionIds: string[],
) {
  const userId = await getUserId();
  if (!connectionIds.length) return;

  if (key === 'shopee') {
    await Promise.all(
      connectionIds.map((id) =>
        request({
          method: 'DELETE',
          path: `/api/shopee/shops/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`,
        }),
      ),
    );
    return;
  }

  if (key === 'tiktok') {
    await Promise.all(
      connectionIds.map((id) =>
        request({
          method: 'DELETE',
          path: `/api/tiktok/shops/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`,
        }),
      ),
    );
    return;
  }

  if (key === 'facebook') {
    await Promise.all(
      connectionIds.map((id) =>
        request({
          method: 'DELETE',
          path: `/api/facebook/pages/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`,
        }),
      ),
    );
    return;
  }

  throw new Error('Sàn này chưa hỗ trợ ngắt kết nối.');
}

export async function syncPlatform(key: EcommercePlatformKey) {
  const userId = await getUserId();

  if (key === 'shopee') {
    await request({
      method: 'POST',
      path: '/api/shopee/orders/sync',
      body: { user_id: userId },
    });
    return;
  }

  if (key === 'tiktok') {
    await request({
      method: 'POST',
      path: '/api/tiktok/orders/sync',
      body: { user_id: userId },
    });
    return;
  }

  if (key === 'facebook') {
    await request({
      method: 'POST',
      path: '/api/facebook/sync',
      body: { user_id: userId },
    });
    return;
  }

  throw new Error('Sàn này chưa hỗ trợ đồng bộ dữ liệu.');
}
