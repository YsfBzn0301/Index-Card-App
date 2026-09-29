import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '../../components/BrandLogo';
import { DeckCard } from '../../components/DeckCard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { useAppTheme } from '../../state/ThemeContext';
import { displayFont } from '../../theme/palette';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { decks, prioritizedDecks, masteredCards, totalCards, dueCards } = useLibrary();
  const { t } = useLanguage();
  const progress = totalCards === 0 ? 0 : Math.round((masteredCards / totalCards) * 100);

  function startStudying(deckId?: string) {
    router.navigate({ pathname: '/study', params: deckId ? { deckId, at: String(Date.now()) } : {} });
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <BrandLogo />
          <ThemeToggle />
        </View>

        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.hero}>
          <Text style={styles.heroTitle}>{t('heroTitle')}</Text>
          <View style={styles.heroStats}>
            <View>
              <Text style={styles.statNumber}>{dueCards.length}</Text>
              <Text style={styles.statLabel}>{t('cards')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statNumber}>{progress}%</Text>
              <Text style={styles.statLabel}>{t('mastered')}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('startStudying')}
            onPress={() => startStudying()}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <Text style={styles.ctaText}>{t('startStudying')}</Text>
            <View style={styles.ctaIcon}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('decks')}</Text>
          <Text style={[styles.sectionHint, { color: theme.muted }]}>{decks.length} {t('active')}</Text>
        </View>

        {decks.length === 0 ? (
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('emptyStudyTitle')}</Text>
            <Text style={[styles.emptyBody, { color: theme.muted }]}>{t('emptyStudyBody')}</Text>
          </View>
        ) : (
          <View style={styles.deckList}>
            {prioritizedDecks.slice(0, 4).map((deck) => (
              <Pressable
                key={deck.id}
                accessibilityRole="button"
                onPress={() => startStudying(deck.id)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <DeckCard deck={deck} theme={theme} />
              </Pressable>
            ))}
          </View>
        )}
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
    paddingBottom: 32,
    gap: 22,
  },
  hero: {
    minHeight: 300,
    borderRadius: 32,
    padding: 24,
    gap: 18,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -6,
  },
  kicker: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: displayFont,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.6,
    maxWidth: 310,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    padding: 16,
    gap: 18,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.88,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 6,
    paddingLeft: 20,
    paddingRight: 6,
  },
  ctaText: {
    color: '#1E1B18',
    fontSize: 15,
    fontWeight: '800',
  },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1B18',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: displayFont,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontWeight: '700',
  },
  deckList: {
    gap: 12,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 22,
    padding: 22,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: displayFont,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
});
