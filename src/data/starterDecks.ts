import { Deck } from '../types/flashcards';

const now = new Date().toISOString();

export const starterDecks: Deck[] = [
  {
    id: 'starter-bio',
    title: 'Bio Basics',
    subject: 'Biologie',
    accent: '#24B8A8',
    emoji: 'DNA',
    createdAt: now,
    updatedAt: now,
    cards: [
      { id: 'bio-1', front: 'Was ist Osmose?', back: 'Die Diffusion von Wasser durch eine semipermeable Membran.', mastery: 0 },
      { id: 'bio-2', front: 'Wofuer steht DNA?', back: 'Desoxyribonukleinsaeure.', mastery: 1 },
      { id: 'bio-3', front: 'Aufgabe der Mitochondrien?', back: 'Sie wandeln Naehrstoffe in nutzbare Zellenergie um.', mastery: 0 },
    ],
  },
  {
    id: 'starter-math',
    title: 'Mathe Sprint',
    subject: 'Algebra',
    accent: '#FF5A7A',
    emoji: 'fx',
    createdAt: now,
    updatedAt: now,
    cards: [
      { id: 'math-1', front: 'Quadratische Formel?', back: 'x = (-b +/- Wurzel(b^2 - 4ac)) / 2a.', mastery: 0 },
      { id: 'math-2', front: 'Was ist eine Primzahl?', back: 'Eine natuerliche Zahl groesser 1 mit genau zwei Teilern.', mastery: 2 },
      { id: 'math-3', front: 'Ableitung von x^2?', back: '2x.', mastery: 1 },
    ],
  },
];
