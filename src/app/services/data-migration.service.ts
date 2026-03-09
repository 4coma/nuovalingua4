import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { FirebaseSyncService, UserData, UserStatistics, UserSettings } from './firebase-sync.service';
import { DictionaryWord } from './personal-dictionary.service';
import { DiscussionTurn, DiscussionContext } from './discussion.service';

export interface SavedText {
  id: string;
  title: string;
  content: string;
  language: string;
  difficulty: string;
  dateSaved: Date;
  wordCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataMigrationService {

  constructor(
    private storageService: StorageService,
    private firebaseSync: FirebaseSyncService
  ) {}

  /**
   * Récupère une valeur locale en privilégiant la clé scopée utilisateur
   * puis fallback sur la clé legacy globale pour compatibilité.
   */
  private getScopedLocalStorage(baseKey: string): string | null {
    const uid = this.firebaseSync.getCurrentUser()?.uid;
    if (uid) {
      const scopedValue = localStorage.getItem(`${baseKey}__${uid}`);
      if (scopedValue !== null) {
        return scopedValue;
      }
    } else {
      const guestValue = localStorage.getItem(`${baseKey}__guest`);
      if (guestValue !== null) {
        return guestValue;
      }
    }

    return localStorage.getItem(baseKey);
  }

  /**
   * Migre toutes les données locales vers Firebase
   */
  async migrateAllDataToFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled()) {
      throw new Error('Firebase n\'est pas activé');
    }

