import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AppTheme } from '../theme/palette';
import { Deck } from '../types/flashcards';

type DeckChipsProps = {
  decks: Deck[];
  selectedId?: string;
  theme: AppTheme;
  onSelect: (deckId: string) => void;
};

// Deck picker for the study screen: every saved deck is reachable, empty ones are dimmed.
export function DeckChips({ decks, selectedId, theme, onSelect }: DeckChipsProps) {
  if (decks.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {decks.map((deck) => {
        const isActive = deck.id === selectedId;
        const dueCount = deck.cards.filter((card) => card.mastery < 3).length;
        const isEmpty = deck.cards.length === 0;

        return (
          <Pressable
            key={deck.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${deck.title}, ${dueCount}/${deck.cards.length}`}
            onPress={() => onSelect(deck.id)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: isActive ? deck.accent : theme.elevated, borderColor: isActive ? deck.accent : theme.border },
              isEmpty && !isActive && styles.dimmed,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : theme.text }]} numberOfLines={1}>
              {deck.title}
            </Text>
            <Text style={[styles.count, { color: isActive ? '#FFFFFF' : theme.muted }]}>{dueCount}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 180,
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dimmed: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
