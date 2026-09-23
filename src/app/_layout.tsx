import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '../state/LanguageContext';
import { LibraryProvider } from '../state/LibraryContext';
import { createTheme } from '../theme/palette';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = createTheme(colorScheme);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('study-reminders', {
        name: 'Study reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#24B8A8',
      }).catch(() => undefined);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const reminderSpeak = data?.reminderSpeak === true;
      const reminderMessage = typeof data?.reminderMessage === 'string' ? data.reminderMessage : undefined;
      const reminderLanguage = typeof data?.languageCode === 'string' ? data.languageCode : undefined;

      if (reminderSpeak && reminderMessage) {
        Speech.stop().finally(() => {
          Speech.speak(reminderMessage, {
            language: reminderLanguage,
            rate: 0.9,
            pitch: 1,
          });
        });
      }
    });

    return () => subscription.remove();
  }, []);

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
