import { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F43'];
const pieceCount = 36;

type Props = {
  // Increment to fire one burst; 0 shows nothing.
  burst: number;
};

type Piece = { x: number; drift: number; delay: number; size: number; color: string; spin: number; round: boolean; duration: number };

function createPieces(): Piece[] {
  const { width } = Dimensions.get('window');
  return Array.from({ length: pieceCount }, (_, index) => ({
    x: Math.random() * width,
    drift: (Math.random() - 0.5) * 140,
    delay: Math.random() * 250,
    size: 8 + Math.random() * 8,
    color: colors[index % colors.length],
    spin: 2 + Math.random() * 4,
    round: Math.random() > 0.6,
    duration: 1500 + Math.random() * 900,
  }));
}

function Burst() {
  const [pieces] = useState(createPieces);
  const [progress] = useState(() => pieces.map(() => new Animated.Value(0)));
  const height = Dimensions.get('window').height;

  useEffect(() => {
    const animation = Animated.parallel(
      progress.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          delay: pieces[index].delay,
          duration: pieces[index].duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [pieces, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => {
        const value = progress[index];
        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: piece.x,
              top: -20,
              width: piece.size,
              height: piece.round ? piece.size : piece.size * 0.5,
              borderRadius: piece.round ? piece.size / 2 : 2,
              backgroundColor: piece.color,
              opacity: value.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.9] }) },
                { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] }) },
                { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin * 360}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

export function Confetti({ burst }: Props) {
  return burst > 0 ? <Burst key={burst} /> : null;
}
