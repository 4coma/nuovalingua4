import { Injectable } from '@angular/core';
import { WordMastery } from './vocabulary-tracking.service';

export interface SM2Response {
  quality: number; // 0-5 (0=incorrect, 5=excellent)
}

@Injectable({
  providedIn: 'root'
})
export class SM2AlgorithmService {
  
  /**
   * Calcule la prochaine révision selon l'algorithme SM-2
   */
  calculateNextReview(word: WordMastery, quality: number): WordMastery {
    const updatedWord = { ...word };
    
    // Initialiser les propriétés SM-2 si elles n'existent pas
    const currentEF = word.eFactor ?? 2.5;
    const currentInterval = word.interval ?? 0;
    const currentRepetitions = word.repetitions ?? 0;
    
    // Calculer le nouveau facteur d'efficacité
    updatedWord.eFactor = this.calculateEFactor(currentEF, quality);
    
    // Calculer le nouvel intervalle
    updatedWord.interval = this.calculateInterval({ ...word, interval: currentInterval, repetitions: currentRepetitions }, quality);
    
    // Mettre à jour les répétitions
    if (quality >= 3) {
      updatedWord.repetitions = currentRepetitions + 1;
    } else {
      updatedWord.repetitions = 0;
    }
    
    // Calculer la prochaine révision
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + updatedWord.interval);
    updatedWord.nextReview = nextReviewDate.getTime();
    
    return updatedWord;
  }
  
  /**
   * Calcule le nouveau facteur d'efficacité selon la qualité de la réponse
   */
  private calculateEFactor(currentEF: number, quality: number): number {
    let newEF = currentEF;
    
    if (quality >= 4) {
      newEF += 0.1;
    } else if (quality === 3) {
      newEF += 0.05;
    } else if (quality === 2) {
      newEF -= 0.15;
    } else {
      newEF -= 0.2;
    }
    
    return Math.max(1.3, newEF); // Minimum EF = 1.3
  }
  
  /**
   * Calcule le nouvel intervalle selon l'algorithme SM-2
   */
  private calculateInterval(word: WordMastery, quality: number): number {
    if (quality < 3) {
      return 1; // Révision le lendemain
    }
    
    const repetitions = word.repetitions ?? 0;
    const interval = word.interval ?? 0;
    const eFactor = word.eFactor ?? 2.5;
    
    if (repetitions === 0) {
      return 1;
    } else if (repetitions === 1) {
      return 6;
    } else {
      return Math.round(interval * eFactor);
    }
  }
  
  /**
   * Vérifie si un mot est dû pour révision
   */
  isDueForReview(word: WordMastery): boolean {
    // Si pas de nextReview, considérer comme dû
    if (!word.nextReview) return true;
    return Date.now() >= word.nextReview;
  }
  
  /**
   * Récupère tous les mots dûs pour révision
   */
  getWordsDueForReview(words: WordMastery[]): WordMastery[] {
    return words.filter(word => this.isDueForReview(word));
  }
  
  /**
   * Trie les mots par priorité de révision (plus dûs en premier)
   */
  sortWordsByPriority(words: WordMastery[]): WordMastery[] {
    return words.sort((a, b) => {
      // Priorité 1: Mots dûs pour révision
      const aDue = this.isDueForReview(a);
      const bDue = this.isDueForReview(b);
      
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      
      // Priorité 2: Parmi les mots dûs, trier par facteur d'efficacité (plus faible en premier)
      if (aDue && bDue) {
        const aEF = a.eFactor ?? 2.5;
        const bEF = b.eFactor ?? 2.5;
        return aEF - bEF;
      }
      
      // Priorité 3: Parmi les mots non dûs, trier par date de prochaine révision
      const aNext = a.nextReview ?? 0;
      const bNext = b.nextReview ?? 0;
      return aNext - bNext;
    });
  }
} 