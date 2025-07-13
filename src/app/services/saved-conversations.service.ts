import { Injectable } from '@angular/core';
import { DiscussionSession } from './discussion.service';

@Injectable({
  providedIn: 'root'
})
export class SavedConversationsService {
  private storageKey = 'savedConversations';

  getAllConversations(): DiscussionSession[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
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
  }

  removeConversation(sessionId: string): void {
    const all = this.getAllConversations().filter(s => s.id !== sessionId);
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  }

  getConversationById(sessionId: string): DiscussionSession | undefined {
    return this.getAllConversations().find(s => s.id === sessionId);
  }
} 