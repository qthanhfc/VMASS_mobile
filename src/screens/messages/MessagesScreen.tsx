import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, type TranslationKey } from '../../i18n';
import { Colors, Spacing, Typography, Radius, Shadow, useThemeMode } from '../../theme';
import { Avatar, EmptyState } from '../../components';
import { Message } from '../../types';
import { RootStackParamList } from '../../navigation';
import { useMessages } from './MessagesContext';
import { countUnreadSenders } from './messagesData';

type FilterType = Message['channel'] | 'all';
type StatusFilter = 'all' | 'unread' | 'read_unreplied' | 'replied';
type SegmentFilter = NonNullable<Message['customerSegment']> | 'all';

const FILTERS: { key: FilterType; labelKey?: TranslationKey; label?: string }[] = [
  { key: 'all', labelKey: 'messages.filter.all' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'zalo', label: 'Zalo' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'sms', label: 'SMS' },
  { key: 'internal', labelKey: 'messages.filter.internal' },
  { key: 'system', labelKey: 'messages.filter.system' },
];

const STATUS_FILTERS: { key: StatusFilter; labelKey: TranslationKey }[] = [
  { key: 'all', labelKey: 'messages.status.all' },
  { key: 'unread', labelKey: 'messages.status.unread' },
  { key: 'read_unreplied', labelKey: 'messages.status.readUnreplied' },
  { key: 'replied', labelKey: 'messages.status.replied' },
];

const SEGMENT_FILTERS: { key: SegmentFilter; labelKey: TranslationKey }[] = [
  { key: 'all', labelKey: 'messages.segment.all' },
  { key: 'new', labelKey: 'messages.segment.new' },
  { key: 'returning', labelKey: 'messages.segment.returning' },
  { key: 'purchased', labelKey: 'messages.segment.purchased' },
  { key: 'callback', labelKey: 'messages.segment.callback' },
  { key: 'potential', labelKey: 'messages.segment.potential' },
  { key: 'unclear_need', labelKey: 'messages.segment.unclearNeed' },
  { key: 'vip', labelKey: 'messages.segment.vip' },
  { key: 'needs_followup', labelKey: 'messages.segment.needsFollowup' },
  { key: 'complaint', labelKey: 'messages.segment.complaint' },
  { key: 'internal', labelKey: 'messages.segment.internal' },
];

const SEGMENT_CONFIG: Record<NonNullable<Message['customerSegment']>, { labelKey: TranslationKey; bg: string; text: string }> = {
  new: { labelKey: 'messages.segment.short.new', bg: '#e7f5ff', text: '#0b6aa8' },
  returning: { labelKey: 'messages.segment.short.returning', bg: '#eef9ef', text: '#1f7a36' },
  purchased: { labelKey: 'messages.segment.short.purchased', bg: '#e8f7ec', text: '#1a7f37' },
  callback: { labelKey: 'messages.segment.short.callback', bg: '#fff5e6', text: '#b26a00' },
  potential: { labelKey: 'messages.segment.short.potential', bg: '#e9f3ff', text: '#1d4ed8' },
  unclear_need: { labelKey: 'messages.segment.short.unclearNeed', bg: '#f3f4f6', text: '#4b5563' },
  vip: { labelKey: 'messages.segment.short.vip', bg: '#fff4de', text: '#a46400' },
  needs_followup: { labelKey: 'messages.segment.short.needsFollowup', bg: '#f3ebff', text: '#6d28d9' },
  complaint: { labelKey: 'messages.segment.short.complaint', bg: '#ffe9e9', text: '#b42318' },
  internal: { labelKey: 'messages.segment.short.internal', bg: '#ededed', text: '#5c5c5c' },
};

function matchStatusFilter(message: Message, status: StatusFilter) {
  if (status === 'all') return true;
  if (status === 'unread') return message.unread > 0;
  if (status === 'read_unreplied') return message.unread === 0 && message.replyStatus === 'unreplied';
  return message.replyStatus === 'replied';
}

function countByStatus(messages: Message[], status: StatusFilter) {
  if (status === 'all') return messages.length;
  if (status === 'unread') return countUnreadSenders(messages);
  return messages.filter(m => matchStatusFilter(m, status)).length;
}

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

