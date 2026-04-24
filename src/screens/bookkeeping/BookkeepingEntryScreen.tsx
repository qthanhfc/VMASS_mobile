import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import { FormField, Card } from '../../components';

const INCOME_CATS = [{ icon: 'cart-outline', label: 'Bán hàng' }, { icon: 'trending-up-outline', label: 'Doanh thu khác' }, { icon: 'gift-outline', label: 'Hoa hồng' }, { icon: 'wallet-outline', label: 'Thu nợ' }, { icon: 'refresh-outline', label: 'Hoàn trả' }, { icon: 'add-circle-outline', label: 'Khác' }];
const EXPENSE_CATS = [{ icon: 'bag-handle-outline', label: 'Nhập hàng' }, { icon: 'people-outline', label: 'Lương' }, { icon: 'home-outline', label: 'Thuê mặt bằng' }, { icon: 'flash-outline', label: 'Điện/nước' }, { icon: 'car-outline', label: 'Vận chuyển' }, { icon: 'remove-circle-outline', label: 'Khác' }];
const ACCOUNTS = ['Tiền mặt', 'Ngân hàng', 'Thẻ tín dụng'];

export function BookkeepingEntryScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [account, setAccount] = useState('Tiền mặt');
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi chép kế toán</Text>
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveTxt}>Lưu</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Type toggle */}
        <View style={styles.typeRow}>
          <TouchableOpacity onPress={() => setType('income')} style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}>
            <Ionicons name="trending-up" size={18} color={type === 'income' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeLabel, type === 'income' && { color: '#fff' }]}>Thu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setType('expense')} style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}>
            <Ionicons name="trending-down" size={18} color={type === 'expense' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeLabel, type === 'expense' && { color: '#fff' }]}>Chi</Text>
          </TouchableOpacity>
        </View>

        {/* Amount display */}
        <View style={[styles.amountDisplay, { backgroundColor: type === 'income' ? Colors.success : Colors.danger }]}>
          <Text style={styles.amountLabel}>{type === 'income' ? 'Số tiền thu' : 'Số tiền chi'}</Text>
          <Text style={styles.amountVal}>{amount ? Number(amount.replace(/\D/g, '')).toLocaleString('vi-VN') : '0'} đ</Text>
        </View>

        <View style={{ padding: Spacing.lg, gap: 16 }}>
          <View>
            <Text style={styles.sectionLabel}>DANH MỤC</Text>
            <View style={styles.catGrid}>
              {cats.map(c => (
                <TouchableOpacity key={c.label} onPress={() => setCategory(c.label)}
                  style={[styles.catItem, category === c.label && styles.catItemActive]}>
                  <Ionicons name={c.icon as any} size={22} color={category === c.label ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.catLabel, category === c.label && { color: Colors.primary }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Card padding={14}>
            <FormField label="Số tiền (đ)" value={amount} onChangeText={setAmount} placeholder="1.000.000" keyboardType="numeric" />
            <FormField label="Mô tả" value={desc} onChangeText={setDesc} placeholder="Nhập mô tả giao dịch" />
            <FormField label="Đối tác" value="" onChangeText={() => {}} placeholder="Tên khách hàng / NCC" />
          </Card>

          <View>
            <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>
            <View style={styles.accountRow}>
              {ACCOUNTS.map(a => (
                <TouchableOpacity key={a} onPress={() => setAccount(a)}
                  style={[styles.accountChip, account === a && styles.accountActive]}>
                  <Text style={[styles.accountLabel, account === a && { color: '#fff' }]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  typeRow: { flexDirection: 'row', margin: Spacing.lg, gap: 8 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  typeBtnActiveIncome: { backgroundColor: Colors.success, borderColor: Colors.success },
  typeBtnActiveExpense: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  typeLabel: { ...Typography.bodyMd, color: Colors.textSecondary },
  amountDisplay: { alignItems: 'center', paddingVertical: 24, marginHorizontal: Spacing.lg, borderRadius: Radius.lg },
  amountLabel: { ...Typography.captionMd, color: 'rgba(255,255,255,0.8)' },
  amountVal: { ...Typography.h1, color: '#fff', marginTop: 4 },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.6, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: { alignItems: 'center', width: '28%', padding: 12, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  catItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  catLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  accountRow: { flexDirection: 'row', gap: 8 },
  accountChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  accountActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  accountLabel: { ...Typography.captionMd, color: Colors.textSecondary },
});
