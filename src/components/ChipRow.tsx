import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius, useThemeMode } from '../theme';

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
  const { colors } = useThemeMode();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      alwaysBounceHorizontal={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.row}>
        {chips.map((chip, index) => (
          <Pressable
            key={chip.key}
            onPress={() => onSelect(chip.key)}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: colors.card, borderColor: colors.border },
              index < chips.length - 1 && styles.chipGap,
              selected === chip.key && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }, selected === chip.key && styles.labelActive]}>
              {chip.label}{chip.count !== undefined ? ` (${chip.count})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    minHeight: 32,
    alignItems: 'center',
  },
  chip: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chipGap: {
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipPressed: {
    opacity: 0.82,
  },
  label: {
    ...Typography.captionMd,
    lineHeight: 15,
    includeFontPadding: false,
    color: Colors.textSecondary,
    textAlignVertical: 'center',
  },
  labelActive: {
    color: '#fff',
  },
});
