import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComprehensionText, ComprehensionQuestion, EvaluationResult } from '../../models/vocabulary';
import { TextGeneratorService } from '../../services/text-generator.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';

@Component({
  selector: 'app-comprehension-questions',
  templateUrl: './comprehension-questions.component.html',
  styleUrls: ['./comprehension-questions.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterLink
  ]
})
export class ComprehensionQuestionsComponent implements OnInit {
  // Titre de la page pour le header global
  pageTitle: string = 'Questions de compréhension';
  
  comprehensionText: ComprehensionText | null = null;
  questions: ComprehensionQuestion[] = [];
  isSubmitting: boolean = false;
  evaluationResult: EvaluationResult | null = null;
  showResult: boolean = false;
  
  // Pour le suivi de la session
  sessionInfo: { category: string, topic: string, date: string } | null = null;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private textGeneratorService: TextGeneratorService,
    private vocabularyTrackingService: VocabularyTrackingService
  ) { }

  ngOnInit() {
    this.loadComprehensionData();
    this.loadSessionInfo();
  }

  /**
   * Charge les données de compréhension du localStorage
   */
  loadComprehensionData() {
    const storedText = localStorage.getItem('comprehensionText');
    if (storedText) {
      try {
        this.comprehensionText = JSON.parse(storedText);
        
        // Si des questions existent, les utiliser
        if (this.comprehensionText?.questions && this.comprehensionText.questions.length > 0) {
          this.questions = this.comprehensionText.questions.map(q => ({ 
            ...q, 
            userAnswer: '' 
          }));
        } else {
          // Si pas de questions, rediriger
          this.router.navigate(['/comprehension']);
        }
      } catch (e) {
        console.error('Erreur lors du parsing du texte de compréhension:', e);
        this.router.navigate(['/comprehension']);
      }
    } else {
      // Si pas de texte, rediriger
      this.router.navigate(['/comprehension']);
    }
  }
  
  /**
   * Charge les informations sur la session depuis le localStorage
   */
  loadSessionInfo() {
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    if (sessionInfoJson) {
      try {
        this.sessionInfo = JSON.parse(sessionInfoJson);
      } catch (e) {
        console.error('Erreur lors du parsing des infos de session:', e);
      }
    }
  }

  /**
   * Soumet les réponses pour évaluation
   */
  submitAnswers() {
    if (!this.comprehensionText?.text) return;
    
    this.isSubmitting = true;
    
    // Mise à jour des réponses dans les questions
    this.questions.forEach(q => {
      if (!q.userAnswer) q.userAnswer = ''; // S'assurer qu'il n'y a pas de undefined
    });
    
    // Envoyer à l'API pour évaluation
    this.textGeneratorService.evaluateUserAnswers(this.comprehensionText.text, this.questions)
      .subscribe({
        next: (result) => {
          this.evaluationResult = result;
          this.isSubmitting = false;
          this.showResult = true;
          
          // Sauvegarder l'évaluation dans le localStorage
          localStorage.setItem('evaluationResult', JSON.stringify(result));
          
          // Suivre la performance sur les mots de vocabulaire
          this.trackVocabularyPerformance(result);
        },
        error: (error) => {
          console.error('Erreur lors de l\'évaluation des réponses:', error);
          this.isSubmitting = false;
          alert('Erreur lors de l\'évaluation des réponses. Veuillez réessayer.');
        }
      });
  }
  
  /**
   * Suit la performance sur les mots de vocabulaire mentionnés dans les questions et réponses
   */
  private trackVocabularyPerformance(result: EvaluationResult) {
    if (!this.comprehensionText?.vocabularyItems || !this.sessionInfo) return;
    
    const vocabularyWords = this.comprehensionText.vocabularyItems;
    
    // Pour chaque feedback de question
    result.feedback.forEach(feedback => {
      const isCorrect = feedback.isCorrect;
      
      // Vérifier si des mots du vocabulaire sont mentionnés dans la question ou la réponse
      vocabularyWords.forEach(vocabItem => {
        // Si le mot est présent dans la question ou la réponse
        const wordInQuestion = feedback.question.toLowerCase().includes(vocabItem.word.toLowerCase());
        const wordInUserAnswer = feedback.userAnswer.toLowerCase().includes(vocabItem.word.toLowerCase());
        const wordInCorrectAnswer = feedback.correctAnswer?.toLowerCase().includes(vocabItem.word.toLowerCase());
        
        if (wordInQuestion || wordInUserAnswer || wordInCorrectAnswer) {
          // Suivre l'utilisation de ce mot dans la question
          this.vocabularyTrackingService.trackWord(
            vocabItem.word,
            vocabItem.translation,
            this.sessionInfo!.category,
            this.sessionInfo!.topic,
            isCorrect, // La réponse correcte indique une bonne maîtrise
            vocabItem.context
          );
        }
      });
    });
  }

  /**
   * Retourne à la page de compréhension
   */
  goBackToComprehension() {
    this.navCtrl.back();
  }

  /**
   * Retourne à la sélection de catégorie
   */
  goToCategories() {
    this.router.navigate(['/category']);
  }
} 