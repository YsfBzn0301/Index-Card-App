import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTabIcon, TabMotion } from '../../components/AnimatedTabIcon';
import { useLanguage } from '../../state/LanguageContext';
import { useAppTheme } from '../../state/ThemeContext';

const tabIcons = {
  index: { filled: 'sparkles', outline: 'sparkles-outline', motion: 'wiggle' },
  decks: { filled: 'albums', outline: 'albums-outline', motion: 'tilt' },
  study: { filled: 'school', outline: 'school-outline', motion: 'bounce' },
  settings: { filled: 'settings', outline: 'settings-outline', motion: 'spin' },
} as const satisfies Record<string, { filled: string; outline: string; motion: TabMotion }>;

export default function TabsLayout() {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const { bottom } = useSafeAreaInsets();
  const bottomPadding = Math.max(bottom, 12);
  const tabColors = {
    index: theme.tabHome,
    decks: theme.tabDecks,
    study: theme.tabStudy,
    settings: theme.tabSettings,
  };

  return (
    <Tabs
      screenListeners={{ tabPress: () => Haptics.selectionAsync().catch(() => undefined) }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tabColors[route.name as keyof typeof tabColors] ?? theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.tab,
          borderTopColor: theme.border,
          height: 64 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
        tabBarIcon: ({ color, focused }) => {
          const icon = tabIcons[route.name as keyof typeof tabIcons];

          return icon ? (
            <AnimatedTabIcon filledName={icon.filled} outlineName={icon.outline} motion={icon.motion} focused={focused} color={color} />
          ) : null;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="decks" options={{ title: t('decks') }} />
      <Tabs.Screen name="study" options={{ title: t('study') }} />
      <Tabs.Screen name="settings" options={{ title: t('settings') }} />
    </Tabs>
  );
}
