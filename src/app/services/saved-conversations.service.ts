import { Injectable } from '@angular/core';
import { DiscussionSession } from './discussion.service';
import { FirebaseSyncService, Conversation } from './firebase-sync.service';

@Injectable({
  providedIn: 'root'
})
export class SavedConversationsService {
  private storageKey = 'savedConversations';

  constructor(private firebaseSync: FirebaseSyncService) {
    // S'abonner aux changements de statut de synchronisation Firebase
    this.firebaseSync.syncStatus$.subscribe(status => {
      if (status.isConnected) {
        this.syncFromFirebase();
      }
    });
  }

  getAllConversations(): DiscussionSession[] {
    const stored = localStorage.getItem(this.storageKey);
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
    localStorage.setItem(this.storageKey, JSON.stringify(all));
    
    // Synchroniser avec Firebase si activé
    this.syncToFirebase();
  }

  removeConversation(sessionId: string): void {
    const all = this.getAllConversations().filter(s => s.id !== sessionId);
    localStorage.setItem(this.storageKey, JSON.stringify(all));
    
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
    if (!this.firebaseSync.isFirebaseEnabled()) {
      return;
    }

    try {
      const conversations = this.getAllConversations();
      // Les conversations sont déjà incluses dans la synchronisation générale via DataMigrationService
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
      const userData = await this.firebaseSync.getAllUserData();
      if (userData && userData.conversations.length > 0) {
        // Convertir les conversations Firebase en format DiscussionSession
        const firebaseConversations = userData.conversations.map((conv: Conversation) => ({
          id: conv.id,
          context: conv.context,
          turns: conv.turns,
          startTime: new Date(conv.startTime),
          endTime: conv.endTime ? new Date(conv.endTime) : undefined,
          language: conv.language || 'it'
        }));

        // Fusionner avec les conversations locales
        const localConversations = this.getAllConversations();
        const mergedConversations = this.mergeConversations(localConversations, firebaseConversations);
        
        // Sauvegarder localement
        localStorage.setItem(this.storageKey, JSON.stringify(mergedConversations));
        
      }
    } catch (error) {
      console.error('🔍 [SavedConversations] Erreur de synchronisation depuis Firebase:', error);
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
} 