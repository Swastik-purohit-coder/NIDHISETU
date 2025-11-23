import type { TextStyle, ViewStyle } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

type Shadow = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

const typography = {
  displayLarge: createType(32, 40, '600'),
  displayMedium: createType(28, 36, '600'),
  headlineLarge: createType(24, 32, '600'),
  headlineMedium: createType(20, 28, '600'),
  titleLarge: createType(18, 26, '500'),
  titleMedium: createType(16, 24, '500'),
  titleSmall: createType(14, 20, '500'),
  bodyLarge: createType(16, 24, '400'),
  bodyMedium: createType(14, 22, '400'),
  bodySmall: createType(12, 18, '400'),
  labelLarge: createType(16, 20, '500'),
  labelMedium: createType(14, 20, '500'),
  labelSmall: createType(12, 16, '400'),
} as const;

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

const elevations: Record<'level0' | 'card' | 'fab', Shadow> = {
  level0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  fab: {
    shadowColor: 'rgba(30, 99, 255, 0.25)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
};

const lightColors = {
  primary: '#FF7A00', // Primary Orange
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFE0B2', // Light Orange
  onPrimaryContainer: '#E65100', // Dark Orange
  secondary: '#4A2C82', // Deep Purple
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F3E5F5', // Light Purple
  onSecondaryContainer: '#4A148C', // Dark Purple
  tertiary: '#9C7AC2', // Soft Purple
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceVariant: '#F1F1F1', // Soft Grey
  outline: '#94A3B8', // Slate 400
  text: '#1A1A1A', // Dark Text
  muted: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200
  icon: '#334155', // Slate 700
  tint: '#FF7A00',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#FF7A00',
  success: '#4CAF50', // Success Green
  warning: '#FFC107', // Amber
  error: '#E53935', // Error Red
  info: '#2196F3', // Blue
  successContainer: '#E8F5E9',
  warningContainer: '#FFF8E1',
  errorContainer: '#FFEBEE',
  infoContainer: '#E3F2FD',
  card: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.6)',
  gradientStart: '#FF7A00',
  gradientEnd: '#FF9E40',
};

const darkColors: typeof lightColors = {
  primary: '#FF9E40', // Lighter Orange for dark mode
  onPrimary: '#1A1A1A',
  primaryContainer: '#E65100',
  onPrimaryContainer: '#FFE0B2',
  secondary: '#9C7AC2', // Lighter Purple for dark mode
  onSecondary: '#1A1A1A',
  secondaryContainer: '#4A148C',
  onSecondaryContainer: '#F3E5F5',
  tertiary: '#B39DDB',
  background: '#121212', // Dark Background
  surface: '#1E1E1E', // Dark Surface
  surfaceVariant: '#2C2C2C',
  outline: '#757575',
  text: '#FFFFFF', // Light Text
  muted: '#A0A0A0',
  border: '#333333',
  icon: '#E0E0E0',
  tint: '#FF9E40',
  tabIconDefault: '#757575',
  tabIconSelected: '#FF9E40',
  success: '#81C784',
  warning: '#FFD54F',
  error: '#E57373',
  info: '#64B5F6',
  successContainer: '#1B5E20',
  warningContainer: '#FF6F00',
  errorContainer: '#B71C1C',
  infoContainer: '#0D47A1',
  card: '#1E1E1E',
  overlay: 'rgba(0, 0, 0, 0.8)',
  gradientStart: '#E65100',
  gradientEnd: '#FF7A00',
};

export interface AppTheme {
  mode: ThemeMode;
  colors: typeof lightColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  elevations: typeof elevations;
  components: {
    button: {
      height: number;
      borderRadius: number;
    };
    input: {
      height: number;
      borderRadius: number;
    };
    card: {
      padding: number;
      borderRadius: number;
    };
    modal: {
      borderRadius: number;
    };
  };
}

const baseComponents = {
  button: {
    height: 56,
    borderRadius: 14,
  },
  input: {
    height: 56,
    borderRadius: 12,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  modal: {
    borderRadius: radii.xl,
  },
};

const lightTheme: AppTheme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  radii,
  elevations,
  components: baseComponents,
};

const darkTheme: AppTheme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  radii,
  elevations,
  components: baseComponents,
};

export type TypographyVariant = keyof typeof typography;
export type ColorToken = keyof typeof lightColors;

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export const Tokens = {
  typography,
  spacing,
  radii,
  elevations,
};

export const getTheme = (mode: ThemeMode = 'light'): AppTheme => (mode === 'dark' ? darkTheme : lightTheme);

export const getPaperTheme = (mode: ThemeMode): MD3Theme => {
  const palette = mode === 'dark' ? darkColors : lightColors;
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    roundness: radii.md,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      surface: palette.surface,
      secondary: palette.secondary,
      outline: palette.outline,
      error: palette.error,
    },
  };
};

function createType(fontSize: number, lineHeight: number, fontWeight: TextStyle['fontWeight']): TextStyle {
  return {
    fontFamily: 'System',
    fontSize,
    lineHeight,
    fontWeight,
    letterSpacing: 0,
  };
}
