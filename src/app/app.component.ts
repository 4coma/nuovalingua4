import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { LlmService } from './services/llm.service';
import { VocabularyExercise, ComprehensionText, VocabularyItem } from './models/vocabulary';
import { AddWordComponent } from './components/add-word/add-word.component';
import { filter } from 'rxjs/operators';

enum AppState {
  CATEGORY_SELECTION,
  VOCABULARY_EXERCISE,
  COMPREHENSION_EXERCISE
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    RouterOutlet,
    RouterLink,
    CommonModule,
    AddWordComponent
  ]
})
export class AppComponent {
  currentState = AppState.CATEGORY_SELECTION;
  
  // Store the current exercises
  vocabularyExercise: VocabularyExercise | null = null;
  comprehensionText: ComprehensionText | null = null;
  
  // States enum for template
  appStates = AppState;

  // Header management
  currentPageTitle: string = 'NuovaLingua';
  showBackButton: boolean = false;

  // Mapping des routes aux titres
  pageTitles: { [key: string]: string } = {
    '/home': 'Accueil',
    '/category': 'Catégories',
    '/vocabulary': 'Vocabulaire',
    '/comprehension': 'Compréhension',
    '/questions': 'Questions',
    '/personal-dictionary': 'Mon dictionnaire personnel'
  };

  // Routes où le bouton retour doit être affiché
  routesWithBackButton: string[] = [
    '/vocabulary',
    '/comprehension',
    '/questions',
    '/personal-dictionary'
  ];

  constructor(
    private llmService: LlmService,
    private router: Router,
    private modalController: ModalController
  ) {
    this.setupRouteListener();
  }

  /**
   * Configure l'écoute des changements de route pour mettre à jour le titre
   */
  private setupRouteListener() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentRoute = event.urlAfterRedirects;
      this.updateHeaderForRoute(currentRoute);
    });
  }

  /**
   * Met à jour le header quand la route change
   */
  private updateHeaderForRoute(route: string) {
    // Mise à jour du titre
    this.currentPageTitle = this.pageTitles[route] || 'NuovaLingua';
    
    // Affichage du bouton retour
    this.showBackButton = this.routesWithBackButton.includes(route);
  }

  /**
   * Appelé quand un composant est activé via le router-outlet
   */
  onRouteActivate(component: any) {
    // Si le composant a un titre personnalisé, l'utiliser
    if (component.pageTitle) {
      this.currentPageTitle = component.pageTitle;
    }
  }

  onCategorySelected(event: {category: string, topic: string}) {
    // Generate a vocabulary exercise based on the selected category and topic
    this.llmService.generateVocabularyExercise(event.category, event.topic)
      .subscribe(
        (exercise) => {
          this.vocabularyExercise = exercise;
          this.currentState = AppState.VOCABULARY_EXERCISE;
          this.router.navigate(['/vocabulary']);
        },
        (error) => {
          console.error('Error generating vocabulary exercise:', error);
          // Handle error appropriately
        }
      );
  }

  onComprehensionRequested(event: { type: 'written' | 'oral', vocabularyItems: VocabularyItem[] }) {
    // Generate a comprehension exercise based on the selected type and vocabulary items
    this.llmService.generateComprehensionExercise(event.type, event.vocabularyItems)
      .subscribe(
        (comprehensionText) => {
          this.comprehensionText = comprehensionText;
          this.currentState = AppState.COMPREHENSION_EXERCISE;
          this.router.navigate(['/comprehension']);
        },
        (error) => {
          console.error('Error generating comprehension exercise:', error);
          // Handle error appropriately
        }
      );
  }

  onExerciseComplete() {
    // Go back to category selection
    this.currentState = AppState.CATEGORY_SELECTION;
    this.vocabularyExercise = null;
    this.comprehensionText = null;
    this.router.navigate(['/category']);
  }

  /**
   * Ouvre le modal pour ajouter un mot au dictionnaire personnel
   */
  async openAddWordModal() {
    const modal = await this.modalController.create({
      component: AddWordComponent,
      cssClass: 'add-word-modal'
    });
    
    await modal.present();
  }
}