function CustomerSegmentBadge({
  segment,
  t,
}: {
  segment?: Message['customerSegment'];
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  if (!segment) return null;
  const cfg = SEGMENT_CONFIG[segment];
  return (
    <View style={[segmentBadgeStyles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[segmentBadgeStyles.label, { color: cfg.text }]}>{t(cfg.labelKey)}</Text>
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

const segmentBadgeStyles = StyleSheet.create({
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

function MessageRow({
  message,
  onPress,
  colors,
  t,
}: {
  message: Message;
  onPress: () => void;
  colors: ReturnType<typeof useThemeMode>['colors'];
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) {
  const isUnread = message.unread > 0;
  return (
    <TouchableOpacity
      style={[
        styles.messageRow,
        isUnread && styles.messageRowUnread,
        {
          backgroundColor: colors.card,
          borderLeftColor: isUnread ? colors.primary : 'transparent',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
        <View style={styles.avatarWrap}>
          <Avatar name={message.senderName} size={46} />
        <View style={[styles.channelDot, { backgroundColor: CHANNEL_CONFIG[message.channel].bg, borderColor: colors.card }]}>
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
            <Text style={[styles.senderName, { color: colors.text }, isUnread && styles.senderNameBold]} numberOfLines={1}>
              {message.senderName}
            </Text>
            <ChannelBadge channel={message.channel} />
            <CustomerSegmentBadge segment={message.customerSegment} t={t} />
          </View>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{message.timestamp}</Text>
        </View>

        <View style={styles.messageBottomRow}>
          <Text
            style={[
              styles.previewText,
              isUnread && styles.previewTextBold,
              { color: isUnread ? colors.text : colors.textSecondary },
            ]}
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const { messages, unreadSenderCount, markThreadRead } = useMessages();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [activeSegment, setActiveSegment] = useState<SegmentFilter>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const channelFiltered =
    activeFilter === 'all'
      ? messages
      : messages.filter(m => m.channel === activeFilter);
  const statusFiltered = channelFiltered.filter(m => matchStatusFilter(m, activeStatus));
  const filtered =
    activeSegment === 'all'
      ? statusFiltered
      : statusFiltered.filter(m => m.customerSegment === activeSegment);

  const totalUnread = unreadSenderCount;
  const isAllMode =
    activeFilter === 'all' &&
    activeStatus === 'all' &&
    activeSegment === 'all';
  const hasAppliedFilters = activeStatus !== 'all' || activeSegment !== 'all';
  const appliedFilterCount =
    Number(activeStatus !== 'all') +
    Number(activeSegment !== 'all');

  const channelCountSource = messages.filter(
    m =>
      matchStatusFilter(m, activeStatus) &&
      (activeSegment === 'all' || m.customerSegment === activeSegment)
  );
  const statusCountSource = (activeFilter === 'all'
    ? messages
    : messages.filter(m => m.channel === activeFilter)
  ).filter(m => activeSegment === 'all' || m.customerSegment === activeSegment);
  const segmentCountSource = (activeFilter === 'all'
    ? messages
    : messages.filter(m => m.channel === activeFilter)
  ).filter(m => matchStatusFilter(m, activeStatus));

  const handleOpenThread = (thread: Message) => {
    if (thread.unread > 0) {
      markThreadRead(thread.id);
    }
    navigation.navigate('MessagesDetail', { threadId: thread.id });
  };

  return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.background }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('messages.title')}</Text>
          {totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[styles.composeBtn, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Filter Chips ── */}
      <View style={[styles.filtersWrap, { backgroundColor: colors.background }]}>
        <ScrollView
          horizontal
          style={styles.filtersScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <TouchableOpacity
            style={[
              styles.filterActionBtn,
              {
                backgroundColor: showFilterPanel ? colors.primary : colors.card,
                borderColor: showFilterPanel || hasAppliedFilters ? colors.primary : colors.border,
              },
              styles.filterChipSpacing,
            ]}
            onPress={() => setShowFilterPanel(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showFilterPanel ? 'options' : 'options-outline'}
              size={15}
              color={showFilterPanel ? '#fff' : colors.text}
            />
            <Text style={[styles.filterActionLabel, { color: showFilterPanel ? '#fff' : colors.text }]}>
              {t('messages.filter')}
            </Text>
            {hasAppliedFilters && (
              <View style={styles.filterActionBadge}>
                <Text style={styles.filterActionBadgeText}>{appliedFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {FILTERS.map((f, index) => {
            const isActive = f.key === 'all' ? isAllMode : f.key === activeFilter;
            const channelKey: Message['channel'] | null = f.key === 'all' ? null : f.key;
            const channelUnread =
              f.key === 'all'
                ? countUnreadSenders(channelCountSource)
                : countUnreadSenders(channelCountSource.filter(m => m.channel === f.key));
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                  index < FILTERS.length - 1 && styles.filterChipSpacing,
                ]}
                onPress={() => {
                  if (f.key === 'all') {
                    setActiveFilter('all');
                    setActiveStatus('all');
                    setActiveSegment('all');
                    setShowFilterPanel(false);
                    return;
                  }
                  setActiveFilter(f.key);
                }}
                activeOpacity={0.7}
              >
                {channelKey && (
                  <Ionicons
                    name={CHANNEL_CONFIG[channelKey].icon}
                    size={13}
                    color={isActive ? '#fff' : CHANNEL_CONFIG[channelKey].bg}
                    style={styles.filterIcon}
                  />
                )}
                <Text style={[styles.filterLabel, { color: isActive ? '#fff' : colors.text }]}>
                  {f.labelKey ? t(f.labelKey) : f.label}
                </Text>
                {channelUnread > 0 && (
                  <Text style={[styles.filterCount, { color: isActive ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
                    · {channelUnread}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {showFilterPanel && (
          <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>{t('messages.statusTitle')}</Text>
            <ScrollView
              horizontal
              style={styles.filtersScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {STATUS_FILTERS.filter(f => f.key !== 'all').map((f, index, arr) => {
                const isActive = f.key === activeStatus;
                const statusCount = countByStatus(statusCountSource, f.key);
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                      index < arr.length - 1 && styles.filterChipSpacing,
                    ]}
                    onPress={() => setActiveStatus(prev => (prev === f.key ? 'all' : f.key))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterLabel, { color: isActive ? '#fff' : colors.text }]}>
                      {t(f.labelKey)}
                    </Text>
                    {statusCount > 0 && (
                      <Text style={[styles.filterCount, { color: isActive ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
                        · {statusCount}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>{t('messages.segmentTitle')}</Text>
            <ScrollView
              horizontal
              style={styles.filtersScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {SEGMENT_FILTERS.filter(f => f.key !== 'all').map((f, index, arr) => {
                const isActive = f.key === activeSegment;
                const segmentCount = segmentCountSource.filter(m => m.customerSegment === f.key).length;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                      index < arr.length - 1 && styles.filterChipSpacing,
                    ]}
                    onPress={() => setActiveSegment(prev => (prev === f.key ? 'all' : f.key))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterLabel, { color: isActive ? '#fff' : colors.text }]}>
                      {t(f.labelKey)}
                    </Text>
                    {segmentCount > 0 && (
                      <Text style={[styles.filterCount, { color: isActive ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>
                        · {segmentCount}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── Message List ── */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="chatbubbles-outline"
            title={t('messages.emptyTitle')}
            description={t('messages.emptyDescription')}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item, index }) => (
            <View>
              <MessageRow message={item} colors={colors} t={t} onPress={() => handleOpenThread(item)} />
              {index < filtered.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          )}
          style={[styles.list, { backgroundColor: colors.card }]}
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
  filtersWrap: {
    paddingBottom: Spacing.sm,
  },
  filterActionBtn: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  filterActionBtnApplied: {
    borderColor: Colors.primary,
  },
  filterActionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterActionLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 4,
  },
  filterActionLabelActive: {
    color: '#fff',
  },
  filterActionBadge: {
    marginLeft: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  filterPanel: {
    marginHorizontal: Spacing.lg,
    marginTop: 2,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  filterSectionTitle: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 4,
    paddingHorizontal: Spacing.md,
  },
  filtersScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filtersRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 2,
    paddingRight: Spacing.md,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  filterChipSpacing: {
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipInactive: {
    borderColor: Colors.border,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterLabel: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: '#fff',
  },
  filterCount: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterCountActive: {
    color: 'rgba(255,255,255,0.9)',
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
    borderLeftWidth: 3,
  },
  messageRowUnread: {
    borderLeftWidth: 3,
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
    fontWeight: '500',
  },
  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
