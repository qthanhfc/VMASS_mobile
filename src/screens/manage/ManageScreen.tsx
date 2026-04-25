import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { Card, SearchBar, SectionHeader } from '../../components';
import { ManageStackParamList } from '../../navigation';

type NavProp = NativeStackNavigationProp<ManageStackParamList, 'ManageMain'>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManageSection {
  key: keyof ManageStackParamList;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  badge?: number;
  color?: string;
}

interface Platform {
  key: string;
  label: string;
  emoji: string;
  color: string;
  orders: number;
  status: 'online' | 'offline' | 'syncing';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SECTIONS: ManageSection[] = [
  { key: 'ProductsList', label: 'Sản phẩm', icon: 'shirt-outline', badge: 142, color: '#7c3aed' },
  { key: 'CustomersList', label: 'Khách hàng', icon: 'people-outline', badge: 38, color: '#0891b2' },
  { key: 'SuppliersList', label: 'Nhà cung cấp', icon: 'business-outline', color: '#16a34a' },
  { key: 'InventoryMain', label: 'Tồn kho', icon: 'cube-outline', badge: 3, color: Colors.warning },
  { key: 'OrdersList', label: 'Đơn hàng', icon: 'receipt-outline', badge: 12, color: Colors.primary },
  { key: 'ReturnsList', label: 'Trả hàng', icon: 'return-down-back-outline', color: Colors.danger },
  { key: 'StaffList', label: 'Nhân viên', icon: 'id-card-outline', color: '#db2777' },
  { key: 'PromotionsList', label: 'Khuyến mãi', icon: 'pricetag-outline', badge: 2, color: Colors.accent },
  { key: 'BookkeepingMain', label: 'Hóa đơn/Công nợ', icon: 'document-text-outline', color: '#0891b2' },
  { key: 'BookkeepingMain', label: 'Kế toán', icon: 'calculator-outline', color: Colors.success },
];

const PLATFORMS: Platform[] = [
  { key: 'shopee', label: 'Shopee', emoji: '🛒', color: '#ee4d2d', orders: 24, status: 'online' },
  { key: 'lazada', label: 'Lazada', emoji: '🔵', color: '#0f1457', orders: 8, status: 'online' },
  { key: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#010101', orders: 15, status: 'syncing' },
  { key: 'tiki', label: 'Tiki', emoji: '🔷', color: '#1a94ff', orders: 3, status: 'offline' },
];

const QUICK_ACTIONS = [
  { key: 'OrdersList' as keyof ManageStackParamList, label: 'Tạo đơn', icon: 'add-circle-outline' as const },
  { key: 'InventoryMain' as keyof ManageStackParamList, label: 'Nhập hàng', icon: 'download-outline' as const },
  { key: 'PosScreen' as keyof ManageStackParamList, label: 'Bán POS', icon: 'storefront-outline' as const },
  { key: 'BookkeepingMain' as keyof ManageStackParamList, label: 'Báo cáo', icon: 'bar-chart-outline' as const },
  { key: 'CustomersList' as keyof ManageStackParamList, label: 'Thêm KH', icon: 'person-add-outline' as const },
];

const BOOKKEEPING_STATS = [
  { label: 'DT Quý 4', value: '287.4M', color: Colors.success },
  { label: 'Thuế phải nộp', value: '14.3M', color: Colors.danger },
  { label: 'Hạn nộp', value: '31/01', color: Colors.warning },
];

const BOOKKEEPING_LINKS = ['Kê khai Q4', 'Hóa đơn VAT', 'Thu/Chi', 'Báo cáo'];

const RECENT_PRODUCTS = [
  { id: 1, name: 'Áo thun basic trắng', sku: 'AT-001', price: 120000, stock: 45 },
  { id: 2, name: 'Quần jean slim fit', sku: 'QJ-012', price: 220000, stock: 18 },
  { id: 3, name: 'Giày sneaker trắng', sku: 'GS-003', price: 420000, stock: 8 },
  { id: 4, name: 'Túi tote canvas', sku: 'TT-007', price: 85000, stock: 3 },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function vnd(n: number) {
  return n.toLocaleString('vi-VN') + ' đ';
}

function StatusDot({ status }: { status: Platform['status'] }) {
  const color =
    status === 'online' ? Colors.success :
    status === 'syncing' ? Colors.warning :
    Colors.textSecondary;
  return (
    <View style={[dotStyles.dot, { backgroundColor: color }]} />
  );
}

const dotStyles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ManageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = useState('');

  function navigate(key: keyof ManageStackParamList) {
    navigation.navigate(key as any);
  }

  return (
    <View style={[styles.screen, { backgroundColor: Colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.headerTitle}>Quản lý</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigate('QrScan')}>
          <Ionicons name="qr-code-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm sản phẩm, đơn hàng, khách hàng..."
        onQrPress={() => navigate('QrScan')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Quick Actions ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              style={styles.quickChip}
              onPress={() => navigate(action.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={16} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.quickChipLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Bookkeeping Card ── */}
        <View style={styles.px}>
          <TouchableOpacity onPress={() => navigate('BookkeepingMain')} activeOpacity={0.85}>
            <Card style={styles.bookkeepingCard} padding={Spacing.lg}>
              <View style={styles.bookkeepingHeader}>
                <View style={styles.bookkeepingTitleRow}>
                  <Ionicons name="calculator" size={20} color="#fff" />
                  <Text style={styles.bookkeepingTitle}>Sổ sách kế toán</Text>
                </View>
                <View style={styles.taxPill}>
                  <Text style={styles.taxPillText}>Kê khai thuế hộ KD</Text>
                </View>
              </View>

              <View style={styles.bookkeepingStats}>
                {BOOKKEEPING_STATS.map(s => (
                  <View key={s.label} style={styles.bookkeepingStat}>
                    <Text style={styles.bookkeepingStatValue}>{s.value}</Text>
                    <Text style={styles.bookkeepingStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.bookkeepingLinks}>
                {BOOKKEEPING_LINKS.map(l => (
                  <View key={l} style={styles.bookkeepingLinkChip}>
                    <Text style={styles.bookkeepingLinkText}>{l}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* ── E-commerce Platforms ── */}
        <SectionHeader title="Sàn thương mại điện tử" action="Kết nối thêm" />
        <View style={styles.px}>
          <Card padding={Spacing.md}>
            <View style={styles.platformGrid}>
              {PLATFORMS.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={styles.platformCard}
                  onPress={() => navigate('EcommerceMain')}
                  activeOpacity={0.7}
                >
                  <View style={styles.platformTop}>
                    <Text style={styles.platformEmoji}>{p.emoji}</Text>
                    <StatusDot status={p.status} />
                  </View>
                  <Text style={styles.platformName}>{p.label}</Text>
                  <Text style={styles.platformOrders}>{p.orders} đơn</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* ── Management Sections Grid ── */}
        <SectionHeader title="Quản lý" />
        <View style={styles.sectionsGrid}>
          {SECTIONS.map((s, i) => (
            <TouchableOpacity
              key={`${s.key}-${i}`}
              style={styles.sectionItem}
              onPress={() => navigate(s.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIconWrap, { backgroundColor: (s.color || Colors.primary) + '18' }]}>
                <Ionicons name={s.icon} size={22} color={s.color || Colors.primary} />
                {s.badge !== undefined && (
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>
                      {s.badge > 99 ? '99+' : s.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.sectionLabel} numberOfLines={2}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Products ── */}
        <SectionHeader title="Sản phẩm gần đây" action="Xem tất cả" onAction={() => navigate('ProductsList')} />
        <View style={styles.px}>
          <Card padding={0} style={styles.tableCard}>
            {RECENT_PRODUCTS.map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.productRow,
                  i < RECENT_PRODUCTS.length - 1 && styles.rowBorder,
                ]}
                onPress={() => navigation.navigate('ProductEdit', { id: p.id })}
                activeOpacity={0.7}
              >
                <View style={styles.productThumb}>
                  <Ionicons name="shirt-outline" size={20} color={Colors.textSecondary} />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.productSku}>{p.sku}</Text>
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.productPrice}>{vnd(p.price)}</Text>
                  <Text style={[styles.productStock, p.stock <= 5 && { color: Colors.danger }]}>
                    Tồn: {p.stock}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: Spacing.sm },
  px: { paddingHorizontal: Spacing.lg },
  // Quick actions
  quickActionsRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  quickChipLabel: {
    ...Typography.captionMd,
    color: Colors.primary,
  },
  // Bookkeeping card
  bookkeepingCard: {
    backgroundColor: Colors.primary,
    gap: Spacing.md,
  },
  bookkeepingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookkeepingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bookkeepingTitle: {
    ...Typography.h4,
    color: '#fff',
  },
  taxPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  taxPillText: {
    ...Typography.label,
    color: '#fff',
    fontSize: 10,
  },
  bookkeepingStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  bookkeepingStat: {
    flex: 1,
  },
  bookkeepingStatValue: {
    ...Typography.h4,
    color: '#fff',
  },
  bookkeepingStatLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  bookkeepingLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bookkeepingLinkChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  bookkeepingLinkText: {
    ...Typography.captionMd,
    color: '#fff',
  },
  // Platforms
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformCard: {
    width: '47%',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  platformEmoji: {
    fontSize: 22,
  },
  platformName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  platformOrders: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Management sections grid
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionItem: {
    width: '18%',
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 60,
  },
  sectionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sectionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.text,
    textAlign: 'center',
    fontSize: 10,
  },
  // Table
  tableCard: {
    overflow: 'hidden',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    gap: 3,
  },
  productName: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  productSku: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  productPrice: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  productStock: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
