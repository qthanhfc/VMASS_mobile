import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { FormField, Card, SectionHeader } from '../../components';

const REASONS = ['Lỗi sản phẩm', 'Không vừa size', 'Hết hạn sử dụng', 'Giao sai hàng', 'Không như mô tả', 'Khác'];
const REFUND_METHODS = ['Tiền mặt', 'Chuyển khoản', 'Hoàn điểm tích lũy'];

export function ReturnCreateScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [orderNum, setOrderNum] = useState('');
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('Tiền mặt');
  const [notes, setNotes] = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo phiếu trả hàng</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>Tạo</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16, paddingBottom: 40 }}>
        <Card padding={14}>
          <SectionHeader title="ĐƠN HÀNG GỐC" />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <FormField label="Mã đơn hàng" value={orderNum} onChangeText={setOrderNum} placeholder="DH00000001" />
            </View>
            <TouchableOpacity style={styles.searchBtn}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Card>

        <Card padding={14}>
          <SectionHeader title="LÝ DO TRẢ HÀNG" />
          <View style={styles.reasonGrid}>
            {REASONS.map(r => (
              <TouchableOpacity key={r} onPress={() => setReason(r)}
                style={[styles.reasonChip, reason === r && styles.reasonActive]}>
                <Text style={[styles.reasonLabel, reason === r && { color: '#fff' }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card padding={14}>
          <SectionHeader title="HÌNH THỨC HOÀN TIỀN" />
          <View style={styles.methodRow}>
            {REFUND_METHODS.map(m => (
              <TouchableOpacity key={m} onPress={() => setRefundMethod(m)}
                style={[styles.methodChip, refundMethod === m && styles.methodActive]}>
                <Text style={[styles.methodLabel, refundMethod === m && { color: '#fff' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card padding={14}>
          <FormField label="Ghi chú" value={notes} onChangeText={setNotes} placeholder="Thêm ghi chú..." multiline numberOfLines={3} />
        </Card>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Số tiền hoàn trả</Text>
          <Text style={styles.summaryVal}>0 đ</Text>
        </View>
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
  searchBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  reasonChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  reasonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  reasonLabel: { ...Typography.captionMd, color: Colors.textSecondary },
  methodRow: { flexDirection: 'column', gap: 8, marginTop: 8 },
  methodChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  methodActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodLabel: { ...Typography.bodyMd, color: Colors.textSecondary },
  summaryCard: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: 16, alignItems: 'center' },
  summaryLabel: { ...Typography.captionMd, color: Colors.primary },
  summaryVal: { ...Typography.h2, color: Colors.primary, marginTop: 4 },
});
