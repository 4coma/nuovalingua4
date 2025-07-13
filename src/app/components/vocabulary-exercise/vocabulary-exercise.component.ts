import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VocabularyExercise, VocabularyItem, VocabularyError } from '../../models/vocabulary';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WordPair, TranslationDirection } from '../../services/llm.service';
import { TextGeneratorService } from '../../services/text-generator.service';
import { ComprehensionText } from '../../models/vocabulary';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { ThemeSelectionModalComponent } from '../theme-selection-modal/theme-selection-modal.component';

interface QuizItem {
  question: WordPair;
  userAnswer: string;
  isCorrect: boolean | null;
  revealed: boolean;
  sourceWord: string; // Le mot à afficher comme question
  targetWord: string; // La traduction attendue
}

@Component({
  selector: 'app-vocabulary-exercise',
  templateUrl: './vocabulary-exercise.component.html',
  styleUrls: ['./vocabulary-exercise.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FormsModule
  ]
})
export class VocabularyExerciseComponent implements OnInit {
  @Input() exercise: VocabularyExercise | null = null;
  @Output() complete = new EventEmitter<VocabularyItem[]>();
  @Output() comprehensionRequested = new EventEmitter<{ type: 'written' | 'oral', vocabularyItems: VocabularyItem[] }>();

  // Titre de la page pour le header global
  pageTitle: string = 'Exercice de vocabulaire';

  sessionInfo: { 
    category: string, 
    topic: string, 
    date: string,
    translationDirection?: TranslationDirection 
  } | null = null;
  
  wordPairs: WordPair[] = [];
  quizItems: QuizItem[] = [];
  currentIndex = 0;
  quizCompleted = false;
  
  // Pour le champ de saisie
  currentAnswer: string = '';
  
  // Pour la fonction de compréhension
  generatingComprehension: boolean = false;
  comprehensionText: ComprehensionText | null = null;
  
  // Pour le suivi des erreurs
  errorList: VocabularyError[] = [];
  showErrorSummary: boolean = false;
  
  constructor(
    private router: Router,
    private textGeneratorService: TextGeneratorService,
    private vocabularyTrackingService: VocabularyTrackingService,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadSessionData();
  }

  loadSessionData() {
    // Essayer d'abord de charger l'exercice prédéfini
    const exerciseJson = localStorage.getItem('vocabularyExercise');
    if (exerciseJson) {
      try {
        const exercise = JSON.parse(exerciseJson);
        this.loadExerciseData(exercise);
        return;
      } catch (error) {
        console.error('Erreur lors du chargement de l\'exercice:', error);
      }
    }

    // Si pas d'exercice spécifique, charger depuis les paires de mots
    const wordPairsJson = localStorage.getItem('wordPairs');
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    
    if (wordPairsJson && sessionInfoJson) {
      this.wordPairs = JSON.parse(wordPairsJson);
      this.sessionInfo = JSON.parse(sessionInfoJson);
      this.prepareQuiz();
    } else {
      // Rediriger vers la sélection de catégorie si aucune donnée n'est trouvée
      this.router.navigate(['/category']);
    }
  }

  // Charge les données d'un exercice prédéfini
  loadExerciseData(exercise: VocabularyExercise) {
    // Récupérer les infos de session
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    if (sessionInfoJson) {
      this.sessionInfo = JSON.parse(sessionInfoJson);
    } else {
      this.sessionInfo = {
        category: 'Vocabulaire',
        topic: exercise.topic || 'Général',
        date: new Date().toISOString()
      };
    }
    
    // Convertir les items en paires de mots (format WordPair)
    this.wordPairs = exercise.items.map(item => ({
      it: item.word,
      fr: item.translation,
      context: item.context
    }));
    
    this.prepareQuiz();
  }

  prepareQuiz() {
    this.quizItems = [];
    this.currentIndex = 0;
    this.quizCompleted = false;
    
    // Déterminer la direction de traduction
    const direction = this.sessionInfo?.translationDirection || 'fr2it';
    
    // Créer les éléments du quiz à partir des paires de mots
    this.wordPairs.forEach((pair) => {
      // Adapter selon la direction choisie
      const sourceWord = direction === 'fr2it' ? pair.fr : pair.it;
      const targetWord = direction === 'fr2it' ? pair.it : pair.fr;
      
      this.quizItems.push({
        question: pair,
        userAnswer: '',
        isCorrect: null,
        revealed: false,
        sourceWord: sourceWord,
        targetWord: targetWord
      });
    });
  }

