import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LlmService, WordPair, TranslationDirection } from '../../services/llm.service';
import { PersonalDictionaryService } from '../../services/personal-dictionary.service';
import { FormsModule } from '@angular/forms';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.component.html',
  styleUrls: ['./category-selection.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule
  ]
})
export class CategorySelectionComponent implements OnInit, OnDestroy {
  @Output() categorySelected = new EventEmitter<{category: string, topic: string}>();
  
  categories: Category[] = [
    {
      id: 'conjugation',
      name: 'Conjugaison',
      icon: 'create',
      description: 'Apprendre et pratiquer les conjugaisons italiennes'
    },
    {
      id: 'grammar',
      name: 'Grammaire',
      icon: 'book',
      description: 'Étudier les règles de grammaire italiennes'
    },
    {
      id: 'vocabulary',
      name: 'Vocabulaire',
      icon: 'chatbubbles',
      description: 'Enrichir votre vocabulaire italien'
    }
  ];

  topics: { [key: string]: string[] } = {
    'conjugation': ['Présent', 'Passé composé', 'Imparfait', 'Futur'],
    'grammar': ['Articles', 'Prépositions', 'Adjectifs', 'Adverbes'],
    'vocabulary': ['Tourisme', 'Nourriture', 'Travail', 'Transport', 'Loisirs', 'Personnel']
  };

  selectedCategory: string | null = null;
  selectedTopic: string | null = null;
  
  // Direction de traduction
  translationDirection: TranslationDirection = 'fr2it';
  
  // États pour les composants d'interface
  showConfirmation: boolean = false;
  isLoading: boolean = false;
  alertButtons: any[] = [];

  pageTitle = 'Catégories';

  constructor(
    private llmService: LlmService,
    private router: Router,
    private personalDictionaryService: PersonalDictionaryService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Charger la direction de traduction depuis le service
    this.translationDirection = this.llmService.translationDirection;
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.selectedTopic = null;
  }

  confirmStartSession(topic: string) {
    this.selectedTopic = topic;
    this.alertButtons = [
      {
        text: 'Annuler',
        role: 'cancel',
        handler: () => {
          this.cancelConfirmation();
        }
      },
      {
        text: 'Démarrer',
        handler: () => {
          this.startSession();
        }
      }
    ];
    this.showConfirmation = true;
  }

  cancelConfirmation() {
    this.showConfirmation = false;
  }

  startSession() {
    this.showConfirmation = false;
    this.isLoading = true;
    console.log('Démarrage session, isLoading:', this.isLoading);

    if (this.selectedCategory && this.selectedTopic) {
      // Mettre à jour la direction de traduction dans le service
      this.llmService.translationDirection = this.translationDirection;
      
      // Cas spécial pour le dictionnaire personnel
      if (this.selectedCategory === 'vocabulary' && this.selectedTopic === 'Personnel') {
        this.handlePersonalDictionary();
        return;
      }

      // Émettre l'événement de sélection de catégorie pour compatibilité
      this.categorySelected.emit({
        category: this.selectedCategory,
        topic: this.selectedTopic
      });

      // Générer les paires de mots via l'API OpenAI
      this.llmService.generateWordPairs(this.selectedTopic, this.selectedCategory).subscribe({
        next: (wordPairs) => {
          console.log('Paires de mots générées:', wordPairs);
          // Stocker les paires de mots dans le localStorage pour la session
          localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
          // Stocker les informations sur la session
          localStorage.setItem('sessionInfo', JSON.stringify({
            category: this.selectedCategory,
            topic: this.selectedTopic,
            date: new Date().toISOString(),
            translationDirection: this.translationDirection
          }));
          
          this.isLoading = false;
          console.log('Chargement terminé, isLoading:', this.isLoading);
          
          // Naviguer vers le jeu d'association (nouveau composant)
          setTimeout(() => {
            this.router.navigate(['/word-pairs-game']);
          }, 100);
        },
        error: (error) => {
          console.error('Erreur lors de la génération des paires de mots:', error);
          this.isLoading = false;
          console.log('Erreur de chargement, isLoading:', this.isLoading);
          // Gérer l'erreur (peut-être afficher une alerte)
          alert('Erreur lors de la génération des paires de mots. Veuillez réessayer.');
        }
      });
    } else {
      this.isLoading = false;
      console.log('Pas de catégorie/sujet sélectionné, isLoading:', this.isLoading);
    }
  }

  /**
   * Gère l'accès au dictionnaire personnel
   */
  private handlePersonalDictionary() {
    // Vérifier si le dictionnaire personnel contient des mots
    const personalWords = this.personalDictionaryService.getAllWords();
    
    if (personalWords.length === 0) {
      this.isLoading = false;
      this.showToast('Votre dictionnaire personnel est vide. Ajoutez des mots pour commencer!');
      return;
    }
    
    // Récupérer les mots pour l'exercice
    const words = this.personalDictionaryService.getWordsForExercise();
    
    // Créer un format compatible avec l'exercice de vocabulaire
    const exercise = {
      items: words.map(word => ({
        word: word.sourceWord,
        translation: word.targetWord,
        context: word.contextualMeaning
      })),
      type: 'vocabulary',
      topic: 'Personnel'
    };
    
    // Sauvegarder l'exercice et rediriger
    localStorage.setItem('vocabularyExercise', JSON.stringify(exercise));
    localStorage.setItem('wordPairs', JSON.stringify(words.map(word => ({
      fr: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
      it: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
      context: word.contextualMeaning
    }))));
    localStorage.setItem('sessionInfo', JSON.stringify({
      category: this.selectedCategory,
      topic: this.selectedTopic,
      date: new Date().toISOString(),
      translationDirection: this.translationDirection
    }));
    
    this.isLoading = false;
    setTimeout(() => {
      this.router.navigate(['/word-pairs-game']);
    }, 100);
  }

  /**
   * Change la direction de traduction
   */
  changeTranslationDirection(direction: string | number | undefined) {
    // Convertir la valeur en string si nécessaire
    const directionStr = direction !== undefined ? String(direction) : undefined;
    
    // Vérifier que la valeur est définie et est bien 'fr2it' ou 'it2fr'
    if (directionStr && (directionStr === 'fr2it' || directionStr === 'it2fr')) {
      this.translationDirection = directionStr as TranslationDirection;
    } else {
      console.warn('Direction de traduction invalide:', direction);
    }
  }

  /**
   * Affiche un toast
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'warning'
    });
    await toast.present();
  }

  getTopicsForCategory() {
    return this.selectedCategory ? this.topics[this.selectedCategory] : [];
  }

  ngOnDestroy() {
    // S'assurer que isLoading est false lorsque le composant est détruit
    this.isLoading = false;
  }
}
