import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Colors } from './tokens';

export const THEME_MODE_STORAGE_KEY = '__theme_color';

export type ThemeMode = 'light' | 'dark';

export type ThemePalette = typeof Colors;

type ThemeContextValue = {
  colors: ThemePalette;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
};

const lightPalette: ThemePalette = Colors;

const darkPalette: ThemePalette = {
  ...Colors,
  background: Colors.backgroundDark,
  card: Colors.cardDark,
  border: Colors.borderDark,
  text: Colors.textDark,
  textSecondary: Colors.textSecondaryDark,
  primaryLight: 'rgba(0, 142, 204, 0.16)',
  successLight: 'rgba(46, 125, 50, 0.18)',
  warningLight: 'rgba(245, 124, 0, 0.16)',
  dangerLight: 'rgba(198, 40, 40, 0.18)',
  mono: Colors.textDark,
};

let currentMode: ThemeMode = 'light';
let hasPatchedCreateElement = false;
let hasPatchedStyleSheetCreate = false;

const normalizeColor = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const colorMap = new Map<unknown, string>([
  [normalizeColor(Colors.background), darkPalette.background],
  [normalizeColor(Colors.card), darkPalette.card],
  [normalizeColor('#fff'), darkPalette.card],
  [normalizeColor('#ffffff'), darkPalette.card],
  [normalizeColor('#000'), darkPalette.text],
  [normalizeColor('#000000'), darkPalette.text],
  [normalizeColor('#111'), darkPalette.text],
  [normalizeColor('#111111'), darkPalette.text],
  [normalizeColor('#1a1a1a'), darkPalette.text],
  [normalizeColor('#1f2937'), darkPalette.text],
  [normalizeColor('#222'), darkPalette.text],
  [normalizeColor('#222222'), darkPalette.text],
  [normalizeColor('#2d3748'), darkPalette.text],
  [normalizeColor('#333'), darkPalette.text],
  [normalizeColor('#333333'), darkPalette.text],
  [normalizeColor('#374151'), darkPalette.textSecondary],
  [normalizeColor('#4b5563'), darkPalette.textSecondary],
  [normalizeColor('rgba(255,255,255,0.94)'), darkPalette.card],
  [normalizeColor('rgba(255,255,255,0.96)'), darkPalette.card],
  [normalizeColor('rgba(255,255,255,0.98)'), darkPalette.card],
  [normalizeColor('rgba(255,255,255,0.9)'), darkPalette.text],
  [normalizeColor('rgba(255,255,255,0.85)'), darkPalette.textSecondary],
  [normalizeColor('rgba(255,255,255,0.8)'), darkPalette.textSecondary],
  [normalizeColor(Colors.border), darkPalette.border],
  [normalizeColor(Colors.text), darkPalette.text],
  [normalizeColor(Colors.mono), darkPalette.text],
  [normalizeColor(Colors.textSecondary), darkPalette.textSecondary],
  [normalizeColor(Colors.primaryLight), darkPalette.primaryLight],
  [normalizeColor(Colors.successLight), darkPalette.successLight],
  [normalizeColor(Colors.warningLight), darkPalette.warningLight],
  [normalizeColor(Colors.dangerLight), darkPalette.dangerLight],
  [normalizeColor('#e7f5ff'), 'rgba(0, 142, 204, 0.16)'],
  [normalizeColor('#e9f3ff'), 'rgba(0, 142, 204, 0.16)'],
  [normalizeColor('#edf5ff'), 'rgba(0, 142, 204, 0.14)'],
  [normalizeColor('#eef9ef'), 'rgba(46, 125, 50, 0.16)'],
  [normalizeColor('#e8f7ec'), 'rgba(46, 125, 50, 0.16)'],
  [normalizeColor('#e8f5e9'), 'rgba(46, 125, 50, 0.16)'],
  [normalizeColor('#edf7ed'), 'rgba(46, 125, 50, 0.16)'],
  [normalizeColor('#fff5e6'), 'rgba(245, 124, 0, 0.14)'],
  [normalizeColor('#fff4de'), 'rgba(245, 124, 0, 0.14)'],
  [normalizeColor('#fff2ed'), 'rgba(217, 119, 87, 0.16)'],
  [normalizeColor('#fff1eb'), 'rgba(217, 119, 87, 0.16)'],
  [normalizeColor('#fcf5eb'), 'rgba(212, 165, 116, 0.16)'],
  [normalizeColor('#fcf2ee'), 'rgba(201, 122, 122, 0.16)'],
  [normalizeColor('#f0d4d4'), 'rgba(201, 122, 122, 0.16)'],
  [normalizeColor('#ffe9e9'), 'rgba(198, 40, 40, 0.16)'],
  [normalizeColor('#c4e4f2'), 'rgba(0, 142, 204, 0.18)'],
  [normalizeColor('#f4e5c4'), 'rgba(196, 162, 116, 0.18)'],
  [normalizeColor('#d4e4c4'), 'rgba(122, 158, 122, 0.18)'],
  [normalizeColor('#f3ebff'), 'rgba(138, 106, 158, 0.18)'],
  [normalizeColor('#f4ecfb'), 'rgba(138, 106, 158, 0.18)'],
  [normalizeColor('#f3f4f6'), 'rgba(255, 255, 255, 0.08)'],
  [normalizeColor('#f2f2f2'), 'rgba(255, 255, 255, 0.08)'],
  [normalizeColor('#efede7'), 'rgba(255, 255, 255, 0.08)'],
  [normalizeColor('#ededed'), 'rgba(255, 255, 255, 0.08)'],
  [normalizeColor('#f8f7f3'), 'rgba(255, 255, 255, 0.06)'],
  [normalizeColor('#d2cec4'), 'rgba(255, 255, 255, 0.14)'],
  [normalizeColor('#cfcac0'), 'rgba(255, 255, 255, 0.18)'],
  [normalizeColor('#cfcfcf'), 'rgba(255, 255, 255, 0.18)'],
  [normalizeColor('#f2c6c6'), 'rgba(198, 40, 40, 0.32)'],
]);

