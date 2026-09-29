import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeckCard } from '../../components/DeckCard';
import { MatchingGame } from '../../components/MatchingGame';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { useAppTheme } from '../../state/ThemeContext';
import { displayFont } from '../../theme/palette';

export default function GamesScreen() {
  const { theme } = useAppTheme();
  const { prioritizedDecks, decks } = useLibrary();
  const { t } = useLanguage();
  const { deckId: requestedDeckId, at: requestToken } = useLocalSearchParams<{ deckId?: string; at?: string }>();
  const [playingDeckId, setPlayingDeckId] = useState<string | undefined>();
  const [handledRequest, setHandledRequest] = useState<string | undefined>();

  // Study and Decks start a game through route params; apply each request once (adjust state during render).
  const requestKey = requestedDeckId ? `${requestedDeckId}:${requestToken ?? ''}` : undefined;
  if (requestKey && requestKey !== handledRequest) {
    setHandledRequest(requestKey);
    if (decks.some((deck) => deck.id === requestedDeckId)) {
      setPlayingDeckId(requestedDeckId);
    }
  }

  // Every deck is playable at any time; a deleted deck drops out of this list and a running game closes.
  const playingDeck = decks.find((deck) => deck.id === playingDeckId);
  const playableDecks = prioritizedDecks.filter((deck) => deck.cards.length > 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>{t('games')}</Text>
            {!!playingDeck && <Text style={[styles.subtitle, { color: theme.muted }]} numberOfLines={1}>{playingDeck.title}</Text>}
          </View>
          <ThemeToggle />
        </View>
        {playingDeck ? (
          <MatchingGame key={playingDeck.id} deck={playingDeck} theme={theme} onExit={() => setPlayingDeckId(undefined)} />
        ) : playableDecks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="game-controller-outline" size={56} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('gamesEmptyTitle')}</Text>
            <Text style={[styles.emptyBody, { color: theme.muted }]}>{t('gamesEmptyBody')}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {playableDecks.map((deck) => (
              <Pressable key={deck.id} accessibilityRole="button" accessibilityLabel={`${t('playGame')}: ${deck.title}`} onPress={() => setPlayingDeckId(deck.id)}>
                <DeckCard deck={deck} theme={theme} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 },
  headerText: { flex: 1 },
  title: { fontFamily: displayFont, fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 14, fontWeight: '700' },
  list: { gap: 12, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16 },
  emptyTitle: { fontFamily: displayFont, fontSize: 22, fontWeight: '800' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
