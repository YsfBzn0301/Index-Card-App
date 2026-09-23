import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '../state/LanguageContext';
import { LibraryProvider } from '../state/LibraryContext';
import { createTheme } from '../theme/palette';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = createTheme(colorScheme);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <LibraryProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />
        </LibraryProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
