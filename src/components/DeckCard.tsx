import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../theme/palette';
import { Deck } from '../types/flashcards';

type DeckCardProps = {
  deck: Deck;
  theme: AppTheme;
};

export function DeckCard({ deck, theme }: DeckCardProps) {
  const completedCards = deck.cards.filter((card) => card.mastery >= 3).length;
  const progress = deck.cards.length === 0 ? 0 : Math.round((completedCards / deck.cards.length) * 100);
  const path = `${deck.category} / ${deck.folder} / ${deck.lesson}`;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <View style={[styles.badge, { backgroundColor: deck.accent }]}> 
        <Text style={styles.badgeText}>{deck.emoji}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{deck.title}</Text>
        <Text style={[styles.subject, { color: theme.muted }]}>{path}</Text>
        <View style={[styles.track, { backgroundColor: theme.elevated }]}> 
          <View style={[styles.fill, { width: `${progress}%`, backgroundColor: deck.accent }]} />
        </View>
      </View>
      <View style={styles.meta}>
        <Ionicons name="layers" size={18} color={theme.muted} />
        <Text style={[styles.count, { color: theme.muted }]}>{deck.cards.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  content: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subject: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 5,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  meta: {
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontWeight: '800',
  },
});
