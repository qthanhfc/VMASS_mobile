import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import { useLanguage } from '../../i18n';
import { ManageStackParamList } from '../../navigation';
import { useRealtimeRefresh } from '../../realtime';
import {
  ApiError,
  createPromotion,
  listCategories,
  listProducts,
  listPromotions,
  serializePromotionRules,
  updatePromotion,
  type PromotionKind,
  type PromotionOptionItem,
  type PromotionRule,
  type PromotionRuleType,
  type ProductCategory,
} from '../../services';
import type { Product } from '../../types';
import {
  DAY_LABELS,
  RULE_TYPES,
  discountPreview,
  firstErrorKey,
  formatCurrencyInput,
  formatDateTimeInput,
  getDefaultRules,
  isGiftRule,
  normalizePromotionForForm,
  parseDateTimeInput,
  validatePromotionForm,
  type PromotionFieldErrors,
} from './promotionFormModel';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type Route = RouteProp<ManageStackParamList, 'PromotionEdit'>;

type PickerTarget = {
  ruleId: string;
  field: keyof PromotionRule;
  mode: 'product' | 'category';
  quantityEnabled?: boolean;
};

export function PromotionEditScreen() {
  const { colors } = useThemeMode();
  const { locale, t } = useLanguage();
  const vi = locale === 'vi';
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const editingId = route.params?.id;
  const isEdit = Boolean(editingId);

  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [promotionType, setPromotionType] = useState<PromotionKind>('DISCOUNT');
  const [ruleType, setRuleType] = useState<PromotionRuleType>('total-order-value');
  const [name, setName] = useState(vi ? 'Giảm giá cuối tuần' : 'Weekend discount');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [perCustomer, setPerCustomer] = useState('1');
  const [startDate, setStartDate] = useState(formatDateTimeInput(new Date().toISOString()));
  const [endDate, setEndDate] = useState(formatDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()));
  const [isAutoUse, setIsAutoUse] = useState(false);
  const [isStackable, setIsStackable] = useState(false);
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [activeTimeStart, setActiveTimeStart] = useState('');
  const [activeTimeEnd, setActiveTimeEnd] = useState('');
  const [rules, setRules] = useState<PromotionRule[]>(getDefaultRules('total-order-value'));
  const [fieldErrors, setFieldErrors] = useState<PromotionFieldErrors>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const activeOptions = useMemo(
    () => RULE_TYPES.filter((option) => option.kind === promotionType),
    [promotionType],
  );

  const loadPromotion = useCallback(async () => {
    if (!editingId) return;
    setLoading(true);
    setLoadError('');

    try {
      const result = await listPromotions({ pageSize: 500, currentPage: 1, search: '' });
      const found = result.items.find((item) => item.id === editingId);
      if (!found) throw new Error(t('promotions.detailLoadError'));

      const form = normalizePromotionForForm(found);
      setPromotionType(form.promotionType);
      setRuleType(form.ruleType);
      setName(form.name);
      setCode(form.code);
      setDescription(form.description);
      setUsageLimit(form.usageLimit);
      setPerCustomer(form.perCustomer);
      setStartDate(form.startDate);
      setEndDate(form.endDate);
      setIsAutoUse(form.isAutoUse);
      setIsStackable(form.isStackable);
      setActiveDays(form.activeDays);
      setActiveTimeStart(form.activeTimeStart);
      setActiveTimeEnd(form.activeTimeEnd);
      setRules(form.rules.length ? form.rules : getDefaultRules(form.ruleType));
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : t('promotions.detailLoadError');
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [editingId, t]);

  useEffect(() => {
    loadPromotion();
  }, [loadPromotion]);
  useRealtimeRefresh(['promotions'], loadPromotion);

  useEffect(() => {
    let mounted = true;

    const loadCatalogs = async () => {
      setCatalogLoading(true);
      try {
        const [productResult, categoryResult] = await Promise.all([
          listProducts({ pageSize: 200, currentPage: 1, search: '' }),
          listCategories(''),
        ]);
        if (!mounted) return;
        setProducts(productResult.items);
        setCategories(categoryResult);
      } catch {
        if (!mounted) return;
        setProducts([]);
        setCategories([]);
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    };

    loadCatalogs();

    return () => {
      mounted = false;
    };
  }, []);

  const title = isEdit ? (vi ? 'Sửa khuyến mãi' : 'Edit promotion') : t('promotions.createTitle');
  const selectedRuleLabel = t(RULE_TYPES.find((option) => option.key === ruleType)?.labelKey || 'promotions.type.totalOrderValue');
  const previewDiscount = discountPreview(rules[0] || getDefaultRules(ruleType)[0], ruleType);
  const previewText = name.trim() || selectedRuleLabel;

  const updateRule = (id: string, patch: Partial<PromotionRule>) => {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[`rule.${id}.${key}`]);
      return next;
    });
  };

  const setRuleItems = (id: string, key: keyof PromotionRule, items: PromotionOptionItem[]) => {
    updateRule(id, { [key]: items } as Partial<PromotionRule>);
  };

  const openPicker = (target: PickerTarget) => {
    setPickerTarget(target);
  };

  const applyPickerItems = (items: PromotionOptionItem[]) => {
    if (!pickerTarget) return;
    setRuleItems(pickerTarget.ruleId, pickerTarget.field, items);
    setPickerTarget(null);
  };

  const duplicateRule = (rule: PromotionRule) => {
    setRules((prev) => [
      ...prev,
      {
        ...rule,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
    ]);
  };

  const clearError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const applyQuickSchedule = (mode: '7d' | '30d' | 'monthEnd') => {
    const start = new Date();
    const end = new Date(start);
    if (mode === '7d') end.setDate(start.getDate() + 7);
    if (mode === '30d') end.setDate(start.getDate() + 30);
    if (mode === 'monthEnd') {
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 0, 0);
    }
    setStartDate(formatDateTimeInput(start.toISOString()));
    setEndDate(formatDateTimeInput(end.toISOString()));
    clearError('startDate');
    clearError('endDate');
  };

  const handleKindChange = (kind: PromotionKind) => {
    setPromotionType(kind);
    const nextRuleType = RULE_TYPES.find((option) => option.kind === kind)?.key || 'total-order-value';
    setRuleType(nextRuleType);
    setRules(getDefaultRules(nextRuleType));
    setFieldErrors({});
  };

  const handleRuleTypeChange = (nextRuleType: PromotionRuleType) => {
    setRuleType(nextRuleType);
    setRules(getDefaultRules(nextRuleType));
    setFieldErrors({});
  };

  const toggleDay = (day: number) => {
    setActiveDays((prev) => (
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day].sort((a, b) => a - b)
    ));
  };

  const handleSave = async () => {
    const errors = validatePromotionForm({
      name,
      usageLimit,
      perCustomer,
      startDate,
      endDate,
      ruleType,
      rules,
    });
    setFieldErrors(errors);

    const firstError = firstErrorKey(errors);
    if (firstError) {
      Alert.alert(t('common.error'), t(errors[firstError] as any));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        quantity: usageLimit.replace(/\D/g, '') || '0',
        description: description.trim(),
        date_start: parseDateTimeInput(startDate),
        date_end: parseDateTimeInput(endDate),
        promotionType,
        type: ruleType,
        optionDiscount: serializePromotionRules(ruleType, rules),
        isAutoUse,
        isStackable,
        maxUsagePerCustomer: perCustomer.replace(/\D/g, '') || '1',
        activeDays,
        activeTimeStart: activeTimeStart || null,
        activeTimeEnd: activeTimeEnd || null,
        dynamic_form: {},
      };

      if (editingId) {
        await updatePromotion({ id: editingId, ...payload });
        Alert.alert(vi ? 'Đã lưu' : 'Saved', t('promotions.updated'), [{ text: 'OK', onPress: () => nav.goBack() }]);
      } else {
        await createPromotion(payload);
        Alert.alert(vi ? 'Đã lưu' : 'Saved', t('promotions.created'), [{ text: 'OK', onPress: () => nav.goBack() }]);
      }
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : t('promotions.saveError');
      Alert.alert(t('common.error'), message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('promotions.loading')}</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="warning-outline" size={32} color={Colors.danger} />
        <Text style={[styles.errorText, { color: Colors.danger }]}>{loadError}</Text>
        <TouchableOpacity style={styles.retryPill} onPress={loadPromotion}>
          <Text style={styles.retryPillText}>{t('promotions.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {code || 'CTKM-AUTO'} · {selectedRuleLabel}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={[styles.savePill, saving && styles.savePillDisabled]} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.savePillText}>{t('common.save')}</Text>}
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
              {code || 'CTKM-AUTO'} · {selectedRuleLabel}
            </Text>
          </View>
        </View>

        <CardTitle title={t('promotions.basicInfo')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field
            label={vi ? 'Tên chương trình' : 'Name'}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            placeholder={t('promotions.namePlaceholder')}
            error={fieldErrors.name ? t(fieldErrors.name as any) : undefined}
          />
          <Field label={t('promotions.description')} value={description} onChangeText={setDescription} placeholder={vi ? 'Mô tả ngắn' : 'Short description'} />
          <View style={styles.twoCol}>
            <Field label={vi ? 'Mã KM' : 'Code'} value={code} editable={false} placeholder="Backend tự tạo" mono />
            <Field
              label={t('promotions.usageLimit')}
              value={usageLimit}
              onChangeText={(text) => {
                setUsageLimit(text.replace(/\D/g, ''));
                clearError('usageLimit');
              }}
              keyboardType="numeric"
              mono
              error={fieldErrors.usageLimit ? t(fieldErrors.usageLimit as any) : undefined}
            />
          </View>
          <Field
            label={t('promotions.maxPerCustomer')}
            value={perCustomer}
            onChangeText={(text) => {
              setPerCustomer(text.replace(/\D/g, ''));
              clearError('perCustomer');
            }}
            keyboardType="numeric"
            mono
            error={fieldErrors.perCustomer ? t(fieldErrors.perCustomer as any) : undefined}
          />
        </View>

        <CardTitle title={t('promotions.ruleType')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.segment}>
            {(['DISCOUNT', 'GIFT'] as PromotionKind[]).map((kind) => {
              const active = promotionType === kind;
              return (
                <TouchableOpacity key={kind} style={[styles.segmentBtn, active && styles.segmentBtnActive]} onPress={() => handleKindChange(kind)}>
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t(kind === 'DISCOUNT' ? 'promotions.kind.discount' : 'promotions.kind.gift')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.typeGrid}>
            {activeOptions.map((option) => {
              const active = ruleType === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => handleRuleTypeChange(option.key)}
                  style={[
                    styles.typeOption,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    active && styles.optionActive,
                  ]}
                >
                  <Text style={[styles.typeLabel, { color: colors.textSecondary }, active && styles.optionTextActive]} numberOfLines={2}>
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <CardTitle title={t('promotions.rules')} />
        {rules.map((rule, index) => (
          <View key={rule.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.ruleHeader}>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>#{index + 1} · {selectedRuleLabel}</Text>
              <View style={styles.ruleActions}>
                <TouchableOpacity onPress={() => duplicateRule(rule)}>
                  <Text style={styles.duplicateText}>{t('promotions.duplicateRule')}</Text>
                </TouchableOpacity>
                {rules.length > 1 ? (
                  <TouchableOpacity onPress={() => setRules((prev) => prev.filter((item) => item.id !== rule.id))}>
                    <Text style={styles.removeText}>{t('promotions.removeRule')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            <RuleFields
              rule={rule}
              ruleType={ruleType}
              updateRule={updateRule}
              setRuleItems={setRuleItems}
              openPicker={openPicker}
              errors={fieldErrors}
            />
          </View>
        ))}
        <TouchableOpacity style={[styles.addRuleBtn, { borderColor: colors.border }]} onPress={() => setRules((prev) => [...prev, getDefaultRules(ruleType)[0]])}>
          <Ionicons name="add" size={16} color={Colors.primary} />
          <Text style={styles.addRuleText}>{t('promotions.addRule')}</Text>
        </TouchableOpacity>

        <CardTitle title={t('promotions.schedule')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.quickScheduleRow}>
            {[
              { key: '7d' as const, label: t('promotions.quickSchedule.7d') },
              { key: '30d' as const, label: t('promotions.quickSchedule.30d') },
              { key: 'monthEnd' as const, label: t('promotions.quickSchedule.monthEnd') },
            ].map((item) => (
              <TouchableOpacity key={item.key} style={styles.quickScheduleChip} onPress={() => applyQuickSchedule(item.key)}>
                <Text style={styles.quickScheduleText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.twoCol}>
            <Field
              label={t('promotions.startDate')}
              value={startDate}
              onChangeText={(text) => {
                setStartDate(text);
                clearError('startDate');
              }}
              placeholder="dd/mm/yyyy hh:mm"
              mono
              error={fieldErrors.startDate ? t(fieldErrors.startDate as any) : undefined}
            />
            <Field
              label={t('promotions.endDate')}
              value={endDate}
              onChangeText={(text) => {
                setEndDate(text);
                clearError('endDate');
              }}
              placeholder="dd/mm/yyyy hh:mm"
              mono
              error={fieldErrors.endDate ? t(fieldErrors.endDate as any) : undefined}
            />
          </View>
          <View style={styles.twoCol}>
            <Field label={t('promotions.timeStart')} value={activeTimeStart} onChangeText={setActiveTimeStart} placeholder="08:00" mono />
            <Field label={t('promotions.timeEnd')} value={activeTimeEnd} onChangeText={setActiveTimeEnd} placeholder="22:00" mono />
          </View>
          <View style={styles.dayRow}>
            {DAY_LABELS.map((day, index) => {
              const active = activeDays.includes(index);
              return (
                <TouchableOpacity key={day} style={[styles.dayChip, active && styles.dayChipActive]} onPress={() => toggleDay(index)}>
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <CardTitle title={t('promotions.options')} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ToggleItem label={t('promotions.autoUse')} value={isAutoUse} onPress={() => setIsAutoUse((prev) => !prev)} />
          <ToggleItem label={t('promotions.stackable')} value={isStackable} onPress={() => setIsStackable((prev) => !prev)} last />
        </View>
      </ScrollView>

      <PromotionItemPicker
        visible={Boolean(pickerTarget)}
        target={pickerTarget}
        products={products}
        categories={categories}
        loading={catalogLoading}
        selected={
          pickerTarget
            ? (rules.find((rule) => rule.id === pickerTarget.ruleId)?.[pickerTarget.field] as PromotionOptionItem[] | undefined) || []
            : []
        }
        onClose={() => setPickerTarget(null)}
        onApply={applyPickerItems}
      />
    </View>
  );
}

function RuleFields({
  rule,
  ruleType,
  updateRule,
  setRuleItems,
  openPicker,
  errors,
}: {
  rule: PromotionRule;
  ruleType: PromotionRuleType;
  updateRule: (id: string, patch: Partial<PromotionRule>) => void;
  setRuleItems: (id: string, key: keyof PromotionRule, items: PromotionOptionItem[]) => void;
  openPicker: (target: PickerTarget) => void;
  errors: PromotionFieldErrors;
}) {
  const { t } = useLanguage();

  const renderDiscountFields = !isGiftRule(ruleType);
  const errorFor = (field: string) => {
    const key = `rule.${rule.id}.${field}`;
    return errors[key] ? t(errors[key] as any) : undefined;
  };

  return (
    <View>
      <View style={styles.ruleSectionHeader}>
        <Ionicons name="filter-outline" size={14} color={Colors.primary} />
        <Text style={styles.ruleSectionTitle}>{t('promotions.condition')}</Text>
      </View>
      {(ruleType === 'total-order-value' || ruleType === 'total-order-value-get-product') ? (
        <View style={styles.twoCol}>
          <Field label={t('promotions.priceFrom')} value={rule.price_start || ''} onChangeText={(text) => updateRule(rule.id, { price_start: formatCurrencyInput(text) })} keyboardType="numeric" error={errorFor('price_start')} />
          <Field label={t('promotions.priceTo')} value={rule.price_end || ''} onChangeText={(text) => updateRule(rule.id, { price_end: formatCurrencyInput(text) })} keyboardType="numeric" />
        </View>
      ) : null}

      {ruleType === 'quantity-product' ? (
        <Field label={t('promotions.quantity')} value={rule.quantity || ''} onChangeText={(text) => updateRule(rule.id, { quantity: text.replace(/\D/g, '') })} keyboardType="numeric" error={errorFor('quantity')} />
      ) : null}

      {ruleType === 'quantity-type-product' ? (
        <Field label={t('promotions.quantity')} value={rule.quantity_type_product || ''} onChangeText={(text) => updateRule(rule.id, { quantity_type_product: text.replace(/\D/g, '') })} keyboardType="numeric" error={errorFor('quantity_type_product')} />
      ) : null}

      {(ruleType === 'customer-accrual-points' || ruleType === 'customer-accrual-points-get-product') ? (
        <Field label={t('promotions.customerPoint')} value={rule.customer_point || ''} onChangeText={(text) => updateRule(rule.id, { customer_point: text.replace(/\D/g, '') })} keyboardType="numeric" error={errorFor('customer_point')} />
      ) : null}

      {ruleType === 'customer-group-discount' ? (
        <Field
          label={t('promotions.customerGroup')}
          value={typeof rule.customer_group === 'object' ? rule.customer_group.label || '' : String(rule.customer_group || '')}
          onChangeText={(text) => updateRule(rule.id, { customer_group: text })}
          error={errorFor('customer_group')}
        />
      ) : null}

      {ruleType === 'one-product' ? (
        <RuleItemSelector
          label={t('promotions.products')}
          items={rule.product || []}
          error={errorFor('product')}
          onOpen={() => openPicker({ ruleId: rule.id, field: 'product', mode: 'product' })}
          onRemove={(item) => setRuleItems(rule.id, 'product', (rule.product || []).filter((selected) => selected.id !== item.id))}
        />
      ) : null}

      {(ruleType === 'one-type-product' || ruleType === 'quantity-type-product') ? (
        <RuleItemSelector
          label={t('promotions.categories')}
          items={rule.category || []}
          error={errorFor('category')}
          onOpen={() => openPicker({ ruleId: rule.id, field: 'category', mode: 'category' })}
          onRemove={(item) => setRuleItems(rule.id, 'category', (rule.category || []).filter((selected) => selected.id !== item.id))}
        />
      ) : null}

      {ruleType === 'product-get-product' ? (
        <>
          <RuleItemSelector
            label={t('promotions.buyItems')}
            items={rule.pgp_buy || []}
            error={errorFor('pgp_buy')}
            quantityEnabled
            onOpen={() => openPicker({ ruleId: rule.id, field: 'pgp_buy', mode: 'product', quantityEnabled: true })}
            onRemove={(item) => setRuleItems(rule.id, 'pgp_buy', (rule.pgp_buy || []).filter((selected) => selected.id !== item.id))}
          />
        </>
      ) : null}

      <View style={styles.ruleSectionHeader}>
        <Ionicons name={isGiftRule(ruleType) ? 'gift-outline' : 'pricetag-outline'} size={14} color={Colors.accent} />
        <Text style={styles.ruleSectionTitle}>{t('promotions.offer')}</Text>
      </View>

      {ruleType === 'product-get-product' ? (
        <RuleItemSelector
          label={t('promotions.giftItems')}
          items={rule.pgp_gift || []}
          error={errorFor('pgp_gift')}
          quantityEnabled
          onOpen={() => openPicker({ ruleId: rule.id, field: 'pgp_gift', mode: 'product', quantityEnabled: true })}
          onRemove={(item) => setRuleItems(rule.id, 'pgp_gift', (rule.pgp_gift || []).filter((selected) => selected.id !== item.id))}
        />
      ) : null}

      {ruleType === 'total-order-value-get-product' ? (
        <RuleItemSelector
          label={t('promotions.giftItems')}
          items={rule.ogp_gift || []}
          error={errorFor('ogp_gift')}
          quantityEnabled
          onOpen={() => openPicker({ ruleId: rule.id, field: 'ogp_gift', mode: 'product', quantityEnabled: true })}
          onRemove={(item) => setRuleItems(rule.id, 'ogp_gift', (rule.ogp_gift || []).filter((selected) => selected.id !== item.id))}
        />
      ) : null}

      {ruleType === 'customer-accrual-points-get-product' ? (
        <RuleItemSelector
          label={t('promotions.giftItems')}
          items={rule.cpgp_gift || []}
          error={errorFor('cpgp_gift')}
          quantityEnabled
          onOpen={() => openPicker({ ruleId: rule.id, field: 'cpgp_gift', mode: 'product', quantityEnabled: true })}
          onRemove={(item) => setRuleItems(rule.id, 'cpgp_gift', (rule.cpgp_gift || []).filter((selected) => selected.id !== item.id))}
        />
      ) : null}

      {renderDiscountFields ? (
        <>
          <View style={styles.unitRow}>
            {[
              { label: t('promotions.discountUnit.fixed'), value: 1 as const },
              { label: t('promotions.discountUnit.percent'), value: 2 as const },
            ].map((unit) => {
              const active = rule.discount_type === unit.value;
              return (
                <TouchableOpacity key={unit.value} style={[styles.unitBtn, active && styles.unitBtnActive]} onPress={() => updateRule(rule.id, { discount_type: unit.value })}>
                  <Text style={[styles.unitText, active && styles.unitTextActive]}>{unit.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.twoCol}>
            <Field label={t('promotions.discountValue')} value={rule.discount_value || ''} onChangeText={(text) => updateRule(rule.id, { discount_value: rule.discount_type === 2 ? text.replace(/\D/g, '') : formatCurrencyInput(text) })} keyboardType="numeric" error={errorFor('discount_value')} />
            <Field label={t('promotions.maxDiscount')} value={rule.max_discount || ''} onChangeText={(text) => updateRule(rule.id, { max_discount: formatCurrencyInput(text) })} keyboardType="numeric" />
          </View>
        </>
      ) : null}
    </View>
  );
}

function RuleItemSelector({
  label,
  items,
  onOpen,
  onRemove,
  error,
  quantityEnabled = false,
}: {
  label: string;
  items: PromotionOptionItem[];
  onOpen: () => void;
  onRemove: (item: PromotionOptionItem) => void;
  error?: string;
  quantityEnabled?: boolean;
}) {
  const { colors } = useThemeMode();
  const { t } = useLanguage();

  return (
    <View style={styles.selectorWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.86}
        style={[styles.selectorBox, { borderColor: error ? Colors.danger : colors.border, backgroundColor: colors.card }]}
        onPress={onOpen}
      >
        <View style={styles.selectorHeader}>
          <Text style={[styles.selectorCount, { color: items.length ? colors.text : colors.textSecondary }]}>
            {items.length ? t('promotions.selectedCount', { count: items.length }) : label}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
        {items.length ? (
          <View style={styles.selectedChipWrap}>
            {items.map((item) => (
              <TouchableOpacity key={String(item.id ?? item.value ?? item.label)} style={styles.selectedChip} onPress={() => onRemove(item)}>
                <Text style={styles.selectedChipText} numberOfLines={1}>
                  {item.label || item.name || item.value || item.id}
                  {quantityEnabled ? ` x${item.quantity || 1}` : ''}
                </Text>
                <Ionicons name="close" size={13} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function PromotionItemPicker({
  visible,
  target,
  products,
  categories,
  loading,
  selected,
  onClose,
  onApply,
}: {
  visible: boolean;
  target: PickerTarget | null;
  products: Product[];
  categories: ProductCategory[];
  loading: boolean;
  selected: PromotionOptionItem[];
  onClose: () => void;
  onApply: (items: PromotionOptionItem[]) => void;
}) {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<PromotionOptionItem[]>([]);

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setQuery('');
    }
  }, [selected, visible]);

  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rawOptions: PromotionOptionItem[] = target?.mode === 'category'
      ? categories.map((category) => ({
          id: category.id,
          value: category.id,
          label: category.name,
        }))
      : products.map((product) => ({
          id: product.id,
          value: product.id,
          label: product.name,
          sku: product.sku,
        }));

    if (!normalizedQuery) return rawOptions;

    return rawOptions.filter((item) => (
      String(item.label || '').toLowerCase().includes(normalizedQuery) ||
      String(item.sku || '').toLowerCase().includes(normalizedQuery) ||
      String(item.id || '').toLowerCase().includes(normalizedQuery)
    ));
  }, [categories, products, query, target?.mode]);

  const isSelected = (item: PromotionOptionItem) =>
    draft.some((selectedItem) => String(selectedItem.id ?? selectedItem.value) === String(item.id ?? item.value));

  const toggleItem = (item: PromotionOptionItem) => {
    setDraft((prev) => {
      if (prev.some((selectedItem) => String(selectedItem.id ?? selectedItem.value) === String(item.id ?? item.value))) {
        return prev.filter((selectedItem) => String(selectedItem.id ?? selectedItem.value) !== String(item.id ?? item.value));
      }
      return [...prev, { ...item, quantity: target?.quantityEnabled ? item.quantity || '1' : item.quantity }];
    });
  };

  const updateQuantity = (item: PromotionOptionItem, delta: number) => {
    setDraft((prev) => prev.map((selectedItem) => {
      if (String(selectedItem.id ?? selectedItem.value) !== String(item.id ?? item.value)) return selectedItem;
      const nextQty = Math.max(1, Number(selectedItem.quantity || 1) + delta);
      return { ...selectedItem, quantity: String(nextQty) };
    }));
  };

  const title = target?.mode === 'category' ? t('promotions.selectCategories') : t('promotions.selectProducts');
  const placeholder = target?.mode === 'category' ? t('promotions.searchCategories') : t('promotions.searchProducts');
  const empty = target?.mode === 'category' ? t('promotions.noCategoryMatch') : t('promotions.noProductMatch');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={onClose} style={styles.pickerIconBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.pickerTitleWrap}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.pickerSub, { color: colors.textSecondary }]}>
                {t('promotions.selectedCount', { count: draft.length })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onApply(draft)} style={styles.pickerDoneBtn}>
              <Text style={styles.pickerDoneText}>{t('promotions.done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.pickerSearch, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              style={[styles.pickerSearchInput, { color: colors.text }]}
            />
          </View>

          {loading ? (
            <View style={styles.pickerLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id ?? item.value ?? item.label)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={[styles.pickerEmpty, { color: colors.textSecondary }]}>{empty}</Text>}
              renderItem={({ item }) => {
                const selectedItem = draft.find((draftItem) => String(draftItem.id ?? draftItem.value) === String(item.id ?? item.value));
                const active = Boolean(selectedItem);

                return (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    style={[styles.pickerRow, { borderBottomColor: colors.border }, active && styles.pickerRowActive]}
                    onPress={() => toggleItem(item)}
                  >
                    <View style={styles.pickerRowMain}>
                      <Text style={[styles.pickerRowTitle, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
                      <Text style={[styles.pickerRowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {target?.mode === 'category' ? `ID ${item.id}` : `${item.sku || 'SKU'} · ID ${item.id}`}
                      </Text>
                    </View>
                    {target?.quantityEnabled && active ? (
                      <View style={styles.qtyStepper}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item, -1)}>
                          <Ionicons name="remove" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{selectedItem?.quantity || 1}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item, 1)}>
                          <Ionicons name="add" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Ionicons
                        name={active ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={active ? Colors.primary : colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function CardTitle({ title }: { title: string }) {
  const { colors } = useThemeMode();
  return <Text style={[styles.cardSectionTitle, { color: colors.textSecondary }]}>{title}</Text>;
}

type FieldProps = React.ComponentProps<typeof TextInput> & {
  label: string;
  mono?: boolean;
  error?: string;
};

function Field({ label, mono, style, editable = true, error, ...props }: FieldProps) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.fieldBox, { backgroundColor: colors.card, borderColor: error ? Colors.danger : colors.border }, !editable && styles.fieldBoxDisabled]}>
        <TextInput
          {...props}
          editable={editable}
          style={[styles.fieldInput, mono && styles.fieldInputMono, { color: editable ? colors.text : colors.textSecondary }, style]}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function ToggleItem({ label, value, onPress, last = false }: { label: string; value: boolean; onPress: () => void; last?: boolean }) {
  const { colors } = useThemeMode();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.toggleRow, { borderBottomColor: colors.border }, !last && styles.toggleRowBorder]}>
      <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.toggleTrack, { borderColor: colors.border }, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, { borderColor: colors.border }, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText: { ...Typography.bodySm, marginTop: 10 },
  errorText: { ...Typography.bodySm, marginTop: 10, textAlign: 'center' },
  retryPill: { marginTop: 14, borderRadius: Radius.full, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 9 },
  retryPillText: { ...Typography.bodySm, color: '#fff', fontWeight: '800' },
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
  backBtn: { padding: 4 },
  headerMain: { flex: 1 },
  headerTitle: { ...Typography.h3, fontWeight: '700' },
  headerSub: { ...Typography.caption, marginTop: 2, fontFamily: 'monospace' },
  savePill: {
    minWidth: 62,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  savePillDisabled: { opacity: 0.7 },
  savePillText: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 44, gap: 8 },
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
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountValue: { ...Typography.h4, color: '#fff', fontFamily: 'monospace', fontWeight: '800' },
  previewInfo: { flex: 1, minWidth: 0 },
  previewKicker: { ...Typography.label, color: 'rgba(255,255,255,0.86)', fontWeight: '800' },
  previewTitle: { ...Typography.bodyMd, color: '#fff', fontWeight: '800', marginTop: 3 },
  previewMeta: { ...Typography.caption, color: 'rgba(255,255,255,0.86)', fontFamily: 'monospace', marginTop: 3 },
  cardSectionTitle: { ...Typography.label, textTransform: 'uppercase', marginTop: 4, marginBottom: -2 },
  card: { backgroundColor: Colors.card, borderColor: Colors.border, borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.md, ...Shadow.sm },
  twoCol: { flexDirection: 'row', gap: 8 },
  fieldWrap: { flex: 1, marginTop: 6, marginBottom: 2 },
  fieldLabel: { ...Typography.captionMd, marginBottom: 5 },
  fieldBox: {
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  fieldBoxDisabled: { opacity: 0.74 },
  fieldInput: { paddingVertical: 8, fontSize: 13, fontWeight: '700', color: Colors.text },
  fieldInputMono: { fontFamily: 'monospace' },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: 2, backgroundColor: Colors.card, marginBottom: 10 },
  segmentBtn: { flex: 1, borderRadius: 6, paddingVertical: 7, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { ...Typography.captionMd, color: Colors.textSecondary, fontWeight: '800' },
  segmentTextActive: { color: '#fff' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeOption: { width: '48.9%', minHeight: 48, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeLabel: { ...Typography.label, letterSpacing: 0, fontWeight: '800', textAlign: 'center' },
  optionTextActive: { color: Colors.primary },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  ruleTitle: { ...Typography.bodySm, fontWeight: '800', flex: 1 },
  ruleActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  duplicateText: { ...Typography.captionMd, color: Colors.primary, fontWeight: '800' },
  removeText: { ...Typography.captionMd, color: Colors.danger, fontWeight: '800' },
  ruleSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, marginBottom: 2 },
  ruleSectionTitle: { ...Typography.captionMd, color: Colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  addRuleBtn: { minHeight: 42, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  addRuleText: { ...Typography.bodySm, color: Colors.primary, fontWeight: '800' },
  selectorWrap: { marginTop: 6, marginBottom: 2 },
  selectorBox: { minHeight: 44, borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9 },
  selectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  selectorCount: { ...Typography.bodySm, fontWeight: '800', flex: 1 },
  selectedChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  selectedChip: { maxWidth: '100%', borderRadius: Radius.full, backgroundColor: Colors.primary, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedChipText: { ...Typography.captionMd, color: '#fff', fontWeight: '800', maxWidth: 210 },
  unitRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  unitBtn: { flex: 1, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.border, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  unitBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  unitText: { ...Typography.captionMd, color: Colors.textSecondary, fontWeight: '800' },
  unitTextActive: { color: '#fff' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dayChip: { minWidth: 38, minHeight: 32, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayText: { ...Typography.captionMd, color: Colors.textSecondary, fontWeight: '800' },
  dayTextActive: { color: '#fff' },
  quickScheduleRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  quickScheduleChip: { flex: 1, minHeight: 32, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  quickScheduleText: { ...Typography.captionMd, color: Colors.primary, fontWeight: '800' },
  toggleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 },
  toggleRowBorder: { borderBottomWidth: 1, borderStyle: 'dashed' },
  toggleLabel: { ...Typography.bodySm, flex: 1, paddingRight: 12, fontWeight: '600' },
  toggleTrack: { width: 40, height: 22, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#cfcfcf', paddingHorizontal: 2, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleThumb: { width: 16, height: 16, borderRadius: Radius.full, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  fieldError: { ...Typography.caption, color: Colors.danger, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.34)', justifyContent: 'flex-end' },
  pickerSheet: { maxHeight: '84%', minHeight: '62%', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingTop: 12, paddingBottom: 20 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pickerIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pickerTitleWrap: { flex: 1 },
  pickerTitle: { ...Typography.h4, fontWeight: '800' },
  pickerSub: { ...Typography.caption, marginTop: 1 },
  pickerDoneBtn: { borderRadius: Radius.full, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8 },
  pickerDoneText: { ...Typography.bodySm, color: '#fff', fontWeight: '800' },
  pickerSearch: { minHeight: 42, borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  pickerSearchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  pickerLoading: { alignItems: 'center', paddingVertical: 24 },
  pickerEmpty: { ...Typography.bodySm, textAlign: 'center', paddingVertical: 28 },
  pickerRow: { minHeight: 54, borderBottomWidth: 1, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  pickerRowActive: { backgroundColor: Colors.primaryLight },
  pickerRowMain: { flex: 1, minWidth: 0 },
  pickerRowTitle: { ...Typography.bodySm, fontWeight: '800' },
  pickerRowMeta: { ...Typography.caption, marginTop: 2 },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary, overflow: 'hidden' },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  qtyText: { minWidth: 28, textAlign: 'center', color: Colors.primary, fontWeight: '800' },
});
