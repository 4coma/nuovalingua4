import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WordPair } from './llm.service';
import { ComprehensionText, ComprehensionQuestion, EvaluationResult } from '../models/vocabulary';
import { StorageService } from './storage.service';
import { LoadingService } from './loading.service';

export interface TranslationResult {
  originalWord: string;
  translation: string;
  contextualMeaning: string;
  partOfSpeech?: string;
  examples?: string[];
}

export interface AssociationSession {
  wordPairs: WordPair[];
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TextGeneratorService {
  private apiUrl = environment.openaiApiUrl;
  private apiKey = environment.openaiApiKey;
  private model = environment.openaiModel;

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private loadingService: LoadingService
  ) {}

  /**
   * Génère un texte de compréhension à partir d'une liste de mots
   */
  generateComprehensionText(wordPairs: WordPair[], type: 'written' | 'oral', themes?: string[]): Observable<ComprehensionText> {
    return this.callOpenAI<ComprehensionText>(this.createComprehensionTextPrompt(wordPairs, type, themes));
  }

  /**
   * Traduit un mot dans son contexte
   */
  getContextualTranslation(word: string, context: string): Observable<TranslationResult> {
    return this.callOpenAI<TranslationResult>(this.createTranslationPrompt(word, context));
  }

  /**
   * Évalue les réponses de l'utilisateur aux questions de compréhension
   */
  evaluateUserAnswers(text: string, questions: ComprehensionQuestion[]): Observable<EvaluationResult> {
    return this.callOpenAI<EvaluationResult>(this.createEvaluationPrompt(text, questions));
  }

  /**
   * Génère des questions de compréhension à partir d'un texte
   */
  generateComprehensionQuestions(text: string): Observable<{questions: ComprehensionQuestion[]}> {
    return this.callOpenAI<{questions: ComprehensionQuestion[]}>(this.createQuestionsPrompt(text));
  }

  /**
   * Évalue les réponses aux questions de compréhension
   * @param text Le texte original de l'exercice de compréhension
   * @param questions Les questions avec les réponses de l'utilisateur
   * @returns Un résultat d'évaluation avec feedback
   */
  evaluateComprehensionAnswers(text: string, questions: ComprehensionQuestion[]): Observable<EvaluationResult> {
    return this.evaluateUserAnswers(text, questions);
  }

  /**
   * Génère une session d'association de mots à partir d'un texte sauvegardé
   */
  generateAssociationSessionFromText(text: string, title: string): Observable<AssociationSession> {
    return this.callOpenAI<AssociationSession>(this.createAssociationSessionPrompt(text, title));
  }

  /**
   * Crée le prompt pour générer un texte de compréhension avec des questions
   */
  private createComprehensionTextPrompt(wordPairs: WordPair[], type: 'written' | 'oral', themes?: string[]): string {
    // Extraire les mots italiens
    const italianWords = wordPairs.map(pair => pair.it);
    
    // Créer des paires de mots formatées
    const formattedPairs = wordPairs.map(pair => 
      `"${pair.it}" (it) - "${pair.fr}" (fr)${pair.context ? ` - Contexte: ${pair.context}` : ''}`
    );
    
    // Récupérer la longueur configurée par l'utilisateur
    const userLength = this.storageService.get('oralComprehensionLength') || 150;
    const targetLength = type === 'oral' ? userLength : 200; // Pour les textes écrits, on garde 200 mots
    
    // Construire la partie thèmes si fournie
    const themesSection = themes && themes.length > 0 
      ? `\nTHÈMES SPÉCIFIÉS: ${themes.join(', ')}\nLe texte doit être centré sur ces thèmes.`
      : '';
    
    return `
      Tu es un assistant de langue spécialisé dans la création de textes pédagogiques pour l'apprentissage de l'italien.
      
      Voici la liste des mots italiens que tu dois utiliser dans ton texte:
      ${italianWords.map(word => `"${word}"`).join(', ')}
      
      Pour information, ces mots proviennent des paires de traduction suivantes:
      ${formattedPairs.join('\n')}${themesSection}
      
      Peux-tu créer un ${type === 'written' ? 'texte narratif' : 'dialogue'} original UNIQUEMENT EN ITALIEN d'environ ${targetLength} mots qui utilise tous ces mots italiens de manière naturelle?
      Le texte doit être de niveau intermédiaire, facile à comprendre mais avec une structure correcte.
      
      De plus, génère 3 à 5 questions de compréhension en FRANÇAIS sur ce texte, qui permettent de vérifier si l'apprenant a bien compris le contenu.
      
      Important:
      - Utilise TOUS les mots italiens de la liste dans ton texte
      - Le texte DOIT être écrit INTÉGRALEMENT en italien (aucun mot ou phrase en français)
      - Crée une histoire cohérente et intéressante${type === 'oral' ? ' sous forme de dialogue entre 2-3 personnes' : ''}
      - Ne fais pas de liste, mais un texte narratif fluide
      - Ne mets PAS en évidence les mots, laisse-les intégrés naturellement dans le texte
      - Les questions doivent être en français et porter sur la compréhension du texte${themes && themes.length > 0 ? '\n- Le texte doit être centré sur les thèmes spécifiés' : ''}
      
      TRES IMPORTANT:
      - RETOURNE TA RÉPONSE SOUS FORME D'OBJET JSON AVEC LA STRUCTURE SUIVANTE:
      {
        "text": "le texte généré ici en italien",
        "type": "${type}",
        "vocabularyItems": [
          {"word": "motItalien1", "translation": "traductionFrançaise1"},
          {"word": "motItalien2", "translation": "traductionFrançaise2"},
          ...
        ],
        "questions": [
          {"question": "Question 1 en français?"},
          {"question": "Question 2 en français?"},
          ...
        ]
      }
      - Assure-toi que chaque mot de la liste apparaît dans le texte ET dans le tableau vocabularyItems
      - Tous les mots dans le texte doivent être en italien
      - Les questions doivent être en français et être de niveau intermédiaire
      - Le format JSON doit être valide pour pouvoir être traité par une application
    `;
  }

