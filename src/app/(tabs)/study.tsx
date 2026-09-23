import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLibrary } from '../../state/LibraryContext';
import { createTheme } from '../../theme/palette';

export default function StudyScreen() {
  const theme = createTheme(useColorScheme());
  const { dueDecks, reviewCard } = useLibrary();
  const [deckIndex, setDeckIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipValue] = useState(() => new Animated.Value(0));
  const deck = dueDecks[deckIndex] ?? dueDecks[0];
  const cards = deck?.cards.filter((card) => card.mastery < 3) ?? [];
  const card = cards[cardIndex] ?? cards[0];

  useEffect(() => {
    Animated.spring(flipValue, {
      toValue: isFlipped ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 55,
    }).start();
  }, [flipValue, isFlipped]);

  function flipCard() {
    setIsFlipped((current) => !current);
    Haptics.selectionAsync().catch(() => undefined);
  }

  function review(grade: 'again' | 'good') {
    if (!deck || !card) {
      return;
    }

    reviewCard(deck.id, card.id, grade);
    setIsFlipped(false);
    setCardIndex((currentIndex) => (currentIndex + 1) % Math.max(1, cards.length));
    Haptics.notificationAsync(grade === 'good' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  }

  function nextDeck() {
    setDeckIndex((currentIndex) => (currentIndex + 1) % Math.max(1, dueDecks.length));
    setCardIndex(0);
    setIsFlipped(false);
  }

  const rotateY = flipValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  if (!deck || !card) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Alles geschafft.</Text>
          <Text style={[styles.emptyCopy, { color: theme.muted }]}>Lege neue Karten an oder setze die Beispieldaten zurueck, wenn du weiter testen willst.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Lernen</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{deck.title} · {cardIndex + 1}/{cards.length}</Text>
          </View>
          <Pressable style={[styles.deckSwitch, { backgroundColor: theme.elevated }]} onPress={nextDeck}>
            <Text style={[styles.deckSwitchText, { color: theme.text }]}>Deck</Text>
          </Pressable>
        </View>

        <Pressable onPress={flipCard} style={styles.cardTouchable}>
          <Animated.View style={[styles.studyCard, { backgroundColor: isFlipped ? deck.accent : theme.surface, borderColor: theme.border, transform: [{ rotateY }] }]}> 
            <Text style={[styles.cardHint, { color: isFlipped ? '#FFFFFF' : theme.muted }]}>{isFlipped ? 'Antwort' : 'Frage'}</Text>
            <Text style={[styles.cardText, { color: isFlipped ? '#FFFFFF' : theme.text }]}>{isFlipped ? card.back : card.front}</Text>
            <Text style={[styles.tapHint, { color: isFlipped ? '#FFFFFF' : theme.muted }]}>Tippen zum Drehen</Text>
          </Animated.View>
        </Pressable>

        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, { backgroundColor: theme.warning }]} onPress={() => review('again')}>
            <Text style={styles.actionText}>Nochmal</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: theme.success }]} onPress={() => review('good')}>
            <Text style={styles.actionText}>Gewusst</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 110,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  deckSwitch: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deckSwitchText: {
    fontWeight: '900',
  },
  cardTouchable: {
    flex: 1,
  },
  studyCard: {
    flex: 1,
    minHeight: 360,
    borderWidth: 1,
    borderRadius: 34,
    padding: 24,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
  },
  cardHint: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  cardText: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyState: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 34,
    fontWeight: '900',
  },
  emptyCopy: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
});
