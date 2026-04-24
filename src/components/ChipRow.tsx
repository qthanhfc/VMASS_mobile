import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface Chip {
  key: string;
  label: string;
  count?: number;
}

interface ChipRowProps {
  chips: Chip[];
  selected: string;
  onSelect: (key: string) => void;
}

export function ChipRow({ chips, selected, onSelect }: ChipRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {chips.map(chip => (
        <TouchableOpacity
          key={chip.key}
          onPress={() => onSelect(chip.key)}
          style={[styles.chip, selected === chip.key && styles.chipActive]}>
          <Text style={[styles.label, selected === chip.key && styles.labelActive]}>
            {chip.label}{chip.count !== undefined ? ` (${chip.count})` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: '#fff',
  },
});
