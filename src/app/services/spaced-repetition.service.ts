import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { VocabularyTrackingService, WordMastery } from './vocabulary-tracking.service';
import { SM2AlgorithmService } from './sm2-algorithm.service';
import { WordPair } from './llm.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class SpacedRepetitionService {
  
  constructor(
    private vocabularyTrackingService: VocabularyTrackingService,
    private sm2Service: SM2AlgorithmService,
    public storageService: StorageService
  ) { }
  
  /**
   * Génère une session de mémorisation espacée basée sur les mots dûs pour révision
   */
  generateSpacedRepetitionSession(count?: number): Observable<WordPair[]> {
    if (count === undefined) {
      const savedCount = this.storageService.get('spacedRepetitionWordsCount');
      count = savedCount !== null && savedCount !== undefined ? parseInt(savedCount) : 10;
    }

    const allWords = this.vocabularyTrackingService.getAllTrackedWords();

    // Filtrer pour ne garder que les mots du dictionnaire personnel
    const personalDictionaryWords = this.getPersonalDictionaryWords();
    const filteredWords = allWords.filter(word => 
      personalDictionaryWords.some(dictWord => 
        dictWord.sourceWord.toLowerCase() === word.word.toLowerCase() ||
        dictWord.targetWord.toLowerCase() === word.word.toLowerCase() ||
        dictWord.sourceWord.toLowerCase() === word.translation.toLowerCase() ||
        dictWord.targetWord.toLowerCase() === word.translation.toLowerCase()
      )
    );

    // Récupérer les mots dûs pour révision selon l'algorithme SM-2
    const dueWords = this.sm2Service.getWordsDueForReview(filteredWords);
    
    // Si pas assez de mots dûs, ajouter les mots avec le plus faible EF
    let selectedWords = dueWords;
    if (selectedWords.length < count) {
      const remainingWords = filteredWords.filter(word => !dueWords.includes(word));
      const sortedByEF = remainingWords.sort((a, b) => {
        const aEF = a.eFactor ?? 2.5;
        const bEF = b.eFactor ?? 2.5;
        return aEF - bEF;
      });
      
      const additionalWords = sortedByEF.slice(0, count - selectedWords.length);
      selectedWords = [...selectedWords, ...additionalWords];
    }

    // Limiter au nombre demandé
    selectedWords = selectedWords.slice(0, count);

    console.log('🔍 [SpacedRepetition] === MOTS SÉLECTIONNÉS ===');
    console.log(`🔍 [SpacedRepetition] Mots dûs pour révision: ${dueWords.length}`);
    console.log(`🔍 [SpacedRepetition] Total sélectionnés: ${selectedWords.length}`);
    selectedWords.forEach((word, index) => {
      const isDue = this.sm2Service.isDueForReview(word);
      const nextReviewDate = word.nextReview ? new Date(word.nextReview).toLocaleDateString() : 'Non définie';
      console.log(`🔍 [SpacedRepetition] ${index + 1}. "${word.word}" (${word.translation}) - EF: ${word.eFactor?.toFixed(2) || 'N/A'} - Dû: ${isDue} - Prochaine révision: ${nextReviewDate}`);
    });
    console.log('🔍 [SpacedRepetition] === FIN DE LA SÉLECTION ===');

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
    console.log('🔍 [SpacedRepetition] updateWordAfterReview appelé pour:', wordId, 'qualité:', quality);
    
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    const wordIndex = allWords.findIndex(w => w.id === wordId);
    
    if (wordIndex >= 0) {
      const word = allWords[wordIndex];
      console.log('🔍 [SpacedRepetition] Mot trouvé:', word.word, 'EF actuel:', word.eFactor, 'intervalle actuel:', word.interval);
      
      const updatedWord = this.sm2Service.calculateNextReview(word, quality);
      console.log('🔍 [SpacedRepetition] Mot mis à jour - nouveau EF:', updatedWord.eFactor, 'nouvel intervalle:', updatedWord.interval, 'prochaine révision:', updatedWord.nextReview ? new Date(updatedWord.nextReview) : 'non définie');
      
      // Mettre à jour le mot dans la liste
      allWords[wordIndex] = updatedWord;
      
      // Sauvegarder les changements
      this.vocabularyTrackingService.saveAllWords(allWords);
      console.log('🔍 [SpacedRepetition] Mots sauvegardés dans le stockage');
    } else {
      console.error('🔍 [SpacedRepetition] Mot non trouvé avec ID:', wordId);
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
    
    // Filtrer pour ne garder que les mots du dictionnaire personnel
    const personalDictionaryWords = this.getPersonalDictionaryWords();
    const filteredWords = allWords.filter(word => 
      personalDictionaryWords.some(dictWord => 
        dictWord.sourceWord.toLowerCase() === word.word.toLowerCase() ||
        dictWord.targetWord.toLowerCase() === word.word.toLowerCase() ||
        dictWord.sourceWord.toLowerCase() === word.translation.toLowerCase() ||
        dictWord.targetWord.toLowerCase() === word.translation.toLowerCase()
      )
    );
    
    const dueWords = this.sm2Service.getWordsDueForReview(filteredWords);
    
    const totalEF = filteredWords.reduce((sum, word) => sum + (word.eFactor ?? 2.5), 0);
    const averageEF = filteredWords.length > 0 ? totalEF / filteredWords.length : 2.5;
    
    const nextReview = dueWords.length > 0 
      ? new Date(Math.min(...dueWords.map(w => w.nextReview ?? 0)))
      : null;
    
    console.log('🔍 [SpacedRepetition] === STATISTIQUES GLOBALES ===');
    console.log(`🔍 [SpacedRepetition] Total mots (dictionnaire personnel): ${filteredWords.length}`);
    console.log(`🔍 [SpacedRepetition] Mots dûs pour révision: ${dueWords.length}`);
    console.log(`🔍 [SpacedRepetition] EF moyen: ${averageEF.toFixed(2)}`);
    console.log(`🔍 [SpacedRepetition] Prochaine révision: ${nextReview ? nextReview.toLocaleDateString() : 'Aucune'}`);
    console.log('🔍 [SpacedRepetition] === FIN DES STATISTIQUES ===');
    
    return {
      totalWords: filteredWords.length,
      dueForReview: dueWords.length,
      averageEF: averageEF,
      nextReviewDate: nextReview
    };
  }

  /**
   * Récupère les mots du dictionnaire personnel
   */
  private getPersonalDictionaryWords(): any[] {
    try {
      const storedWords = localStorage.getItem('personalDictionary');
      if (storedWords) {
        return JSON.parse(storedWords);
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération du dictionnaire personnel:', error);
      return [];
    }
  }
} 