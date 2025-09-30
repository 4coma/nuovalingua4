import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SavedConversationsService } from '../../services/saved-conversations.service';
import { DiscussionSession } from '../../services/discussion.service';

@Component({
  selector: 'app-saved-conversations-list',
  template: `
    <ion-content class="ion-padding">
      <div class="ion-padding-bottom">
        <p class="ion-text-muted">Reprenez vos conversations sauvegardées avec l'IA</p>
      </div>
      
      <ion-list *ngIf="conversations.length > 0">
        <ion-item *ngFor="let conv of conversations" button (click)="resume(conv)">
          <ion-icon name="chatbubbles-outline" slot="start" color="primary"></ion-icon>
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
        <h3>Aucune conversation sauvegardée</h3>
        <p>Commencez une discussion avec l'IA pour voir vos conversations ici.</p>
        <ion-button routerLink="/discussion-context-selection" color="primary" class="ion-margin-top">
          <ion-icon name="chatbubbles-outline" slot="start"></ion-icon>
          Commencer une discussion
        </ion-button>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class SavedConversationsListComponent implements OnInit {
  conversations: DiscussionSession[] = [];

  constructor(
    private savedConversations: SavedConversationsService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.conversations = this.savedConversations.getAllConversations();
  }

  resume(conv: DiscussionSession) {
    // Naviguer vers la discussion avec l'ID de la session sauvegardée
    this.router.navigate(['/discussion', conv.context.id], { 
      queryParams: { sessionId: conv.id } 
    });
  }

  async delete(conv: DiscussionSession, event: Event) {
    event.stopPropagation();
    
    const toast = await this.toastController.create({
      message: `Conversation "${conv.context.title}" supprimée`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    
    this.savedConversations.removeConversation(conv.id);
    this.loadConversations();
    await toast.present();
  }
} 