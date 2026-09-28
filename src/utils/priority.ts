import { AppTheme } from '../theme/palette';
import { Deck, DeckPriority } from '../types/flashcards';

export const priorityLevels: DeckPriority[] = ['high', 'medium', 'low'];

const order: Record<DeckPriority, number> = { high: 0, medium: 1, low: 2 };

export const priorityLabelKeys = {
  high: 'priorityHigh',
  medium: 'priorityMedium',
  low: 'priorityLow',
} as const;

// Stable sort: decks with equal priority keep their existing order.
export function sortByPriority(decks: Deck[]) {
  return [...decks].sort((a, b) => order[a.priority] - order[b.priority]);
}

// Tapping the flag steps low -> medium -> high -> low.
export function nextPriority(priority: DeckPriority): DeckPriority {
  return priority === 'low' ? 'medium' : priority === 'medium' ? 'high' : 'low';
}

export function priorityColor(theme: AppTheme, priority: DeckPriority) {
  return priority === 'high' ? theme.primary : priority === 'medium' ? theme.warning : theme.muted;
}
