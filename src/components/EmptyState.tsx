import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, useThemeMode } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon = 'file-tray-outline', title, description }: EmptyStateProps) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.textSecondary} />
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      {description && <Text style={[styles.desc, { color: colors.textSecondary }]}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    ...Typography.h4,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  desc: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
