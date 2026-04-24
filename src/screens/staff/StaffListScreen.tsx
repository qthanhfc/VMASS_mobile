import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import { ChipRow, Avatar, FAB, Card } from '../../components';
import { ManageStackParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<ManageStackParamList>;

const STATUS_COLORS: Record<string, string> = { online: Colors.success, offline: Colors.textSecondary, break: Colors.warning };
const STATUS_LABELS: Record<string, string> = { online: 'Đang làm', offline: 'Offline', break: 'Nghỉ giải lao' };

const MOCK_STAFF = [
  { id: 1, name: 'Nguyễn Minh Tú', role: 'Nhân viên bán hàng', branch: 'CN Quận 1', status: 'online', phone: '0901111111', checkedIn: true },
  { id: 2, name: 'Trần Thị Bích', role: 'Thu ngân', branch: 'CN Quận 1', status: 'online', phone: '0902222222', checkedIn: true },
  { id: 3, name: 'Lê Văn Đức', role: 'Quản lý kho', branch: 'Kho trung tâm', status: 'break', phone: '0903333333', checkedIn: true },
  { id: 4, name: 'Phạm Thị Nga', role: 'Nhân viên bán hàng', branch: 'CN Quận 3', status: 'offline', phone: '0904444444', checkedIn: false },
];

const ROLE_CHIPS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'nvbh', label: 'NVBH' },
  { key: 'cashier', label: 'Thu ngân' },
  { key: 'warehouse', label: 'Kho' },
  { key: 'manager', label: 'Quản lý' },
];

export function StaffListScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [roleFilter, setRoleFilter] = useState('all');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhân viên</Text>
        <TouchableOpacity onPress={() => nav.navigate('StaffEdit', {})} style={styles.iconBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Attendance card */}
      <View style={{ padding: Spacing.lg, paddingTop: 12 }}>
        <Card padding={14}>
          <Text style={styles.sectionLabel}>CHẤM CÔNG HÔM NAY</Text>
          <View style={styles.attendanceRow}>
            {[
              { label: 'Đã chấm', value: '3', color: Colors.success },
              { label: 'Chưa chấm', value: '1', color: Colors.textSecondary },
              { label: 'Nghỉ phép', value: '0', color: Colors.warning },
              { label: 'Đi muộn', value: '1', color: Colors.danger },
            ].map(s => (
              <View key={s.label} style={styles.attendStat}>
                <Text style={[styles.attendVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.attendLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <ChipRow chips={ROLE_CHIPS} selected={roleFilter} onSelect={setRoleFilter} />

      <FlatList
        data={MOCK_STAFF}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => nav.navigate('StaffEdit', { id: item.id })}>
            <View style={{ position: 'relative', marginRight: 12 }}>
              <Avatar name={item.name} size={44} />
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
              <Text style={styles.branch}>{item.branch} · {STATUS_LABELS[item.status]}</Text>
            </View>
            <TouchableOpacity style={styles.phoneBtn}>
              <Ionicons name="call-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: 72 }} />}
      />
      <FAB onPress={() => nav.navigate('StaffEdit', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { marginRight: 8, padding: 4 },
  headerTitle: { ...Typography.h3, flex: 1 },
  iconBtn: { padding: 4 },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary, letterSpacing: 0.6, marginBottom: 10 },
  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  attendStat: { alignItems: 'center' },
  attendVal: { ...Typography.h3, fontSize: 22 },
  attendLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.card },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.card },
  name: { ...Typography.bodyMd },
  role: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  branch: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  phoneBtn: { padding: 8 },
});
