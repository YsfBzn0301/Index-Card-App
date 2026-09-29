import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../state/LanguageContext';
import { AppTheme } from '../theme/palette';

const actionWidth = 104;

type Props = PropsWithChildren<{
  theme: AppTheme;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}>;

// Swipe a deck card to the left to reveal a red delete action; long-press opens the deck menu.
export function DeckRow({ theme, onPress, onLongPress, onDelete, children }: Props) {
  const { t } = useLanguage();
  const [translateX] = useState(() => new Animated.Value(0));
  const [panResponder] = useState(() => {
    let offset = 0;

    function settle(toValue: number) {
      offset = toValue;
      Animated.spring(translateX, { toValue, useNativeDriver: true, friction: 8, tension: 90 }).start();
    }

    return PanResponder.create({
      // Only a clearly horizontal drag takes over, so taps and vertical scrolling keep working.
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_event, gesture) => {
        translateX.setValue(Math.max(-actionWidth, Math.min(0, offset + gesture.dx)));
      },
      onPanResponderRelease: (_event, gesture) => settle(offset + gesture.dx < -actionWidth / 2 ? -actionWidth : 0),
      onPanResponderTerminate: () => settle(0),
    });
  });

  function requestDelete() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    onDelete();
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.action, { backgroundColor: theme.primary }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('deckDelete')} onPress={requestDelete} style={styles.actionButton}>
          <Ionicons name="trash" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>{t('deckDelete')}</Text>
        </Pressable>
      </View>
      <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}>
        <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350}>
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  action: {
    ...StyleSheet.absoluteFill,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionButton: {
    width: actionWidth,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
