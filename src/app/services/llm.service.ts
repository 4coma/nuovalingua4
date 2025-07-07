import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { VocabularyExercise, ComprehensionText, VocabularyItem } from '../models/vocabulary';
import { environment } from '../../environments/environment';
import { VocabularyTrackingService, WordMastery } from './vocabulary-tracking.service';
import { StorageService } from './storage.service';

export interface WordPair {
  it: string;
  fr: string;
  context?: string;
}

export interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
    index: number;
    finish_reason: string;
  }[];
}

export type TranslationDirection = 'fr2it' | 'it2fr';

@Injectable({
  providedIn: 'root'
})
export class LlmService {
  private apiUrl = environment.openaiApiUrl;
  private apiKey = environment.openaiApiKey;
  private model = environment.openaiModel;
  
  // Direction de traduction par défaut (FR vers IT)
  private _translationDirection: TranslationDirection = 'fr2it';
  
  get translationDirection(): TranslationDirection {
    return this._translationDirection;
  }
  
  set translationDirection(direction: TranslationDirection) {
    this._translationDirection = direction;
    // Sauvegarder la préférence dans le localStorage
    localStorage.setItem('translationDirection', direction);
  }

  constructor(
    private http: HttpClient,
    private vocabularyTrackingService: VocabularyTrackingService,
    private storageService: StorageService
  ) {
    // Charger la direction de traduction sauvegardée
    const savedDirection = localStorage.getItem('translationDirection') as TranslationDirection;
    if (savedDirection) {
      this._translationDirection = savedDirection;
    }
  }

  generateVocabularyExercise(category: string, topic: string): Observable<VocabularyExercise> {
    const prompt = `Generate an Italian vocabulary exercise for the category "${category}" related to "${topic}". 
    Return a JSON object with the following structure:
    {
      "items": [
        {"word": "italian_word", "translation": "french_translation"},
        // 10 items total
      ],
      "type": "${category}",
      "topic": "${topic}"
    }`;

    return this.callOpenAI<VocabularyExercise>(prompt);
  }

  generateComprehensionExercise(type: 'written' | 'oral', vocabularyItems: VocabularyItem[]): Observable<ComprehensionText> {
    const words = vocabularyItems.map(item => item.word).join(', ');
    
    const prompt = `Generate an Italian ${type === 'written' ? 'text' : 'dialogue'} that includes the following words: ${words}.
    The text should be suitable for a language learner at an intermediate level.
    Return a JSON object with the following structure:
    {
      "text": "the_generated_text_in_italian",
      "type": "${type}",
      "vocabularyItems": ${JSON.stringify(vocabularyItems)}
    }`;

    return this.callOpenAI<ComprehensionText>(prompt);
  }

  generateWordPairs(topic: string, category?: string, direction?: TranslationDirection): Observable<WordPair[]> {
    // Utiliser la direction spécifiée ou celle par défaut
    const translationDirection = direction || this._translationDirection;
    
    // Récupérer le nombre d'associations défini par l'utilisateur
    const userAssociationsCount = this.storageService.get('wordAssociationsCount') || 10;
    
    // Récupérer les mots suivis pour cette catégorie et ce sujet
    return this.getReviewWords(category || '', topic).pipe(
      switchMap(wordsToReview => {
        // Si la direction de traduction est inverse à celle dans laquelle les mots ont été stockés,
        // nous devons inverser les paires word/translation
        const reviewWords = wordsToReview.map(w => ({
          it: w.word,
          fr: w.translation,
          context: w.context || undefined
        }));
        
        const numReviewWords = reviewWords.length;
        const maxReviewWords = Math.min(6, Math.floor(userAssociationsCount / 2)); // Max 50% de mots de révision
        const numNewWords = userAssociationsCount - Math.min(numReviewWords, maxReviewWords);
        
        // S'il n'y a pas de mots à réviser, générer tous les nouveaux mots
        if (numReviewWords === 0) {
          return this.generateNewWordPairs(topic, category, userAssociationsCount, [], translationDirection);
        }
        
        // Sinon, générer des nouveaux mots pour compléter
        return this.generateNewWordPairs(topic, category, numNewWords, reviewWords.slice(0, maxReviewWords), translationDirection)
          .pipe(
            map(newWords => {
              // Combiner les mots à réviser avec les nouveaux mots
              return [...reviewWords.slice(0, maxReviewWords), ...newWords];
            })
          );
      })
    );
  }
  