  submitAnswer() {
    if (this.quizCompleted) return;
    
    const currentItem = this.quizItems[this.currentIndex];
    currentItem.userAnswer = this.currentAnswer;
    
    // Vérifier la réponse (en ignorant la casse et les espaces supplémentaires)
    const normalizedUserAnswer = this.currentAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = currentItem.targetWord.trim().toLowerCase();
    
    currentItem.isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    // Si la réponse est incorrecte, ajouter à la liste des erreurs
    if (!currentItem.isCorrect) {
      this.errorList.push({
        sourceWord: currentItem.sourceWord,
        targetWord: currentItem.targetWord,
        userAnswer: this.currentAnswer,
        context: currentItem.question.context
      });
    }
    
    // Suivre ce mot dans le service de suivi du vocabulaire
    if (this.sessionInfo) {
      // Déterminer les mots source et cible en fonction de la direction
      let sourceWord, targetWord;
      if (this.sessionInfo.translationDirection === 'fr2it') {
        sourceWord = currentItem.question.fr;
        targetWord = currentItem.question.it;
      } else {
        sourceWord = currentItem.question.it;
        targetWord = currentItem.question.fr;
      }
      
      this.vocabularyTrackingService.trackWord(
        sourceWord, 
        targetWord,
        this.sessionInfo.category,
        this.sessionInfo.topic,
        currentItem.isCorrect,
        currentItem.question.context
      );
    }
    
    // Réinitialiser le champ de saisie
    this.currentAnswer = '';
    
    // Passer à la question suivante après un court délai
    setTimeout(() => {
      if (this.currentIndex < this.quizItems.length - 1) {
        this.currentIndex++;
      } else {
        this.quizCompleted = true;
      }
    }, 1000);
  }

  showAnswer() {
    const currentItem = this.quizItems[this.currentIndex];
    currentItem.revealed = true;
    
    // Ajouter à la liste des erreurs puisque l'utilisateur n'a pas répondu correctement
    this.errorList.push({
      sourceWord: currentItem.sourceWord,
      targetWord: currentItem.targetWord,
      userAnswer: "(non répondu)",
      context: currentItem.question.context
    });
    
    // Suivre ce mot dans le service de suivi du vocabulaire comme incorrect (puisque révélé)
    if (this.sessionInfo) {
      // Déterminer les mots source et cible en fonction de la direction
      let sourceWord, targetWord;
      if (this.sessionInfo.translationDirection === 'fr2it') {
        sourceWord = currentItem.question.fr;
        targetWord = currentItem.question.it;
      } else {
        sourceWord = currentItem.question.it;
        targetWord = currentItem.question.fr;
      }
      
      this.vocabularyTrackingService.trackWord(
        sourceWord,
        targetWord,
        this.sessionInfo.category,
        this.sessionInfo.topic,
        false, // Considéré comme une réponse incorrecte
        currentItem.question.context
      );
    }
  }

  nextWord() {
    if (this.currentIndex < this.quizItems.length - 1) {
      this.currentIndex++;
      this.currentAnswer = '';
    } else {
      this.quizCompleted = true;
    }
  }

  getScore(): number {
    const correctAnswers = this.quizItems.filter(item => item.isCorrect).length;
    return (correctAnswers / this.quizItems.length) * 100;
  }

