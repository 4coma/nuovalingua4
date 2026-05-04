import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { FirebaseSyncService, UserData, UserStatistics, UserSettings } from './firebase-sync.service';
import { DictionaryWord } from './personal-dictionary.service';
import { SavedText as CurrentSavedText } from '../models/vocabulary';
import { WordMastery } from './vocabulary-tracking.service';
import { Pom } from '../models/pom';

export interface CloudUserPreferences {
  notificationSettings: {
    enabled: boolean;
    time: string;
    message: string;
  };
  comprehensionNotificationSettings: {
    enabled: boolean;
    time: string;
  };
  wordAssociationsCount: number;
  oralComprehensionLength: number;
  spacedRepetitionWordsCount: number;
  personalDictionaryWordsCount: number;
  openaiApiKey?: string;
  googleTtsApiKey?: string;
  dailyComprehensionThemes: string[];
  comprehensionNotificationCustomPrompt?: string;
  pomReviewFactor: number;
  pomInitialIntervalSeconds: number;
  pomNotificationGraceMinutes: number;
}

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

  private readonly defaultPreferences: CloudUserPreferences = {
    notificationSettings: {
      enabled: false,
      time: '18:30',
      message: 'Il est temps de pratiquer votre italien ! 🇮🇹'
    },
    comprehensionNotificationSettings: {
      enabled: false,
      time: '19:00'
    },
    wordAssociationsCount: 10,
    oralComprehensionLength: 150,
    spacedRepetitionWordsCount: 10,
    personalDictionaryWordsCount: 8,
    dailyComprehensionThemes: [],
    pomReviewFactor: 2,
    pomInitialIntervalSeconds: 43200,
    pomNotificationGraceMinutes: 10
  };

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
    const vocabularyTracking = this.getVocabularyTracking();
    const poms = this.getPoms();
    const statistics = this.getStatistics();
    const settings = this.getSettings();
    const preferences = this.getPreferences();

    return {
      personalDictionary,
      conversations,
      statistics,
      settings,
      savedTexts: [],
      savedTextsV2: savedTexts,
      vocabularyTracking,
      poms,
      preferences,
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
  private getSavedTexts(): CurrentSavedText[] {
    try {
      const storedTexts = this.getScopedLocalStorage('savedTexts');
      if (!storedTexts) return [];

      const texts = JSON.parse(storedTexts);
      return Array.isArray(texts) ? texts : [];
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur récupération textes sauvegardés:', error);
      return [];
    }
  }

  private getVocabularyTracking(): WordMastery[] {
    try {
      const storedWords = this.getScopedLocalStorage('vocabulary_mastery');
      if (!storedWords) return [];

      const words = JSON.parse(storedWords);
      return Array.isArray(words) ? words : [];
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur récupération suivi vocabulaire:', error);
      return [];
    }
  }

  private getPoms(): Pom[] {
    try {
      const storedPoms = this.getScopedLocalStorage('poms');
      if (!storedPoms) return [];

      const poms = JSON.parse(storedPoms);
      return Array.isArray(poms) ? poms : [];
    } catch (error) {
      console.error('🔍 [DataMigration] Erreur récupération POMs:', error);
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
    const preferences = this.getPreferences();
    return {
      notificationsEnabled: preferences.notificationSettings.enabled,
      notificationTime: preferences.notificationSettings.time,
      notificationMessage: preferences.notificationSettings.message,
      comprehensionNotificationsEnabled: preferences.comprehensionNotificationSettings.enabled,
      comprehensionNotificationTime: preferences.comprehensionNotificationSettings.time,
      wordAssociationsCount: preferences.wordAssociationsCount,
      oralComprehensionLength: preferences.oralComprehensionLength,
      spacedRepetitionWordsCount: preferences.spacedRepetitionWordsCount,
      personalDictionaryWordsCount: preferences.personalDictionaryWordsCount,
      openaiApiKey: preferences.openaiApiKey || undefined,
      googleTtsApiKey: preferences.googleTtsApiKey || undefined
    };
  }

  getPreferences(): CloudUserPreferences {
    const notificationSettings = this.storageService.get('notificationSettings');
    const comprehensionSettings = this.storageService.get('comprehensionNotificationSettings');
    const dailyThemes = this.storageService.get('dailyComprehensionThemes');

    return {
      notificationSettings: {
        ...this.defaultPreferences.notificationSettings,
        ...(notificationSettings || {})
      },
      comprehensionNotificationSettings: {
        ...this.defaultPreferences.comprehensionNotificationSettings,
        ...(comprehensionSettings || {})
      },
      wordAssociationsCount: this.parseNumberSetting(this.storageService.get('wordAssociationsCount'), this.defaultPreferences.wordAssociationsCount),
      oralComprehensionLength: this.parseNumberSetting(this.storageService.get('oralComprehensionLength'), this.defaultPreferences.oralComprehensionLength),
      spacedRepetitionWordsCount: this.parseNumberSetting(this.storageService.get('spacedRepetitionWordsCount'), this.defaultPreferences.spacedRepetitionWordsCount),
      personalDictionaryWordsCount: this.parseNumberSetting(this.storageService.get('personalDictionaryWordsCount'), this.defaultPreferences.personalDictionaryWordsCount),
      openaiApiKey: this.getOptionalStringSetting('userOpenaiApiKey'),
      googleTtsApiKey: this.getOptionalStringSetting('userGoogleTtsApiKey'),
      dailyComprehensionThemes: Array.isArray(dailyThemes)
        ? dailyThemes
        : this.parseStringArraySetting(dailyThemes),
      comprehensionNotificationCustomPrompt: this.getOptionalStringSetting('comprehensionNotificationCustomPrompt'),
      pomReviewFactor: this.parseNumberSetting(this.storageService.get('pomReviewFactor'), this.defaultPreferences.pomReviewFactor),
      pomInitialIntervalSeconds: this.parseNumberSetting(this.storageService.get('pomInitialIntervalSeconds'), this.defaultPreferences.pomInitialIntervalSeconds),
      pomNotificationGraceMinutes: this.parseNumberSetting(this.storageService.get('pomNotificationGraceMinutes'), this.defaultPreferences.pomNotificationGraceMinutes)
    };
  }

  async syncPreferencesToFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled() || !this.firebaseSync.getCurrentUser()) {
      return;
    }

    await this.firebaseSync.syncUserDataPatch({
      preferences: this.getPreferences(),
      settings: this.getSettings(),
      statistics: this.getStatistics()
    });
  }

  async hydratePreferencesFromFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled() || !this.firebaseSync.getCurrentUser()) {
      return;
    }

    const userDocument = await this.firebaseSync.getUserDocumentData();
    if (!userDocument) {
      await this.syncPreferencesToFirebase();
      return;
    }

    const localPreferences = this.getPreferences();
    const remotePreferences = this.normalizeRemotePreferences(userDocument);
    if (!remotePreferences) {
      await this.syncPreferencesToFirebase();
      return;
    }

    const mergedPreferences: CloudUserPreferences = {
      ...localPreferences,
      ...remotePreferences,
      notificationSettings: {
        ...localPreferences.notificationSettings,
        ...remotePreferences.notificationSettings
      },
      comprehensionNotificationSettings: {
        ...localPreferences.comprehensionNotificationSettings,
        ...remotePreferences.comprehensionNotificationSettings
      },
      dailyComprehensionThemes: remotePreferences.dailyComprehensionThemes?.length
        ? remotePreferences.dailyComprehensionThemes
        : localPreferences.dailyComprehensionThemes
    };

    this.applyPreferencesToLocalStorage(mergedPreferences);
    await this.firebaseSync.syncUserDataPatch({
      preferences: mergedPreferences,
      settings: this.getSettings(),
      statistics: userDocument['statistics'] || this.getStatistics()
    });
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

  private parseNumberSetting(value: any, fallback: number): number {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getOptionalStringSetting(key: string): string | undefined {
    const value = this.storageService.get(key);
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private parseStringArraySetting(value: any): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim());
    }

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string' && item.trim()) : [];
      } catch {
        return [];
      }
    }

    return [];
  }

  private normalizeRemotePreferences(userDocument: Record<string, any>): CloudUserPreferences | null {
    const remotePreferences = userDocument['preferences'];
    if (remotePreferences && typeof remotePreferences === 'object') {
      return {
        ...this.defaultPreferences,
        ...remotePreferences,
        notificationSettings: {
          ...this.defaultPreferences.notificationSettings,
          ...(remotePreferences['notificationSettings'] || {})
        },
        comprehensionNotificationSettings: {
          ...this.defaultPreferences.comprehensionNotificationSettings,
          ...(remotePreferences['comprehensionNotificationSettings'] || {})
        },
        dailyComprehensionThemes: this.parseStringArraySetting(remotePreferences['dailyComprehensionThemes'])
      };
    }

    const legacySettings = userDocument['settings'];
    if (!legacySettings || typeof legacySettings !== 'object') {
      return null;
    }

    return {
      ...this.defaultPreferences,
      notificationSettings: {
        enabled: !!legacySettings['notificationsEnabled'],
        time: legacySettings['notificationTime'] || this.defaultPreferences.notificationSettings.time,
        message: legacySettings['notificationMessage'] || this.defaultPreferences.notificationSettings.message
      },
      comprehensionNotificationSettings: {
        enabled: !!legacySettings['comprehensionNotificationsEnabled'],
        time: legacySettings['comprehensionNotificationTime'] || this.defaultPreferences.comprehensionNotificationSettings.time
      },
      wordAssociationsCount: this.parseNumberSetting(legacySettings['wordAssociationsCount'], this.defaultPreferences.wordAssociationsCount),
      oralComprehensionLength: this.parseNumberSetting(legacySettings['oralComprehensionLength'], this.defaultPreferences.oralComprehensionLength),
      spacedRepetitionWordsCount: this.parseNumberSetting(legacySettings['spacedRepetitionWordsCount'], this.defaultPreferences.spacedRepetitionWordsCount),
      personalDictionaryWordsCount: this.parseNumberSetting(legacySettings['personalDictionaryWordsCount'], this.defaultPreferences.personalDictionaryWordsCount),
      openaiApiKey: typeof legacySettings['openaiApiKey'] === 'string' ? legacySettings['openaiApiKey'] : undefined,
      googleTtsApiKey: typeof legacySettings['googleTtsApiKey'] === 'string' ? legacySettings['googleTtsApiKey'] : undefined,
      dailyComprehensionThemes: [],
      comprehensionNotificationCustomPrompt: undefined,
      pomReviewFactor: this.defaultPreferences.pomReviewFactor,
      pomInitialIntervalSeconds: this.defaultPreferences.pomInitialIntervalSeconds,
      pomNotificationGraceMinutes: this.defaultPreferences.pomNotificationGraceMinutes
    };
  }

  private applyPreferencesToLocalStorage(preferences: CloudUserPreferences): void {
    this.storageService.set('notificationSettings', preferences.notificationSettings);
    this.storageService.set('comprehensionNotificationSettings', preferences.comprehensionNotificationSettings);
    this.storageService.set('wordAssociationsCount', preferences.wordAssociationsCount);
    this.storageService.set('oralComprehensionLength', preferences.oralComprehensionLength);
    this.storageService.set('spacedRepetitionWordsCount', preferences.spacedRepetitionWordsCount);
    this.storageService.set('personalDictionaryWordsCount', preferences.personalDictionaryWordsCount);
    this.storageService.set('dailyComprehensionThemes', preferences.dailyComprehensionThemes);
    this.storageService.set('pomReviewFactor', preferences.pomReviewFactor);
    this.storageService.set('pomInitialIntervalSeconds', preferences.pomInitialIntervalSeconds);
    this.storageService.set('pomNotificationGraceMinutes', preferences.pomNotificationGraceMinutes);

    if (preferences.openaiApiKey?.trim()) {
      this.storageService.set('userOpenaiApiKey', preferences.openaiApiKey.trim());
    } else {
      this.storageService.remove('userOpenaiApiKey');
    }

    if (preferences.googleTtsApiKey?.trim()) {
      this.storageService.set('userGoogleTtsApiKey', preferences.googleTtsApiKey.trim());
    } else {
      this.storageService.remove('userGoogleTtsApiKey');
    }

    if (preferences.comprehensionNotificationCustomPrompt?.trim()) {
      this.storageService.set('comprehensionNotificationCustomPrompt', preferences.comprehensionNotificationCustomPrompt.trim());
    } else {
      this.storageService.remove('comprehensionNotificationCustomPrompt');
    }
  }

  /**
   * Vérifie si des données locales existent
   */
  hasLocalData(): boolean {
    const words = this.getPersonalDictionary();
    const conversations = this.getConversations();
    const texts = this.getSavedTexts();
    const trackedWords = this.getVocabularyTracking();
    const poms = this.getPoms();
    
    const hasWords = words.length > 0;
    const hasConversations = conversations.length > 0;
    const hasTexts = texts.length > 0;
    const hasTrackedWords = trackedWords.length > 0;
    const hasPoms = poms.length > 0;
    
    return hasWords || hasConversations || hasTexts || hasTrackedWords || hasPoms;
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