  /**
   * Génère de nouveaux mots de vocabulaire
   */
  private generateNewWordPairs(
    topic: string, 
    category?: string, 
    count: number = 12,
    wordsToReview: WordPair[] = [],
    direction: TranslationDirection = 'fr2it'
  ): Observable<WordPair[]> {
    let prompt: string;
    
    // Liste des mots à réviser pour le contexte
    const reviewWordsContext = wordsToReview.length > 0 
      ? `Inclure ces mots dans les 12 mots générés pour révision: ${wordsToReview.map(w => w.it).join(', ')}. ` 
      : '';
    
    // Adapter le prompt en fonction de la direction de traduction
    const translationDirection = direction === 'fr2it' 
      ? 'du français vers l\'italien'
      : 'de l\'italien vers le français';
      
    if (category === 'conjugation') {
      prompt = `Génère ${count} verbes en italien avec leur traduction en français pour pratiquer la conjugaison au temps "${topic}". 
      ${reviewWordsContext}
      Varie les personnes. La traduction française doit inclure la personne (ex: "it": "mangio", "fr": "je mange").
      Pour la 3e personne du singulier et du pluriel, utilise uniquement le masculin. N'oublie pas les apostrophes quand nécessaire pour les traductions françaises (ex : "j'allais" et pas "je allais")
      La direction de traduction est ${translationDirection}, l'utilisateur devra traduire ${direction === 'fr2it' ? 'du français vers l\'italien' : 'de l\'italien vers le français'}.
      Retourne uniquement un tableau JSON avec la structure suivante:
      [
        {"it": "verbe_italien", "fr": "traduction_française", "context": "exemple de phrase conjuguée au temps ${topic}"},
        // Répète pour ${count} verbes au total.
      ]
      N'inclus aucun texte avant ou après le JSON.`;
    } else {
      prompt = `Génère ${count} paires de mots en italien avec leur traduction en français sur le thème: "${topic}".
      ${reviewWordsContext}
      La direction de traduction est ${translationDirection}, l'utilisateur devra traduire ${direction === 'fr2it' ? 'du français vers l\'italien' : 'de l\'italien vers le français'}.
      Retourne uniquement un tableau JSON avec la structure suivante:
      [
        {"it": "mot_italien", "fr": "traduction_française", "context": "phrase d'exemple ou contexte d'utilisation (optionnel)"},
        // Répète pour ${count} paires au total
      ]
      Attention, le mot italien et le mot français doivent uniquement contenir la traduction de l'un et de l'autre.
      N'inclus aucun texte avant ou après le JSON.`;
    }

    return this.callOpenAI<WordPair[]>(prompt);
  }
  
  /**
   * Récupère les mots à réviser pour une catégorie/sujet donnés
   */
  private getReviewWords(category: string, topic: string): Observable<WordMastery[]> {
    // Récupérer les mots suivis pour cette catégorie et ce sujet
    const trackedWords = this.vocabularyTrackingService.getTrackedWordsByCategory(category, topic);
    
    // Si pas de mots à réviser, retourner un tableau vide
    if (trackedWords.length === 0) {
      return of([]);
    }
    
    // S'il y a moins de 6 mots, les retourner tous
    if (trackedWords.length <= 6) {
      return of(trackedWords);
    }
    
    // Sinon, utiliser LLM pour déterminer les meilleurs mots à réviser
    return this.getMostRelevantWordsToReview(trackedWords, category, topic);
  }
  