  async requestComprehension(type: 'written' | 'oral') {
    // Demander à l'utilisateur s'il veut préciser des thèmes
    const modal = await this.modalController.create({
      component: ThemeSelectionModalComponent,
      cssClass: 'theme-selection-modal'
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    const selectedThemes = data?.themes || [];
    
    // Convertir les WordPair en VocabularyItem pour être compatible avec l'interface existante
    const vocabularyItems = this.wordPairs.map(pair => ({
      word: pair.it,
      translation: pair.fr,
      context: pair.context
    }));
    
    this.generatingComprehension = true;
    
    // Générer le texte de compréhension via le service avec les thèmes sélectionnés
    this.textGeneratorService.generateComprehensionText(this.wordPairs, type, selectedThemes).subscribe({
      next: (result) => {
        this.comprehensionText = result;
        this.generatingComprehension = false;
        
        // Stocker le texte dans le localStorage pour y accéder depuis le composant de compréhension
        localStorage.setItem('comprehensionText', JSON.stringify(this.comprehensionText));
        
        // Mettre à jour le sessionInfo dans le localStorage pour la sauvegarde
        if (this.sessionInfo) {
          const sessionInfoWithThemes = {
            ...this.sessionInfo,
            themes: selectedThemes
          };
          localStorage.setItem('sessionInfo', JSON.stringify(sessionInfoWithThemes));
        }
        
        // Naviguer vers la page de compréhension
        this.router.navigate(['/comprehension']);
      },
      error: (error) => {
        console.error('Erreur lors de la génération du texte de compréhension:', error);
        this.generatingComprehension = false;
        alert('Erreur lors de la génération du texte. Veuillez réessayer.');
      }
    });
  }

  finishExercise() {
    // Convertir les WordPair en VocabularyItem pour être compatible avec l'interface existante
    const vocabularyItems = this.wordPairs.map(pair => ({
      word: pair.it,
      translation: pair.fr,
      context: pair.context
    }));
    
    this.complete.emit(vocabularyItems);
    this.router.navigate(['/category']);
  }

  /**
   * Active ou désactive l'affichage du résumé des erreurs
   */
  toggleErrorSummary() {
    this.showErrorSummary = !this.showErrorSummary;
  }

  /**
   * Vérifie si l'utilisateur a fait des erreurs
   */
  hasErrors(): boolean {
    return this.errorList.length > 0;
  }

  /**
   * Réinitialise la liste des erreurs
   */
  clearErrors() {
    this.errorList = [];
  }

  /**
   * Recommence l'exercice complet
   */
  restartExercise() {
    // Réinitialiser les statistiques
    this.currentIndex = 0;
    this.quizCompleted = false;
    this.errorList = [];
    this.currentAnswer = '';
    
    // Réinitialiser tous les quiz items
    this.quizItems.forEach(item => {
      item.userAnswer = '';
      item.isCorrect = null;
      item.revealed = false;
    });
    
    // Sauvegarder l'état de recommencement dans le localStorage
    localStorage.setItem('vocabularyExerciseRestart', 'true');
    
    this.showToast('Exercice recommencé');
  }

  /**
   * Recommence uniquement avec les mots ratés
   */
  restartFailedWords() {
    if (this.errorList.length === 0) {
      this.showToast('Aucun mot raté à recommencer');
      return;
    }
    
    // Déterminer la direction de traduction originale
    const direction = this.sessionInfo?.translationDirection || 'fr2it';
    
    // Créer un nouvel exercice avec seulement les mots ratés
    // en respectant la direction de traduction originale
    const failedItems = this.errorList.map(error => {
      // Trouver le WordPair original correspondant à cette erreur
      const originalPair = this.wordPairs.find(pair => {
        // Vérifier si cette paire correspond à l'erreur selon la direction
        if (direction === 'fr2it') {
          return pair.fr === error.sourceWord && pair.it === error.targetWord;
        } else {
          return pair.it === error.sourceWord && pair.fr === error.targetWord;
        }
      });
      
      if (originalPair) {
        // Utiliser la paire originale pour respecter la direction
        if (direction === 'fr2it') {
          return {
            word: originalPair.fr, // Le mot français
            translation: originalPair.it, // La traduction italienne
            context: originalPair.context
          };
        } else {
          return {
            word: originalPair.it, // Le mot italien
            translation: originalPair.fr, // La traduction française
            context: originalPair.context
          };
        }
      } else {
        // Fallback si la paire n'est pas trouvée
        return {
          word: error.sourceWord,
          translation: error.targetWord,
          context: error.context
        };
      }
    });
    
    const failedExercise = {
      items: failedItems,
      type: 'vocabulary',
      topic: this.sessionInfo?.topic || 'Vocabulaire - Mots ratés'
    };
    
    // Stocker l'exercice des mots ratés
    localStorage.setItem('vocabularyExercise', JSON.stringify(failedExercise));
    localStorage.setItem('vocabularyExerciseRestart', 'true');
    
    // Recharger la page pour démarrer le nouvel exercice
    window.location.reload();
  }

  /**
   * Affiche un toast
   */
  private async showToast(message: string) {
    const { ToastController } = await import('@ionic/angular');
    const toastController = new ToastController();
    const toast = await toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
