export type MasteryLevel = 0 | 1 | 2 | 3;

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  mastery: MasteryLevel;
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
  reminderAt?: string;
  reminderLeadMinutes?: number;
  reminderMessage?: string;
  reminderSpeak?: boolean;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
};

export type ReminderSettings = {
  reminderAt?: string;
  reminderLeadMinutes?: number;
  reminderMessage?: string;
  reminderSpeak?: boolean;
};

export type ReviewGrade = 'again' | 'good';
