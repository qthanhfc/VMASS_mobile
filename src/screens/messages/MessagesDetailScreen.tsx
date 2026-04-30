import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, EmptyState } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';
import { RootStackParamList } from '../../navigation';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { CustomerSegment, CustomerTag, Message } from '../../types';
import { useMessages } from './MessagesContext';

type DetailNavProp = NativeStackNavigationProp<RootStackParamList, 'MessagesDetail'>;
type DetailRouteProp = RouteProp<RootStackParamList, 'MessagesDetail'>;

type ChatSender = 'customer' | 'me' | 'system';

interface ChatItem {
  id: string;
  sender: ChatSender;
  text: string;
  time: string;
  dateLabel: string;
  status?: 'sent' | 'delivered' | 'read';
}

const CHANNEL_META: Record<Message['channel'], { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; labelKey?: TranslationKey; label?: string }> = {
  facebook: { icon: 'logo-facebook', color: '#1877f2', label: 'Facebook' },
  zalo: { icon: 'chatbubble-ellipses-outline', color: '#0068ff', label: 'Zalo' },
  instagram: { icon: 'logo-instagram', color: '#e1306c', label: 'Instagram' },
  sms: { icon: 'phone-portrait-outline', color: Colors.success, label: 'SMS' },
  internal: { icon: 'people-outline', color: '#7c3aed', labelKey: 'messages.filter.internal' },
  system: { icon: 'notifications-outline', color: Colors.textSecondary, labelKey: 'messages.filter.system' },
};

const SEGMENT_OPTIONS: Array<{ key: CustomerSegment; labelKey: TranslationKey; bg: string; text: string }> = [
  { key: 'new', labelKey: 'messages.segment.new', bg: '#e7f5ff', text: '#0b6aa8' },
  { key: 'returning', labelKey: 'messages.segment.returning', bg: '#eef9ef', text: '#1f7a36' },
  { key: 'purchased', labelKey: 'messages.segment.purchased', bg: '#e8f7ec', text: '#1a7f37' },
  { key: 'callback', labelKey: 'messages.segment.callback', bg: '#fff5e6', text: '#b26a00' },
  { key: 'potential', labelKey: 'messages.segment.potential', bg: '#e9f3ff', text: '#1d4ed8' },
  { key: 'unclear_need', labelKey: 'messages.segment.unclearNeed', bg: '#f3f4f6', text: '#4b5563' },
  { key: 'vip', labelKey: 'messages.segment.vip', bg: '#fff4de', text: '#a46400' },
  { key: 'needs_followup', labelKey: 'messages.segment.needsFollowup', bg: '#f3ebff', text: '#6d28d9' },
  { key: 'complaint', labelKey: 'messages.segment.complaint', bg: '#ffe9e9', text: '#b42318' },
  { key: 'internal', labelKey: 'messages.segment.internal', bg: '#ededed', text: '#5c5c5c' },
];

const TAG_OPTIONS: Array<{ key: CustomerTag; labelKey: TranslationKey }> = [
  { key: 'easy_to_close', labelKey: 'messages.tag.easyToClose' },
  { key: 'high_value', labelKey: 'messages.tag.highValue' },
  { key: 'price_sensitive', labelKey: 'messages.tag.priceSensitive' },
  { key: 'needs_consult', labelKey: 'messages.tag.needsConsult' },
  { key: 'refund_risk', labelKey: 'messages.tag.refundRisk' },
];
const TAG_LABEL_KEY_MAP: Record<CustomerTag, TranslationKey> = TAG_OPTIONS.reduce((acc, item) => {
  acc[item.key] = item.labelKey;
  return acc;
}, {} as Record<CustomerTag, TranslationKey>);

function createInitialConversation(
  thread: Message,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): ChatItem[] {
  const threadClock = toClock(thread.timestamp, 4);
  const today = t('messages.detail.today');
  const baseCustomer = [
    {
      id: `c-${thread.id}-1`,
      sender: 'customer' as const,
      text: thread.preview,
      time: threadClock,
      dateLabel: today,
    },
    {
      id: `c-${thread.id}-2`,
      sender: 'customer' as const,
      text: t('messages.detail.customerFollowup'),
      time: toClock('', 2),
      dateLabel: today,
    },
  ];

  const internalNote: ChatItem[] =
    thread.channel === 'internal' || thread.channel === 'system'
      ? [
          {
            id: `s-${thread.id}-1`,
            sender: 'system',
            text: t('messages.detail.systemMessage'),
            time: '09:02',
            dateLabel: today,
          },
        ]
      : [];

  const agentReply: ChatItem = {
    id: `m-${thread.id}-1`,
    sender: 'me',
    text: t('messages.detail.agentReply'),
    time: '09:03',
    dateLabel: today,
    status: 'read',
  };

  return [...baseCustomer, ...internalNote, agentReply];
}

