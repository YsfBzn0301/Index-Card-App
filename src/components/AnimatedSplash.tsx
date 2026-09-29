import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { useLibrary } from '../state/LibraryContext';
import { useAppTheme } from '../state/ThemeContext';
import { BrandLogo } from './BrandLogo';

const minimumVisibleMs = 1000;

// Runs right after the native splash: the logo fades in and scales up, and the overlay leaves as soon
// as the saved library is loaded (but not before a short minimum, so the animation can finish).
export function AnimatedSplash() {
  const { theme } = useAppTheme();
  const { isReady } = useLibrary();
  const [isDone, setIsDone] = useState(false);
  const [hasWaited, setHasWaited] = useState(false);
  const [logoProgress] = useState(() => new Animated.Value(0));
  const [overlayOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // The overlay is mounted and painted, so the native splash can hand over to it.
    SplashScreen.hideAsync().catch(() => undefined);
    Animated.timing(logoProgress, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const timer = setTimeout(() => setHasWaited(true), minimumVisibleMs);
    return () => clearTimeout(timer);
  }, [logoProgress]);

  useEffect(() => {
    if (!isReady || !hasWaited) {
      return;
    }

    Animated.timing(overlayOpacity, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => setIsDone(true));
  }, [isReady, hasWaited, overlayOpacity]);

  if (isDone) {
    return null;
  }

  return (
    <Animated.View pointerEvents={hasWaited && isReady ? 'none' : 'auto'} style={[styles.overlay, { backgroundColor: theme.background, opacity: overlayOpacity }]}>
      <Animated.View
        style={{
          opacity: logoProgress,
          transform: [{ scale: logoProgress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
        }}
      >
        <BrandLogo size={1.5} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
