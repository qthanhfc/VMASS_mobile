import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, useThemeMode } from '../../theme';
import { FormField, Card, SectionHeader, ToggleRow } from '../../components';
import { useLanguage, type TranslationKey } from '../../i18n';

const TYPES = [
  { key: 'percent', labelKey: 'promotions.type.percent' },
  { key: 'flat', labelKey: 'promotions.type.flat' },
  { key: 'bogo', labelKey: 'promotions.type.bogo' },
  { key: 'combo', labelKey: 'promotions.type.combo' },
] as const;
const CHANNELS = ['POS', 'Shopee', 'Lazada', 'TikTok', 'Online'];

export function PromotionEditScreen() {
  const { colors } = useThemeMode();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [type, setType] = useState('percent');
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [limit, setLimit] = useState('');
  const [activeChannels, setActiveChannels] = useState(new Set(['POS', 'Shopee']));

  const toggleChannel = (ch: string) => {
    setActiveChannels(s => { const n = new Set(s); n.has(ch) ? n.delete(ch) : n.add(ch); return n; });
  };

  const previewText = type === 'percent' ? t('promotions.preview.percent', { value: value || '?' }) :
    type === 'flat' ? t('promotions.preview.flat', { value: value || '?' }) :
    type === 'bogo' ? t('promotions.preview.bogo') : t('promotions.preview.combo');

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('promotions.createTitle')}</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>{t('common.save')}</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16, paddingBottom: 40 }}>
        {/* Preview banner */}
        <View style={styles.preview}>
          <Text style={styles.previewText}>{previewText}</Text>
          {name ? <Text style={styles.previewName}>{name}</Text> : null}
        </View>

        <Card padding={14}>
          <SectionHeader title={t('promotions.typeTitle')} />
          <View style={styles.typeGrid}>
            {TYPES.map(item => (
              <TouchableOpacity key={item.key} onPress={() => setType(item.key)}
                style={[styles.typeChip, type === item.key && styles.typeActive]}>
                <Text style={[styles.typeLabel, type === item.key && { color: '#fff' }]}>{t(item.labelKey as TranslationKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card padding={14}>
          <FormField label={t('promotions.nameRequired')} value={name} onChangeText={setName} placeholder={t('promotions.namePlaceholder')} />
          {(type === 'percent' || type === 'flat') && (
            <FormField label={t(type === 'percent' ? 'promotions.percentValue' : 'promotions.flatValue')} value={value} onChangeText={setValue} placeholder={type === 'percent' ? '10' : '50000'} keyboardType="numeric" />
          )}
          <FormField label={t('promotions.codeOptional')} value={code} onChangeText={setCode} placeholder="SALE10" hint={t('promotions.codeHint')} />
          <FormField label={t('promotions.usageLimit')} value={limit} onChangeText={setLimit} placeholder="100" keyboardType="numeric" />
        </Card>

        <Card padding={14}>
          <SectionHeader title={t('promotions.applyTime')} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FormField label={t('promotions.startDate')} value="" onChangeText={() => {}} placeholder="dd/mm/yyyy" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label={t('promotions.endDate')} value="" onChangeText={() => {}} placeholder="dd/mm/yyyy" />
            </View>
          </View>
        </Card>

        <Card padding={14}>
          <SectionHeader title={t('promotions.salesChannels')} />
          <View style={styles.channelRow}>
            {CHANNELS.map(ch => (
              <TouchableOpacity key={ch} onPress={() => toggleChannel(ch)}
                style={[styles.channelChip, activeChannels.has(ch) && styles.channelActive]}>
                <Text style={[styles.channelLabel, activeChannels.has(ch) && { color: '#fff' }]}>{ch}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.primary, borderRadius: Radius.md },
  saveTxt: { ...Typography.bodyMd, color: '#fff' },
  preview: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 20, alignItems: 'center' },
  previewText: { ...Typography.h1, color: '#fff' },
  previewName: { ...Typography.body, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  typeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeLabel: { ...Typography.captionMd, color: Colors.textSecondary },
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  channelChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  channelActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  channelLabel: { ...Typography.captionMd, color: Colors.textSecondary },
});
