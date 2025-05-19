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