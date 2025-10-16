import { Injectable } from '@angular/core';
import { TranslationDirection } from './llm.service';
import { StorageService } from './storage.service';

export type FullRevisionStage = 'association' | 'conversation' | 'encoding' | 'completed';

export interface FullRevisionWord {
  id: string;
  it: string;
  fr: string;
  context?: string;
  themes?: string[];
  assignedTo: 'ai' | 'user';
  usedByAi: boolean;
  usedByUser: boolean;
}

export interface FullRevisionSession {
  id: string;
  createdAt: string;
  stage: FullRevisionStage;
  translationDirection: TranslationDirection;
  themes: string[];
  words: FullRevisionWord[];
  aiQueue: string[];
  userQueue: string[];
  associationCompleted: boolean;
  conversationCompleted: boolean;
}

export interface FullRevisionStartConfig {
  words: Array<{
    id: string;
    it: string;
    fr: string;
    context?: string;
    themes?: string[];
  }>;
  translationDirection: TranslationDirection;
  themes?: string[];
}

export interface VocabularyExercisePayload {
  items: Array<{ word: string; translation: string; context?: string }>;
  type: 'vocabulary';
  topic: string;
}

@Injectable({
  providedIn: 'root'
})
export class FullRevisionService {
  private readonly storageKey = 'fullRevisionSession';

  constructor(private storage: StorageService) {}

  startSession(config: FullRevisionStartConfig): FullRevisionSession {
    const shuffled = [...config.words].sort(() => Math.random() - 0.5);
    const words: FullRevisionWord[] = shuffled.map(word => ({
      id: word.id,
      it: word.it,
      fr: word.fr,
      context: word.context,
      themes: word.themes || [],
      assignedTo: 'user',
      usedByAi: false,
      usedByUser: false
    }));

    const session: FullRevisionSession = {
      id: this.generateSessionId(),
      createdAt: new Date().toISOString(),
      stage: 'association',
      translationDirection: config.translationDirection,
      themes: config.themes || [],
      words,
      aiQueue: [],
      userQueue: words.map(w => w.it),
      associationCompleted: false,
      conversationCompleted: false
    };

    this.storage.set(this.storageKey, session);
    return session;
  }

  getSession(): FullRevisionSession | null {
    const session = this.storage.get(this.storageKey);
    if (!session) {
      return null;
    }
    return session as FullRevisionSession;
  }

  updateSession(session: FullRevisionSession): void {
    this.storage.set(this.storageKey, session);
  }

  clearSession(): void {
    this.storage.remove(this.storageKey);
    localStorage.removeItem('fullRevisionActive');
    localStorage.removeItem('fullRevisionSessionId');
  }

  setStage(stage: FullRevisionStage): FullRevisionSession | null {
    const session = this.getSession();
    if (!session) {
      return null;
    }
    session.stage = stage;
    if (stage === 'conversation') {
      session.associationCompleted = true;
    }
    if (stage === 'encoding') {
      session.conversationCompleted = true;
    }
    if (stage === 'completed') {
      session.associationCompleted = true;
      session.conversationCompleted = true;
    }
    this.storage.set(this.storageKey, session);
    return session;
  }

  markWordUsed(word: string, speaker: 'ai' | 'user'): FullRevisionSession | null {
    const session = this.getSession();
    if (!session) {
      return null;
    }

    const normalised = word.trim().toLowerCase();
    const target = session.words.find(w => w.it.toLowerCase() === normalised);
    if (!target) {
      return session;
    }

    if (speaker === 'ai') {
      // Les mots ne sont plus assignés à l'IA, mais on conserve la logique pour compatibilité
      target.usedByAi = true;
      session.aiQueue = session.aiQueue.filter(itWord => itWord.toLowerCase() !== normalised);
    } else {
      target.usedByUser = true;
      session.userQueue = session.userQueue.filter(itWord => itWord.toLowerCase() !== normalised);
    }

    if (session.aiQueue.length === 0 && session.userQueue.length === 0) {
      session.conversationCompleted = true;
    }

    this.storage.set(this.storageKey, session);
    return session;
  }

  getRemainingWords(speaker: 'ai' | 'user'): string[] {
    const session = this.getSession();
    if (!session) {
      return [];
    }
    return speaker === 'ai' ? [...session.aiQueue] : [...session.userQueue];
  }

  getWordsByAssignment(assignedTo: 'ai' | 'user'): FullRevisionWord[] {
    const session = this.getSession();
    if (!session) {
      return [];
    }
    return session.words.filter(word => word.assignedTo === assignedTo);
  }

  getSessionInfoSummary(): { category: string; topic: string; date: string; translationDirection: TranslationDirection } | null {
    const session = this.getSession();
    if (!session) {
      return null;
    }

    return {
      category: 'Révision complète',
      topic: session.themes.length > 0 ? session.themes.join(', ') : 'Révision complète',
      date: session.createdAt,
      translationDirection: session.translationDirection
    };
  }

  getVocabularyExercisePayload(): VocabularyExercisePayload | null {
    const session = this.getSession();
    if (!session) {
      return null;
    }

    const isFrToIt = session.translationDirection === 'fr2it';
    const items = session.words.map(word => ({
      word: isFrToIt ? word.fr : word.it,
      translation: isFrToIt ? word.it : word.fr,
      context: word.context
    }));

    return {
      items,
      type: 'vocabulary',
      topic: session.themes.length > 0 ? session.themes.join(', ') : 'Révision complète'
    };
  }

  getWords(): FullRevisionWord[] {
    const session = this.getSession();
    return session ? session.words : [];
  }

  assignQueuesFromWords(): void {
    const session = this.getSession();
    if (!session) {
      return;
    }
    const userWords = session.words
      .filter(w => w.assignedTo === 'user' && !w.usedByUser)
      .map(w => w.it);
    session.aiQueue = [];
    session.userQueue = [...userWords];
    this.storage.set(this.storageKey, session);
  }

  getNextAiWord(): string | undefined {
    const session = this.getSession();
    if (!session || session.aiQueue.length === 0) {
      return undefined;
    }
    return session.aiQueue[0];
  }

  /**
   * Synchronise les mots de l'exercice d'association avec la session
   */
  syncWordsFromAssociation(associationWords: Array<{it: string, fr: string, context?: string}>): void {
    const session = this.getSession();
    if (!session) {
      return;
    }

    // Mettre à jour les mots de la session avec ceux de l'exercice d'association
    const updatedWords = session.words.map(word => {
      const associationWord = associationWords.find(aw => 
        aw.it.toLowerCase() === word.it.toLowerCase() && 
        aw.fr.toLowerCase() === word.fr.toLowerCase()
      );
      
      if (associationWord) {
        // Le mot a été vu dans l'exercice d'association
        return {
          ...word,
          context: associationWord.context || word.context,
          usedByUser: false, // Reset pour la conversation
          usedByAi: false
        };
      } else {
        // Le mot n'a pas été vu dans l'exercice d'association
        return {
          ...word,
          assignedTo: 'ai' as const, // Assigner à l'IA
          usedByUser: false,
          usedByAi: false
        };
      }
    });

    session.words = updatedWords;
    this.assignQueuesFromWords();
    this.storage.set(this.storageKey, session);
  }

  private generateSessionId(): string {
    return 'fullrev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }
}
