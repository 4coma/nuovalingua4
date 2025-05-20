import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VocabularyExercise, VocabularyItem } from '../../models/vocabulary';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WordPair, TranslationDirection } from '../../services/llm.service';
import { TextGeneratorService } from '../../services/text-generator.service';
import { ComprehensionText } from '../../models/vocabulary';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';

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
  
  constructor(
    private router: Router,
    private textGeneratorService: TextGeneratorService,
    private vocabularyTrackingService: VocabularyTrackingService
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

  requestComprehension(type: 'written' | 'oral') {
    // Convertir les WordPair en VocabularyItem pour être compatible avec l'interface existante
    const vocabularyItems = this.wordPairs.map(pair => ({
      word: pair.it,
      translation: pair.fr,
      context: pair.context
    }));
    
    this.generatingComprehension = true;
    
    // Générer le texte de compréhension via le service
    this.textGeneratorService.generateComprehensionText(this.wordPairs, type).subscribe({
      next: (result) => {
        this.comprehensionText = result;
        this.generatingComprehension = false;
        
        // Stocker le texte dans le localStorage pour y accéder depuis le composant de compréhension
        localStorage.setItem('comprehensionText', JSON.stringify(this.comprehensionText));
        
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
}
