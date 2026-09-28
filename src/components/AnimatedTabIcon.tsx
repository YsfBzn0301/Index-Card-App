import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, ColorValue, Easing, StyleSheet, View } from 'react-native';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Each tab gets its own small "personality" when it becomes active.
export type TabMotion = 'wiggle' | 'tilt' | 'bounce' | 'spin';

type AnimatedTabIconProps = {
  filledName: IconName;
  outlineName: IconName;
  focused: boolean;
  color: ColorValue;
  motion: TabMotion;
  size?: number;
};

const burstInput = [0, 0.25, 0.5, 0.75, 1];

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => subscription.remove();
  }, []);

  return reduceMotion;
}

export function AnimatedTabIcon({ filledName, outlineName, focused, color, motion, size = 24 }: AnimatedTabIconProps) {
  const reduceMotion = useReduceMotion();
  // progress: resting state (0 inactive, 1 active). burst: one-shot flourish played on activation.
  const [progress] = useState(() => new Animated.Value(focused ? 1 : 0));
  const [burst] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();

    if (!focused) {
      burst.setValue(0);
      return;
    }

    if (reduceMotion) {
      return;
    }

    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [burst, focused, progress, reduceMotion]);

  const rotate = burst.interpolate(
    motion === 'wiggle'
      ? { inputRange: burstInput, outputRange: ['0deg', '-16deg', '14deg', '-6deg', '0deg'] }
      : motion === 'tilt'
        ? { inputRange: [0, 0.5, 1], outputRange: ['0deg', '-12deg', '0deg'] }
        : motion === 'spin'
          ? { inputRange: [0, 1], outputRange: ['0deg', '90deg'] }
          : { inputRange: [0, 1], outputRange: ['0deg', '0deg'] },
  );
  const hop = burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, motion === 'bounce' ? -9 : -4, 0] });
  const pop = burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, motion === 'bounce' ? 1.3 : 1.18, 1] });
  const lift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const grow = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const glowScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { backgroundColor: color, opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }), transform: [{ scale: glowScale }] }]}
      />
      <Animated.View style={{ transform: [{ translateY: lift }, { translateY: hop }, { scale: grow }, { scale: pop }, { rotate }] }}>
        <Ionicons name={focused ? filledName : outlineName} size={size} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
