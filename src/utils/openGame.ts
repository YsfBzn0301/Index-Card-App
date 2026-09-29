import { router } from 'expo-router';

// The timestamp makes every request unique, so the same deck can be opened twice in a row.
export function openGame(deckId: string) {
  router.navigate({ pathname: '/games', params: { deckId, at: String(Date.now()) } });
}
