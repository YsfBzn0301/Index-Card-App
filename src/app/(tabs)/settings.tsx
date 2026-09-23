import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supportedLanguages } from '../../i18n/language';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { createTheme } from '../../theme/palette';

const developmentBuildApkUrl = 'https://expo.dev/artifacts/eas/gCpUVE3Sp-dhWQEZNYl_liXJmLQY6w_nKCsL3zhN9zo.apk';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = createTheme(colorScheme);
  const { resetLibrary, totalCards, masteredCards } = useLibrary();
  const { languageCode, languageLabel, setLanguageCode, t } = useLanguage();
  const isDevelopmentBuildActive = Constants.appOwnership !== 'expo';

  function confirmReset() {
    Alert.alert(t('resetSamplesTitle'), t('resetSamplesBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('resetSamples'), style: 'destructive', onPress: resetLibrary },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{t('settings')}</Text>
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.panelTitle, { color: theme.text }]}>{t('language')}</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>{t('activeLanguage')}: {languageLabel}</Text>
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
          <Text style={[styles.panelTitle, { color: theme.text }]}>{t('conceptTitle')}</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>{t('conceptBody')}</Text>
        </View>
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.panelTitle, { color: theme.text }]}>{t('developmentBuildTitle')}</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>{t('developmentBuildBody')}</Text>
          <Pressable
            disabled={isDevelopmentBuildActive}
            style={[styles.linkButton, { backgroundColor: isDevelopmentBuildActive ? theme.elevated : theme.secondary }]}
            onPress={() => Linking.openURL(developmentBuildApkUrl)}
          >
            <Text style={[styles.linkButtonText, { color: isDevelopmentBuildActive ? theme.muted : '#FFFFFF' }]}> 
              {isDevelopmentBuildActive ? t('developmentBuildInstalled') : t('developmentBuildLink')}
            </Text>
          </Pressable>
        </View>
        <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.panelTitle, { color: theme.text }]}>{t('status')}</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>{t('themeMode')}: {colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
          <Text style={[styles.copy, { color: theme.muted }]}>{t('cards')}: {masteredCards}/{totalCards} {t('mastered')}</Text>
        </View>
        <Pressable style={[styles.resetButton, { backgroundColor: theme.primary }]} onPress={confirmReset}>
          <Text style={styles.resetText}>{t('resetSamples')}</Text>
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
  linkButton: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
