import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
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
  const [swipeX] = useState(() => new Animated.Value(0));
  const [completionScale] = useState(() => new Animated.Value(0.82));
  const [completionOpacity] = useState(() => new Animated.Value(0));
  const [sparkleDrift] = useState(() => new Animated.Value(0));
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

  function review(grade: 'again' | 'good') {
    if (!deck || !card) {
      return;
    }

    reviewCard(deck.id, card.id, grade);
    setIsFlipped(false);
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
            <Text style={[styles.title, { color: theme.text }]}>Lernen</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{deck.title} · {cardIndex + 1}/{cards.length}</Text>
          </View>
          <Pressable style={[styles.deckSwitch, { backgroundColor: theme.elevated }]} onPress={nextDeck}>
            <Text style={[styles.deckSwitchText, { color: theme.text }]}>Deck</Text>
          </Pressable>
        </View>

        <Animated.View {...panResponder.panHandlers} style={[styles.swipeFrame, { transform: [{ translateX: swipeX }, { rotateZ: swipeRotate }] }]}> 
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.againBadge, { backgroundColor: theme.warning, opacity: againOpacity }]}> 
            <Text style={styles.swipeBadgeText}>Wiederholen</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeBadge, styles.goodBadge, { backgroundColor: theme.success, opacity: goodOpacity }]}> 
            <Text style={styles.swipeBadgeText}>Gewusst</Text>
          </Animated.View>
          <Pressable onPress={flipCard} style={styles.cardTouchable}>
            <Animated.View style={[styles.studyCard, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ perspective: 1200 }, { rotateY: frontRotateY }] }]}> 
              <Text style={[styles.cardHint, { color: theme.muted }]}>Frage</Text>
              <Text style={[styles.cardText, { color: theme.text }]}>{card.front}</Text>
              <Text style={[styles.tapHint, { color: theme.muted }]}>Tippen zum Drehen</Text>
            </Animated.View>
            <Animated.View style={[styles.studyCard, { backgroundColor: deck.accent, borderColor: deck.accent, transform: [{ perspective: 1200 }, { rotateY: backRotateY }] }]}> 
              <Text style={[styles.cardHint, styles.lightText]}>Antwort</Text>
              <Text style={[styles.cardText, styles.lightText]}>{card.back}</Text>
              <Text style={[styles.tapHint, styles.lightText]}>Tippen zum Drehen</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

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