function formatHourMinute(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function toClock(value: string, fallbackMinutesAgo = 0) {
  const hhmm = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!hhmm) {
    const now = new Date();
    const minutesMatch = value.match(/(\d+)\s*phút/i);
    if (minutesMatch) {
      now.setMinutes(now.getMinutes() - Number(minutesMatch[1]));
      return now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    const hoursMatch = value.match(/(\d+)\s*giờ/i);
    if (hoursMatch) {
      now.setHours(now.getHours() - Number(hoursMatch[1]));
      return now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    now.setMinutes(now.getMinutes() - fallbackMinutesAgo);
    return now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}`;
}

export function MessagesDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const navigation = useNavigation<DetailNavProp>();
  const route = useRoute<DetailRouteProp>();
  const { threadId } = route.params;
  const { getThreadById, markThreadRead, setThreadSegment, toggleThreadTag } = useMessages();
  const thread = getThreadById(threadId);
  const meta = useMemo(() => (thread ? CHANNEL_META[thread.channel] : null), [thread]);
  const listRef = useRef<FlatList<ChatItem>>(null);
  const [draft, setDraft] = useState('');
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [showQuickClassify, setShowQuickClassify] = useState(false);
  const [conversation, setConversation] = useState<ChatItem[]>(() =>
    thread ? createInitialConversation(thread, t) : []
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!thread) return;
    setConversation(createInitialConversation(thread, t));
    setFocusedMessageId(null);
    markThreadRead(thread.id);
  }, [threadId, t]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timeout);
  }, [conversation.length]);

  const onSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const newItem: ChatItem = {
      id: `my-${Date.now()}`,
      sender: 'me',
      text: trimmed,
      time: formatHourMinute(new Date()),
      dateLabel: t('messages.detail.today'),
      status: 'sent',
    };
    setConversation(prev => [...prev, newItem]);
    setDraft('');
  };

  if (!thread || !meta) {
    return (
      <View style={[styles.screen, styles.emptyScreen, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="chatbubbles-outline"
          title={t('messages.detail.notFoundTitle')}
          description={t('messages.detail.notFoundDescription')}
        />
        <TouchableOpacity style={styles.backToListBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backToListText}>{t('messages.detail.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedSegment = SEGMENT_OPTIONS.find(item => item.key === thread.customerSegment);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 14 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerProfile}>
          <Avatar name={thread.senderName} size={36} />
          <View style={styles.headerMeta}>
            <Text numberOfLines={1} style={styles.headerName}>{thread.senderName}</Text>
            <View style={styles.headerChannelRow}>
              <Ionicons name={meta.icon} size={12} color={meta.color} />
              <Text style={styles.headerChannelText}>{meta.labelKey ? t(meta.labelKey) : meta.label}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.8}>
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickClassifyWrap}>
        <TouchableOpacity
          style={[styles.quickClassifyBtn, showQuickClassify && styles.quickClassifyBtnActive]}
          onPress={() => setShowQuickClassify(v => !v)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={showQuickClassify ? 'pricetags' : 'pricetags-outline'}
            size={14}
            color={showQuickClassify ? '#fff' : Colors.text}
          />
          <Text style={[styles.quickClassifyText, showQuickClassify && styles.quickClassifyTextActive]}>
            {t('messages.detail.quickClassify')}
          </Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          style={styles.selectedTagsScroll}
          contentContainerStyle={styles.selectedTagsRow}
          showsHorizontalScrollIndicator={false}
        >
          {selectedSegment && (
            <View style={[styles.currentSegmentChip, { backgroundColor: selectedSegment.bg }]}>
              <Text style={[styles.currentSegmentText, { color: selectedSegment.text }]}>
                {t(selectedSegment.labelKey)}
              </Text>
            </View>
          )}

          {thread.customerTags?.map((tag, index) => (
            <View
              key={tag}
              style={[
                styles.selectedTagChip,
                index > 0 && styles.selectedTagChipCompactSpacing,
              ]}
            >
              <Text style={styles.selectedTagText}>{t(TAG_LABEL_KEY_MAP[tag])}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {showQuickClassify && (
        <View style={styles.classifyPanel}>
          <Text style={styles.classifySectionTitle}>{t('messages.detail.mainSegment')}</Text>
          <View style={styles.classifyChipWrap}>
            {SEGMENT_OPTIONS.map(option => {
              const active = thread.customerSegment === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.classifyChip, active && styles.classifyChipActive]}
                  onPress={() => setThreadSegment(thread.id, active ? undefined : option.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.classifyChipText, active && styles.classifyChipTextActive]}>
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.classifySectionTitle}>{t('messages.detail.careTag')}</Text>
          <View style={styles.classifyChipWrap}>
            {TAG_OPTIONS.map(option => {
              const active = !!thread.customerTags?.includes(option.key);
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.classifyChip, active && styles.classifyChipActive]}
                  onPress={() => toggleThreadTag(thread.id, option.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.classifyChipText, active && styles.classifyChipTextActive]}>
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={conversation}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatListContent}
        renderItem={({ item, index }) => {
          const prev = conversation[index - 1];
          const next = conversation[index + 1];
          const showDate = !prev || prev.dateLabel !== item.dateLabel;
          const isMine = item.sender === 'me';
          const isSystem = item.sender === 'system';
          const isSameSideAsNext =
            !!next &&
            !isSystem &&
            next.sender === item.sender &&
            next.dateLabel === item.dateLabel;
          const showTapTimestamp = focusedMessageId === item.id;
          return (
            <View>
              {showDate && (
                <View style={styles.dateWrap}>
                  <Text style={styles.dateText}>{item.dateLabel}</Text>
                </View>
              )}

              {isSystem ? (
                <View style={styles.systemBubble}>
                  <Text style={styles.systemText}>{item.text}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.messageRow,
                    isMine ? styles.messageRowMine : styles.messageRowOther,
                    isSameSideAsNext && styles.messageRowGrouped,
                  ]}
                  activeOpacity={0.95}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setFocusedMessageId(prevId => (prevId === item.id ? null : item.id));
                  }}
                >
                  {showTapTimestamp && (
                    <View style={styles.tapTimestampWrap}>
                      <Text style={styles.tapTimestampText}>{item.dateLabel} • {toClock(item.time)}</Text>
                    </View>
                  )}
                  <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isMine && styles.myMessageText]}>{item.text}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('messages.detail.inputPlaceholder')}
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          multiline
          maxLength={800}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
          onPress={onSend}
          activeOpacity={0.85}
          disabled={!draft.trim()}
        >
          <Ionicons name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  emptyScreen: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  backToListBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  backToListText: {
    ...Typography.bodyMd,
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  headerMeta: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  headerName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    color: Colors.text,
  },
  headerChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  headerChannelText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickClassifyWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickClassifyBtn: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickClassifyBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickClassifyText: {
    ...Typography.captionMd,
    color: Colors.text,
    marginLeft: 4,
  },
  quickClassifyTextActive: {
    color: '#fff',
  },
  currentSegmentChip: {
    marginLeft: Spacing.sm,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentSegmentText: {
    ...Typography.captionMd,
    fontSize: 11,
  },
  selectedTagsScroll: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  selectedTagsRow: {
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  selectedTagChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 10,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  selectedTagChipCompactSpacing: {
    marginLeft: 3,
  },
  selectedTagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  classifyPanel: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  classifySectionTitle: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  classifyChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  classifyChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classifyChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  classifyChipText: {
    ...Typography.captionMd,
    color: Colors.text,
  },
  classifyChipTextActive: {
    color: '#fff',
  },
  chatListContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  dateWrap: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    backgroundColor: '#eef0f4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#eceff3',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginBottom: 8,
    maxWidth: '90%',
  },
  systemText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  messageRow: {
    marginBottom: 8,
    maxWidth: '84%',
  },
  messageRowGrouped: {
    marginBottom: 3,
  },
  messageRowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  tapTimestampWrap: {
    marginBottom: 4,
  },
  tapTimestampText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    backgroundColor: '#eceff3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  inputBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 110,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    color: Colors.text,
    ...Typography.body,
  },
  sendBtn: {
    marginLeft: 6,
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
