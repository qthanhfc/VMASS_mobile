import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
  padding?: number;
}

export function Card({ children, style, accent, padding = 16 }: CardProps) {
  return (
    <View style={[styles.card, accent && styles.accent, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
  accent: {
    backgroundColor: Colors.primary,
  },
});
