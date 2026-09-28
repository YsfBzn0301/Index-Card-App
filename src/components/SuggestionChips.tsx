import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AppTheme } from '../theme/palette';

type SuggestionChipsProps = {
  options: string[];
  value: string;
  theme: AppTheme;
  onSelect: (option: string) => void;
};

function isSameText(a: string, b: string) {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

// Horizontal row of existing values; the chip matching the current input is highlighted.
export function SuggestionChips({ options, value, theme, onSelect }: SuggestionChipsProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const isActive = isSameText(option, value);

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: isActive ? theme.primary : theme.elevated, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : theme.text }]} numberOfLines={1}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 200,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
