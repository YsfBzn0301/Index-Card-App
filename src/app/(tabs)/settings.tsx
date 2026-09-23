import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supportedLanguages } from '../../i18n/language';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { createTheme } from '../../theme/palette';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = createTheme(colorScheme);
  const { resetLibrary, totalCards, masteredCards } = useLibrary();
  const { languageCode, languageLabel, setLanguageCode, t } = useLanguage();

  function confirmReset() {
    Alert.alert('Beispieldaten wiederherstellen?', 'Deine aktuellen lokalen Decks werden ersetzt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Zuruecksetzen', style: 'destructive', onPress: resetLibrary },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{t('settings')}</Text>
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.panelTitle, { color: theme.text }]}>{t('language')}</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>Aktiv: {languageLabel}</Text>
          <View style={styles.languageGrid}>
            {supportedLanguages.map((language) => {
              const isActive = language.code === languageCode;

              return (
                <Pressable key={language.code} style={[styles.languageButton, { backgroundColor: isActive ? theme.primary : theme.elevated, borderColor: theme.border }]} onPress={() => setLanguageCode(language.code)}>
                  <Text style={[styles.languageButtonText, { color: isActive ? '#FFFFFF' : theme.text }]}>{language.shortLabel}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.panelTitle, { color: theme.text }]}>App-Konzept</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>Offline-first Karteikarten-App fuer Schueler, Studierende und junge Erwachsene. Fokus: schnelle Deck-Erstellung, kurze Sessions, sichtbarer Fortschritt und ein verspieltes Interface.</Text>
        </View>
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.panelTitle, { color: theme.text }]}>Status</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>Theme: {colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'} automatisch</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>Karten: {masteredCards}/{totalCards} gemeistert</Text>
        </View>
        <Pressable style={[styles.resetButton, { backgroundColor: theme.primary }]} onPress={confirmReset}>
          <Text style={styles.resetText}>Beispieldaten wiederherstellen</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  languageButton: {
    borderWidth: 1,
    borderRadius: 14,
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  languageButtonText: {
    fontWeight: '900',
  },
  resetButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
