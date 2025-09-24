import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LlmService, WordPair, TranslationDirection } from '../../services/llm.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { FormsModule } from '@angular/forms';
import { CustomPromptModalComponent } from '../custom-prompt-modal/custom-prompt-modal.component';
import { CustomInstructionModalComponent } from '../custom-instruction-modal/custom-instruction-modal.component';
import { StorageService } from '../../services/storage.service';
import { FocusModeService } from '../../services/focus-mode.service';

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
    },
    {
      id: 'custom',
      name: 'Libre',
      icon: 'rocket',
      description: 'Créer une session personnalisée selon vos besoins'
    }
  ];

  topics: { [key: string]: string[] } = {
    'conjugation': ['Présent', 'Passé composé', 'Imparfait', 'Futur', 'Plus-que-parfait', 'Futur antérieur', 'Subjonctif présent', 'Subjonctif passé', 'Conditionnel', 'Impératif', 'Gérondif'],
    'grammar': ['Articles', 'Prépositions', 'Adjectifs', 'Adverbes'],
    'vocabulary': ['Tourisme', 'Nourriture', 'Travail', 'Transport', 'Loisirs', 'Personnel']
  };

  selectedCategory: string | null = null;
  selectedTopic: string | null = null;
  
  // Nouvelle propriété pour gérer l'affichage
  showTopics: boolean = false;
  
  // Direction de traduction
  translationDirection: TranslationDirection = 'fr2it';
  
  // États pour les composants d'interface
  showConfirmation: boolean = false;
  isLoading: boolean = false;
  alertButtons: any[] = [];

  // Mode focus
  isFocusMode: boolean = false;
  focusInstruction: string = '';

  pageTitle = 'Catégories';

  constructor(
    private llmService: LlmService,
    private router: Router,
    private personalDictionaryService: PersonalDictionaryService,
    private toastController: ToastController,
    private modalController: ModalController,
    private storageService: StorageService,
    private focusModeService: FocusModeService
  ) { }

  ngOnInit() {
    // Charger la direction de traduction depuis le service
    this.translationDirection = this.llmService.translationDirection;
    
    // Vérifier si on est en mode focus (seulement si on vient de l'accueil avec un focus)
    this.checkFocusMode();
  }

  /**
   * Vérifie si on est en mode focus et charge les données appropriées
   */
  private checkFocusMode() {
    this.isFocusMode = this.storageService.get('isFocusMode') || false;
    this.focusInstruction = this.storageService.get('focusInstruction') || '';
    const fromFocusButton = this.storageService.get('fromFocusButton') || false;
    
    // Ne démarrer la session focus que si on a explicitement activé le mode focus
    // ET qu'on vient du bouton focus (pas d'une session normale)
    if (this.isFocusMode && this.focusInstruction && fromFocusButton) {
      this.pageTitle = 'Focus Mode';
      // Nettoyer le flag fromFocusButton pour éviter qu'il persiste
      this.storageService.remove('fromFocusButton');
      // Démarrer directement la session avec le focus
      this.startFocusSession();
    } else {
      // Nettoyer les flags de focus si on n'est pas en mode focus
      this.storageService.remove('isFocusMode');
      this.storageService.remove('focusInstruction');
      this.storageService.remove('fromFocusButton');
    }
  }

  /**
   * Démarre une session avec le focus défini
   */
  private async startFocusSession() {
    if (!this.focusInstruction) {
      console.error('Instruction de focus manquante');
      return;
    }

    try {
      // Vérifier si des mots existent déjà pour ce focus
      const existingWords = this.focusModeService.getCurrentFocusWords();

      // Créer les informations de session
      const sessionInfo = {
        category: 'Focus Mode',
        topic: this.focusInstruction,
        date: new Date().toISOString(),
        translationDirection: this.translationDirection,
        customInstruction: this.focusInstruction
      };

      // Sauvegarder les informations communes
      this.storageService.set('sessionInfo', sessionInfo);
      this.storageService.set('isFocusMode', true);
      this.storageService.set('focusInstruction', this.focusInstruction);

      // S'il y a déjà des mots, les utiliser directement
      if (existingWords.length > 0) {
        this.storageService.set('wordPairs', existingWords);
        this.router.navigate(['/word-pairs-game']);
        return;
      }

      this.isLoading = true;

      // Générer les mots avec l'instruction de focus en excluant ceux déjà générés
      const wordPairs = await this.llmService.generateWordPairs(
        this.focusInstruction,
        undefined,
        this.translationDirection,
        existingWords.map(w => w.it)
      ).toPromise();

      if (!wordPairs || wordPairs.length === 0) {
        throw new Error('Aucun mot généré');
      }

      // Sauvegarder les paires de mots pour la session
      this.storageService.set('wordPairs', wordPairs);
      this.storageService.set('isFocusMode', true);

      // Ajouter les mots au focus
      this.focusModeService.addWordsToCurrentFocus(wordPairs);

      // Naviguer vers l'exercice
      this.router.navigate(['/word-pairs-game']);

    } catch (error) {
      console.error('Erreur lors du démarrage de la session focus:', error);
      await this.showToast('Erreur lors de la génération des mots pour le focus');
      
      // Nettoyer le mode focus en cas d'erreur
      this.storageService.remove('isFocusMode');
      this.storageService.remove('focusInstruction');
      
      // Retourner à l'accueil
      this.router.navigate(['/home']);
    } finally {
      this.isLoading = false;
    }
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.selectedTopic = null;
    
    if (categoryId === 'custom') {
      this.openCustomPromptModal();
    } else {
      // Afficher les sous-catégories
      this.showTopics = true;
    }
  }

  /**
   * Retourne à l'affichage des catégories principales
   */
  backToCategories() {
    this.showTopics = false;
    this.selectedCategory = null;
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
          this.askForCustomInstruction();
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

  /**
   * Ouvre le modal pour saisir une consigne personnalisée
   */
  async openCustomPromptModal() {
    const modal = await this.modalController.create({
      component: CustomPromptModalComponent,
      cssClass: 'custom-prompt-modal'
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    
    if (data && data.prompt) {
      // Lancer la génération avec la consigne personnalisée
      this.startCustomSession(data.prompt);
    } else {
      // Réinitialiser la sélection si l'utilisateur annule
      this.selectedCategory = null;
    }
  }

  /**
   * Demande à l'utilisateur s'il veut ajouter une consigne spécifique
   */
  async askForCustomInstruction() {
    const modal = await this.modalController.create({
      component: CustomInstructionModalComponent,
      cssClass: 'custom-instruction-modal'
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    
    if (data && data.instruction) {
      // Lancer la session avec la consigne personnalisée
      this.startSessionWithCustomInstruction(data.instruction);
    } else {
      // Lancer la session normale
      this.startSession();
    }
  }

  /**
   * Démarre une session personnalisée avec la consigne de l'utilisateur
   */
  startCustomSession(customPrompt: string) {
    this.isLoading = true;
    console.log('Démarrage session personnalisée, isLoading:', this.isLoading);
    
    // Sauvegarder les informations de la session
    const sessionInfo = {
      category: 'Personnalisé',
      topic: customPrompt.length > 30 ? customPrompt.substring(0, 27) + '...' : customPrompt,
      date: new Date().toISOString(),
      translationDirection: this.translationDirection
    };
    console.log('Info session personnalisée:', sessionInfo);
    localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
    
    // Appeler le service LLM pour générer des paires de mots avec la consigne personnalisée
    this.llmService.generateCustomWordPairs(customPrompt, this.translationDirection)
      .subscribe({
        next: (wordPairs: WordPair[]) => {
          console.log('Paires de mots personnalisées générées:', wordPairs);
          localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
          this.isLoading = false;
          console.log('Navigation vers word-pairs-game');
          
          // Utiliser setTimeout pour s'assurer que la navigation se déclenche après les autres opérations
          setTimeout(() => {
            this.router.navigate(['/word-pairs-game'])
              .then(success => {
                console.log('Navigation réussie:', success);
              })
              .catch(err => {
                console.error('Erreur de navigation:', err);
                // Si la navigation échoue, tenter une autre approche
                this.router.navigateByUrl('/word-pairs-game');
              });
          }, 100);
        },
        error: (error: any) => {
          console.error('Erreur lors de la génération des paires de mots:', error);
          this.isLoading = false;
          this.showToast('Erreur lors de la génération de la session personnalisée. Veuillez réessayer.');
        }
      });
  }

  /**
   * Démarre une session avec une consigne personnalisée
   */
  startSessionWithCustomInstruction(customInstruction: string) {
    this.isLoading = true;
    console.log('Démarrage session avec consigne personnalisée, isLoading:', this.isLoading);

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

      // Générer les paires de mots via l'API OpenAI avec la consigne personnalisée
      this.llmService.generateWordPairsWithCustomInstruction(
        this.selectedTopic, 
        this.selectedCategory, 
        customInstruction
      ).subscribe({
        next: (wordPairs: WordPair[]) => {
          console.log('Paires de mots générées avec consigne personnalisée:', wordPairs);
          
          // Stocker les paires de mots dans le localStorage pour la session
          localStorage.setItem('wordPairs', JSON.stringify(wordPairs));
          // Stocker les informations sur la session
          localStorage.setItem('sessionInfo', JSON.stringify({
            category: this.selectedCategory,
            topic: this.selectedTopic,
            date: new Date().toISOString(),
            translationDirection: this.translationDirection,
            customInstruction: customInstruction
          }));
          
          this.isLoading = false;
          console.log('Chargement terminé, isLoading:', this.isLoading);
          
          // Naviguer vers le jeu d'association (nouveau composant)
          setTimeout(() => {
            this.router.navigate(['/word-pairs-game']);
          }, 100);
        },
        error: (error: any) => {
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
}
