import { Injectable } from '@angular/core';
import { SavedText, ComprehensionText } from '../models/vocabulary';
import { FirebaseSyncService } from './firebase-sync.service';

@Injectable({
  providedIn: 'root'
})
export class SavedTextsService {
  private readonly LEGACY_STORAGE_KEY = 'savedTexts';
  private readonly SCOPED_STORAGE_PREFIX = 'savedTexts__';
  private currentUserId: string | null = null;
  private isHydratingFromFirebase = false;

  constructor(private firebaseSync: FirebaseSyncService) {
    this.currentUserId = this.firebaseSync.getCurrentUser()?.uid || null;
    this.firebaseSync.authUser$.subscribe(user => {
      const newUserId = user?.uid || null;
      const previousUserId = this.currentUserId;
      const didUserChange = newUserId !== previousUserId;

      this.currentUserId = newUserId;

      if (didUserChange && this.currentUserId) {
        this.migrateGuestDataToUserScope(this.currentUserId, previousUserId);
      }

      if (didUserChange && this.firebaseSync.isFirebaseEnabled() && this.currentUserId) {
        this.syncFromFirebase();
      }
    });

    this.firebaseSync.syncStatus$.subscribe(status => {
      if (status.isConnected && this.currentUserId) {
        this.syncFromFirebase();
      }
    });
  }

  private getActiveStorageKey(): string {
    if (this.currentUserId) {
      return `${this.SCOPED_STORAGE_PREFIX}${this.currentUserId}`;
    }
    return `${this.SCOPED_STORAGE_PREFIX}guest`;
  }

  private ensureLegacyGuestMigration(): void {
    if (this.currentUserId) {
      return;
    }
    const guestKey = this.getActiveStorageKey();
    if (localStorage.getItem(guestKey) !== null) {
      return;
    }
    const legacyData = localStorage.getItem(this.LEGACY_STORAGE_KEY);
    if (legacyData !== null) {
      localStorage.setItem(guestKey, legacyData);
    }
  }

  private getScopedStorageKeyForUser(userId: string | null): string {
    return `${this.SCOPED_STORAGE_PREFIX}${userId || 'guest'}`;
  }

  private writeTexts(savedTexts: SavedText[]): void {
    localStorage.setItem(this.getActiveStorageKey(), JSON.stringify(savedTexts));
  }

  private migrateGuestDataToUserScope(userId: string, previousUserId: string | null): void {
    if (previousUserId) {
      return;
    }

    this.ensureLegacyGuestMigration();
    const guestKey = this.getScopedStorageKeyForUser(null);
    const userKey = this.getScopedStorageKeyForUser(userId);
    const guestData = localStorage.getItem(guestKey);
    if (!guestData) {
      return;
    }

    const userData = localStorage.getItem(userKey);
    const guestTexts = this.parseStoredTexts(guestData);
    const userTexts = userData ? this.parseStoredTexts(userData) : [];
    localStorage.setItem(userKey, JSON.stringify(this.mergeTexts(userTexts, guestTexts)));
  }

