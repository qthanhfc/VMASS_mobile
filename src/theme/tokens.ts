export const Colors = {
  primary: '#008ecc',
  primaryDark: '#0070a0',
  primaryLight: '#e6f5fc',
  background: '#f0eee9',
  backgroundDark: '#1a1a1a',
  card: '#ffffff',
  cardDark: '#252525',
  border: '#e8e6e0',
  borderDark: '#3a3a3a',
  text: '#1a1a1a',
  textDark: '#f4f1e8',
  textSecondary: '#6b6860',
  textSecondaryDark: '#9e9a8e',
  accent: '#ff7043',
  success: '#2e7d32',
  warning: '#f57c00',
  danger: '#c62828',
  successLight: '#e8f5e9',
  warningLight: '#fff3e0',
  dangerLight: '#ffebee',
  mono: '#1a1a1a',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  h4: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, fontWeight: '500' as const },
  bodySm: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  captionMd: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, fontWeight: '600' as const },
};
