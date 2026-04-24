import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { SearchBar, StatusBadge, FAB } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const MOCK_SUPPLIERS = [
  { id: 1, name: 'Công ty CP Thời Trang Việt', phone: '02812345678', contactPerson: 'Anh Hùng', category: 'Thời trang', currentDebt: 15000000, totalOrders: 24, status: 'active' },
  { id: 2, name: 'NCC Thực Phẩm Sạch', phone: '02823456789', contactPerson: 'Chị Lan', category: 'Thực phẩm', currentDebt: 0, totalOrders: 38, status: 'active' },
  { id: 3, name: 'Mỹ Phẩm Hàn Quốc', phone: '02834567890', contactPerson: 'Anh Tuấn', category: 'Mỹ phẩm', currentDebt: 8500000, totalOrders: 15, status: 'active' },
  { id: 4, name: 'Công ty Điện Tử ABC', phone: '02845678901', contactPerson: 'Chị Hoa', category: 'Điện tử', currentDebt: 0, totalOrders: 7, status: 'inactive' },
];

export function SuppliersListScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');

  const filtered = MOCK_SUPPLIERS.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const totalDebt = MOCK_SUPPLIERS.reduce((sum, s) => sum + s.currentDebt, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhà cung cấp</Text>
        <TouchableOpacity onPress={() => nav.navigate('SupplierEdit', {})} style={styles.iconBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryVal}>{MOCK_SUPPLIERS.length}</Text>
          <Text style={styles.summaryLabel}>Nhà cung cấp</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftWidth: 1, borderLeftColor: Colors.border }]}>
          <Text style={[styles.summaryVal, totalDebt > 0 && { color: Colors.danger }]}>
            {(totalDebt / 1000000).toFixed(1)}M đ
          </Text>
          <Text style={styles.summaryLabel}>Tổng công nợ</Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Tìm nhà cung cấp..." />

      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => nav.navigate('SupplierEdit', { id: item.id })}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>{item.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={[styles.catBadge]}><Text style={styles.catLabel}>{item.category}</Text></View>
              </View>
              <Text style={styles.contact}>{item.contactPerson} · {item.phone}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>{item.totalOrders} đơn nhập</Text>
                {item.currentDebt > 0 && (
                  <Text style={{ ...Typography.captionMd, color: Colors.danger }}>
                    Nợ: {item.currentDebt.toLocaleString('vi-VN')}đ
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.textSecondary }]} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
      />
      <FAB onPress={() => nav.navigate('SupplierEdit', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { padding: 4 },
  summaryRow: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryVal: { ...Typography.h2, color: Colors.text },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.card, gap: 12 },
  logo: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  logoText: { ...Typography.h3, color: Colors.primary },
  name: { ...Typography.bodyMd, flex: 1 },
  contact: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  catLabel: { ...Typography.label, color: Colors.primary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