const whiteTextValues = new Set<unknown>([
  normalizeColor('#fff'),
  normalizeColor('#ffffff'),
  normalizeColor('rgba(255,255,255,0.98)'),
  normalizeColor('rgba(255,255,255,0.96)'),
  normalizeColor('rgba(255,255,255,0.94)'),
  normalizeColor('rgba(255,255,255,0.9)'),
  normalizeColor('rgba(255,255,255,0.85)'),
  normalizeColor('rgba(255,255,255,0.8)'),
  normalizeColor('rgba(255,255,255,0.78)'),
  normalizeColor('rgba(255,255,255,0.75)'),
  normalizeColor('rgba(255,255,255,0.7)'),
]);

const transformColor = (value: unknown, propertyName?: string) => {
  if (currentMode !== 'dark') return value;
  const normalized = normalizeColor(value);
  if (propertyName === 'color' && whiteTextValues.has(normalized)) {
    return value;
  }
  const mapped = colorMap.get(normalized);
  return mapped || value;
};

const transformStyle = (style: unknown): unknown => {
  if (currentMode !== 'dark' || !style) return style;

  if (Array.isArray(style)) {
    return style.map(transformStyle);
  }

  if (typeof style !== 'object') {
    const flattened = StyleSheet.flatten(style as never);
    return flattened ? transformStyle(flattened) : style;
  }

  const source = style as Record<string, unknown>;
  const next: Record<string, unknown> = { ...source };

  for (const key of [
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'color',
  ]) {
    if (key in next) {
      next[key] = transformColor(next[key], key);
    }
  }

  return next;
};

const patchStyleSheetCreateForTheme = () => {
  if (hasPatchedStyleSheetCreate) return;

  hasPatchedStyleSheetCreate = true;
  const originalCreate = StyleSheet.create.bind(StyleSheet);

  StyleSheet.create = ((styles: Record<string, unknown>) => {
    const lightStyles = originalCreate(styles as never) as Record<string, unknown>;
    const modeBeforeDarkBuild = currentMode;
    currentMode = 'dark';
    const darkStyleSource = Object.fromEntries(
      Object.entries(styles).map(([key, value]) => [key, transformStyle(value)])
    );
    currentMode = modeBeforeDarkBuild;
    const darkStyles = originalCreate(darkStyleSource as never) as Record<string, unknown>;
    const themedStyles: Record<string, unknown> = {};

    Object.keys(styles).forEach((key) => {
      Object.defineProperty(themedStyles, key, {
        enumerable: true,
        configurable: false,
        get() {
          return currentMode === 'dark' ? darkStyles[key] : lightStyles[key];
        },
      });
    });

    return themedStyles;
  }) as typeof StyleSheet.create;
};

const hasTextColor = (style: unknown): boolean => {
  const flattened = StyleSheet.flatten(style as never);
  return Boolean(flattened && 'color' in flattened);
};

const patchCreateElementForTheme = () => {
  if (hasPatchedCreateElement) return;

  hasPatchedCreateElement = true;
  const originalCreateElement = React.createElement;

  React.createElement = ((type: React.ElementType, props: Record<string, unknown> | null, ...children: React.ReactNode[]) => {
    if (currentMode !== 'dark' || !props) {
      return originalCreateElement(type, props, ...children);
    }

    let nextProps = props;

    if ('style' in props) {
      nextProps = { ...nextProps, style: transformStyle(props.style) };
    }

    if ('color' in props) {
      nextProps = { ...nextProps, color: transformColor(props.color, 'color') };
    }

    if ('placeholderTextColor' in props) {
      nextProps = { ...nextProps, placeholderTextColor: transformColor(props.placeholderTextColor, 'color') };
    }

    if (type === Text && !hasTextColor(nextProps.style)) {
      nextProps = { ...nextProps, style: [nextProps.style, { color: darkPalette.text }] };
    }

    if (type === TextInput) {
      nextProps = {
        ...nextProps,
        placeholderTextColor: props.placeholderTextColor
          ? transformColor(props.placeholderTextColor, 'color')
          : darkPalette.textSecondary,
        style: [
          { color: darkPalette.text, backgroundColor: darkPalette.card, borderColor: darkPalette.border },
          nextProps.style,
        ],
      };
    }

    return originalCreateElement(type, nextProps, ...children);
  }) as typeof React.createElement;
};

patchStyleSheetCreateForTheme();
patchCreateElementForTheme();

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const modeFromStoredColor = (value?: string | null): ThemeMode =>
  value?.includes('dark') ? 'dark' : 'light';

const storedColorFromMode = (mode: ThemeMode) => `${mode}.blueolympic`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  currentMode = mode;

  useEffect(() => {
    let isMounted = true;

    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (isMounted) setModeState(modeFromStoredColor(stored));
    };

    loadTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, storedColorFromMode(nextMode));
  }, []);

  const toggleMode = useCallback(async () => {
    await setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      colors: mode === 'dark' ? darkPalette : lightPalette,
      isDark: mode === 'dark',
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeProvider');
  }

  return context;
}
