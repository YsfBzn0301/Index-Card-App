import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeckCard } from '../../components/DeckCard';
import { useLibrary } from '../../state/LibraryContext';
import { createTheme } from '../../theme/palette';

export default function HomeScreen() {
  const theme = createTheme(useColorScheme());
  const { decks, masteredCards, totalCards, dueCards } = useLibrary();
  const progress = totalCards === 0 ? 0 : Math.round((masteredCards / totalCards) * 100);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.hero}>
          <Text style={styles.kicker}>Index Card</Text>
          <Text style={styles.heroTitle}>Heute kurz lernen, morgen locker abrufen.</Text>
          <View style={styles.heroStats}>
            <View>
              <Text style={styles.statNumber}>{dueCards.length}</Text>
              <Text style={styles.statLabel}>faellige Karten</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statNumber}>{progress}%</Text>
              <Text style={styles.statLabel}>gemeistert</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Deine Decks</Text>
          <Text style={[styles.sectionHint, { color: theme.muted }]}>{decks.length} aktiv</Text>
        </View>

        <View style={styles.deckList}>
          {decks.slice(0, 4).map((deck) => (
            <DeckCard key={deck.id} deck={deck} theme={theme} />
          ))}
        </View>
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
    gap: 22,
  },
  hero: {
    minHeight: 250,
    borderRadius: 32,
    padding: 24,
    justifyContent: 'space-between',
  },
  kicker: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    opacity: 0.9,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    maxWidth: 310,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 22,
    padding: 16,
    gap: 18,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.88,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  sectionHint: {
    fontWeight: '800',
  },
  deckList: {
    gap: 12,
  },
});
