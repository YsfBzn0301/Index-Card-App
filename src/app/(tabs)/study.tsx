import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeckChips } from '../../components/DeckChips';
import { RuledPaper } from '../../components/RuledPaper';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { useAppTheme } from '../../state/ThemeContext';
import { displayFont } from '../../theme/palette';
import { isAnswerMatch } from '../../utils/answerMatch';
import { speakInLanguage, stopSpeaking } from '../../utils/speech';

export default function StudyScreen() {
  const { theme } = useAppTheme();
  const { decks, prioritizedDecks, reviewCard } = useLibrary();
  const { languageCode, t } = useLanguage();
  const { deckId: requestedDeckId, at: requestToken } = useLocalSearchParams<{ deckId?: string; at?: string }>();
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>();
  const [lastReviewed, setLastReviewed] = useState<{ back: string } | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [handledRequest, setHandledRequest] = useState<string | undefined>();
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipValue] = useState(() => new Animated.Value(0));
  const [swipeX] = useState(() => new Animated.Value(0));
  const [completionScale] = useState(() => new Animated.Value(0.82));
  const [completionOpacity] = useState(() => new Animated.Value(0));
  const [isSpeechMode, setIsSpeechMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenAnswer, setSpokenAnswer] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [ttsFeedback, setTtsFeedback] = useState('');
  // Falls back to the first deck that has cards, so a freshly created empty deck never hides the others.
  const deck = decks.find((currentDeck) => currentDeck.id === selectedDeckId) ?? prioritizedDecks.find((currentDeck) => currentDeck.cards.length > 0) ?? decks[0];
  const dueCards = deck?.cards.filter((card) => card.mastery < 3) ?? [];
  const cards = dueCards.length > 0 ? dueCards : deck?.cards ?? [];
  const card = cards[cardIndex] ?? cards[0];
  const isComplete = !deck || !card;
  const isReviewingCompletedDeck = !!deck && dueCards.length === 0 && deck.cards.length > 0;

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

  async function speak(text: string, label: string) {
    const textToSpeak = text.trim();

    if (!textToSpeak) {
      return;
    }

    setTtsFeedback(`${label}: ${t('speechListening')}`);

    try {
      const result = await speakInLanguage(textToSpeak, languageCode, {
        rate: 0.88,
        onStart: () => setTtsFeedback(`${label}: ${t('listen')}`),
        onDone: () => setTtsFeedback(''),
        onStopped: () => setTtsFeedback(''),
        onError: (error) => {
          const message = error.message || t('speechUnavailable');
          setTtsFeedback(message);
          Alert.alert(t('listen'), message);
        },
      });

      if (result === 'voice-missing') {
        setTtsFeedback(t('voiceMissing'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('speechUnavailable');
      setTtsFeedback(message);
      Alert.alert(t('listen'), message);
    }
  }

  function review(grade: 'again' | 'good') {
    if (!deck || !card) {
      return;
    }

    reviewCard(deck.id, card.id, grade);
    setLastReviewed({ back: card.back });
    setIsFlipped(false);
    setSpokenAnswer('');
    setSpeechFeedback('');
    setIsListening(false);
    setTtsFeedback('');

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
    setIsSpeechMode(false);
    setIsListening(false);
    setSpokenAnswer('');
    setSpeechFeedback('');
    setTtsFeedback('');
    setLastReviewed(null);
    stopSpeaking();
  }

  function enterSpeechMode() {
    setIsSpeechMode(true);
    setIsFlipped(false);
    setSpokenAnswer('');
    setSpeechFeedback('');
  }

  function leaveSpeechMode() {
    import('expo-speech-recognition')
      .then(({ ExpoSpeechRecognitionModule }) => ExpoSpeechRecognitionModule.abort())
      .catch(() => undefined);
    setIsSpeechMode(false);
    setIsListening(false);
    setSpokenAnswer('');
    setSpeechFeedback('');
  }

  async function startAnswerSpeechCheck() {
    if (!card || isListening) {
      return;
    }

    setIsListening(true);
    setSpokenAnswer('');
    setSpeechFeedback(t('speechListening'));

    try {
      const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');

      if (!ExpoSpeechRecognitionModule) {
        const message = t('speechUnavailable');
        setIsListening(false);
        setSpeechFeedback(message);
        Alert.alert(t('speechMode'), message);
        return;
      }

      const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permissions.granted) {
        const message = t('speechUnavailable');
        setIsListening(false);
        setSpeechFeedback(message);
        Alert.alert(t('speechMode'), message);
        return;
      }

      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        const message = t('speechUnavailable');
        setIsListening(false);
        setSpeechFeedback(message);
        Alert.alert(t('speechMode'), message);
        return;
      }

      setSpeechFeedback(t('speechListening'));

      let cleanup = () => undefined;
      const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        const transcript = event.results[0]?.transcript?.trim() ?? '';
        if (!transcript) {
          return;
        }

        setSpokenAnswer(transcript);

        if (isAnswerMatch(transcript, card.back)) {
          setSpeechFeedback(t('speechCorrect'));
          cleanup();
          ExpoSpeechRecognitionModule.abort();
          review('good');
          return;
        }

        setSpeechFeedback(t('speechTryAgain'));
      });
      const endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
        setIsListening(false);
        cleanup();
      });
      const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        setIsListening(false);
        cleanup();
        if (event.error !== 'aborted') {
          setSpeechFeedback(event.message || t('speechTryAgain'));
        }
      });

      cleanup = () => {
        resultListener.remove();
        endListener.remove();
        errorListener.remove();
      };

      try {
        ExpoSpeechRecognitionModule.start({
          lang: languageCode,
          interimResults: false,
          continuous: false,
          maxAlternatives: 1,
          iosTaskHint: 'confirmation',
          androidIntentOptions: {
            EXTRA_LANGUAGE_MODEL: 'web_search',
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : t('speechUnavailable');
        setIsListening(false);
        setSpeechFeedback(message);
        Alert.alert(t('speechMode'), message);
      }
    } catch {
      const message = t('speechUnavailable');
      setIsListening(false);
      setSpeechFeedback(message);
      Alert.alert(t('speechMode'), message);
    }
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
      <View style={styles.content}>
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
        <Animated.View {...(!isSpeechMode ? panResponder.panHandlers : {})} style={[styles.swipeFrame, { transform: [{ translateX: swipeX }, { rotateZ: swipeRotate }] }]}> 
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.againBadge, { backgroundColor: theme.warning, opacity: againOpacity }]}> 
            <Text style={styles.swipeBadgeText}>{t('repeat')}</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.goodBadge, { backgroundColor: theme.success, opacity: goodOpacity }]}> 
            <Text style={styles.swipeBadgeText}>{t('good')}</Text>
          </Animated.View>
          <Pressable disabled={isSpeechMode} onPress={flipCard} accessibilityRole="button" accessibilityLabel={`${isFlipped ? t('answer') : t('question')}: ${isFlipped ? card.back : card.front}. ${t('tapToFlip')}`} style={styles.cardTouchable}>
            <Animated.View style={[styles.studyCard, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ perspective: 1200 }, { rotateY: frontRotateY }] }]}> 
              <RuledPaper lineColor={theme.border} ruleColor={theme.primary} />
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardHint, { color: theme.muted }]}>{t('question')}</Text>
              </View>
              <Text style={[styles.cardText, { color: theme.text }]}>{card.front}</Text>
              <Text style={[styles.tapHint, { color: theme.muted }]}>{t('tapToFlip')}</Text>
            </Animated.View>
            <Animated.View style={[styles.studyCard, { backgroundColor: deck.accent, borderColor: deck.accent, transform: [{ perspective: 1200 }, { rotateY: backRotateY }] }]}> 
              <RuledPaper lineColor="rgba(255,255,255,0.22)" ruleColor="rgba(255,255,255,0.7)" />
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardHint, styles.lightText]}>{t('answer')}</Text>
              </View>
              <Text style={[styles.cardText, styles.lightText]}>{card.back}</Text>
              <Text style={[styles.tapHint, styles.lightText]}>{t('tapToFlip')}</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <View style={styles.audioActions}>
          <Pressable accessibilityRole="button" style={[styles.audioButton, { backgroundColor: theme.elevated }]} onPress={() => speak(card.front, t('front'))}>
            <Text style={[styles.audioButtonText, { color: theme.text }]}>{t('speakFront')}</Text>
          </Pressable>
        </View>
        {!!ttsFeedback && <Text style={[styles.ttsFeedback, { color: theme.muted }]}>{ttsFeedback}</Text>}
        {!!lastReviewed && (
          <View style={[styles.lastAnswer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.lastAnswerText}>
              <Text style={[styles.lastAnswerLabel, { color: theme.muted }]}>{t('lastAnswer')}</Text>
              <Text style={[styles.lastAnswerValue, { color: theme.text }]} numberOfLines={2}>{lastReviewed.back}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('speakBack')}
              onPress={() => speak(lastReviewed.back, t('answer'))}
              style={({ pressed }) => [styles.lastAnswerButton, { backgroundColor: deck.accent }, pressed && styles.pressed]}
            >
              <Ionicons name="volume-high" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {isSpeechMode ? (
          <View style={[styles.speechModePanel, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={[styles.speechModeTitle, { color: theme.text }]}>{t('speechMode')}</Text>
            <Text style={[styles.speechModeHint, { color: theme.muted }]}>{t('speechHint')}</Text>
            {!!spokenAnswer && <Text style={[styles.spokenAnswer, { color: theme.text }]}>{spokenAnswer}</Text>}
            {!!speechFeedback && <Text style={[styles.speechFeedback, { color: theme.muted }]}>{speechFeedback}</Text>}
            <View style={styles.speechModeActions}>
              <Pressable style={[styles.speechModeButton, { backgroundColor: theme.secondary }]} onPress={startAnswerSpeechCheck}>
                <Text style={styles.speechModeButtonText}>{isListening ? t('speechListening') : t('speechStart')}</Text>
              </Pressable>
              <Pressable style={[styles.speechModeExitButton, { borderColor: theme.border }]} onPress={leaveSpeechMode}>
                <Text style={[styles.speechModeExitText, { color: theme.text }]}>{t('speechExit')}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={[styles.speechModeButton, { backgroundColor: theme.secondary }]} onPress={enterSpeechMode}>
            <Text style={styles.speechModeButtonText}>{t('speechMode')}</Text>
          </Pressable>
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
    paddingBottom: 20,
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
  lastAnswerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  audioActions: {
    flexDirection: 'row',
    gap: 10,
  },
  audioButton: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  audioButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  ttsFeedback: {
    marginTop: -14,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
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
  speechModePanel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  speechModeTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  speechModeHint: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  spokenAnswer: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  speechFeedback: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  speechModeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  speechModeButton: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  speechModeButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  speechModeExitButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  speechModeExitText: {
    fontWeight: '900',
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