  /**
   * Crée le prompt pour traduire un mot dans son contexte
   */
  private createTranslationPrompt(word: string, context: string): string {
    return `
      Tu es un assistant linguistique spécialisé en italien et français.
      
      Je souhaite obtenir la traduction contextuelle du mot italien "${word}" qui apparaît dans le texte suivant:
      
      "${context}"
      
      Retourne uniquement un objet JSON avec la structure suivante:
      {
        "originalWord": "${word}",
        "translation": "la traduction française la plus précise dans ce contexte",
        "contextualMeaning": "explication brève en français du sens dans ce contexte spécifique",
        "partOfSpeech": "catégorie grammaticale en français (nom, verbe, adjectif, etc.)",
        "examples": ["1-2 exemples de phrases en italien avec traduction française"]
      }
      
      Assure-toi que la traduction et les explications sont en français standard et correct.
    `;
  }

  /**
   * Crée le prompt pour évaluer les réponses aux questions de compréhension
   */
  private createEvaluationPrompt(text: string, questions: ComprehensionQuestion[]): string {
    const questionsAndAnswers = questions
      .map((q, index) => {
        return `Question ${index + 1}: ${q.question}\nRéponse de l'apprenant: ${q.userAnswer || "Pas de réponse"}`;
      })
      .join('\n\n');

    return `
      Tu es un professeur de langue italienne qui évalue les réponses d'un élève à des questions de compréhension.
      
      Voici le texte sur lequel portaient les questions:
      "${text}"
      
      Voici les questions et les réponses de l'élève:
      ${questionsAndAnswers}
      
      Pour chaque réponse, fournis:
      1. Si la réponse est correcte ou non
      2. Une explication concise sur ce qui est correct ou incorrect
      3. La bonne réponse ou une meilleure formulation si nécessaire
      
      TRES IMPORTANT:
      - RETOURNE TA RÉPONSE SOUS FORME D'OBJET JSON AVEC LA STRUCTURE SUIVANTE:
      {
        "feedback": [
          {
            "question": "la question posée",
            "userAnswer": "la réponse de l'utilisateur",
            "isCorrect": true/false,
            "explanation": "ton explication",
            "correctAnswer": "la bonne réponse ou suggestion d'amélioration"
          },
          ...
        ],
        "score": 75,
        "overallFeedback": "commentaire général sur la performance de l'apprenant"
      }
      - Le score doit être un pourcentage (0-100) basé sur le nombre de réponses correctes
      - Sois bienveillant mais précis dans tes explications
      - Le format JSON doit être valide pour pouvoir être traité par une application
    `;
  }

  /**
   * Crée le prompt pour générer des questions de compréhension
   */
  private createQuestionsPrompt(text: string): string {
    return `
      Tu es un assistant pédagogique spécialisé dans l'apprentissage de l'italien.
      
      Voici un texte en italien:
      "${text}"
      
      Peux-tu générer 3 à 5 questions de compréhension en français sur ce texte? Les questions doivent permettre de vérifier si l'apprenant a bien compris le contenu.
      
      Important:
      - Les questions doivent être en français
      - Les questions doivent porter sur la compréhension du texte
      - Les questions doivent être de niveau intermédiaire
      - Les questions doivent être de type ouverte (pas de QCM)
      
      TRES IMPORTANT:
      - RETOURNE TA RÉPONSE SOUS FORME D'OBJET JSON AVEC LA STRUCTURE SUIVANTE:
      {
        "questions": [
          {"question": "Question 1 en français?"},
          {"question": "Question 2 en français?"},
          ...
        ]
      }
      - Le format JSON doit être valide pour pouvoir être traité par une application
    `;
  }

