import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { useColorScheme } from 'react-native';

import { createTheme } from '../../theme/palette';

type IconName = ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<string, IconName> = {
  index: 'sparkles',
  decks: 'albums',
  study: 'school',
  settings: 'settings',
};

export default function TabsLayout() {
  const theme = createTheme(useColorScheme());

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.tab,
          borderTopColor: theme.border,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
        tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name] ?? 'ellipse'} color={color} size={size} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Start' }} />
      <Tabs.Screen name="decks" options={{ title: 'Decks' }} />
      <Tabs.Screen name="study" options={{ title: 'Lernen' }} />
      <Tabs.Screen name="settings" options={{ title: 'Mehr' }} />
    </Tabs>
  );
}
