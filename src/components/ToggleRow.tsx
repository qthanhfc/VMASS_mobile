import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, useThemeMode } from '../theme';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

export function ToggleRow({ label, description, value, onValueChange }: ToggleRowProps) {
  const { colors } = useThemeMode();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.desc, { color: colors.textSecondary }]}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  content: {
    flex: 1,
  },
  label: {
    ...Typography.bodyMd,
    color: Colors.text,
  },
  desc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
