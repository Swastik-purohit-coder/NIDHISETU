import { useMemo } from 'react';

import { AppTheme, getTheme, ThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns the memoized design system theme (light/dark aware).
 */
export const useAppTheme = (): AppTheme => {
  const scheme = (useColorScheme() ?? 'light') as ThemeMode;

  return useMemo(() => getTheme(scheme), [scheme]);
};
