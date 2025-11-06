import { Component, EventEmitter, Output, OnInit } from '@angular/core';
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