  /**
   * Utilise le LLM pour déterminer les mots les plus pertinents à réviser
   */
  private getMostRelevantWordsToReview(
    words: WordMastery[], 
    category: string, 
    topic: string
  ): Observable<WordMastery[]> {
    // Formater les données pour le LLM
    const wordsData = words.map(w => ({
      id: w.id,
      word: w.word,
      translation: w.translation,
      lastReviewed: new Date(w.lastReviewed).toISOString(),
      masteryLevel: w.masteryLevel,
      timesReviewed: w.timesReviewed
    }));
    
    const prompt = `
    Je t'envoie une liste de mots italiens que l'utilisateur a déjà vus lors de sessions précédentes.
    Sélectionne les 6 mots les plus pertinents à réviser maintenant, en te basant sur :
    1. La date de dernière révision (les mots non vus récemment mais pas trop anciens sont prioritaires)
    2. Le niveau de maîtrise (les mots moins bien maîtrisés sont prioritaires)
    3. Le nombre de révisions (favoriser les mots qui ont été vus peu de fois)
    
    Utilise l'algorithme de répétition espacée pour déterminer quels mots sont à réviser maintenant.
    
    Voici la liste des mots, avec leur ID, traduction, dernière révision, niveau de maîtrise et nombre de révisions:
    ${JSON.stringify(wordsData, null, 2)}
    
    Réponds uniquement avec un tableau JSON contenant les ID des 6 mots que tu recommandes de réviser, par ordre de priorité :
    ["id1", "id2", "id3", "id4", "id5", "id6"]`;
    
    return this.callOpenAI<string[]>(prompt).pipe(
      map(recommendedIds => {
        // Filtrer les mots selon les IDs recommandés
        return words.filter(word => recommendedIds.includes(word.id));
      })
    );
  }

  /**
   * Génère des paires de mots à partir d'une consigne personnalisée de l'utilisateur
   * @param customPrompt La consigne personnalisée de l'utilisateur
   * @param direction La direction de traduction
   * @returns Un Observable contenant les paires de mots générées
   */
  generateCustomWordPairs(customPrompt: string, direction: TranslationDirection): Observable<WordPair[]> {
    // Adapter le prompt en fonction de la direction de traduction
    const translationDirection = direction === 'fr2it' 
      ? 'du français vers l\'italien'
      : 'de l\'italien vers le français';
    
    // Récupérer le nombre d'associations défini par l'utilisateur
    const userAssociationsCount = this.storageService.get('wordAssociationsCount') || 10;
    
    const prompt = `
      Je souhaite apprendre du vocabulaire italien selon cette consigne personnalisée: "${customPrompt}".
      
      Génère ${userAssociationsCount} paires de mots en italien avec leur traduction en français qui correspondent à ma demande.
      
      La direction de traduction est ${translationDirection}, l'utilisateur devra traduire ${direction === 'fr2it' ? 'du français vers l\'italien' : 'de l\'italien vers le français'}.
      
      Retourne uniquement un tableau JSON avec la structure suivante:
      [
        {"it": "mot_italien", "fr": "traduction_française", "context": "phrase d'exemple ou contexte d'utilisation pour mieux comprendre le mot"},
        // Répète pour ${userAssociationsCount} paires au total
      ]
      
      Attention, le mot italien et le mot français doivent uniquement contenir la traduction de l'un et de l'autre.
      N'inclus aucun texte avant ou après le JSON.
    `;

    return this.callOpenAI<WordPair[]>(prompt);
  }

  private callOpenAI<T>(prompt: string): Observable<T> {
    // Utiliser la clé API utilisateur si disponible, sinon la clé par défaut
    const userApiKey = this.storageService.get('userOpenaiApiKey');
    const apiKeyToUse = userApiKey || this.apiKey;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKeyToUse}`
    });

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant d\'apprentissage de l\'italien qui génère du contenu éducatif structuré en JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    };

    return this.http.post<OpenAIResponse>(this.apiUrl, body, { headers }).pipe(
      map(response => {
        const content = response.choices[0].message.content;
        try {
          // Essayer de parser la réponse en JSON
          // Si la réponse contient du texte avant/après le JSON, essayer de l'extraire
          const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as T;
          }
          return JSON.parse(content) as T;
        } catch (error) {
          console.error('Erreur lors du parsing de la réponse JSON:', error);
          console.log('Contenu reçu:', content);
          throw new Error('Format de réponse invalide');
        }
      })
    );
  }
}
