import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Alert, Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { createTheme } from '../../theme/palette';

export default function StudyScreen() {
  const theme = createTheme(useColorScheme());
  const { dueDecks, reviewCard } = useLibrary();
  const { languageCode, t } = useLanguage();
  const [deckIndex, setDeckIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipValue] = useState(() => new Animated.Value(0));
  const [swipeX] = useState(() => new Animated.Value(0));
  const [completionScale] = useState(() => new Animated.Value(0.82));
  const [completionOpacity] = useState(() => new Animated.Value(0));
  const [sparkleDrift] = useState(() => new Animated.Value(0));
  const [isSpeechMode, setIsSpeechMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenAnswer, setSpokenAnswer] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState('');
  const deck = dueDecks[deckIndex] ?? dueDecks[0];
  const cards = deck?.cards.filter((card) => card.mastery < 3) ?? [];
  const card = cards[cardIndex] ?? cards[0];
  const isComplete = !deck || !card;

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
      sparkleDrift.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(completionScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 85,
      }),
      Animated.timing(completionOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleDrift, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleDrift, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [completionOpacity, completionScale, isComplete, sparkleDrift]);

  function flipCard() {
    setIsFlipped((current) => !current);
    Haptics.selectionAsync().catch(() => undefined);
  }

  function speak(text: string) {
    Speech.stop().finally(() => {
      Speech.speak(text, {
        language: languageCode,
        pitch: 1.02,
        rate: 0.92,
      });
    });
  }

  function review(grade: 'again' | 'good') {
    if (!deck || !card) {
      return;
    }

    reviewCard(deck.id, card.id, grade);
    setIsFlipped(false);
    setSpokenAnswer('');
    setSpeechFeedback('');
    setIsListening(false);
    setCardIndex((currentIndex) => (currentIndex + 1) % Math.max(1, cards.length));
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

  function nextDeck() {
    setDeckIndex((currentIndex) => (currentIndex + 1) % Math.max(1, dueDecks.length));
    setCardIndex(0);
    setIsFlipped(false);
    setIsSpeechMode(false);
    setIsListening(false);
    setSpokenAnswer('');
    setSpeechFeedback('');
  }

  function normalizeAnswer(value: string) {
    return value
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function enterSpeechMode() {
    setIsSpeechMode(true);
    setIsFlipped(false);
    setSpokenAnswer('');
    setSpeechFeedback('');
    Alert.alert(t('speechMode'), t('speechHint'));
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
        const message = 'Native Speech-Erkennung ist in dieser installierten App nicht enthalten. Installiere die neueste Development-Build-APK und oeffne Index Card, nicht Expo Go.';
        setIsListening(false);
        setSpeechFeedback(message);
        Alert.alert(t('speechMode'), message);
        return;
      }

      const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permissions.granted) {
        const message = 'Mikrofon oder Spracherkennung wurde nicht erlaubt. Bitte in den App-Einstellungen erlauben und erneut versuchen.';
        setIsListening(false);
        setSpeechFeedback(message);
        Alert.alert(t('speechMode'), message);
        return;
      }

      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        const message = 'Auf diesem Geraet ist kein Speech-Recognition-Dienst verfuegbar. Android: Google App oder Speech Recognition & Synthesis installieren/aktivieren. iOS: Siri & Diktieren aktivieren.';
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

        if (normalizeAnswer(transcript) === normalizeAnswer(card.back)) {
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
    } catch (error) {
      const message = error instanceof Error
        ? `Native Speech-Erkennung ist nicht geladen: ${error.message}`
        : t('speechUnavailable');
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
  const sparkleTranslateY = sparkleDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
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

  if (isComplete) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
        <Animated.View style={[styles.emptyState, { opacity: completionOpacity, transform: [{ scale: completionScale }] }]}> 
          <Animated.View style={[styles.sparkleRow, { transform: [{ translateY: sparkleTranslateY }] }]}> 
            <View style={[styles.sparkle, { backgroundColor: theme.primary }]} />
            <View style={[styles.sparkle, styles.sparkleLarge, { backgroundColor: theme.warning }]} />
            <View style={[styles.sparkle, { backgroundColor: theme.secondary }]} />
          </Animated.View>
          <View style={[styles.trophy, { backgroundColor: theme.success }]}> 
            <Text style={styles.trophyText}>100%</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Stark gemacht!</Text>
          <Text style={[styles.emptyCopy, { color: theme.muted }]}>Du hast alle faelligen Karten gewusst. Kurze Pause, dann geht es mit neuen Karten weiter.</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>{t('study')}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{deck.title} · {cardIndex + 1}/{cards.length}</Text>
          </View>
          <Pressable style={[styles.deckSwitch, { backgroundColor: theme.elevated }]} onPress={nextDeck}>
            <Text style={[styles.deckSwitchText, { color: theme.text }]}>Deck</Text>
          </Pressable>
        </View>

        <Animated.View {...(!isSpeechMode ? panResponder.panHandlers : {})} style={[styles.swipeFrame, { transform: [{ translateX: swipeX }, { rotateZ: swipeRotate }] }]}> 
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.againBadge, { backgroundColor: theme.warning, opacity: againOpacity }]}> 
            <Text style={styles.swipeBadgeText}>{t('repeat')}</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.goodBadge, { backgroundColor: theme.success, opacity: goodOpacity }]}> 
            <Text style={styles.swipeBadgeText}>{t('good')}</Text>
          </Animated.View>
          <Pressable disabled={isSpeechMode} onPress={flipCard} style={styles.cardTouchable}>
            <Animated.View style={[styles.studyCard, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ perspective: 1200 }, { rotateY: frontRotateY }] }]}> 
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardHint, { color: theme.muted }]}>{t('question')}</Text>
                <Pressable style={[styles.speechButton, { backgroundColor: theme.elevated }]} onPress={() => speak(card.front)}>
                  <Text style={[styles.speechButtonText, { color: theme.text }]}>{t('listen')}</Text>
                </Pressable>
              </View>
              <Text style={[styles.cardText, { color: theme.text }]}>{card.front}</Text>
              <Text style={[styles.tapHint, { color: theme.muted }]}>{t('tapToFlip')}</Text>
            </Animated.View>
            <Animated.View style={[styles.studyCard, { backgroundColor: deck.accent, borderColor: deck.accent, transform: [{ perspective: 1200 }, { rotateY: backRotateY }] }]}> 
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardHint, styles.lightText]}>{t('answer')}</Text>
                <Pressable style={styles.lightSpeechButton} onPress={() => speak(card.back)}>
                  <Text style={styles.lightSpeechButtonText}>{t('listen')}</Text>
                </Pressable>
              </View>
              <Text style={[styles.cardText, styles.lightText]}>{card.back}</Text>
              <Text style={[styles.tapHint, styles.lightText]}>{t('tapToFlip')}</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

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
          <Pressable style={[styles.actionButton, { backgroundColor: theme.warning }]} onPress={() => review('again')}>
            <Text style={styles.actionText}>{t('again')}</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: theme.success }]} onPress={() => review('good')}>
            <Text style={styles.actionText}>{t('good')}</Text>
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  speechButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  speechButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  lightSpeechButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  lightSpeechButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
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
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  sparkle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  sparkleLarge: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  trophy: {
    width: 126,
    height: 126,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trophyText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },
  emptyTitle: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyCopy: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
