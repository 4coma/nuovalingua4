import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { VocabularyTrackingService, WordMastery } from './vocabulary-tracking.service';
import { SM2AlgorithmService } from './sm2-algorithm.service';
import { WordPair } from './llm.service';

@Injectable({
  providedIn: 'root'
})
export class SpacedRepetitionService {
  
  constructor(
    private vocabularyTrackingService: VocabularyTrackingService,
    private sm2Service: SM2AlgorithmService
  ) { }
  
  /**
   * Génère une session de mémorisation espacée basée sur l'algorithme SM-2
   */
  generateSpacedRepetitionSession(count: number = 10): Observable<WordPair[]> {
    // Récupérer tous les mots suivis
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    
    if (allWords.length === 0) {
      return of([]);
    }
    
    // Trier les mots par priorité SM-2
    const sortedWords = this.sm2Service.sortWordsByPriority(allWords);
    
    // Prendre les mots les plus prioritaires
    const selectedWords = sortedWords.slice(0, count);
    
    // Convertir en format WordPair
    const wordPairs: WordPair[] = selectedWords.map(word => ({
      it: word.word,
      fr: word.translation,
      context: word.context
    }));
    
    return of(wordPairs);
  }
  
  /**
   * Met à jour un mot après une session de mémorisation espacée
   */
  updateWordAfterReview(wordId: string, quality: number): void {
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    const wordIndex = allWords.findIndex(w => w.id === wordId);
    
    if (wordIndex >= 0) {
      const word = allWords[wordIndex];
      const updatedWord = this.sm2Service.calculateNextReview(word, quality);
      
      // Mettre à jour le mot dans la liste
      allWords[wordIndex] = updatedWord;
      
      // Sauvegarder les changements
      this.vocabularyTrackingService.saveAllWords(allWords);
    }
  }
  
  /**
   * Récupère les statistiques de mémorisation espacée
   */
  getSpacedRepetitionStats(): {
    totalWords: number;
    dueForReview: number;
    averageEF: number;
    nextReviewDate: Date | null;
  } {
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    const dueWords = this.sm2Service.getWordsDueForReview(allWords);
    
    const totalEF = allWords.reduce((sum, word) => sum + (word.eFactor ?? 2.5), 0);
    const averageEF = allWords.length > 0 ? totalEF / allWords.length : 2.5;
    
    const nextReview = dueWords.length > 0 
      ? new Date(Math.min(...dueWords.map(w => w.nextReview ?? 0)))
      : null;
    
    return {
      totalWords: allWords.length,
      dueForReview: dueWords.length,
      averageEF: averageEF,
      nextReviewDate: nextReview
    };
  }
} 