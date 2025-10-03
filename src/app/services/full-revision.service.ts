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

@Injectable({
  providedIn: 'root'
})
export class FullRevisionService {
  private readonly storageKey = 'fullRevisionSession';

  constructor(private storage: StorageService) {}

  startSession(config: FullRevisionStartConfig): FullRevisionSession {
    const shuffled = [...config.words].sort(() => Math.random() - 0.5);
    const total = shuffled.length;
    const aiCount = Math.floor(total / 2);

    const aiWords = shuffled.slice(0, aiCount);
    const userWords = shuffled.slice(aiCount);

    const words: FullRevisionWord[] = shuffled.map(word => ({
      id: word.id,
      it: word.it,
      fr: word.fr,
      context: word.context,
      themes: word.themes || [],
      assignedTo: aiWords.includes(word) ? 'ai' as const : 'user' as const,
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
      aiQueue: aiWords.map(w => w.it),
      userQueue: userWords.map(w => w.it),
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
      if (target.assignedTo !== 'ai') {
        return session;
      }
      target.usedByAi = true;
      session.aiQueue = session.aiQueue.filter(itWord => itWord.toLowerCase() !== normalised);
    } else {
      if (target.assignedTo !== 'user') {
        return session;
      }
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

  getWords(): FullRevisionWord[] {
    const session = this.getSession();
    return session ? session.words : [];
  }

  assignQueuesFromWords(): void {
    const session = this.getSession();
    if (!session) {
      return;
    }
    const aiWords = session.words
      .filter(w => w.assignedTo === 'ai' && !w.usedByAi)
      .map(w => w.it);
    const userWords = session.words
      .filter(w => w.assignedTo === 'user' && !w.usedByUser)
      .map(w => w.it);
    session.aiQueue = [...aiWords];
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

  private generateSessionId(): string {
    return 'fullrev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }
}
