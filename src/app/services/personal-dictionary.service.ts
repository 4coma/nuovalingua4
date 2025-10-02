import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { VocabularyTrackingService, WordMastery } from './vocabulary-tracking.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';
import { FirebaseSyncService } from './firebase-sync.service';

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
  theme?: string; // Thème/catégorie du mot (ex: "Subjonctif passé", "Articles", etc.)
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
  /**
   * File d'attente pour séquencer les mises à jour de notification et éviter les doublons
   */
  private notificationUpdateQueue: Promise<void> = Promise.resolve();
  
  /**
   * BehaviorSubject pour notifier les changements du dictionnaire en temps réel
   */
  private dictionaryWordsSubject = new BehaviorSubject<DictionaryWord[]>([]);
  public dictionaryWords$ = this.dictionaryWordsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private vocabularyTrackingService: VocabularyTrackingService,
    private notificationService: NotificationService,
    private storageService: StorageService,
    private firebaseSync: FirebaseSyncService
  ) {
    // Initialiser le BehaviorSubject avec les mots existants
    this.initializeDictionarySubject();
    
    // Écouter les changements de statut Firebase
    this.firebaseSync.syncStatus$.subscribe(status => {
      if (status.isConnected && this.firebaseSync.isFirebaseEnabled()) {
        this.syncFromFirebase();
      }
    });
  }

  /**
   * Initialise le BehaviorSubject avec les mots du dictionnaire existants
   */
  private initializeDictionarySubject(): void {
    const words = this.getAllWords();
    this.dictionaryWordsSubject.next(words);
  }

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
    console.log('🔍 [PersonalDictionary] Tentative d\'ajout du mot:', word);
    
    const words = this.getAllWords();
    console.log('🔍 [PersonalDictionary] Mots existants dans le dictionnaire:', words.length);
    
    // Vérifier si le mot existe déjà (même mot dans les mêmes langues)
    const exists = words.some(w => 
      w.sourceWord.toLowerCase() === word.sourceWord.toLowerCase() && 
      w.sourceLang === word.sourceLang &&
      w.targetLang === word.targetLang
    );
    
    console.log('🔍 [PersonalDictionary] Le mot existe déjà?', exists);
    
    if (exists) {
      console.log('🔍 [PersonalDictionary] Mot déjà existant, ajout refusé');
      return false; // Le mot existe déjà
    }
    
    // Générer un ID unique
    word.id = Date.now().toString();
    word.dateAdded = Date.now();
    
    console.log('🔍 [PersonalDictionary] Mot avec ID généré:', word);
    
    // Ajouter le mot et sauvegarder
    words.push(word);
    localStorage.setItem(this.storageKey, JSON.stringify(words));
    
    console.log('🔍 [PersonalDictionary] Mot sauvegardé dans localStorage, total mots:', words.length);
    
    // Émettre la mise à jour via le BehaviorSubject
    this.dictionaryWordsSubject.next(words);
    
    // Ajouter automatiquement le mot au système de tracking SM-2
    this.addWordToSM2Tracking(word);
    
    // Mettre à jour la notification quotidienne avec le nombre de mots ajoutés aujourd'hui
    this.updateDailyNotification();
    
    // Synchroniser avec Firebase si activé
    this.syncToFirebase();
    
    console.log('🔍 [PersonalDictionary] Mot ajouté avec succès');
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
      // Émettre la mise à jour via le BehaviorSubject
      this.dictionaryWordsSubject.next(filteredWords);
      
      // Synchroniser avec Firebase si activé
      this.syncToFirebase();
      
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
      
      // Émettre la mise à jour via le BehaviorSubject
      this.dictionaryWordsSubject.next(words);
      
      console.log('Mot mis à jour avec succès');
      
      // Mettre à jour également le tracking SM-2 si nécessaire
      this.updateWordInSM2Tracking(updatedWord);
      
      // Synchroniser avec Firebase si activé
      this.syncToFirebase();
      
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
   * Obtient les mots à réviser aujourd'hui (algorithme simple basé sur minRevisionDate)
   * Cette méthode est utilisée pour "Réviser mes mots" et ne utilise PAS l'algorithme SM-2
   */
  getWordsToReviewToday(): DictionaryWord[] {
    const allWords = this.getAllWords();
    const currentTimestamp = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    return allWords.filter(word => {
      // Exclure les mots marqués comme connus
      if (word.isKnown) {
        return false;
      }
      
      // Si minRevisionDate n'est pas définie, le mot n'est pas à réviser aujourd'hui
      if (!word.minRevisionDate) {
        return false;
      }
      
      // Le mot est à réviser aujourd'hui si sa minRevisionDate est entre aujourd'hui 00:00 et 23:59
      return word.minRevisionDate >= todayStart.getTime() && word.minRevisionDate <= todayEnd.getTime();
    });
  }

  /**
   * Traduit un mot d'une langue à une autre
   */
  translateWord(word: string, sourceLang: string, targetLang: string): Observable<TranslationResponse> {
    // Vérifier si la clé API est configurée
    const userApiKey = this.storageService.get('userOpenaiApiKey');
    
    if (!userApiKey) {
      this.showErrorToast('Clé API OpenAI non configurée. Veuillez configurer votre clé API dans les préférences.');
      return new Observable(observer => {
        observer.error(new Error('Clé API non configurée'));
      });
    }

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
    
    // Récupérer la clé API utilisateur
    const userApiKey = this.storageService.get('userOpenaiApiKey');
    const apiKeyToUse = userApiKey || this.apiKey;
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${apiKeyToUse}`);
    
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

  /**
   * Compte le nombre de mots ajoutés aujourd'hui
   */
  countWordsAddedToday(): number {
    const words = this.getAllWords();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Définir l'heure à minuit pour compter les mots ajoutés aujourd'hui

    return words.filter(word => {
      const wordDate = new Date(word.dateAdded);
      wordDate.setHours(0, 0, 0, 0); // Définir l'heure à minuit pour compter les mots ajoutés aujourd'hui
      return wordDate >= today;
    }).length;
  }

  /**
   * Met à jour la notification quotidienne avec le nombre de mots ajoutés aujourd'hui
   */
  private updateDailyNotification(): void {
    const wordsAddedToday = this.countWordsAddedToday();
    this.notificationUpdateQueue = this.notificationUpdateQueue
      .then(() =>
        this.notificationService.updateNotificationMessageWithTodayWords(wordsAddedToday)
      )
      .catch(error =>
        console.error('Erreur lors de la mise à jour de la notification quotidienne:', error)
      );
  }

  /**
   * Récupère un mot du dictionnaire par son ID
   */
  getWordById(wordId: string): DictionaryWord | null {
    const allWords = this.getAllWords();
    return allWords.find(word => word.id === wordId) || null;
  }

  /**
   * Récupère les mots suivis (WordMastery) pour un mot du dictionnaire personnel
   */
  getTrackedWordsForDictionaryWord(dictionaryWordId: string): WordMastery[] {
    const allTrackedWords = this.vocabularyTrackingService.getAllTrackedWords();
    const dictionaryWord = this.getWordById(dictionaryWordId);
    
    if (!dictionaryWord) {
      return [];
    }
    
    // Chercher les mots suivis qui correspondent à ce mot du dictionnaire
    return allTrackedWords.filter(trackedWord => {
      const trackedWordText = trackedWord.word.toLowerCase();
      const trackedTranslation = trackedWord.translation.toLowerCase();
      const dictSourceWord = dictionaryWord.sourceWord.toLowerCase();
      const dictTargetWord = dictionaryWord.targetWord.toLowerCase();
      
      return (trackedWordText === dictSourceWord && trackedTranslation === dictTargetWord) ||
             (trackedWordText === dictTargetWord && trackedTranslation === dictSourceWord);
    });
  }

  /**
   * Réinitialise la notification au message par défaut (appelé au début de chaque jour)
   */
  resetDailyNotification(): void {
    this.notificationUpdateQueue = this.notificationUpdateQueue
      .then(() => this.notificationService.resetNotificationMessage())
      .catch(error =>
        console.error('Erreur lors de la réinitialisation de la notification quotidienne:', error)
      );
  }

  /**
   * Ajoute plusieurs mots au dictionnaire personnel en une seule fois
   * Utile pour ajouter automatiquement les mots générés par l'IA
   */
  addMultipleWords(words: DictionaryWord[]): { added: number; duplicates: number } {
    const existingWords = this.getAllWords();
    let addedCount = 0;
    let duplicatesCount = 0;
    
    const newWords = [...existingWords];
    
    words.forEach(word => {
      // Vérifier si le mot existe déjà
      const exists = existingWords.some(w => 
        w.sourceWord.toLowerCase() === word.sourceWord.toLowerCase() && 
        w.sourceLang === word.sourceLang &&
        w.targetLang === word.targetLang
      );
      
      if (!exists) {
        // Générer un ID unique
        word.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        word.dateAdded = Date.now();
        
        newWords.push(word);
        addedCount++;
        
        // Ajouter automatiquement au système de tracking SM-2
        this.addWordToSM2Tracking(word);
      } else {
        duplicatesCount++;
      }
    });
    
    // Sauvegarder tous les nouveaux mots
    if (addedCount > 0) {
      localStorage.setItem(this.storageKey, JSON.stringify(newWords));
      
      // Émettre la mise à jour via le BehaviorSubject
      this.dictionaryWordsSubject.next(newWords);
      
      // Mettre à jour la notification quotidienne
      this.updateDailyNotification();
      
      // Synchroniser avec Firebase si activé
      this.syncToFirebase();
    }
    
    console.log(`Mots ajoutés: ${addedCount}, Doublons ignorés: ${duplicatesCount}`);
    
    return { added: addedCount, duplicates: duplicatesCount };
  }

  /**
   * Synchronise le dictionnaire avec Firebase
   */
  private async syncToFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled()) {
      return;
    }

    try {
      const words = this.getAllWords();
      await this.firebaseSync.syncPersonalDictionary(words);
      console.log('🔍 [PersonalDictionary] Synchronisation vers Firebase réussie');
    } catch (error) {
      console.error('🔍 [PersonalDictionary] Erreur de synchronisation vers Firebase:', error);
    }
  }

  /**
   * Récupère le dictionnaire depuis Firebase
   */
  private async syncFromFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled()) {
      return;
    }

    try {
      const firebaseWords = await this.firebaseSync.getPersonalDictionary();
      if (firebaseWords.length > 0) {
        // Fusionner avec les mots locaux
        const localWords = this.getAllWords();
        const mergedWords = this.mergeWords(localWords, firebaseWords);
        
        // Sauvegarder localement
        localStorage.setItem(this.storageKey, JSON.stringify(mergedWords));
        this.dictionaryWordsSubject.next(mergedWords);
        
        console.log('🔍 [PersonalDictionary] Synchronisation depuis Firebase réussie:', mergedWords.length, 'mots');
      }
    } catch (error) {
      console.error('🔍 [PersonalDictionary] Erreur de synchronisation depuis Firebase:', error);
    }
  }

  /**
   * Fusionne les mots locaux et Firebase
   */
  private mergeWords(localWords: DictionaryWord[], firebaseWords: DictionaryWord[]): DictionaryWord[] {
    const merged = [...localWords];
    
    firebaseWords.forEach(firebaseWord => {
      const exists = merged.some(localWord => localWord.id === firebaseWord.id);
      if (!exists) {
        merged.push(firebaseWord);
      } else {
        // Mettre à jour le mot existant avec les données Firebase si plus récent
        const index = merged.findIndex(localWord => localWord.id === firebaseWord.id);
        if (index !== -1) {
          // Ici on pourrait comparer les timestamps pour décider quelle version garder
          merged[index] = firebaseWord;
        }
      }
    });
    
    return merged;
  }

  /**
   * Force une synchronisation complète avec Firebase
   */
  async forceSyncWithFirebase(): Promise<void> {
    if (!this.firebaseSync.isFirebaseEnabled()) {
      throw new Error('Firebase n\'est pas activé');
    }

    try {
      // Synchroniser vers Firebase
      await this.syncToFirebase();
      
      // Récupérer depuis Firebase
      await this.syncFromFirebase();
      
      console.log('🔍 [PersonalDictionary] Synchronisation complète réussie');
    } catch (error) {
      console.error('🔍 [PersonalDictionary] Erreur de synchronisation complète:', error);
      throw error;
    }
  }
}
