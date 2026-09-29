import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../state/ThemeContext';
import { displayFont } from '../theme/palette';

type Props = {
  // Scales the whole mark; 1 is the compact header size.
  size?: number;
};

// Stacked index cards on a gradient tile, followed by the wordmark. Built from plain views so it
// needs no image asset and follows the light/dark theme.
export function BrandLogo({ size = 1 }: Props) {
  const { theme } = useAppTheme();
  const tile = 44 * size;

  return (
    <View style={[styles.row, { gap: 12 * size }]} accessibilityRole="header" accessibilityLabel="Index Card">
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tile, { width: tile, height: tile, borderRadius: 14 * size, shadowColor: theme.gradientStart }]}
      >
        <View style={[styles.card, styles.cardBack, { width: 24 * size, height: 17 * size, borderRadius: 4 * size }]} />
        <View style={[styles.card, styles.cardMid, { width: 24 * size, height: 17 * size, borderRadius: 4 * size }]} />
        <View style={[styles.card, { width: 24 * size, height: 17 * size, borderRadius: 4 * size }]}>
          <View style={[styles.rule, { top: 5 * size, height: 1.5 * size }]} />
          <View style={[styles.rule, { top: 9 * size, height: 1.5 * size, width: '55%' }]} />
        </View>
      </LinearGradient>
      <Text style={[styles.word, { color: theme.text, fontSize: 24 * size }]} numberOfLines={1}>
        Index<Text style={{ color: theme.primary }}> Card</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardBack: {
    opacity: 0.45,
    transform: [{ translateY: -6 }, { rotate: '-8deg' }],
  },
  cardMid: {
    opacity: 0.75,
    transform: [{ translateY: -3 }, { rotate: '5deg' }],
  },
  rule: {
    position: 'absolute',
    left: '15%',
    width: '70%',
    borderRadius: 1,
    backgroundColor: '#B8B0A6',
  },
  word: {
    fontFamily: displayFont,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
});
