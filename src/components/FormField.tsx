import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Typography, Spacing, Radius, useThemeMode } from '../theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, error, hint, style, ...props }: FormFieldProps) {
  const { colors } = useThemeMode();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {hint && !error && <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.captionMd,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  error: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
  },
});
