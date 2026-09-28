import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useLanguage } from '../state/LanguageContext';
import { speakInLanguage } from '../utils/speech';

// Reads a tapped reminder aloud in the language currently selected in the app, not the one active when it was scheduled.
export function ReminderSpeechListener() {
  const { languageCode } = useLanguage();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const reminderMessage = typeof data?.reminderMessage === 'string' ? data.reminderMessage : undefined;

      if (data?.reminderSpeak === true && reminderMessage) {
        speakInLanguage(reminderMessage, languageCode).catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [languageCode]);

  return null;
}
