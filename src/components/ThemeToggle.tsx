import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';

import { useLanguage } from '../state/LanguageContext';
import { useAppTheme } from '../state/ThemeContext';

type ThemeToggleProps = {
  // Use on colored backgrounds such as the home hero, where theme surfaces would clash.
  onColor?: boolean;
};

// Sun/moon button shown in the header of every screen. The icon shows the mode a tap switches to.
export function ThemeToggle({ onColor = false }: ThemeToggleProps) {
  const { theme, colorScheme, toggleColorScheme } = useAppTheme();
  const { t } = useLanguage();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? t('switchToLight') : t('switchToDark')}
      hitSlop={6}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        toggleColorScheme();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: onColor ? 'rgba(255,255,255,0.24)' : theme.elevated },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={onColor ? '#FFFFFF' : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
