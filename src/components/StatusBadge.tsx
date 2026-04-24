import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '../theme';

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_MAP: Record<string, { type: StatusType; label: string }> = {
  active: { type: 'success', label: 'Đang bán' },
  inactive: { type: 'neutral', label: 'Ngừng bán' },
  pending: { type: 'warning', label: 'Chờ xử lý' },
  paid: { type: 'info', label: 'Đã thanh toán' },
  packing: { type: 'info', label: 'Đóng gói' },
  shipping: { type: 'info', label: 'Đang giao' },
  done: { type: 'success', label: 'Hoàn thành' },
  cancelled: { type: 'danger', label: 'Đã hủy' },
  returned: { type: 'danger', label: 'Trả hàng' },
  approved: { type: 'success', label: 'Đã duyệt' },
  rejected: { type: 'danger', label: 'Từ chối' },
  completed: { type: 'success', label: 'Hoàn thành' },
  scheduled: { type: 'info', label: 'Lên lịch' },
  ended: { type: 'neutral', label: 'Đã kết thúc' },
};

const TYPE_COLORS: Record<StatusType, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  danger: { bg: Colors.dangerLight, text: Colors.danger },
  info: { bg: Colors.primaryLight, text: Colors.primary },
  neutral: { bg: Colors.border, text: Colors.textSecondary },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const mapped = STATUS_MAP[status] || { type: 'neutral' as StatusType, label: status };
  const colors = TYPE_COLORS[mapped.type];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label || mapped.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.label,
  },
});