  private parseStoredTexts(stored: string): SavedText[] {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Erreur lors du parsing des textes sauvegardés:', error);
      return [];
    }
  }

  /**
   * Sauvegarde un texte de compréhension
   */
  saveText(comprehensionText: ComprehensionText, category: string, topic: string, customTitle?: string): boolean {
    try {
      const savedTexts = this.getAllTexts();
      
      const newSavedText: SavedText = {
        id: this.generateId(),
        title: customTitle || this.generateTitle(category, topic, comprehensionText.type),
        text: comprehensionText.text,
        type: comprehensionText.type,
        category: category,
        topic: topic,
        vocabularyItems: comprehensionText.vocabularyItems,
        questions: comprehensionText.questions,
        dateCreated: Date.now(),
        dateLastAccessed: Date.now(),
        accessCount: 1,
        isFavorite: false
      };
      
      savedTexts.push(newSavedText);
      this.writeTexts(savedTexts);
      this.syncToFirebase();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Récupère tous les textes sauvegardés
   */
  getAllTexts(): SavedText[] {
    try {
      this.ensureLegacyGuestMigration();
      const savedTextsJson = localStorage.getItem(this.getActiveStorageKey());
      return savedTextsJson ? JSON.parse(savedTextsJson) : [];
    } catch {
      return [];
    }
  }

  /**
   * Récupère un texte par son ID
   */
  getTextById(id: string): SavedText | null {
    const savedTexts = this.getAllTexts();
    return savedTexts.find(text => text.id === id) || null;
  }

  /**
   * Met à jour les statistiques d'accès d'un texte
   */
  updateAccessStats(id: string): void {
    try {
      const savedTexts = this.getAllTexts();
      const textIndex = savedTexts.findIndex(text => text.id === id);
      
      if (textIndex !== -1) {
        savedTexts[textIndex].dateLastAccessed = Date.now();
        savedTexts[textIndex].accessCount++;
        this.writeTexts(savedTexts);
        this.syncToFirebase();
      }
    } catch {
    }
  }

  /**
   * Marque/démarque un texte comme favori
   */
  toggleFavorite(id: string): boolean {
    try {
      const savedTexts = this.getAllTexts();
      const textIndex = savedTexts.findIndex(text => text.id === id);
      
      if (textIndex !== -1) {
        savedTexts[textIndex].isFavorite = !savedTexts[textIndex].isFavorite;
        this.writeTexts(savedTexts);
        this.syncToFirebase();
        return savedTexts[textIndex].isFavorite;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Supprime un texte sauvegardé
   */
  deleteText(id: string): boolean {
    try {
      const savedTexts = this.getAllTexts();
      const filteredTexts = savedTexts.filter(text => text.id !== id);
      
      if (filteredTexts.length !== savedTexts.length) {
        this.writeTexts(filteredTexts);
        this.syncToFirebase();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les textes favoris
   */
  getFavoriteTexts(): SavedText[] {
    return this.getAllTexts().filter(text => text.isFavorite);
  }

  /**
   * Récupère les textes par type
   */
  getTextsByType(type: 'written' | 'oral'): SavedText[] {
    return this.getAllTexts().filter(text => text.type === type);
  }

  /**
   * Récupère les textes par catégorie
   */
  getTextsByCategory(category: string): SavedText[] {
    return this.getAllTexts().filter(text => text.category === category);
  }

  /**
   * Récupère les textes les plus récents
   */
  getRecentTexts(limit: number = 5): SavedText[] {
    return this.getAllTexts()
      .sort((a, b) => (b.dateLastAccessed || 0) - (a.dateLastAccessed || 0))
      .slice(0, limit);
  }

  /**
   * Récupère les textes les plus consultés
   */
  getMostAccessedTexts(limit: number = 5): SavedText[] {
    return this.getAllTexts()
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Génère un titre pour le texte sauvegardé
   */
  private generateTitle(category: string, topic: string, type: 'written' | 'oral'): string {
    const typeText = type === 'written' ? 'Compréhension écrite' : 'Compréhension orale';
    return `${typeText} - ${category} - ${topic}`;
  }

  /**
   * Vérifie si un texte existe déjà (basé sur le contenu et la catégorie)
   */
  textExists(text: string, category: string, topic: string): boolean {
    const savedTexts = this.getAllTexts();
    return savedTexts.some(savedText => 
      savedText.text === text && 
      savedText.category === category && 
      savedText.topic === topic
    );
  }

  private async syncToFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled() || this.isHydratingFromFirebase || !this.currentUserId) {
      return;
    }

    try {
      await this.firebaseSync.syncUserDataPatch({
        savedTextsV2: this.getAllTexts()
      });
    } catch (error) {
      console.error('🔍 [SavedTexts] Erreur de synchronisation vers Firebase:', error);
    }
  }

  async syncFromFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled() || !this.currentUserId) {
      return;
    }

    try {
      const userDocument = await this.firebaseSync.getUserDocumentData();
      const rawTexts = userDocument?.['savedTextsV2'] || userDocument?.['savedTexts'];
      if (!Array.isArray(rawTexts)) {
        return;
      }

      this.isHydratingFromFirebase = true;

      const localTexts = this.getAllTexts();
      const mergedTexts = this.mergeTexts(localTexts, rawTexts as SavedText[]);
      this.writeTexts(mergedTexts);
      await this.firebaseSync.syncUserDataPatch({ savedTextsV2: mergedTexts });
    } catch (error) {
      console.error('🔍 [SavedTexts] Erreur de synchronisation depuis Firebase:', error);
    } finally {
      this.isHydratingFromFirebase = false;
    }
  }

  private mergeTexts(localTexts: SavedText[], remoteTexts: SavedText[]): SavedText[] {
    const merged = new Map<string, SavedText>();

    for (const text of localTexts) {
      merged.set(text.id, text);
    }

    for (const text of remoteTexts) {
      const existing = merged.get(text.id);
      if (!existing) {
        merged.set(text.id, text);
        continue;
      }

      const existingAccess = existing.dateLastAccessed || existing.dateCreated || 0;
      const remoteAccess = text.dateLastAccessed || text.dateCreated || 0;
      merged.set(text.id, remoteAccess >= existingAccess ? text : existing);
    }

    return Array.from(merged.values()).sort((a, b) => (b.dateLastAccessed || b.dateCreated) - (a.dateLastAccessed || a.dateCreated));
  }
}
