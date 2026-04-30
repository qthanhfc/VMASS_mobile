import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow, useThemeMode } from '../theme';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  style?: ViewStyle;
  dark?: boolean;
}

export function StatCard({ label, value, sub, color, style, dark }: StatCardProps) {
  const { colors } = useThemeMode();
  const bg = dark ? colors.primary : colors.card;
  const textColor = dark ? '#fff' : colors.text;
  const subColor = dark ? 'rgba(255,255,255,0.7)' : colors.textSecondary;
  const labelColor = dark ? 'rgba(255,255,255,0.8)' : colors.textSecondary;

  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.value, { color: color || textColor }]} numberOfLines={1}>{value}</Text>
      {sub && <Text style={[styles.sub, { color: subColor }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    flex: 1,
  },
  label: {
    ...Typography.captionMd,
    marginBottom: 4,
  },
  value: {
    ...Typography.h3,
    fontSize: 20,
  },
  sub: {
    ...Typography.caption,
    marginTop: 2,
  },
});
