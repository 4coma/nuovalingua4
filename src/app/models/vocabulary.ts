export interface VocabularyItem {
  word: string;
  translation: string;
  context?: string;
}

export interface VocabularyExercise {
  items: VocabularyItem[];
  type: string;
  topic: string;
}

export interface ComprehensionText {
  text: string;
  type: 'written' | 'oral';
  vocabularyItems: VocabularyItem[];
  questions?: ComprehensionQuestion[];
}

export interface ComprehensionQuestion {
  question: string;
  userAnswer?: string;
}

export interface AnswerFeedback {
  question: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
  correctAnswer?: string;
}

export interface EvaluationResult {
  feedback: AnswerFeedback[];
  score?: number;
  overallFeedback?: string;
}

export interface VocabularyError {
  sourceWord: string;
  targetWord: string;
  userAnswer: string;
  context?: string;
}

export interface SavedText {
  id: string;
  title: string;
  text: string;
  type: 'written' | 'oral';
  category: string;
  topic: string;
  vocabularyItems: VocabularyItem[];
  questions?: ComprehensionQuestion[];
  dateCreated: number;
  dateLastAccessed?: number;
  accessCount: number;
  isFavorite: boolean;
} 