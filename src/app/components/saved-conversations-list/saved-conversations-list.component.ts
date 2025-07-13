import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { SavedConversationsService } from '../../services/saved-conversations.service';
import { DiscussionSession } from '../../services/discussion.service';

@Component({
  selector: 'app-saved-conversations-list',
  template: `
    <ion-header>
      <ion-toolbar color="secondary">
        <ion-title>Conversations sauvegardées</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list *ngIf="conversations.length > 0">
        <ion-item *ngFor="let conv of conversations" (click)="resume(conv)">
          <ion-icon name="chatbubbles-outline" slot="start"></ion-icon>
          <ion-label>
            <h2>{{ conv.context.title }}</h2>
            <p>{{ conv.context.situation }}</p>
            <small>{{ conv.startTime | date:'short' }}</small>
          </ion-label>
          <ion-button fill="clear" color="danger" slot="end" (click)="delete(conv, $event)">
            <ion-icon name="trash"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>
      <div *ngIf="conversations.length === 0" class="ion-text-center ion-padding">
        <ion-icon name="chatbubble-ellipses-outline" size="large" color="medium"></ion-icon>
        <p>Aucune conversation sauvegardée.</p>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SavedConversationsListComponent {
  conversations: DiscussionSession[] = [];
  @Output() resumeConversation = new EventEmitter<DiscussionSession>();

  constructor(
    private savedConversations: SavedConversationsService,
    private modalCtrl: ModalController
  ) {
    this.conversations = this.savedConversations.getAllConversations();
  }

  close() {
    this.modalCtrl.dismiss();
  }

  resume(conv: DiscussionSession) {
    this.modalCtrl.dismiss(conv);
  }

  delete(conv: DiscussionSession, event: Event) {
    event.stopPropagation();
    this.savedConversations.removeConversation(conv.id);
    this.conversations = this.savedConversations.getAllConversations();
  }
} 