import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VocabularyExercise, VocabularyItem } from '../../models/vocabulary';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WordPair } from '../../services/llm.service';
import { TextGeneratorService } from '../../services/text-generator.service';
import { ComprehensionText } from '../../models/vocabulary';

interface QuizItem {
  question: WordPair;
  userAnswer: string;
  isCorrect: boolean | null;
  revealed: boolean;
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

  sessionInfo: { category: string, topic: string, date: string } | null = null;
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
    private textGeneratorService: TextGeneratorService
  ) { }

  ngOnInit() {
    this.loadSessionData();
  }

  loadSessionData() {
    // Charger les paires de mots du localStorage
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

  prepareQuiz() {
    this.quizItems = [];
    this.currentIndex = 0;
    this.quizCompleted = false;
    
    // Créer les éléments du quiz à partir des paires de mots
    this.wordPairs.forEach((pair) => {
      this.quizItems.push({
        question: pair,
        userAnswer: '',
        isCorrect: null,
        revealed: false
      });
    });
  }

  submitAnswer() {
    if (this.quizCompleted) return;
    
    const currentItem = this.quizItems[this.currentIndex];
    currentItem.userAnswer = this.currentAnswer;
    
    // Vérifier la réponse (en ignorant la casse et les espaces supplémentaires)
    const normalizedUserAnswer = this.currentAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = currentItem.question.fr.trim().toLowerCase();
    
    currentItem.isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
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
