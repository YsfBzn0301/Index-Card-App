import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../state/LanguageContext';
import { AppTheme, displayFont } from '../theme/palette';
import { Deck } from '../types/flashcards';
import { priorityColor, priorityLabelKeys } from '../utils/priority';

type DeckCardProps = {
  deck: Deck;
  theme: AppTheme;
  // When given, the priority flag becomes a button so the level can be changed without opening the deck.
  onPriorityPress?: () => void;
  // When given, a game button starts the matching game for this deck.
  onGamePress?: () => void;
};

export function DeckCard({ deck, theme, onPriorityPress, onGamePress }: DeckCardProps) {
  const { t } = useLanguage();
  const completedCards = deck.cards.filter((card) => card.mastery >= 3).length;
  const progress = deck.cards.length === 0 ? 0 : Math.round((completedCards / deck.cards.length) * 100);
  const path = `${deck.category} / ${deck.folder} / ${deck.lesson}`;
  const priorityText = `${t('priority')}: ${t(priorityLabelKeys[deck.priority])}`;
  const flagColor = priorityColor(theme, deck.priority);
  const flag = <Ionicons name={deck.priority === 'low' ? 'flag-outline' : 'flag'} size={22} color={flagColor} />;

  return (
    <View
      accessible={!onPriorityPress && !onGamePress}
      accessibilityLabel={`${deck.title}, ${path}, ${completedCards}/${deck.cards.length}, ${priorityText}`}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={[styles.badge, { backgroundColor: deck.accent }]}>
        <Text style={styles.badgeText} numberOfLines={1} adjustsFontSizeToFit>
          {deck.emoji}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {deck.title}
        </Text>
        <Text style={[styles.subject, { color: theme.muted }]} numberOfLines={1}>
          {path}
        </Text>
        <View style={[styles.track, { backgroundColor: theme.elevated }]}>
          <View style={[styles.fill, { width: `${progress}%`, backgroundColor: deck.accent }]} />
        </View>
      </View>
      <View style={styles.meta}>
        {onPriorityPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={priorityText}
            hitSlop={12}
            onPress={onPriorityPress}
            style={({ pressed }) => [styles.flag, pressed && styles.flagPressed]}
          >
            {flag}
          </Pressable>
        ) : (
          <View style={styles.flag}>{flag}</View>
        )}
        {onGamePress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('playGame')}
            hitSlop={10}
            onPress={onGamePress}
            style={({ pressed }) => [styles.gameButton, { backgroundColor: theme.primary }, pressed && styles.flagPressed]}
          >
            <Ionicons name="game-controller" size={24} color="#FFFFFF" />
          </Pressable>
        ) : null}
        <Ionicons name="layers-outline" size={18} color={theme.muted} />
        <Text style={[styles.count, { color: theme.muted }]}>
          {completedCards}/{deck.cards.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subject: {
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  meta: {
    alignItems: 'center',
    gap: 4,
    minWidth: 40,
  },
  flag: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  flagPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.92 }],
  },
  count: {
    fontWeight: '700',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
