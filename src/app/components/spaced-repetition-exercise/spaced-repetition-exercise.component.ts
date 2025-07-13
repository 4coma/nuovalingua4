import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WordPair } from '../../services/llm.service';
import { SpacedRepetitionService } from '../../services/spaced-repetition.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';

interface QualityOption {
  value: number;
  label: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-spaced-repetition-exercise',
  templateUrl: './spaced-repetition-exercise.component.html',
  styleUrls: ['./spaced-repetition-exercise.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class SpacedRepetitionExerciseComponent implements OnInit {
  pageTitle: string = 'Mémorisation espacée';
  
  wordPairs: WordPair[] = [];
  currentIndex = 0;
  exerciseCompleted = false;
  
  // Pour l'évaluation de qualité
  showQualityOptions = false;
  currentWordId: string = '';
  
  qualityOptions: QualityOption[] = [
    { value: 0, label: 'Incorrect', description: 'Je ne connaissais pas du tout', color: 'danger' },
    { value: 1, label: 'Très difficile', description: 'J\'ai eu beaucoup de mal', color: 'warning' },
    { value: 2, label: 'Difficile', description: 'J\'ai eu du mal', color: 'medium' },
    { value: 3, label: 'Correct', description: 'J\'ai réussi', color: 'success' },
    { value: 4, label: 'Facile', description: 'C\'était facile', color: 'primary' },
    { value: 5, label: 'Excellent', description: 'C\'était très facile', color: 'tertiary' }
  ];
  
  // Statistiques
  stats = {
    totalWords: 0,
    dueForReview: 0,
    averageEF: 2.5,
    nextReviewDate: null as Date | null
  };
  
  constructor(
    private router: Router,
    private spacedRepetitionService: SpacedRepetitionService,
    private vocabularyTrackingService: VocabularyTrackingService,
    private toastController: ToastController
  ) { }
  
  ngOnInit() {
    this.loadSession();
    this.loadStats();
  }
  
  /**
   * Charge la session de mémorisation espacée
   */
  loadSession() {
    this.spacedRepetitionService.generateSpacedRepetitionSession(10).subscribe({
      next: (wordPairs) => {
        this.wordPairs = wordPairs;
        if (wordPairs.length === 0) {
          this.showToast('Aucun mot à réviser pour le moment. Continuez à utiliser l\'application pour accumuler du vocabulaire !');
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la session:', error);
        this.showToast('Erreur lors du chargement de la session');
        this.router.navigate(['/home']);
      }
    });
  }
  
  /**
   * Charge les statistiques de mémorisation espacée
   */
  loadStats() {
    this.stats = this.spacedRepetitionService.getSpacedRepetitionStats();
  }
  
  /**
   * Évalue la qualité de la réponse pour le mot actuel
   */
  evaluateQuality(quality: number) {
    if (this.currentIndex >= this.wordPairs.length) return;
    
    const currentPair = this.wordPairs[this.currentIndex];
    const wordId = this.vocabularyTrackingService.generateWordId(currentPair.it, currentPair.fr);
    
    // Mettre à jour le mot avec l'algorithme SM-2
    this.spacedRepetitionService.updateWordAfterReview(wordId, quality);
    
    // Passer au mot suivant
    this.currentIndex++;
    
    // Vérifier si l'exercice est terminé
    if (this.currentIndex >= this.wordPairs.length) {
      this.exerciseCompleted = true;
      this.showToast('Session terminée ! Vos mots ont été mis à jour selon l\'algorithme de mémorisation espacée.');
    }
    
    this.showQualityOptions = false;
  }
  
  /**
   * Affiche les options de qualité pour le mot actuel
   */
  showQualityEvaluation() {
    if (this.currentIndex >= this.wordPairs.length) return;
    
    const currentPair = this.wordPairs[this.currentIndex];
    this.currentWordId = this.vocabularyTrackingService.generateWordId(currentPair.it, currentPair.fr);
    this.showQualityOptions = true;
  }
  
  /**
   * Termine l'exercice et retourne à l'accueil
   */
  finishExercise() {
    this.router.navigate(['/home']);
  }
  
  /**
   * Affiche un toast
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
} 