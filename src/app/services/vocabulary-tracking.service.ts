import { Injectable } from '@angular/core';
import { StorageService } from '../services/storage.service';

export interface WordMastery {
  id: string;
  word: string;
  translation: string;
  category: string;
  topic: string;
  lastReviewed: number; // timestamp
  masteryLevel: number; // 0-100
  timesReviewed: number;
  timesCorrect: number;
  context?: string;
  
  // Propriétés SM-2 (optionnelles pour compatibilité avec les données existantes)
  eFactor?: number;        // Facteur d'efficacité (défaut: 2.5)
  interval?: number;       // Intervalle en jours (défaut: 0)
  repetitions?: number;    // Nombre de révisions consécutives réussies
  nextReview?: number;     // Timestamp de la prochaine révision
}

@Injectable({
  providedIn: 'root'
})
export class VocabularyTrackingService {
  private readonly STORAGE_KEY = 'vocabulary_mastery';
  private readonly MAX_TRACKED_WORDS = 100;
  
  constructor(private storageService: StorageService) { }
  
  /**
   * Récupère tous les mots suivis
   */
  getAllTrackedWords(): WordMastery[] {
    try {
      const storedWords = this.storageService.get(this.STORAGE_KEY) || [];
      return storedWords;
    } catch (error) {
      console.error('Erreur lors de la récupération des mots suivis:', error);
      return [];
    }
  }
  
  /**
   * Récupère les mots suivis filtrés par catégorie et sujet
   */
  getTrackedWordsByCategory(category: string, topic: string): WordMastery[] {
    try {
      const allWords = this.getAllTrackedWords();
      return allWords.filter(word => 
        word.category === category && 
        (topic ? word.topic === topic : true)
      );
    } catch (error) {
      console.error('Erreur lors du filtrage des mots suivis:', error);
      return [];
    }
  }
  
  /**
   * Ajoute ou met à jour un mot après une session
   */
  trackWord(word: string, translation: string, category: string, topic: string, 
            isCorrect: boolean, context?: string): void {
    try {
      if (!word || !translation || !category) {
        console.warn('Données incomplètes pour le suivi de mot');
        return;
      }
      
      const allWords = this.getAllTrackedWords();
      
      // Générer un ID unique pour le mot
      const wordId = this.generateWordId(word, translation);
      
      // Vérifier si le mot existe déjà
      const existingWordIndex = allWords.findIndex(w => w.id === wordId);
      
      if (existingWordIndex >= 0) {
        // Mettre à jour le mot existant
        const existingWord = allWords[existingWordIndex];
        existingWord.lastReviewed = Date.now();
        existingWord.timesReviewed++;
        
        if (isCorrect) {
          existingWord.timesCorrect++;
        }
        
        // Calculer le nouveau niveau de maîtrise (simple pour l'instant)
        existingWord.masteryLevel = Math.round((existingWord.timesCorrect / existingWord.timesReviewed) * 100);
        
        allWords[existingWordIndex] = existingWord;
      } else {
        // Ajouter un nouveau mot
        const newWord: WordMastery = {
          id: wordId,
          word,
          translation,
          category,
          topic,
          lastReviewed: Date.now(),
          masteryLevel: isCorrect ? 100 : 0,
          timesReviewed: 1,
          timesCorrect: isCorrect ? 1 : 0,
          context
        };
        
        allWords.push(newWord);
      }
      
      // Trier par date de révision (du plus récent au plus ancien)
      allWords.sort((a, b) => b.lastReviewed - a.lastReviewed);
      
      // Limiter à MAX_TRACKED_WORDS
      const limitedWords = allWords.slice(0, this.MAX_TRACKED_WORDS);
      
      // Sauvegarder dans le stockage
      this.storageService.set(this.STORAGE_KEY, limitedWords);
    } catch (error) {
      console.error('Erreur lors du suivi d\'un mot:', error);
    }
  }
  
  /**
   * Génère un ID unique pour un mot basé sur le mot et sa traduction
   */
  generateWordId(word: string, translation: string): string {
    try {
      return `${word.toLowerCase()}_${translation.toLowerCase()}`;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'ID:', error);
      return `${Date.now()}`;
    }
  }
  
  /**
   * Sauvegarde tous les mots (utilisé pour les mises à jour SM-2)
   */
  saveAllWords(words: WordMastery[]): void {
    try {
      console.log('🔍 [VocabularyTracking] saveAllWords appelé avec', words.length, 'mots');
      
      // Trier par date de révision (du plus récent au plus ancien)
      words.sort((a, b) => b.lastReviewed - a.lastReviewed);
      
      // Limiter à MAX_TRACKED_WORDS
      const limitedWords = words.slice(0, this.MAX_TRACKED_WORDS);
      
      // Sauvegarder dans le stockage
      this.storageService.set(this.STORAGE_KEY, limitedWords);
      console.log('🔍 [VocabularyTracking] Mots sauvegardés dans le stockage');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des mots:', error);
    }
  }
} 