  /**
   * Crée le prompt pour générer une session d'association à partir d'un texte
   */
  private createAssociationSessionPrompt(text: string, title: string): string {
    console.log('text passé au modèle : ', text);
    
    return `
      Tu es un assistant pédagogique spécialisé dans l'apprentissage de l'italien.
      
      Voici un texte en italien:
      "${text}"
      
      À partir de ce texte, je veux que tu extraies 8-12 paires de mots français-italien qui sont importantes pour la compréhension du texte.
      Ces mots doivent être de niveau intermédiaire et utiles pour l'apprentissage.
      
      Important:
      - Choisis des mots qui apparaissent dans le texte
      - Inclus des mots de vocabulaire variés (noms, verbes, adjectifs)
      - Assure-toi que les traductions sont précises
      
      TRES IMPORTANT:
      - RETOURNE TA RÉPONSE SOUS FORME D'OBJET JSON AVEC LA STRUCTURE SUIVANTE:
      {
        "wordPairs": [
          {"it": "mot italien", "fr": "traduction française", "context": "contexte d'utilisation optionnel"},
          {"it": "mot italien", "fr": "traduction française", "context": "contexte d'utilisation optionnel"},
          ...
        ],
        "title": "${title}",
        "description": "Description brève de la session basée sur le contenu du texte",
        "category": "vocabulaire"
      }
      - Le format JSON doit être valide pour pouvoir être traité par une application
      - Assure-toi que chaque paire a les champs "it" et "fr"
      - Le champ "context" est optionnel
      - La difficulté doit être "easy", "medium" ou "hard"
    `;
  }

  /**
   * Appel à l'API OpenAI
   */
  private callOpenAI<T>(prompt: string): Observable<T> {
    this.loadingService.showLoading('Traitement en cours...');
    
    // Vérifier si l'utilisateur a défini sa propre clé API
    const userApiKey = this.storageService.get('userOpenaiApiKey');
    
    // Si aucune clé utilisateur n'est définie, afficher une notification
    if (!userApiKey) {
      this.loadingService.hideLoading();
      this.showApiKeyNotification();
      return throwError(() => new Error('Clé API non configurée'));
    }
    
    const apiKeyToUse = userApiKey || this.apiKey;
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${apiKeyToUse}`);
    
    const data = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant pédagogique spécialisé dans l\'apprentissage de l\'italien. Tu réponds au format JSON lorsqu\'on te le demande. Lorsqu\'on te demande de créer un texte en italien, tu réponds UNIQUEMENT en italien pour le texte, mais tu peux utiliser le français pour les traductions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    };
    
    return this.http.post<any>(this.apiUrl, data, { headers }).pipe(
      map(response => {
        this.loadingService.hideLoading();
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
        this.loadingService.hideLoading();
        console.error('OpenAI API error:', error);
        
        // Gestion d'erreur plus détaillée
        let errorMessage = 'Erreur lors du traitement';
        if (error.status === 401) {
          errorMessage = 'Clé API invalide. Vérifiez vos préférences.';
        } else if (error.status === 429) {
          errorMessage = 'Limite de requêtes dépassée. Réessayez plus tard.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Réessayez dans quelques instants.';
        } else if (error.status === 0) {
          errorMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
        }
        
        this.loadingService.showErrorToast(errorMessage);
        throw error;
      })
    );
  }
  
  /**
   * Extrait le contexte avant et après un mot dans un texte
   */
  extractContext(text: string, word: string, windowSize: number = 5): string {
    // Trouver la position du mot dans le texte
    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();
    const wordIndex = lowerText.indexOf(lowerWord);
    
    if (wordIndex === -1) return word;
    
    // Diviser le texte en mots
    const words = text.split(/\s+/);
    
    // Trouver l'index du mot dans le tableau des mots
    let currentIndex = 0;
    let targetWordIndex = -1;
    
    for (let i = 0; i < words.length; i++) {
      const cleanWord = words[i].replace(/[.,;!?()[\]{}""«»]/g, '').toLowerCase();
      if (currentIndex <= wordIndex && wordIndex < currentIndex + words[i].length) {
        targetWordIndex = i;
        break;
      }
      currentIndex += words[i].length + 1; // +1 pour l'espace
    }
    
    if (targetWordIndex === -1) return word;
    
    // Extraire les mots avant et après
    const startIndex = Math.max(0, targetWordIndex - windowSize);
    const endIndex = Math.min(words.length, targetWordIndex + windowSize + 1);
    
    return words.slice(startIndex, endIndex).join(' ');
  }

  /**
   * Affiche une notification pour informer l'utilisateur qu'il doit configurer sa clé API
   */
  private async showApiKeyNotification(): Promise<void> {
    await this.loadingService.showErrorToast('Veuillez configurer votre clé API OpenAI dans les préférences pour utiliser cette fonctionnalité.');
  }
} 