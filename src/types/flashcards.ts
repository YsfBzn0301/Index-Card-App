export type MasteryLevel = 0 | 1 | 2 | 3;

export type DeckPriority = 'high' | 'medium' | 'low';

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  mastery: MasteryLevel;
  frontImageUri?: string;
  backImageUri?: string;
  lastReviewedAt?: string;
};

export type Deck = {
  id: string;
  title: string;
  subject: string;
  category: string;
  folder: string;
  lesson: string;
  accent: string;
  emoji: string;
  priority: DeckPriority;
  reminderAt?: string;
  reminderLeadMinutes?: number;
  reminderMessage?: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
};

export type ReminderSettings = {
  reminderAt?: string;
  reminderLeadMinutes?: number;
  reminderMessage?: string;
};

export type ReviewGrade = 'again' | 'good';
