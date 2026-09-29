import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../state/LanguageContext';
import { AppTheme, displayFont } from '../theme/palette';
import { Deck } from '../types/flashcards';
import { Confetti } from './Confetti';

const maxPairs = 6;

type Pair = { id: string; question: string; answer: string; questionImage?: string; answerImage?: string };
type TileStatus = 'idle' | 'selected' | 'correct' | 'wrong';

type Props = {
  deck: Deck;
  theme: AppTheme;
  onExit: () => void;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

// A side needs text or an image to be matchable; images are shown as small thumbnails on the tile.
function buildPairs(deck: Deck): Pair[] {
  return shuffle(deck.cards.filter((card) => (card.front.trim() || card.frontImageUri) && (card.back.trim() || card.backImageUri)))
    .slice(0, maxPairs)
    .map((card) => ({
      id: card.id,
      question: card.front.trim(),
      answer: card.back.trim(),
      questionImage: card.frontImageUri,
      answerImage: card.backImageUri,
    }));
}

type TileProps = {
  label: string;
  imageUri?: string;
  status: TileStatus;
  disabled: boolean;
  theme: AppTheme;
  onPress: () => void;
};

function Tile({ label, imageUri, status, disabled, theme, onPress }: TileProps) {
  const [shake] = useState(() => new Animated.Value(0));
  const [vanish] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (status === 'wrong') {
      Animated.sequence(
        [10, -10, 8, -8, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 60, easing: Easing.linear, useNativeDriver: true })),
      ).start();
    } else if (status === 'correct') {
      Animated.sequence([
        Animated.timing(vanish, { toValue: 1.08, duration: 140, useNativeDriver: true }),
        Animated.timing(vanish, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    }
  }, [status, shake, vanish]);

  const backgroundColor =
    status === 'correct' ? theme.success : status === 'wrong' ? theme.primary : status === 'selected' ? theme.secondary : theme.surface;
  const isFilled = status !== 'idle';

  return (
    <Animated.View
      pointerEvents={status === 'correct' ? 'none' : 'auto'}
      style={{ opacity: status === 'correct' ? vanish : 1, transform: [{ translateX: shake }, { scale: status === 'correct' ? vanish : 1 }] }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: status === 'selected', disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.tile, { backgroundColor, borderColor: isFilled ? backgroundColor : theme.border }, pressed && styles.tilePressed]}
      >
        {!!imageUri && <Image source={{ uri: imageUri }} contentFit="contain" style={styles.tileImage} />}
        {!!label && (
          <Text style={[styles.tileText, { color: isFilled ? '#FFFFFF' : theme.text }]} numberOfLines={4}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function MatchingGame({ deck, theme, onExit }: Props) {
  const { t } = useLanguage();
  const [round, setRound] = useState(0);
  // The board is rebuilt per deck and per round ("play again"), not on every card edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pairs = useMemo(() => buildPairs(deck), [deck.id, round]);
  const questions = useMemo(() => shuffle(pairs), [pairs]);
  const answers = useMemo(() => shuffle(pairs), [pairs]);
  const [solved, setSolved] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<{ question: string; answer: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [burst, setBurst] = useState(0);
  const isWon = pairs.length > 0 && solved.length === pairs.length;

  useEffect(() => {
    if (isWon || pairs.length === 0) {
      return;
    }
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon, pairs.length, round]);

  function restart() {
    setRound((current) => current + 1);
    setSolved([]);
    setSelectedQuestion(null);
    setWrongAnswer(null);
    setMistakes(0);
    setSeconds(0);
  }

  function pickQuestion(id: string) {
    if (wrongAnswer) {
      return;
    }
    setSelectedQuestion((current) => (current === id ? null : id));
    Haptics.selectionAsync().catch(() => undefined);
  }

  function pickAnswer(id: string) {
    if (!selectedQuestion || wrongAnswer) {
      return;
    }

    if (selectedQuestion === id) {
      const nextSolved = [...solved, id];
      setSolved(nextSolved);
      setSelectedQuestion(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (nextSolved.length === pairs.length) {
        setBurst((current) => current + 1);
      }
      return;
    }

    setWrongAnswer({ question: selectedQuestion, answer: id });
    setMistakes((current) => current + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    // The red shake plays, then both tiles are deactivated again.
    setTimeout(() => {
      setWrongAnswer(null);
      setSelectedQuestion(null);
    }, 520);
  }

  const score = Math.max(0, pairs.length * 100 - mistakes * 20 - seconds);

  if (pairs.length < 2) {
    return (
      <View style={styles.center}>
        <Text style={[styles.message, { color: theme.text }]}>{t('gameNeedCards')}</Text>
        <Pressable style={[styles.button, { backgroundColor: theme.secondary }]} onPress={onExit}>
          <Text style={styles.buttonText}>{t('gameBack')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.game}>
      <View style={styles.statusRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('gameBack')} hitSlop={10} onPress={onExit} style={[styles.exit, { backgroundColor: theme.elevated }]}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.stat, { color: theme.text }]}>{solved.length}/{pairs.length}</Text>
        <Text style={[styles.stat, { color: theme.muted }]}>{t('gameTime')} {seconds}s</Text>
        <Text style={[styles.stat, { color: theme.muted }]}>{t('gameMistakes')} {mistakes}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.board}>
        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: theme.muted }]}>{t('gameQuestions')}</Text>
          {questions.map((pair) => {
            const isSolved = solved.includes(pair.id);
            const status: TileStatus = isSolved ? 'correct' : wrongAnswer?.question === pair.id ? 'wrong' : selectedQuestion === pair.id ? 'selected' : 'idle';
            return <Tile key={pair.id} label={pair.question} imageUri={pair.questionImage} status={status} disabled={isSolved || !!wrongAnswer} theme={theme} onPress={() => pickQuestion(pair.id)} />;
          })}
        </View>
        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: theme.muted }]}>{t('gameAnswers')}</Text>
          {answers.map((pair) => {
            const isSolved = solved.includes(pair.id);
            const status: TileStatus = isSolved ? 'correct' : wrongAnswer?.answer === pair.id ? 'wrong' : 'idle';
            return <Tile key={pair.id} label={pair.answer} imageUri={pair.answerImage} status={status} disabled={isSolved || !selectedQuestion || !!wrongAnswer} theme={theme} onPress={() => pickAnswer(pair.id)} />;
          })}
        </View>
      </ScrollView>
      {isWon && (
        <View style={[styles.winOverlay, { backgroundColor: theme.background }]}>
          <Text style={[styles.winTitle, { color: theme.text }]}>{t('gameWon')}</Text>
          <Text style={[styles.message, { color: theme.muted }]}>
            {t('gameScore')}: {score} · {t('gameTime')}: {seconds}s · {t('gameMistakes')}: {mistakes}
          </Text>
          <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={restart}>
            <Text style={styles.buttonText}>{t('gamePlayAgain')}</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: theme.elevated }]} onPress={onExit}>
            <Text style={[styles.buttonText, { color: theme.text }]}>{t('gameBack')}</Text>
          </Pressable>
        </View>
      )}
      <Confetti burst={burst} />
    </View>
  );
}

const styles = StyleSheet.create({
  game: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 10 },
  exit: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stat: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  board: { flexDirection: 'row', gap: 12, paddingBottom: 32 },
  column: { flex: 1, gap: 10 },
  columnTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  tile: { minHeight: 64, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center' },
  tilePressed: { opacity: 0.8 },
  tileImage: { width: '100%', height: 56, marginBottom: 6 },
  tileText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  winOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  winTitle: { fontFamily: displayFont, fontSize: 34, fontWeight: '800' },
  message: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  button: { borderRadius: 16, paddingHorizontal: 22, paddingVertical: 14, minWidth: 200, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
