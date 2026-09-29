import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti } from '../../components/Confetti';
import { CardFace } from '../../components/CardFace';
import { DeckChips } from '../../components/DeckChips';
import { RuledPaper } from '../../components/RuledPaper';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { useAppTheme } from '../../state/ThemeContext';
import { displayFont } from '../../theme/palette';

export default function StudyScreen() {
  const { theme } = useAppTheme();
  const { decks, prioritizedDecks, reviewCard, resetDeckProgress } = useLibrary();
  const { t } = useLanguage();
  const { deckId: requestedDeckId, at: requestToken } = useLocalSearchParams<{ deckId?: string; at?: string }>();
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>();
  const [lastReviewed, setLastReviewed] = useState<{ back: string } | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [handledRequest, setHandledRequest] = useState<string | undefined>();
  const [confettiBurst, setConfettiBurst] = useState(0);
  // Set when the last open card of a stack was mastered; the dialog offers other stacks or a repeat.
  const [finished, setFinished] = useState<{ deckId: string; title: string } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipValue] = useState(() => new Animated.Value(0));
  const [swipeX] = useState(() => new Animated.Value(0));
  const [completionScale] = useState(() => new Animated.Value(0.82));
  const [completionOpacity] = useState(() => new Animated.Value(0));
  // Falls back to the first deck that has cards, so a freshly created empty deck never hides the others.
  const deck = decks.find((currentDeck) => currentDeck.id === selectedDeckId) ?? prioritizedDecks.find((currentDeck) => currentDeck.cards.length > 0) ?? decks[0];
  const dueCards = deck?.cards.filter((card) => card.mastery < 3) ?? [];
  const cards = dueCards.length > 0 ? dueCards : deck?.cards ?? [];
  const card = cards[cardIndex] ?? cards[0];
  const isComplete = !deck || !card;
  // Other stacks that still have cards to learn, offered when a stack is finished.
  const otherOpenDecks = prioritizedDecks.filter((other) => other.id !== finished?.deckId && other.cards.some((item) => item.mastery < 3));
  const isReviewingCompletedDeck =!!deck && dueCards.length === 0 && deck.cards.length > 0;

  // Home opens a specific deck via route params; apply each request once (adjust state during render).
  const requestKey = requestedDeckId ? `${requestedDeckId}:${requestToken ?? ''}` : undefined;
  if (requestKey && requestKey !== handledRequest) {
    setHandledRequest(requestKey);
    if (decks.some((currentDeck) => currentDeck.id === requestedDeckId)) {
      setSelectedDeckId(requestedDeckId);
      setCardIndex(0);
      setIsFlipped(false);
      setLastReviewed(null);
    }
  }

  useEffect(() => {
    Animated.spring(flipValue, {
      toValue: isFlipped ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 55,
    }).start();
  }, [flipValue, isFlipped]);

  useEffect(() => {
    if (!isComplete) {
      completionScale.setValue(0.82);
      completionOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(completionScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 70,
      }),
      Animated.timing(completionOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [completionOpacity, completionScale, isComplete]);

  function flipCard() {
    setIsFlipped((current) => !current);
    Haptics.selectionAsync().catch(() => undefined);
  }

  function review(grade: 'again' | 'good') {
    if (!deck || !card) {
      return;
    }

    reviewCard(deck.id, card.id, grade);
    const finishesStack = grade === 'good' && !isReviewingCompletedDeck && deck.cards.every((item) => (item.id === card.id ? item.mastery + 1 >= 3 : item.mastery >= 3));
    if (finishesStack) {
      setFinished({ deckId: deck.id, title: deck.title });
    }
    if (grade === 'good') {
      setConfettiBurst((current) => current + 1);
    }
    setLastReviewed({ back: card.back });
    setIsFlipped(false);

    // A card that reaches full mastery leaves the queue, so the next card slides into the same index.
    const leavesQueue = grade === 'good' && card.mastery < 3 && card.mastery + 1 >= 3;
    if (isReviewingCompletedDeck && grade === 'again') {
      setCardIndex(0);
    } else if (leavesQueue) {
      setCardIndex((currentIndex) => (cards.length > 1 ? currentIndex % (cards.length - 1) : 0));
    } else {
      setCardIndex((currentIndex) => (currentIndex + 1) % Math.max(1, cards.length));
    }
    Haptics.notificationAsync(grade === 'good' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  }

  function repeatFinishedDeck() {
    if (!finished) {
      return;
    }

    resetDeckProgress(finished.deckId);
    setSelectedDeckId(finished.deckId);
    setCardIndex(0);
    setLastReviewed(null);
    setFinished(null);
  }

  function openOtherDeck(deckId: string) {
    setFinished(null);
    selectDeck(deckId);
  }

  function completeSwipe(grade: 'again' | 'good') {
    Animated.timing(swipeX, {
      toValue: grade === 'good' ? 460 : -460,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      swipeX.setValue(0);
      review(grade);
    });
  }

  function selectDeck(deckId: string) {
    if (deckId === deck?.id) {
      return;
    }

    setSelectedDeckId(deckId);
    setCardIndex(0);
    setIsFlipped(false);
    setLastReviewed(null);
  }

  const frontRotateY = flipValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotateY = flipValue.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const swipeRotate = swipeX.interpolate({ inputRange: [-220, 0, 220], outputRange: ['-8deg', '0deg', '8deg'], extrapolate: 'clamp' });
  const againOpacity = swipeX.interpolate({ inputRange: [-140, -60], outputRange: [1, 0], extrapolate: 'clamp' });
  const goodOpacity = swipeX.interpolate({ inputRange: [60, 140], outputRange: [0, 1], extrapolate: 'clamp' });
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
    onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
    onPanResponderGrant: () => swipeX.stopAnimation(),
    onPanResponderMove: (_, gestureState) => swipeX.setValue(gestureState.dx),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 80 || gestureState.vx > 0.45) {
        completeSwipe('good');
        return;
      }

      if (gestureState.dx < -80 || gestureState.vx < -0.45) {
        completeSwipe('again');
        return;
      }

      Animated.spring(swipeX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 70,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(swipeX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 70,
      }).start();
    },
    onPanResponderTerminationRequest: () => false,
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>{t('study')}</Text>
            {!!deck && (
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {deck.title}
                {card ? ` · ${cardIndex + 1}/${cards.length}${isReviewingCompletedDeck ? ` · ${t('reviewMode')}` : ''}` : ''}
              </Text>
            )}
          </View>
          <ThemeToggle />
        </View>

        {!!deck && (
          <View accessibilityRole="header" style={[styles.learningBanner, { backgroundColor: deck.accent }]}>
            <Ionicons name="school" size={20} color="#FFFFFF" />
            <Text style={styles.learningBannerText} numberOfLines={2}>{t('learningNow').replace('{name}', deck.title)}</Text>
          </View>
        )}

        <DeckChips decks={prioritizedDecks} selectedId={deck?.id} theme={theme} onSelect={selectDeck} />

        {isComplete ? (
          <Animated.View style={[styles.emptyState, { opacity: completionOpacity, transform: [{ scale: completionScale }] }]}>
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <RuledPaper lineColor={theme.border} ruleColor={theme.primary} lineCount={4} lineSpacing={26} firstLineOffset={30} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('emptyStudyTitle')}</Text>
            <Text style={[styles.emptyCopy, { color: theme.muted }]}>{t('emptyStudyBody')}</Text>
          </Animated.View>
        ) : (
          <>
        <Animated.View {...panResponder.panHandlers} style={[styles.swipeFrame, { transform: [{ translateX: swipeX }, { rotateZ: swipeRotate }] }]}>
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.againBadge, { backgroundColor: theme.warning, opacity: againOpacity }]}> 
            <Text style={styles.swipeBadgeText}>{t('repeat')}</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.goodBadge, { backgroundColor: theme.success, opacity: goodOpacity }]}> 
            <Text style={styles.swipeBadgeText}>{t('good')}</Text>
          </Animated.View>
          <Pressable onPress={flipCard} accessibilityRole={Platform.OS === 'web' ? undefined : 'button'} accessibilityLabel={`${isFlipped ? t('answer') : t('question')}: ${isFlipped ? card.back : card.front}. ${t('tapToFlip')}`} style={styles.cardTouchable}>
            <Animated.View pointerEvents={isFlipped ? 'none' : 'auto'} style={[styles.studyCard, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ perspective: 1200 }, { rotateY: frontRotateY }] }]}> 
              <RuledPaper lineColor={theme.border} ruleColor={theme.primary} />
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardHint, { color: theme.muted }]}>{t('question')}</Text>
              </View>
              <CardFace text={card.front} imageUri={card.frontImageUri} textStyle={[styles.cardText, { color: theme.text }]} />
              <Text style={[styles.tapHint, { color: theme.muted }]}>{t('tapToFlip')}</Text>
            </Animated.View>
            <Animated.View pointerEvents={isFlipped ? 'auto' : 'none'} style={[styles.studyCard, { backgroundColor: deck.accent, borderColor: deck.accent, transform: [{ perspective: 1200 }, { rotateY: backRotateY }] }]}> 
              <RuledPaper lineColor="rgba(255,255,255,0.22)" ruleColor="rgba(255,255,255,0.7)" />
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardHint, styles.lightText]}>{t('answer')}</Text>
              </View>
              <CardFace text={card.back} imageUri={card.backImageUri} textStyle={[styles.cardText, styles.lightText]} />
              <Text style={[styles.tapHint, styles.lightText]}>{t('tapToFlip')}</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {!!lastReviewed?.back.trim() && (
          <View style={[styles.lastAnswer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.lastAnswerText}>
              <Text style={[styles.lastAnswerLabel, { color: theme.muted }]}>{t('lastAnswer')}</Text>
              <Text style={[styles.lastAnswerValue, { color: theme.text }]} numberOfLines={2}>{lastReviewed.back}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.warning }, pressed && styles.pressed]} onPress={() => review('again')}>
            <Text style={styles.actionText}>{t('again')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.success }, pressed && styles.pressed]} onPress={() => review('good')}>
            <Text style={styles.actionText}>{t('good')}</Text>
          </Pressable>
        </View>
          </>
        )}
      </ScrollView>
      <Confetti burst={confettiBurst} />
      <Modal transparent statusBarTranslucent visible={!!finished} animationType="fade" onRequestClose={() => setFinished(null)}>
        <View style={styles.finishBackdrop}>
          <View style={[styles.finishCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.finishEmoji}>🎉</Text>
            <Text style={[styles.finishMessage, { color: theme.text }]}>{t('stackDone').replace('{name}', finished?.title ?? '')}</Text>
            {otherOpenDecks.length > 0 && (
              <View style={styles.finishList}>
                <Text style={[styles.finishListTitle, { color: theme.muted }]}>{t('decks')}</Text>
                <ScrollView style={styles.finishListScroll} contentContainerStyle={styles.finishListContent}>
                  {otherOpenDecks.map((other) => (
                    <Pressable
                      key={other.id}
                      accessibilityRole="button"
                      onPress={() => openOtherDeck(other.id)}
                      style={({ pressed }) => [styles.finishDeck, { backgroundColor: theme.elevated, borderColor: other.accent }, pressed && styles.pressed]}
                    >
                      <Text style={[styles.finishDeckTitle, { color: theme.text }]} numberOfLines={1}>{other.title}</Text>
                      <Text style={[styles.finishDeckCount, { color: theme.muted }]}>{other.cards.filter((item) => item.mastery < 3).length}/{other.cards.length}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={styles.finishActions}>
              <Pressable accessibilityRole="button" style={[styles.finishButton, { backgroundColor: theme.primary }]} onPress={repeatFinishedDeck}>
                <Text style={styles.finishButtonText}>{t('deckRepeat')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={[styles.finishButton, { backgroundColor: theme.elevated }]} onPress={() => setFinished(null)}>
                <Text style={[styles.finishButtonText, { color: theme.text }]}>{t('done')}</Text>
              </Pressable>
            </View>
          </View>
          <Confetti burst={finished ? 1 : 0} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: displayFont,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  lastAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
  },
  lastAnswerText: {
    flex: 1,
    gap: 2,
  },
  lastAnswerLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  lastAnswerValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  swipeFrame: {
    flex: 1,
    minHeight: 360,
  },
  swipeBadge: {
    position: 'absolute',
    top: 24,
    zIndex: 3,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  againBadge: {
    left: 24,
  },
  goodBadge: {
    right: 24,
  },
  swipeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  learningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  learningBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  finishBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  finishCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 26,
    padding: 24,
    gap: 14,
    alignItems: 'center',
  },
  finishEmoji: {
    fontSize: 48,
  },
  finishMessage: {
    fontFamily: displayFont,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  finishPrompt: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  finishList: {
    alignSelf: 'stretch',
    gap: 8,
  },
  finishListTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  finishListScroll: {
    maxHeight: 200,
  },
  finishListContent: {
    gap: 8,
  },
  finishDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  finishDeckTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  finishDeckCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  finishActions: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  finishButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  cardTouchable: {
    flex: 1,
    minHeight: 360,
  },
  studyCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderRadius: 26,
    padding: 24,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  cardHint: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardText: {
    fontFamily: displayFont,
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '700',
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '800',
  },
  lightText: {
    color: '#FFFFFF',
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
    alignItems: 'center',
    gap: 10,
  },
  emptyCard: {
    width: 132,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: displayFont,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptyCopy: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
