import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { VocabularyTrackingService, WordMastery } from './vocabulary-tracking.service';

export interface DictionaryWord {
  id: string;
  sourceWord: string;
  sourceLang: string;
  targetWord: string;
  targetLang: string;
  contextualMeaning?: string;
  partOfSpeech?: string;
  examples?: string[];
  dateAdded: number;
  minRevisionDate?: number; // Timestamp de la date minimum pour la révision (undefined = pas de restriction)
  isKnown?: boolean; // Si le mot est marqué comme connu
  revisionDelay?: string; // Délai de révision sélectionné ('1j', '3j', '7j', '15j', '1m', '3m', '6m')
}

export interface TranslationResponse {
  sourceWord: string;
  sourceLang: string;
  targetWord: string;
  targetLang: string;
  contextualMeaning?: string;
  partOfSpeech?: string;
  examples?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PersonalDictionaryService {
  private storageKey = 'personalDictionary';
  private apiUrl = environment.openaiApiUrl;
  private apiKey = environment.openaiApiKey;
  private model = environment.openaiModel;
  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private vocabularyTrackingService: VocabularyTrackingService
  ) {}

  /**
   * Récupère tous les mots du dictionnaire personnel
   */
  getAllWords(): DictionaryWord[] {
    const storedWords = localStorage.getItem(this.storageKey);
    if (storedWords) {
      try {
        return JSON.parse(storedWords);
      } catch (e) {
        console.error('Erreur lors de la récupération du dictionnaire:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * Ajoute un mot au dictionnaire personnel
   */
  addWord(word: DictionaryWord): boolean {
    const words = this.getAllWords();
    
    // Vérifier si le mot existe déjà (même mot dans les mêmes langues)
    const exists = words.some(w => 
      w.sourceWord.toLowerCase() === word.sourceWord.toLowerCase() && 
      w.sourceLang === word.sourceLang &&
      w.targetLang === word.targetLang
    );
    
    if (exists) {
      return false; // Le mot existe déjà
    }
    
    // Générer un ID unique
    word.id = Date.now().toString();
    word.dateAdded = Date.now();
    
    // Ajouter le mot et sauvegarder
    words.push(word);
    localStorage.setItem(this.storageKey, JSON.stringify(words));
    
    // Ajouter automatiquement le mot au système de tracking SM-2
    this.addWordToSM2Tracking(word);
    
    return true;
  }

  /**
   * Supprime un mot du dictionnaire personnel
   */
  removeWord(wordId: string): boolean {
    const words = this.getAllWords();
    const filteredWords = words.filter(w => w.id !== wordId);
    
    if (filteredWords.length < words.length) {
      localStorage.setItem(this.storageKey, JSON.stringify(filteredWords));
      return true;
    }
    
    return false; // Mot non trouvé
  }

  /**
   * Met à jour un mot du dictionnaire personnel
   */
  updateWord(updatedWord: DictionaryWord): boolean {
    console.log('Tentative de mise à jour du mot:', updatedWord);
    const words = this.getAllWords();
    const wordIndex = words.findIndex(w => w.id === updatedWord.id);
    
    console.log('Index du mot trouvé:', wordIndex);
    
    if (wordIndex !== -1) {
      // Préserver la date d'ajout originale
      updatedWord.dateAdded = words[wordIndex].dateAdded;
      
      // Mettre à jour le mot
      words[wordIndex] = updatedWord;
      
      // Sauvegarder dans le localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(words));
      
      console.log('Mot mis à jour avec succès');
      
      // Mettre à jour également le tracking SM-2 si nécessaire
      this.updateWordInSM2Tracking(updatedWord);
      
      return true;
    }
    
    console.log('Mot non trouvé pour la mise à jour');
    return false; // Mot non trouvé
  }

  /**
   * Définit la date minimum de révision pour un mot
   */
  setMinRevisionDate(wordId: string, minRevisionDate: number | undefined): boolean {
    const words = this.getAllWords();
    const wordIndex = words.findIndex(w => w.id === wordId);
    
    if (wordIndex !== -1) {
      words[wordIndex].minRevisionDate = minRevisionDate;
      localStorage.setItem(this.storageKey, JSON.stringify(words));
      console.log('Date minimum de révision mise à jour pour le mot:', words[wordIndex].sourceWord);
      return true;
    }
    
    console.log('Mot non trouvé pour la mise à jour de la date de révision');
    return false;
  }

  /**
   * Marque un mot comme connu ou non connu
   */
  setWordKnownStatus(wordId: string, isKnown: boolean): boolean {
    const words = this.getAllWords();
    const wordIndex = words.findIndex(w => w.id === wordId);
    
    if (wordIndex !== -1) {
      words[wordIndex].isKnown = isKnown;
      localStorage.setItem(this.storageKey, JSON.stringify(words));
      console.log(`Statut 'connu' mis à jour pour ${words[wordIndex].sourceWord}: ${isKnown}`);
      return true;
    }
    
    console.log('Mot non trouvé pour la mise à jour du statut connu');
    return false;
  }

  /**
   * Obtient les mots disponibles pour la révision (filtrés par minRevisionDate et isKnown)
   */
  getAvailableWordsForRevision(): DictionaryWord[] {
    const allWords = this.getAllWords();
    const currentTimestamp = Date.now();
    
    return allWords.filter(word => {
      // Exclure les mots marqués comme connus
      if (word.isKnown) {
        return false;
      }
      
      // Si minRevisionDate n'est pas définie, le mot est disponible
      if (!word.minRevisionDate) {
        return true;
      }
      // Si la date actuelle est supérieure ou égale à minRevisionDate, le mot est disponible
      return currentTimestamp >= word.minRevisionDate;
    });
  }

  /**
   * Traduit un mot d'une langue à une autre
   */
  translateWord(word: string, sourceLang: string, targetLang: string): Observable<TranslationResponse> {
    return this.callOpenAI<TranslationResponse>(
      this.createTranslationPrompt(word, sourceLang, targetLang)
    );
  }

  /**
   * Crée le prompt pour traduire un mot
   */
  private createTranslationPrompt(word: string, sourceLang: string, targetLang: string): string {
    // Mapper les codes de langue aux noms complets pour le prompt
    const langNames: {[key: string]: string} = {
      'fr': 'français',
      'it': 'italien',
      'en': 'anglais',
      'es': 'espagnol',
      'de': 'allemand'
    };

    const sourceLangName = langNames[sourceLang] || sourceLang;
    const targetLangName = langNames[targetLang] || targetLang;

    return `
      Tu es un assistant linguistique spécialisé en traduction.
      
      Je souhaite obtenir la traduction du mot en ${sourceLangName} "${word}" vers le ${targetLangName}.
      
      Retourne uniquement un objet JSON avec la structure suivante:
      {
        "sourceWord": "${word}",
        "sourceLang": "${sourceLang}",
        "targetWord": "la traduction exacte en ${targetLangName}",
        "targetLang": "${targetLang}",
        "contextualMeaning": "explication brève en français du sens du mot",
        "partOfSpeech": "catégorie grammaticale (nom, verbe, adjectif, etc.)",
        "examples": ["1-2 exemples de phrases avec traduction"]
      }
      
      Assure-toi que la traduction est précise et que les exemples sont utiles pour comprendre l'usage du mot.
    `;
  }

  /**
   * Appel à l'API OpenAI
   */
  private callOpenAI<T>(prompt: string): Observable<T> {
    this.showLoading('Traduction en cours...');
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.apiKey}`);
    
    const data = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant linguistique spécialisé en traduction. Tu réponds au format JSON lorsqu\'on te le demande.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3 // Température plus basse pour des traductions plus cohérentes
    };
    
    return this.http.post<any>(this.apiUrl, data, { headers }).pipe(
      map(response => {
        this.hideLoading();
        const content = response.choices[0].message.content.trim();
        try {
          // Essayer de parser la réponse JSON
          return JSON.parse(content) as T;
        } catch (e) {
          // Si pas un JSON valide, essayer d'extraire le JSON du texte
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as T;
          }
          throw new Error('Format de réponse invalide');
        }
      }),
      catchError(error => {
        this.hideLoading();
        this.showErrorToast('Erreur lors de la traduction');
        console.error('OpenAI API error:', error);
        throw error;
      })
    );
  }

  /**
   * Affiche un indicateur de chargement
   */
  private async showLoading(message: string): Promise<void> {
    this.loading = await this.loadingCtrl.create({
      message: message,
      spinner: 'crescent'
    });
    await this.loading.present();
  }
  
  /**
   * Cache l'indicateur de chargement
   */
  private hideLoading(): void {
    if (this.loading) {
      this.loadingCtrl.getTop().then(loader => {
        if (loader) {
          loader.dismiss();
          this.loading = null;
        }
      });
    }
  }
  
  /**
   * Affiche un message d'erreur
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  /**
   * Obtient les mots à utiliser pour l'exercice de vocabulaire personnel
   * Retourne un sous-ensemble aléatoire de mots (par défaut 10)
   */
  getWordsForExercise(count: number = 10): DictionaryWord[] {
    const allWords = this.getAllWords();
    
    // Si moins de mots que demandés, retourner tous les mots
    if (allWords.length <= count) {
      return allWords;
    }
    
    // Sinon, sélectionner aléatoirement
    const shuffled = [...allWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Ajoute automatiquement un mot du dictionnaire personnel au système de tracking SM-2
   */
  private addWordToSM2Tracking(dictionaryWord: DictionaryWord): void {
    try {
      // Déterminer quelle est la langue source et cible pour le tracking
      const isItalianToFrench = dictionaryWord.sourceLang === 'it' && dictionaryWord.targetLang === 'fr';
      const isFrenchToItalian = dictionaryWord.sourceLang === 'fr' && dictionaryWord.targetLang === 'it';
      
      if (!isItalianToFrench && !isFrenchToItalian) {
        console.warn('Langues non supportées pour le tracking SM-2:', dictionaryWord.sourceLang, dictionaryWord.targetLang);
        return;
      }
      
      // Créer un WordMastery avec les propriétés SM-2 par défaut
      const wordMastery: WordMastery = {
        id: this.vocabularyTrackingService.generateWordId(
          isItalianToFrench ? dictionaryWord.sourceWord : dictionaryWord.targetWord,
          isItalianToFrench ? dictionaryWord.targetWord : dictionaryWord.sourceWord
        ),
        word: isItalianToFrench ? dictionaryWord.sourceWord : dictionaryWord.targetWord,
        translation: isItalianToFrench ? dictionaryWord.targetWord : dictionaryWord.sourceWord,
        category: 'vocabulary',
        topic: 'Personnel',
        lastReviewed: Date.now(),
        masteryLevel: 0, // Nouveau mot, pas encore maîtrisé
        timesReviewed: 0,
        timesCorrect: 0,
        context: dictionaryWord.contextualMeaning,
        
        // Propriétés SM-2 par défaut pour un nouveau mot
        eFactor: 2.5,        // Facteur d'efficacité par défaut
        interval: 0,          // Premier intervalle (révision immédiate)
        repetitions: 0,       // Pas encore de répétitions
        nextReview: Date.now() // Dû immédiatement
      };
      
      // Ajouter au système de tracking
      const allWords = this.vocabularyTrackingService.getAllTrackedWords();
      const existingIndex = allWords.findIndex(w => w.id === wordMastery.id);
      
      if (existingIndex >= 0) {
        // Le mot existe déjà, ne pas le remplacer
        console.log('Mot déjà présent dans le tracking SM-2:', wordMastery.word);
        return;
      }
      
      // Ajouter le nouveau mot
      allWords.push(wordMastery);
      this.vocabularyTrackingService.saveAllWords(allWords);
      
      console.log('Mot ajouté au tracking SM-2:', wordMastery.word);
    } catch (error) {
      console.error('Erreur lors de l\'ajout au tracking SM-2:', error);
    }
  }

  /**
   * Met à jour le tracking SM-2 pour un mot existant
   */
  private updateWordInSM2Tracking(updatedWord: DictionaryWord): void {
    try {
      const isItalianToFrench = updatedWord.sourceLang === 'it' && updatedWord.targetLang === 'fr';
      const isFrenchToItalian = updatedWord.sourceLang === 'fr' && updatedWord.targetLang === 'it';

      if (!isItalianToFrench && !isFrenchToItalian) {
        console.warn('Langues non supportées pour le tracking SM-2:', updatedWord.sourceLang, updatedWord.targetLang);
        return;
      }

      const wordToUpdate = isItalianToFrench ? updatedWord.sourceWord : updatedWord.targetWord;
      const translationToUpdate = isItalianToFrench ? updatedWord.targetWord : updatedWord.sourceWord;

      const allWords = this.vocabularyTrackingService.getAllTrackedWords();
      const existingIndex = allWords.findIndex(w => w.word === wordToUpdate);

      if (existingIndex >= 0) {
        allWords[existingIndex] = {
          ...allWords[existingIndex],
          word: wordToUpdate,
          translation: translationToUpdate,
          context: updatedWord.contextualMeaning,
          lastReviewed: Date.now(),
          timesReviewed: allWords[existingIndex].timesReviewed + 1,
          timesCorrect: allWords[existingIndex].timesCorrect + (updatedWord.contextualMeaning ? 1 : 0) // Incrémenter si le mot a une signification contextuelle
        };
        this.vocabularyTrackingService.saveAllWords(allWords);
        console.log('Mot mis à jour dans le tracking SM-2:', wordToUpdate);
      } else {
        console.warn('Mot non trouvé dans le tracking SM-2 pour la mise à jour:', wordToUpdate);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tracking SM-2:', error);
    }
  }
} 