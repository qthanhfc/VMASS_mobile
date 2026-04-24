import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { FormField, Card, SectionHeader, ToggleRow } from '../../components';

const TYPES = [{ key: 'percent', label: '% Giảm' }, { key: 'flat', label: 'Giảm cố định' }, { key: 'bogo', label: 'Mua 1 tặng 1' }, { key: 'combo', label: 'Combo' }];
const CHANNELS = ['POS', 'Shopee', 'Lazada', 'TikTok', 'Online'];

export function PromotionEditScreen() {
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

  const previewText = type === 'percent' ? `Giảm ${value || '?'}%` :
    type === 'flat' ? `Giảm ${value || '?'} đ` :
    type === 'bogo' ? 'Mua 1 tặng 1' : 'Ưu đãi combo';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo khuyến mãi</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>Lưu</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16, paddingBottom: 40 }}>
        {/* Preview banner */}
        <View style={styles.preview}>
          <Text style={styles.previewText}>{previewText}</Text>
          {name ? <Text style={styles.previewName}>{name}</Text> : null}
        </View>

        <Card padding={14}>
          <SectionHeader title="LOẠI KHUYẾN MÃI" />
          <View style={styles.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setType(t.key)}
                style={[styles.typeChip, type === t.key && styles.typeActive]}>
                <Text style={[styles.typeLabel, type === t.key && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card padding={14}>
          <FormField label="Tên chương trình *" value={name} onChangeText={setName} placeholder="VD: Giảm giá cuối tuần" />
          {(type === 'percent' || type === 'flat') && (
            <FormField label={type === 'percent' ? 'Giá trị giảm (%)' : 'Số tiền giảm (đ)'} value={value} onChangeText={setValue} placeholder={type === 'percent' ? '10' : '50000'} keyboardType="numeric" />
          )}
          <FormField label="Mã khuyến mãi (tùy chọn)" value={code} onChangeText={setCode} placeholder="SALE10" hint="Để trống nếu không cần mã" />
          <FormField label="Giới hạn lượt dùng (0 = không giới hạn)" value={limit} onChangeText={setLimit} placeholder="100" keyboardType="numeric" />
        </Card>

        <Card padding={14}>
          <SectionHeader title="THỜI GIAN ÁP DỤNG" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Từ ngày" value="" onChangeText={() => {}} placeholder="dd/mm/yyyy" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Đến ngày" value="" onChangeText={() => {}} placeholder="dd/mm/yyyy" />
            </View>
          </View>
        </Card>

        <Card padding={14}>
          <SectionHeader title="KÊNH BÁN" />
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
