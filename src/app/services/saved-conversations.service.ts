import { Injectable } from '@angular/core';
import { DiscussionSession } from './discussion.service';
import { FirebaseSyncService, Conversation } from './firebase-sync.service';

@Injectable({
  providedIn: 'root'
})
export class SavedConversationsService {
  private readonly legacyStorageKey = 'savedConversations';
  private readonly scopedStoragePrefix = 'savedConversations__';
  private currentUserId: string | null = null;
  private isHydratingFromFirebase = false;

  constructor(private firebaseSync: FirebaseSyncService) {
    this.currentUserId = this.firebaseSync.getCurrentUser()?.uid || null;

    this.firebaseSync.authUser$.subscribe(user => {
      const newUserId = user?.uid || null;
      const previousUserId = this.currentUserId;
      const didUserChange = newUserId !== this.currentUserId;
      this.currentUserId = newUserId;

      if (didUserChange && this.currentUserId) {
        this.migrateGuestDataToUserScope(this.currentUserId, previousUserId);
      }

      if (didUserChange && this.firebaseSync.isFirebaseEnabled() && this.currentUserId) {
        this.syncFromFirebase();
      }
    });

    // S'abonner aux changements de statut de synchronisation Firebase
    this.firebaseSync.syncStatus$.subscribe(status => {
      if (status.isConnected) {
        this.syncFromFirebase();
      }
    });
  }

  private getActiveStorageKey(): string {
    if (this.currentUserId) {
      return `${this.scopedStoragePrefix}${this.currentUserId}`;
    }
    return `${this.scopedStoragePrefix}guest`;
  }

  private ensureLegacyGuestMigration(): void {
    if (this.currentUserId) {
      return;
    }
    const guestKey = this.getActiveStorageKey();
    if (localStorage.getItem(guestKey) !== null) {
      return;
    }
    const legacyData = localStorage.getItem(this.legacyStorageKey);
    if (legacyData !== null) {
      localStorage.setItem(guestKey, legacyData);
    }
  }

  private getScopedStorageKeyForUser(userId: string | null): string {
    return `${this.scopedStoragePrefix}${userId || 'guest'}`;
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

    const existingUserData = localStorage.getItem(userKey);
    const guestConversations = this.parseStoredConversations(guestData);
    const userConversations = existingUserData ? this.parseStoredConversations(existingUserData) : [];
    const merged = this.mergeConversations(userConversations, guestConversations);
    localStorage.setItem(userKey, JSON.stringify(merged));
  }

  private parseStoredConversations(stored: string): DiscussionSession[] {
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map((conv: any) => this.deserializeConversation(conv)) : [];
    } catch (error) {
      console.error('Erreur lors du parsing des conversations stockées:', error);
      return [];
    }
  }

  getAllConversations(): DiscussionSession[] {
    this.ensureLegacyGuestMigration();
    const stored = localStorage.getItem(this.getActiveStorageKey());
    if (stored) {
      try {
        const conversations = JSON.parse(stored);
        // Reconvertir les timestamps en objets Date
        return conversations.map((conv: any) => this.deserializeConversation(conv));
      } catch (e) {
        console.error('Erreur lors de la récupération des conversations sauvegardées:', e);
        return [];
      }
    }
    return [];
  }

  saveConversation(session: DiscussionSession): void {
    const all = this.getAllConversations();
    const idx = all.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      all[idx] = session;
    } else {
      all.push(session);
    }
    localStorage.setItem(this.getActiveStorageKey(), JSON.stringify(all));
    
    // Synchroniser avec Firebase si activé
    this.syncToFirebase();
  }

  removeConversation(sessionId: string): void {
    const all = this.getAllConversations().filter(s => s.id !== sessionId);
    localStorage.setItem(this.getActiveStorageKey(), JSON.stringify(all));
    
    // Synchroniser avec Firebase si activé
    this.syncToFirebase();
  }

  getConversationById(sessionId: string): DiscussionSession | undefined {
    return this.getAllConversations().find(s => s.id === sessionId);
  }

  /**
   * Désérialise une conversation en reconvertissant les timestamps en objets Date
   */
  private deserializeConversation(conv: any): DiscussionSession {
    return {
      ...conv,
      startTime: new Date(conv.startTime),
      endTime: conv.endTime ? new Date(conv.endTime) : undefined,
      turns: conv.turns.map((turn: any) => ({
        ...turn,
        timestamp: new Date(turn.timestamp)
      }))
    };
  }

  /**
   * Synchronise les conversations avec Firebase
   */
  private async syncToFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled() || this.isHydratingFromFirebase || !this.currentUserId) {
      return;
    }

    try {
      const conversations = this.getAllConversations();
      await this.firebaseSync.syncUserDataPatch({
        conversations: conversations.map(conversation => this.serializeConversation(conversation))
      });
    } catch (error) {
      console.error('🔍 [SavedConversations] Erreur de synchronisation vers Firebase:', error);
    }
  }

  /**
   * Récupère les conversations depuis Firebase
   */
  async syncFromFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled()) {
      return;
    }

    try {
      const userDocument = await this.firebaseSync.getUserDocumentData();
      const cloudConversations = userDocument?.['conversations'];
      if (!Array.isArray(cloudConversations)) {
        return;
      }

      this.isHydratingFromFirebase = true;

      const firebaseConversations = cloudConversations.map((conv: Conversation) => ({
          id: conv.id,
          context: conv.context,
          turns: conv.turns,
          startTime: new Date(conv.startTime),
          endTime: conv.endTime ? new Date(conv.endTime) : undefined,
          language: conv.language || 'it'
      }));

      const localConversations = this.getAllConversations();
      const mergedConversations = this.mergeConversations(localConversations, firebaseConversations);

      localStorage.setItem(this.getActiveStorageKey(), JSON.stringify(mergedConversations));
      await this.firebaseSync.syncUserDataPatch({
        conversations: mergedConversations.map(conversation => this.serializeConversation(conversation))
      });
    } catch (error) {
      console.error('🔍 [SavedConversations] Erreur de synchronisation depuis Firebase:', error);
    } finally {
      this.isHydratingFromFirebase = false;
    }
  }

  /**
   * Fusionne les conversations locales et Firebase
   */
  private mergeConversations(localConversations: DiscussionSession[], firebaseConversations: DiscussionSession[]): DiscussionSession[] {
    const merged = [...localConversations];
    
    firebaseConversations.forEach(firebaseConv => {
      const exists = merged.some(localConv => localConv.id === firebaseConv.id);
      if (!exists) {
        merged.push(firebaseConv);
      } else {
        // Mettre à jour la conversation existante avec les données Firebase si plus récent
        const index = merged.findIndex(localConv => localConv.id === firebaseConv.id);
        if (index !== -1) {
          // Ici on pourrait comparer les timestamps pour décider quelle version garder
          merged[index] = firebaseConv;
        }
      }
    });
    
    return merged;
  }

  private serializeConversation(conversation: DiscussionSession): Conversation {
    return {
      ...conversation,
      startTime: new Date(conversation.startTime),
      endTime: conversation.endTime ? new Date(conversation.endTime) : undefined,
      turns: conversation.turns.map(turn => ({
        ...turn,
        timestamp: new Date(turn.timestamp)
      }))
    };
  }
}
