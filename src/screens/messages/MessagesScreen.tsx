import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { Avatar, EmptyState } from '../../components';
import { Message } from '../../types';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    channel: 'facebook',
    senderName: 'Nguyễn Thị Lan',
    preview: 'Cho mình hỏi áo này còn size M không ạ?',
    timestamp: '2 phút',
    unread: 3,
    isPinned: true,
  },
  {
    id: 2,
    channel: 'zalo',
    senderName: 'Trần Văn Minh',
    preview: 'Shop ơi cho mình đổi màu được không?',
    timestamp: '15 phút',
    unread: 1,
    isPinned: false,
  },
  {
    id: 3,
    channel: 'instagram',
    senderName: 'Lê Thị Hoa',
    preview: 'Mình muốn mua combo 3 áo thì giảm được không?',
    timestamp: '32 phút',
    unread: 0,
    isPinned: true,
  },
  {
    id: 4,
    channel: 'sms',
    senderName: '0912 345 678',
    preview: 'Đơn hàng của tôi giao đến chưa?',
    timestamp: '1 giờ',
    unread: 2,
    isPinned: false,
  },
  {
    id: 5,
    channel: 'facebook',
    senderName: 'Phạm Quốc Bảo',
    preview: 'Cảm ơn shop, hàng đẹp lắm ạ!',
    timestamp: '2 giờ',
    unread: 0,
    isPinned: false,
  },
  {
    id: 6,
    channel: 'internal',
    senderName: 'Nhân viên Hùng',
    preview: 'Anh ơi kho hết hàng mã AT-001 rồi ạ.',
    timestamp: '3 giờ',
    unread: 1,
    isPinned: false,
  },
  {
    id: 7,
    channel: 'system',
    senderName: 'Hệ thống',
    preview: 'Đơn hàng DH-0234 đã được xác nhận thanh toán.',
    timestamp: '4 giờ',
    unread: 0,
    isPinned: false,
  },
  {
    id: 8,
    channel: 'zalo',
    senderName: 'Hoàng Thị Mai',
    preview: 'Bên mình có ship COD không shop?',
    timestamp: 'Hôm qua',
    unread: 0,
    isPinned: false,
  },
];

type FilterType = Message['channel'] | 'all';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'zalo', label: 'Zalo' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'sms', label: 'SMS' },
  { key: 'internal', label: 'Nội bộ' },
  { key: 'system', label: 'Hệ thống' },
];

// ─── Channel config ───────────────────────────────────────────────────────────

interface ChannelConfig {
  label: string;
  bg: string;
  text: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const CHANNEL_CONFIG: Record<Message['channel'], ChannelConfig> = {
  facebook: { label: 'FB', bg: '#1877f2', text: '#fff', icon: 'logo-facebook' },
  zalo: { label: 'ZL', bg: '#0068ff', text: '#fff', icon: 'chatbubble-ellipses-outline' },
  instagram: { label: 'IG', bg: '#e1306c', text: '#fff', icon: 'logo-instagram' },
  sms: { label: 'SMS', bg: Colors.success, text: '#fff', icon: 'phone-portrait-outline' },
  internal: { label: 'NB', bg: '#7c3aed', text: '#fff', icon: 'people-outline' },
  system: { label: 'SYS', bg: Colors.textSecondary, text: '#fff', icon: 'notifications-outline' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: Message['channel'] }) {
  const cfg = CHANNEL_CONFIG[channel];
  return (
    <View style={[channelBadgeStyles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[channelBadgeStyles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const channelBadgeStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
});

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={unreadStyles.badge}>
      <Text style={unreadStyles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const unreadStyles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

function MessageRow({ message }: { message: Message }) {
  const isUnread = message.unread > 0;
  return (
    <TouchableOpacity style={styles.messageRow} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        <Avatar name={message.senderName} size={46} />
        <View style={[styles.channelDot, { backgroundColor: CHANNEL_CONFIG[message.channel].bg }]}>
          <Ionicons
            name={CHANNEL_CONFIG[message.channel].icon}
            size={9}
            color="#fff"
          />
        </View>
      </View>

      <View style={styles.messageContent}>
        <View style={styles.messageTopRow}>
          <View style={styles.namePinRow}>
            {message.isPinned && (
              <Text style={styles.pinIcon}>📌</Text>
            )}
            <Text style={[styles.senderName, isUnread && styles.senderNameBold]} numberOfLines={1}>
              {message.senderName}
            </Text>
            <ChannelBadge channel={message.channel} />
          </View>
          <Text style={styles.timestamp}>{message.timestamp}</Text>
        </View>

        <View style={styles.messageBottomRow}>
          <Text
            style={[styles.previewText, isUnread && styles.previewTextBold]}
            numberOfLines={1}
          >
            {message.preview}
          </Text>
          <UnreadBadge count={message.unread} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filtered =
    activeFilter === 'all'
      ? MOCK_MESSAGES
      : MOCK_MESSAGES.filter(m => m.channel === activeFilter);

  const totalUnread = MOCK_MESSAGES.reduce((sum, m) => sum + m.unread, 0);

  return (
    <View style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          {totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.composeBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Filter Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map(f => {
          const isActive = f.key === activeFilter;
          const channelUnread =
            f.key === 'all'
              ? totalUnread
              : MOCK_MESSAGES.filter(m => m.channel === f.key).reduce((s, m) => s + m.unread, 0);
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {f.label}
              </Text>
              {channelUnread > 0 && (
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                    {channelUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Message List ── */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="chatbubbles-outline"
            title="Không có tin nhắn"
            description="Chưa có tin nhắn nào trong mục này."
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item, index }) => (
            <View>
              <MessageRow message={item} />
              {index < filtered.length - 1 && <View style={styles.divider} />}
            </View>
          )}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  totalUnreadBadge: {
    backgroundColor: Colors.danger,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  totalUnreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  composeBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Filter chips
  filtersRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
    ...Shadow.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterLabel: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: Colors.border,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  // List
  list: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
  // Message row
  messageRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  avatarWrap: {
    position: 'relative',
  },
  channelDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  messageContent: {
    flex: 1,
    gap: 5,
  },
  messageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  namePinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  pinIcon: {
    fontSize: 11,
  },
  senderName: {
    ...Typography.bodyMd,
    color: Colors.text,
    flex: 1,
  },
  senderNameBold: {
    fontWeight: '700',
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  messageBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  previewText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    flex: 1,
  },
  previewTextBold: {
    color: Colors.text,
    fontWeight: '500',
  },
  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
