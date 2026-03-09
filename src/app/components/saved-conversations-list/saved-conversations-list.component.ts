import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { SavedConversationsService } from '../../services/saved-conversations.service';
import { DiscussionSession } from '../../services/discussion.service';

@Component({
  selector: 'app-saved-conversations-list',
  templateUrl: './saved-conversations-list.component.html',
  styleUrls: ['./saved-conversations-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class SavedConversationsListComponent implements OnInit {
  conversations: DiscussionSession[] = [];

  constructor(
    private savedConversations: SavedConversationsService,
    private modalController: ModalController,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.conversations = this.savedConversations.getAllConversations();
  }

  async resume(conv: DiscussionSession) {
    // En modal, remonter la conversation sélectionnée au parent.
    if (await this.dismissIfModal(conv)) {
      return;
    }

    // En page autonome, naviguer directement vers la discussion.
    this.router.navigate(['/discussion', conv.context.id], {
      queryParams: { sessionId: conv.id }
    });
  }

  async startConversation() {
    await this.dismissIfModal();
    await this.router.navigate(['/discussion-context-selection']);
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

  private async dismissIfModal(data?: unknown): Promise<boolean> {
    const topModal = await this.modalController.getTop();
    if (!topModal) {
      return false;
    }

    await this.modalController.dismiss(data);
    return true;
  }
} 
