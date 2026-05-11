import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, FormField, Header } from '../../components';
import { ManageStackParamList } from '../../navigation';
import { Colors, Radius, Spacing, Typography, useThemeMode } from '../../theme';
import {
  approveReturnRequest,
  executeReturnRequest,
  getReturnRequestDetail,
  rejectReturnRequest,
  type ReturnRequest,
} from '../../services';

type Nav = NativeStackNavigationProp<ManageStackParamList>;
type DetailRoute = RouteProp<ManageStackParamList, 'ReturnDetail'>;

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  completed: 'Đã hoàn tiền',
  cancelled: 'Đã hủy',
};

export function ReturnRequestDetailScreen() {
  const { colors } = useThemeMode();
  const nav = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const requestId = route.params.id;
  const [row, setRow] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const detail = await getReturnRequestDetail(requestId);
      setRow(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được phiếu trả hàng';
      Alert.alert('Lỗi', message, [{ text: 'OK', onPress: () => nav.goBack() }]);
    } finally {
      setLoading(false);
    }
  }, [nav, requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const money = useMemo(
    () => (value: number) => `${(value || 0).toLocaleString('vi-VN')} đ`,
    [],
  );

  const onApprove = async () => {
    if (!row) return;
    try {
      setSubmitting(true);
      await approveReturnRequest(row.id);
      await load();
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Duyệt phiếu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const onReject = async () => {
    if (!row) return;
    if (!rejectReason.trim()) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setSubmitting(true);
      await rejectReturnRequest(row.id, rejectReason.trim());
      await load();
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Từ chối phiếu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const onExecute = async () => {
    if (!row) return;
    try {
      setSubmitting(true);
      await executeReturnRequest(row.id);
      await load();
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Hoàn tiền thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !row) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={`#${row.return_code}`} subtitle={STATUS_LABEL[row.status] || row.status} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.line}>Đơn gốc: {row.source_order_code || 'N/A'}</Text>
          <Text style={styles.line}>Lý do: {row.reason_text || row.reason_key || 'N/A'}</Text>
          <Text style={styles.line}>Ghi chú: {row.notes || 'N/A'}</Text>
          <Text style={styles.line}>Tổng hoàn: {money(row.total_amount)}</Text>
          {row.reject_reason ? <Text style={styles.reject}>Lý do từ chối: {row.reject_reason}</Text> : null}
        </Card>

        <Card padding={0}>
          {(row.items || []).map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.product_name || 'Sản phẩm'}</Text>
                <Text style={styles.itemMeta}>{item.product_sku || 'N/A'} · x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{money(item.line_total)}</Text>
            </View>
          ))}
        </Card>

        {row.status === 'pending' ? (
          <Card>
            <FormField
              label="Lý do từ chối (nếu từ chối)"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Nhập lý do từ chối..."
              multiline
              numberOfLines={3}
            />
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnOk]} onPress={onApprove} disabled={submitting}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.btnOkText}>{submitting ? '...' : 'Duyệt'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject} disabled={submitting}>
                <Ionicons name="close" size={16} color={Colors.text} />
                <Text style={styles.btnRejectText}>{submitting ? '...' : 'Từ chối'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}

        {row.status === 'approved' ? (
          <TouchableOpacity style={[styles.btn, styles.btnExecute]} onPress={onExecute} disabled={submitting}>
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={styles.btnOkText}>{submitting ? '...' : 'Thực thi hoàn tiền'}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: 10, paddingBottom: 30 },
  line: { ...Typography.bodySm, color: Colors.text, marginBottom: 4 },
  reject: { ...Typography.bodySm, color: Colors.danger, marginTop: 4 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemMain: { flex: 1, minWidth: 0 },
  itemName: { ...Typography.bodySm, color: Colors.text, fontWeight: '700' },
  itemMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { ...Typography.bodyMd, color: Colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    borderRadius: Radius.md,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  btnOk: { backgroundColor: Colors.success, flex: 1 },
  btnReject: { borderWidth: 1.5, borderColor: Colors.border, flex: 1 },
  btnExecute: { backgroundColor: Colors.primary },
  btnOkText: { ...Typography.bodySm, color: '#fff', fontWeight: '700' },
  btnRejectText: { ...Typography.bodySm, color: Colors.text, fontWeight: '700' },
});
