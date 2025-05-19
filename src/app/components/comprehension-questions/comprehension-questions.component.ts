import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComprehensionText, ComprehensionQuestion, EvaluationResult } from '../../models/vocabulary';
import { TextGeneratorService } from '../../services/text-generator.service';

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

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private textGeneratorService: TextGeneratorService
  ) { }

  ngOnInit() {
    this.loadComprehensionData();
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
        },
        error: (error) => {
          console.error('Erreur lors de l\'évaluation des réponses:', error);
          this.isSubmitting = false;
          alert('Erreur lors de l\'évaluation des réponses. Veuillez réessayer.');
        }
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