    try {
      
      const userData = await this.collectAllLocalData();
      await this.firebaseSync.syncAllUserData(userData);
      
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur lors de la migration:', error);
      throw error;
    }
  }

  /**
   * Collecte toutes les données locales
   */
  private async collectAllLocalData(): Promise<UserData> {
    const personalDictionary = this.getPersonalDictionary();
    const conversations = this.getConversations();
    const savedTexts = this.getSavedTexts();
    const statistics = this.getStatistics();
    const settings = this.getSettings();

    return {
      personalDictionary,
      conversations,
      statistics,
      settings,
      savedTexts,
      metadata: {
        createdAt: new Date(),
        lastSync: new Date(),
        syncVersion: 1,
        appVersion: '1.0.0'
      }
    };
  }

  /**
   * Récupère le dictionnaire personnel depuis le localStorage
   */
  private getPersonalDictionary(): DictionaryWord[] {
    try {
      const storedWords = this.getScopedLocalStorage('personalDictionary');
      
      if (storedWords) {
        const words = JSON.parse(storedWords);
        return words;
      }
      return [];
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur récupération dictionnaire:', error);
      return [];
    }
  }

  /**
   * Récupère les conversations depuis le localStorage
   */
  private getConversations(): any[] {
    try {
      const storedConversations = this.getScopedLocalStorage('savedConversations');
      if (!storedConversations) return [];

      const conversations = JSON.parse(storedConversations);
      
      // Convertir les sessions de discussion en conversations
      return conversations.map((session: any) => ({
        id: session.id,
        context: session.context,
        turns: session.turns || [],
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        language: session.language || 'it'
      }));
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur récupération conversations:', error);
      return [];
    }
  }

  /**
   * Récupère les textes sauvegardés depuis le localStorage
   */
  private getSavedTexts(): SavedText[] {
    try {
      const storedTexts = this.getScopedLocalStorage('savedTexts');
      if (!storedTexts) return [];

      const texts = JSON.parse(storedTexts);
      
      return texts.map((text: any) => ({
        id: text.id,
        title: text.title,
        content: text.content,
        language: text.language || 'it',
        difficulty: text.difficulty || 'intermediate',
        dateSaved: new Date(text.dateSaved),
        wordCount: text.wordCount || 0
      }));
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur récupération textes sauvegardés:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques depuis le localStorage
   */
  private getStatistics(): UserStatistics {
    try {
      const totalWordsLearned = this.getPersonalDictionary().length;
      const totalConversations = this.getConversations().length;
      
      // Calculer le temps d'étude total (approximation)
      const totalStudyTime = this.calculateTotalStudyTime();
      
      // Calculer la série de jours
      const streakDays = this.calculateStreakDays();
      
      return {
        totalWordsLearned,
        totalConversations,
        totalStudyTime,
        streakDays,
        lastActivity: new Date(),
        wordsAddedToday: this.getWordsAddedToday(),
        conversationsToday: this.getConversationsToday()
      };
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur calcul statistiques:', error);
      return {
        totalWordsLearned: 0,
        totalConversations: 0,
        totalStudyTime: 0,
        streakDays: 0,
        lastActivity: new Date(),
        wordsAddedToday: 0,
        conversationsToday: 0
      };
    }
  }

  /**
   * Récupère les paramètres depuis le localStorage
   */
  private getSettings(): UserSettings {
    return {
      notificationsEnabled: localStorage.getItem('notificationsEnabled') === 'true',
      notificationTime: localStorage.getItem('notificationTime') || '18:30',
      notificationMessage: localStorage.getItem('notificationMessage') || 'Il est temps de pratiquer votre italien ! 🇮🇹',
      comprehensionNotificationsEnabled: localStorage.getItem('comprehensionNotificationsEnabled') === 'true',
      comprehensionNotificationTime: localStorage.getItem('comprehensionNotificationTime') || '19:00',
      wordAssociationsCount: parseInt(localStorage.getItem('wordAssociationsCount') || '10'),
      oralComprehensionLength: parseInt(localStorage.getItem('oralComprehensionLength') || '150'),
      spacedRepetitionWordsCount: parseInt(localStorage.getItem('spacedRepetitionWordsCount') || '10'),
      personalDictionaryWordsCount: parseInt(localStorage.getItem('personalDictionaryWordsCount') || '8'),
      openaiApiKey: localStorage.getItem('userOpenaiApiKey') || undefined,
      googleTtsApiKey: localStorage.getItem('userGoogleTtsApiKey') || undefined
    };
  }

  /**
   * Calcule le temps d'étude total (approximation)
   */
  private calculateTotalStudyTime(): number {
    // Approximation basée sur le nombre de mots et conversations
    const words = this.getPersonalDictionary().length;
    const conversations = this.getConversations().length;
    
    // Estimation : 2 minutes par mot + 5 minutes par conversation
    return (words * 2 + conversations * 5) * 60 * 1000; // en millisecondes
  }

  /**
   * Calcule la série de jours (approximation)
   */
  private calculateStreakDays(): number {
    // Logique simple : si l'utilisateur a des données récentes, on considère qu'il a une série
    const words = this.getPersonalDictionary();
    const conversations = this.getConversations();
    
    if (words.length > 0 || conversations.length > 0) {
      return 1; // Au moins 1 jour
    }
    
    return 0;
  }

  /**
   * Calcule les mots ajoutés aujourd'hui
   */
  private getWordsAddedToday(): number {
    const words = this.getPersonalDictionary();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return words.filter(word => {
      const wordDate = new Date(word.dateAdded);
      wordDate.setHours(0, 0, 0, 0);
      return wordDate.getTime() === today.getTime();
    }).length;
  }

  /**
   * Calcule les conversations d'aujourd'hui
   */
  private getConversationsToday(): number {
    const conversations = this.getConversations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return conversations.filter(conv => {
      const convDate = new Date(conv.startTime);
      convDate.setHours(0, 0, 0, 0);
      return convDate.getTime() === today.getTime();
    }).length;
  }

  /**
   * Vérifie si des données locales existent
   */
  hasLocalData(): boolean {
    const words = this.getPersonalDictionary();
    const conversations = this.getConversations();
    const texts = this.getSavedTexts();
    
    const hasWords = words.length > 0;
    const hasConversations = conversations.length > 0;
    const hasTexts = texts.length > 0;
    
    return hasWords || hasConversations || hasTexts;
  }

  /**
   * Obtient un résumé des données locales
   */
  getLocalDataSummary(): { words: number; conversations: number; texts: number } {
    return {
      words: this.getPersonalDictionary().length,
      conversations: this.getConversations().length,
      texts: this.getSavedTexts().length
    };
  }
}
