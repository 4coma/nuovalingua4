import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DiscussionService, DiscussionContext } from '../../services/discussion.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { CreateCustomContextModalComponent } from './create-custom-context-modal.component';
import { SavedConversationsListComponent } from '../saved-conversations-list/saved-conversations-list.component';

@Component({
  selector: 'app-discussion-context-selection',
  templateUrl: './discussion-context-selection.component.html',
  styleUrls: ['./discussion-context-selection.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class DiscussionContextSelectionComponent implements OnInit {
  contextsByCategory: { [key: string]: DiscussionContext[] } = {};
  selectedDifficulty: string = 'all';
  selectedCategory: string = 'all';
  difficulties = [
    { value: 'all', label: 'Tous les niveaux' },
    { value: 'beginner', label: 'Débutant' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'advanced', label: 'Avancé' }
  ];

  constructor(
    private discussionService: DiscussionService,
    private router: Router,
    private modalCtrl: ModalController
  ) {
    console.log('🔍 DiscussionContextSelectionComponent - Constructor appelé');
  }

  ngOnInit() {
    console.log('🔍 DiscussionContextSelectionComponent - ngOnInit appelé');
    this.loadContexts();
  }

  loadContexts() {
    this.contextsByCategory = this.discussionService.getContextsByCategory();
  }

  getFilteredContexts(): { [key: string]: DiscussionContext[] } {
    let filtered = this.discussionService.getDiscussionContexts();

    // Filtrer par difficulté
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(context => context.difficulty === this.selectedDifficulty);
    }

    // Filtrer par catégorie
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(context => context.category === this.selectedCategory);
    }

    // Regrouper par catégorie
    return filtered.reduce((acc, context) => {
      if (!acc[context.category]) {
        acc[context.category] = [];
      }
      acc[context.category].push(context);
      return acc;
    }, {} as { [key: string]: DiscussionContext[] });
  }

  getCategories(): string[] {
    const contexts = this.discussionService.getDiscussionContexts();
    const categories = [...new Set(contexts.map(context => context.category))];
    return categories;
  }

  selectContext(context: DiscussionContext, idx?: number) {
    console.log('🔍 [CTX] Sélection du contexte:', {
      id: context.id,
      titre: context.title,
      index: idx,
      contexte: context
    });
    this.router.navigate(['/discussion', context.id]);
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return 'Débutant';
      case 'intermediate':
        return 'Intermédiaire';
      case 'advanced':
        return 'Avancé';
      default:
        return difficulty;
    }
  }

  getContextIcon(contextId: string): string {
    switch (contextId) {
      case 'restaurant':
        return 'restaurant-outline';
      case 'argument':
        return 'heart-outline';
      case 'shopping':
        return 'bag-outline';
      case 'travel':
        return 'map-outline';
      case 'work':
        return 'briefcase-outline';
      default:
        return 'chatbubble-outline';
    }
  }

  isEmptyContexts(): boolean {
    const filteredContexts = this.getFilteredContexts();
    return Object.keys(filteredContexts).length === 0;
  }

  async openCreateContextModal() {
    console.log('🔍 [CTX] Ouverture du modal de création de contexte');
    const modal = await this.modalCtrl.create({
      component: CreateCustomContextModalComponent,
      cssClass: 'custom-context-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      // Ajoute le contexte custom à la liste (en mémoire)
      this.discussionService.getDiscussionContexts().push(data);
      // Navigue directement vers la discussion
      this.router.navigate(['/discussion', data.id]);
    }
  }

  async openSavedConversations() {
    console.log('🔍 [CTX] Ouverture de la liste des conversations sauvegardées');
    const modal = await this.modalCtrl.create({
      component: SavedConversationsListComponent,
      cssClass: 'saved-conversations-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data && data.id) {
      // Naviguer vers la discussion avec l'id de la session sauvegardée
      this.router.navigate(['/discussion', data.context.id], { queryParams: { sessionId: data.id } });
    }
  }
} 