import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { starterDecks } from '../data/starterDecks';
import { deckAccents } from '../theme/palette';
import { Deck, Flashcard, ReviewGrade } from '../types/flashcards';

const storageKey = 'index-card.library.v1';

type LibraryContextValue = {
  decks: Deck[];
  isReady: boolean;
  totalCards: number;
  masteredCards: number;
  dueCards: Flashcard[];
  dueDecks: Deck[];
  createDeck: (title: string, category: string, folder: string, lesson: string) => void;
  addCard: (deckId: string, front: string, back: string) => void;
  deleteCard: (deckId: string, cardId: string) => void;
  deleteCategory: (category: string) => void;
  deleteDeck: (deckId: string) => void;
  deleteFolder: (category: string, folder: string) => void;
  deleteLesson: (category: string, folder: string, lesson: string) => void;
  reviewCard: (deckId: string, cardId: string, grade: ReviewGrade) => void;
  resetDeckProgress: (deckId: string) => void;
  resetLibrary: () => void;
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isDue(card: Flashcard) {
  return card.mastery < 3;
}

function normalizeDeck(deck: Deck): Deck {
  const subject = deck.subject || deck.category || 'Allgemein';

  return {
    ...deck,
    subject,
    category: deck.category || subject,
    folder: deck.folder || 'Allgemein',
    lesson: deck.lesson || 'Lektion 1',
  };
}

export function LibraryProvider({ children }: PropsWithChildren) {
  const [decks, setDecks] = useState<Deck[]>(starterDecks);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLibrary() {
      const saved = await AsyncStorage.getItem(storageKey);
      if (!isMounted) {
        return;
      }

      if (saved) {
        setDecks((JSON.parse(saved) as Deck[]).map(normalizeDeck));
      }
      setIsReady(true);
    }

    loadLibrary().catch(() => setIsReady(true));

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      AsyncStorage.setItem(storageKey, JSON.stringify(decks)).catch(() => undefined);
    }
  }, [decks, isReady]);

  const value = useMemo<LibraryContextValue>(() => {
    const totalCards = decks.reduce((total, deck) => total + deck.cards.length, 0);
    const masteredCards = decks.reduce(
      (total, deck) => total + deck.cards.filter((card) => card.mastery >= 3).length,
      0,
    );
    const dueDecks = decks.filter((deck) => deck.cards.some(isDue));
    const dueCards = dueDecks.flatMap((deck) => deck.cards.filter(isDue));

    return {
      decks,
      isReady,
      totalCards,
      masteredCards,
      dueCards,
      dueDecks,
      createDeck: (title, category, folder, lesson) => {
        const now = new Date().toISOString();
        const trimmedCategory = category.trim() || 'Allgemein';
        setDecks((currentDecks) => [
          {
            id: createId('deck'),
            title: title.trim() || 'Neues Deck',
            subject: trimmedCategory,
            category: trimmedCategory,
            folder: folder.trim() || 'Vokabeln',
            lesson: lesson.trim() || 'Lektion 1',
            accent: deckAccents[currentDecks.length % deckAccents.length],
            emoji: 'NEW',
            cards: [],
            createdAt: now,
            updatedAt: now,
          },
          ...currentDecks,
        ]);
      },
      addCard: (deckId, front, back) => {
        const now = new Date().toISOString();
        setDecks((currentDecks) =>
          currentDecks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  updatedAt: now,
                  cards: [
                    { id: createId('card'), front: front.trim(), back: back.trim(), mastery: 0 },
                    ...deck.cards,
                  ],
                }
              : deck,
          ),
        );
      },
      deleteCard: (deckId, cardId) => {
        const now = new Date().toISOString();
        setDecks((currentDecks) =>
          currentDecks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  updatedAt: now,
                  cards: deck.cards.filter((card) => card.id !== cardId),
                }
              : deck,
          ),
        );
      },
      deleteCategory: (category) => {
        setDecks((currentDecks) => currentDecks.filter((deck) => deck.category !== category));
      },
      deleteDeck: (deckId) => {
        setDecks((currentDecks) => currentDecks.filter((deck) => deck.id !== deckId));
      },
      deleteFolder: (category, folder) => {
        setDecks((currentDecks) => currentDecks.filter((deck) => deck.category !== category || deck.folder !== folder));
      },
      deleteLesson: (category, folder, lesson) => {
        setDecks((currentDecks) =>
          currentDecks.filter((deck) => deck.category !== category || deck.folder !== folder || deck.lesson !== lesson),
        );
      },
      reviewCard: (deckId, cardId, grade) => {
        const now = new Date().toISOString();
        setDecks((currentDecks) =>
          currentDecks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  updatedAt: now,
                  cards: deck.cards.map((card) =>
                    card.id === cardId
                      ? {
                          ...card,
                          lastReviewedAt: now,
                          mastery: grade === 'good' ? Math.min(3, card.mastery + 1) as Flashcard['mastery'] : 0,
                        }
                      : card,
                  ),
                }
              : deck,
          ),
        );
      },
      resetDeckProgress: (deckId) => {
        const now = new Date().toISOString();
        setDecks((currentDecks) =>
          currentDecks.map((deck) =>
            deck.id === deckId
              ? {
                  ...deck,
                  updatedAt: now,
                  cards: deck.cards.map((card) => ({ ...card, mastery: 0, lastReviewedAt: undefined })),
                }
              : deck,
          ),
        );
      },
      resetLibrary: () => setDecks(starterDecks),
    };
  }, [decks, isReady]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);

  if (!context) {
    throw new Error('useLibrary must be used inside LibraryProvider');
  }

  return context;
}
