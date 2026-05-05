import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography, useThemeMode } from '../../theme';
import { useLanguage, type TranslationKey } from '../../i18n';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type Route = RouteProp<ManageStackParamList, 'PromotionEdit'>;
type PromotionType = 'percent' | 'flat' | 'bogo' | 'combo';
type ScopeType = 'all' | 'category' | 'sku' | 'tier';

type PromoTypeOption = {
  key: PromotionType;
  labelKey: TranslationKey;
  value: string;
};

const TYPES: PromoTypeOption[] = [
  { key: 'percent', labelKey: 'promotions.type.percent', value: '20%' },
  { key: 'flat', labelKey: 'promotions.type.flat', value: '₫' },
  { key: 'bogo', labelKey: 'promotions.type.bogo', value: 'X+Y' },
  { key: 'combo', labelKey: 'promotions.type.combo', value: '◇' },
];

const MOCK_PROMOTIONS: Record<number, {
  name: string;
  code: string;
  type: PromotionType;
  value: string;
  maxDiscount: string;
  minOrder: string;
  usageLimit: string;
  perCustomer: string;
  priority: string;
  startDate: string;
  endDate: string;
}> = {
  1: {
    name: 'Giảm 20% toàn bộ đồ uống',
    code: 'DRINK20',
    type: 'percent',
    value: '20',
    maxDiscount: '100.000',
    minOrder: '50.000',
    usageLimit: '500',
    perCustomer: '3',
    priority: 'Cao',
    startDate: '15/12/2025 00:00',
    endDate: '31/12/2025 23:59',
  },
};

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('vi-VN') : '';
};

