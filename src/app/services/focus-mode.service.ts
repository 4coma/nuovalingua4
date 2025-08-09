import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { WordPair } from './llm.service';

export interface FocusSession {
  focus: string;
  dateCreated: number;
  lastUsed?: number;
  words?: WordPair[];
}

@Injectable({
  providedIn: 'root'
})
export class FocusModeService {
  private readonly FOCUS_STORAGE_KEY = 'currentFocus';
  private readonly FOCUS_SESSIONS_KEY = 'focusSessions';

  constructor(private storageService: StorageService) {}

  /**
   * Définit le focus actuel
   */
  setCurrentFocus(focus: string): void {
    const focusSession: FocusSession = {
      focus,
      dateCreated: Date.now(),
      lastUsed: Date.now(),
      words: []
    };
    
    this.storageService.set(this.FOCUS_STORAGE_KEY, focusSession);
  }

  /**
   * Ajoute des mots à la session de focus actuelle
   */
  addWordsToCurrentFocus(wordPairs: WordPair[]): void {
    const focusSession = this.getCurrentFocusSession();
    if (focusSession) {
      focusSession.words = [...(focusSession.words || []), ...wordPairs];
      this.storageService.set(this.FOCUS_STORAGE_KEY, focusSession);
    }
  }

  /**
   * Récupère les mots associés au focus actuel
   */
  getCurrentFocusWords(): WordPair[] {
    const focusSession = this.getCurrentFocusSession();
    return focusSession?.words || [];
  }

  /**
   * Récupère le focus actuel
   */
  getCurrentFocus(): string | null {
    const focusSession = this.storageService.get(this.FOCUS_STORAGE_KEY);
    return focusSession ? focusSession.focus : null;
  }

  /**
   * Récupère la session de focus complète
   */
  getCurrentFocusSession(): FocusSession | null {
    return this.storageService.get(this.FOCUS_STORAGE_KEY);
  }

  /**
   * Supprime le focus actuel
   */
  clearCurrentFocus(): void {
    this.storageService.remove(this.FOCUS_STORAGE_KEY);
  }

  /**
   * Met à jour la date de dernière utilisation
   */
  updateLastUsed(): void {
    const focusSession = this.getCurrentFocusSession();
    if (focusSession) {
      focusSession.lastUsed = Date.now();
      this.storageService.set(this.FOCUS_STORAGE_KEY, focusSession);
    }
  }

  /**
   * Sauvegarde une session de focus dans l'historique
   */
  saveFocusSession(focus: string): void {
    const sessions = this.getFocusSessions();
    const newSession: FocusSession = {
      focus,
      dateCreated: Date.now(),
      lastUsed: Date.now()
    };
    
    // Ajouter la nouvelle session au début
    sessions.unshift(newSession);
    
    // Garder seulement les 10 dernières sessions
    if (sessions.length > 10) {
      sessions.splice(10);
    }
    
    this.storageService.set(this.FOCUS_SESSIONS_KEY, sessions);
  }

  /**
   * Récupère l'historique des sessions de focus
   */
  getFocusSessions(): FocusSession[] {
    return this.storageService.get(this.FOCUS_SESSIONS_KEY) || [];
  }
} 