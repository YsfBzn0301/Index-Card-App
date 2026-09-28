import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { AppTheme, createTheme } from '../theme/palette';

const storageKey = 'index-card.theme.v1';

type Scheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  colorScheme: Scheme;
  toggleColorScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Follows the system until the user picks a mode; the pick is then remembered.
export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<Scheme | null>(null);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(storageKey)
      .then((saved) => {
        if (isMounted && (saved === 'light' || saved === 'dark')) {
          setOverride(saved);
          // Also switches native pieces (date picker, system dialogs, status bar) where the platform supports it.
          Appearance.setColorScheme?.(saved);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const colorScheme: Scheme = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

    return {
      theme: createTheme(colorScheme),
      colorScheme,
      toggleColorScheme: () => {
        const next: Scheme = colorScheme === 'dark' ? 'light' : 'dark';
        setOverride(next);
        Appearance.setColorScheme?.(next);
        AsyncStorage.setItem(storageKey, next).catch(() => undefined);
      },
    };
  }, [override, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }

  return context;
}