export function PromotionEditScreen() {
  const { colors } = useThemeMode();
  const { locale, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const vi = locale === 'vi';
  const existing = route.params?.id ? MOCK_PROMOTIONS[route.params.id] : undefined;
  const isEdit = Boolean(existing);

  const [type, setType] = useState<PromotionType>(existing?.type ?? 'percent');
  const [scope, setScope] = useState<ScopeType>('category');
  const [name, setName] = useState(existing?.name ?? (vi ? 'Giảm 20% toàn bộ đồ uống' : '20% off all beverages'));
  const [code, setCode] = useState(existing?.code ?? 'DRINK20');
  const [priority, setPriority] = useState(existing?.priority ?? (vi ? 'Cao' : 'High'));
  const [value, setValue] = useState(existing?.value ?? '20');
  const [maxDiscount, setMaxDiscount] = useState(existing?.maxDiscount ?? '100.000');
  const [minOrder, setMinOrder] = useState(existing?.minOrder ?? '50.000');
  const [startDate, setStartDate] = useState(existing?.startDate ?? '15/12/2025 00:00');
  const [endDate, setEndDate] = useState(existing?.endDate ?? '31/12/2025 23:59');
  const [usageLimit, setUsageLimit] = useState(existing?.usageLimit ?? '500');
  const [perCustomer, setPerCustomer] = useState(existing?.perCustomer ?? '3');
  const [channels, setChannels] = useState({
    pos: true,
    shopee: true,
    tiktok: true,
    web: false,
    stackable: false,
  });
  const [categories, setCategories] = useState([
    vi ? 'Đồ uống' : 'Beverage',
    vi ? 'Cà phê' : 'Coffee',
    vi ? 'Nước ngọt' : 'Soft drinks',
  ]);

  const title = isEdit ? (vi ? 'Sửa khuyến mãi' : 'Edit promotion') : t('promotions.createTitle');
  const previewDiscount = useMemo(() => {
    if (type === 'percent') return `${value || '?'}%`;
    if (type === 'flat') return `${value || '?'}K`;
    if (type === 'bogo') return 'X+Y';
    return 'COMBO';
  }, [type, value]);

  const previewText = useMemo(() => {
    if (name.trim()) return name.trim();
    if (type === 'percent') return t('promotions.preview.percent', { value: value || '?' });
    if (type === 'flat') return t('promotions.preview.flat', { value: value || '?' });
    if (type === 'bogo') return t('promotions.preview.bogo');
    return t('promotions.preview.combo');
  }, [name, t, type, value]);

  const updateChannel = (key: keyof typeof channels) =>
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));

  const removeCategory = (category: string) =>
    setCategories(prev => prev.filter(item => item !== category));

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('promotions.nameRequired'));
      return;
    }

    Alert.alert(
      vi ? 'Đã lưu' : 'Saved',
      vi ? 'Chương trình khuyến mãi đã được cập nhật.' : 'Promotion has been updated.',
      [{ text: 'OK', onPress: () => nav.goBack() }],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {code || 'KM-012'} · {vi ? 'Nháp' : 'Draft'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.savePill}>
          <Text style={styles.savePillText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewCard}>
          <View style={styles.previewSheen} />
          <View style={styles.discountBox}>
            <Text style={styles.discountValue} numberOfLines={1}>{previewDiscount}</Text>
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewKicker}>{vi ? 'XEM TRƯỚC' : 'PREVIEW'}</Text>
            <Text style={styles.previewTitle} numberOfLines={2}>{previewText}</Text>
            <Text style={styles.previewMeta} numberOfLines={1}>
              {code || 'DRINK20'} · {vi ? 'hết 31/12' : 'ends 31/12'}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            {vi ? 'Thông tin chương trình' : 'Program info'}
          </Text>
          <Field label={vi ? 'Tên chương trình' : 'Name'} value={name} onChangeText={setName} placeholder={t('promotions.namePlaceholder')} />
          <View style={styles.twoCol}>
            <Field label={vi ? 'Mã KM' : 'Code'} value={code} onChangeText={setCode} placeholder="DRINK20" mono autoCapitalize="characters" />
            <Field label={vi ? 'Ưu tiên' : 'Priority'} value={priority} onChangeText={setPriority} placeholder={vi ? 'Cao' : 'High'} rightIcon="chevron-down" />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            ▣ {vi ? 'Kiểu giảm giá' : 'Discount type'}
          </Text>
          <View style={styles.typeGrid}>
            {TYPES.map(item => {
              const active = type === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setType(item.key)}
                  style={[
                    styles.typeOption,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    active && styles.optionActive,
                  ]}
                >
                  <Text style={[styles.typeValue, { color: colors.text }, active && styles.optionTextActive]}>{item.value}</Text>
                  <Text style={[styles.typeLabel, { color: colors.textSecondary }, active && styles.optionTextActive]} numberOfLines={1}>
                    {t(item.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.twoCol}>
            <Field
              label={vi ? 'Giá trị giảm' : 'Discount value'}
              value={value}
              onChangeText={setValue}
              placeholder={type === 'percent' ? '20' : '50'}
              keyboardType="numeric"
              mono
              highlight
              suffix={type === 'percent' ? '%' : type === 'flat' ? 'K' : undefined}
            />
            <Field
              label={vi ? 'Giảm tối đa' : 'Max discount'}
              value={maxDiscount}
              onChangeText={text => setMaxDiscount(formatCurrencyInput(text))}
              placeholder="100.000"
              keyboardType="numeric"
              mono
              suffix="đ"
            />
          </View>
          <Field
            label={vi ? 'Đơn tối thiểu' : 'Min order'}
            value={minOrder}
            onChangeText={text => setMinOrder(formatCurrencyInput(text))}
            placeholder="50.000"
            keyboardType="numeric"
            suffix="đ"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            ◷ {vi ? 'Thời gian' : 'Schedule'}
          </Text>
          <View style={styles.twoCol}>
            <Field label={t('promotions.startDate')} value={startDate} onChangeText={setStartDate} placeholder="dd/mm/yyyy" mono />
            <Field label={t('promotions.endDate')} value={endDate} onChangeText={setEndDate} placeholder="dd/mm/yyyy" mono />
          </View>
          <View style={styles.twoCol}>
            <Field label={vi ? 'Lượt dùng tối đa' : 'Max uses'} value={usageLimit} onChangeText={setUsageLimit} keyboardType="numeric" mono />
            <Field label={vi ? 'Mỗi khách / lần' : 'Per customer'} value={perCustomer} onChangeText={setPerCustomer} keyboardType="numeric" mono />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            ◎ {vi ? 'Áp dụng cho' : 'Apply to'}
          </Text>
          <View style={styles.scopeGrid}>
            {[
              { key: 'all', label: vi ? 'Tất cả SP' : 'All products' },
              { key: 'category', label: vi ? 'Theo danh mục' : 'By category' },
              { key: 'sku', label: vi ? 'SP cụ thể' : 'Specific SKUs' },
              { key: 'tier', label: vi ? 'Hạng KH' : 'Customer tier' },
            ].map(item => {
              const active = scope === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setScope(item.key as ScopeType)}
                  style={[
                    styles.scopeOption,
                    { borderColor: colors.border },
                    active && styles.scopeOptionActive,
                  ]}
                >
                  <Text style={[styles.scopeLabel, { color: colors.text }, active && styles.scopeLabelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.categoryChips}>
            {categories.map(category => (
              <TouchableOpacity key={category} onPress={() => removeCategory(category)} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{category}</Text>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.addCategoryChip, { borderColor: colors.border }]}
              onPress={() => setCategories(prev => [...prev, vi ? 'Danh mục mới' : 'New category'])}
            >
              <Ionicons name="add" size={14} color={colors.textSecondary} />
              <Text style={[styles.addCategoryText, { color: colors.textSecondary }]}>
                {vi ? 'Thêm danh mục' : 'Add category'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            ◌ {t('promotions.salesChannels')}
          </Text>
          <ToggleItem label={vi ? 'Tại cửa hàng (POS)' : 'In-store (POS)'} value={channels.pos} onPress={() => updateChannel('pos')} />
          <ToggleItem label="Shopee" value={channels.shopee} onPress={() => updateChannel('shopee')} />
          <ToggleItem label="TikTok Shop" value={channels.tiktok} onPress={() => updateChannel('tiktok')} />
          <ToggleItem label="Website / App" value={channels.web} onPress={() => updateChannel('web')} />
          <ToggleItem label={vi ? 'Kết hợp với KM khác' : 'Stack with other promos'} value={channels.stackable} onPress={() => updateChannel('stackable')} last />
        </View>
      </ScrollView>
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  mono?: boolean;
  highlight?: boolean;
  suffix?: string;
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
};

function Field({ label, mono, highlight, suffix, rightIcon, style, ...props }: FieldProps) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          { backgroundColor: colors.card, borderColor: colors.border },
          highlight && styles.fieldBoxHighlight,
        ]}
      >
        <TextInput
          {...props}
          style={[styles.fieldInput, mono && styles.fieldInputMono, { color: colors.text }, style]}
          placeholderTextColor={colors.textSecondary}
        />
        {suffix && <Text style={[styles.fieldSuffix, { color: colors.textSecondary }]}>{suffix}</Text>}
        {rightIcon && <Ionicons name={rightIcon} size={15} color={colors.textSecondary} />}
      </View>
    </View>
  );
}

type ToggleItemProps = {
  label: string;
  value: boolean;
  onPress: () => void;
  last?: boolean;
};

function ToggleItem({ label, value, onPress, last = false }: ToggleItemProps) {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.toggleRow, { borderBottomColor: colors.border }, !last && styles.toggleRowBorder]}
    >
      <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.toggleTrack, { borderColor: colors.border }, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, { borderColor: colors.border }, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  headerSub: {
    ...Typography.caption,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  savePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  savePillText: {
    ...Typography.bodySm,
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
    gap: 10,
  },
  previewCard: {
    minHeight: 92,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  previewSheen: {
    position: 'absolute',
    right: -34,
    top: -50,
    width: 142,
    height: 180,
    backgroundColor: Colors.accent,
    opacity: 0.88,
    transform: [{ rotate: '28deg' }],
  },
  discountBox: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountValue: {
    ...Typography.h4,
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  previewInfo: {
    flex: 1,
    minWidth: 0,
  },
  previewKicker: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.86)',
    letterSpacing: 0.4,
    fontWeight: '800',
  },
  previewTitle: {
    ...Typography.bodyMd,
    color: '#fff',
    fontWeight: '800',
    marginTop: 3,
  },
  previewMeta: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'monospace',
    marginTop: 3,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldWrap: {
    flex: 1,
    marginTop: 6,
    marginBottom: 2,
  },
  fieldLabel: {
    ...Typography.captionMd,
    marginBottom: 5,
  },
  fieldBox: {
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  fieldBoxHighlight: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  fieldInputMono: {
    fontFamily: 'monospace',
  },
  fieldSuffix: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    minHeight: 64,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  typeValue: {
    ...Typography.bodyMd,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  typeLabel: {
    ...Typography.label,
    marginTop: 3,
    letterSpacing: 0,
    fontWeight: '800',
    textAlign: 'center',
  },
  optionTextActive: {
    color: Colors.primary,
  },
  scopeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  scopeOption: {
    width: '48.9%',
    minHeight: 38,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scopeOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  scopeLabel: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  scopeLabelActive: {
    color: Colors.primary,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryChipText: {
    ...Typography.captionMd,
    color: '#fff',
    fontWeight: '800',
  },
  addCategoryChip: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addCategoryText: {
    ...Typography.captionMd,
    fontWeight: '800',
  },
  toggleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  toggleRowBorder: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  toggleLabel: {
    ...Typography.bodySm,
    flex: 1,
    paddingRight: 12,
    fontWeight: '600',
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#cfcfcf',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
});
