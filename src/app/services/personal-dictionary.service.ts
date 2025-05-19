import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoadingController, ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';

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
    private toastCtrl: ToastController
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
} 