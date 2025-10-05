import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LlmService } from './llm.service';
import { AudioRecordingService } from './audio-recording.service';
import { SpeechRecognitionService, TranscriptionResult } from './speech-recognition.service';
import { ToastController } from '@ionic/angular';
import { SavedConversationsService } from './saved-conversations.service';
import { FullRevisionService, FullRevisionSession } from './full-revision.service';

export interface DiscussionContext {
  id: string;
  title: string;
  situation: string;
  userRole: string;
  aiRole: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  description: string;
  hidden?: boolean;
}

export interface ErrorCorrection {
  erreur: string;
  correction: string;
  traduction: string;
  type: string;
}

export interface MessageFeedback {
  erreurs?: ErrorCorrection[];
  // Propriétés de l'ancien format pour la compatibilité
  grammaire?: string;
  vocabulaire?: string;
  prononciation?: string;
  suggestion?: string;
}

export interface AIResponse {
  reponse: string;
  feedback: MessageFeedback;
}

export interface DiscussionTurn {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: Date;
  audioUrl?: string;
  transcription?: string;
  feedback?: MessageFeedback;
  highlightedWords?: string[];
}

export interface DiscussionSession {
  id: string;
  context: DiscussionContext;
  turns: DiscussionTurn[];
  startTime: Date;
  endTime?: Date;
  language: string;
}

export interface DiscussionState {
  isActive: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  currentSession?: DiscussionSession;
  currentTurn?: DiscussionTurn;
}

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {
  private stateSubject = new BehaviorSubject<DiscussionState>({
    isActive: false,
    isRecording: false,
    isProcessing: false
  });

  public state$ = this.stateSubject.asObservable();

  private readonly MAX_TURNS_HISTORY = 8;

  // Contextes de discussion prédéfinis
  private discussionContexts: DiscussionContext[] = [
    {
      id: 'restaurant',
      title: 'Au restaurant',
      situation: 'Vous êtes dans un restaurant italien à Rome',
      userRole: 'Client qui commande son repas',
      aiRole: 'Serveur italien',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Commander un repas dans un restaurant italien'
    },
    {
      id: 'argument',
      title: 'Dispute amoureuse',
      situation: 'Vous vous disputez avec votre partenaire italien',
      userRole: 'Personne qui se justifie',
      aiRole: 'Partenaire fâché',
      difficulty: 'intermediate',
      category: 'Relations',
      description: 'Gérer une dispute dans un couple'
    },
    {
      id: 'shopping',
      title: 'Shopping',
      situation: 'Vous faites du shopping dans une boutique italienne',
      userRole: 'Client qui achète des vêtements',
      aiRole: 'Vendeur italien',
      difficulty: 'beginner',
      category: 'Vie quotidienne',
      description: 'Acheter des vêtements en Italie'
    },
    {
      id: 'travel',
      title: 'Voyage',
      situation: 'Vous demandez votre chemin dans une ville italienne',
      userRole: 'Touriste perdu',
      aiRole: 'Passant italien',
      difficulty: 'intermediate',
      category: 'Voyage',
      description: 'Demander des directions en italien'
    },
    {
      id: 'work',
      title: 'Travail',
      situation: 'Vous avez une réunion avec des collègues italiens',
      userRole: 'Employé qui présente un projet',
      aiRole: 'Collègue italien',
      difficulty: 'advanced',
      category: 'Professionnel',
      description: 'Présenter un projet en italien'
    },
    {
      id: 'full-revision',
      title: 'Révision complète',
      situation: 'Vous menez une conversation libre en italien pour réviser un vocabulaire ciblé',
      userRole: 'Apprenant qui doit placer des mots précis',
      aiRole: 'Coach de langue italien qui guide la conversation',
      difficulty: 'intermediate',
      category: 'Révision',
      description: 'Conversation guidée pour réemployer des mots d\'une session de révision',
      hidden: true
    }
  ];

  constructor(
    private llmService: LlmService,
    private audioRecordingService: AudioRecordingService,
    private speechRecognitionService: SpeechRecognitionService,
    private toastCtrl: ToastController,
    private savedConversations: SavedConversationsService,
    private fullRevisionService: FullRevisionService
  ) {}

  /**
   * Obtient tous les contextes de discussion
   */
  getDiscussionContexts(): DiscussionContext[] {
    return this.discussionContexts;
  }

  /**
   * Obtient les contextes par catégorie
   */
  getContextsByCategory(): { [key: string]: DiscussionContext[] } {
    return this.discussionContexts.reduce((acc, context) => {
      if (!acc[context.category]) {
        acc[context.category] = [];
      }
      acc[context.category].push(context);
      return acc;
    }, {} as { [key: string]: DiscussionContext[] });
  }

  /**
   * Obtient les contextes par difficulté
   */
  getContextsByDifficulty(difficulty: string): DiscussionContext[] {
    return this.discussionContexts.filter(context => context.difficulty === difficulty);
  }

  /**
   * Reprend une session de discussion sauvegardée
   */
  resumeSession(session: DiscussionSession): void {
    
    // Déterminer le dernier tour pour l'affichage
    const lastTurn = session.turns.length > 0 ? session.turns[session.turns.length - 1] : undefined;
    
    this.updateState({
      isActive: true,
      isRecording: false,
      isProcessing: false,
      currentSession: session,
      currentTurn: lastTurn
    });
    
  }

  /**
   * Démarre une nouvelle session de discussion
   */
  async startDiscussion(context: DiscussionContext): Promise<boolean> {
    try {
      if (context.id === 'full-revision') {
        const activeFullRevision = this.fullRevisionService.getSession();
        if (!activeFullRevision) {
          this.showToast('Aucune session de révision complète n\'est active.');
          return false;
        }
        if (activeFullRevision.stage !== 'conversation') {
          this.fullRevisionService.setStage('conversation');
        }
        this.fullRevisionService.assignQueuesFromWords();
      }

      const session: DiscussionSession = {
        id: this.generateSessionId(),
        context: context,
        turns: [],
        startTime: new Date(),
        language: 'it'
      };

      // Générer la première réplique de l'IA
      const aiFirstResponse = await this.generateAIResponse(context, '');
      
      const aiTurn: DiscussionTurn = {
        speaker: 'ai',
        message: aiFirstResponse.reponse,
        timestamp: new Date()
      };

      const highlightedWords = this.handleAiWordsForFullRevision(aiTurn.message);
      if (highlightedWords.length > 0) {
        aiTurn.highlightedWords = highlightedWords;
      }

      session.turns.push(aiTurn);

      this.updateState({
        isActive: true,
        isRecording: false,
        isProcessing: false,
        currentSession: session,
        currentTurn: aiTurn
      });
      this.savedConversations.saveConversation(session);

      return true;
    } catch (error) {
      console.error('Erreur lors du démarrage de la discussion:', error);
      this.showToast('Erreur lors du démarrage de la discussion');
      return false;
    }
  }

  /**
   * Enregistre la réponse de l'utilisateur
   */
  async recordUserResponse(): Promise<void> {
    const currentState = this.stateSubject.value;
    if (!currentState.currentSession) return;

    this.updateState({ isRecording: true });

    try {
      // Démarrer l'enregistrement
      const recordingSuccess = await this.audioRecordingService.startRecording();
      if (!recordingSuccess) {
        this.updateState({ isRecording: false });
        return;
      }

      // Attendre que l'utilisateur arrête l'enregistrement
      // (cela sera géré par l'interface utilisateur)
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      this.updateState({ isRecording: false });
      this.showToast('Erreur lors de l\'enregistrement');
    }
  }

  /**
   * Traite la réponse enregistrée de l'utilisateur
   */
  async processUserResponse(): Promise<void> {
    const currentState = this.stateSubject.value;
    if (!currentState.currentSession) {
      console.warn('🔍 DiscussionService - Pas de session courante, abandon processUserResponse');
      return;
    }

    this.updateState({ isProcessing: true });

    try {
      // S'assurer que l'enregistrement est bien arrêté et le blob prêt
      // await this.audioRecordingService.stopRecording(); // SUPPRIMÉ : c'est le composant qui gère ça
      // Obtenir l'enregistrement audio
      const audioBlob = this.audioRecordingService.getAudioBlob();
      if (!audioBlob) {
        console.warn('🔍 DiscussionService - Aucun audioBlob trouvé');
        this.updateState({ isProcessing: false });
        this.showToast('Aucun enregistrement à traiter');
        return;
      }

      // Transcrire l'audio
      const transcription = await this.transcribeAudio(audioBlob);
      if (!transcription) {
        console.warn('🔍 DiscussionService - Transcription échouée');
        this.updateState({ isProcessing: false });
        this.showToast('Erreur lors de la transcription');
        return;
      }

      // Créer le tour de l'utilisateur
      const userTurn: DiscussionTurn = {
        speaker: 'user',
        message: transcription.text,
        timestamp: new Date(),
        audioUrl: this.audioRecordingService.getAudioUrl() || undefined,
        transcription: transcription.text
      };

      // Ajouter le tour à la session
      currentState.currentSession.turns.push(userTurn);

      const userHighlights = this.handleUserWordsForFullRevision(userTurn.message);
      if (userHighlights.length > 0) {
        userTurn.highlightedWords = userHighlights;
      }

      // Mettre à jour l'état pour afficher le message utilisateur immédiatement
      this.updateState({
        currentSession: currentState.currentSession,
        currentTurn: userTurn
      });

      // Générer la réponse de l'IA
      const aiResponseData = await this.generateAIResponse(
        currentState.currentSession.context,
        transcription.text,
        currentState.currentSession.turns
      );

      // Ajouter le feedback au message utilisateur précédent
      if (userTurn && aiResponseData.feedback) {
        userTurn.feedback = aiResponseData.feedback;
      }

      const aiTurn: DiscussionTurn = {
        speaker: 'ai',
        message: aiResponseData.reponse,
        timestamp: new Date()
      };

      const highlightedWords = this.handleAiWordsForFullRevision(aiTurn.message);
      if (highlightedWords.length > 0) {
        aiTurn.highlightedWords = highlightedWords;
      }

      currentState.currentSession.turns.push(aiTurn);

      this.updateState({
        isProcessing: false,
        currentSession: currentState.currentSession,
        currentTurn: aiTurn
      });
      this.savedConversations.saveConversation(currentState.currentSession);

    } catch (error) {
      console.error('🔍 DiscussionService - Erreur processUserResponse:', error);
      this.updateState({ isProcessing: false });
      this.showToast('Erreur lors du traitement de la réponse');
    }
  }

  /**
   * Traite la réponse texte de l'utilisateur
   */
  async processTextResponse(userMessage: string): Promise<void> {
    const currentState = this.stateSubject.value;
    if (!currentState.currentSession) {
      console.warn('🔍 DiscussionService - Pas de session courante, abandon processTextResponse');
      return;
    }

    this.updateState({ isProcessing: true });

    try {
      // Créer le tour de l'utilisateur
      const userTurn: DiscussionTurn = {
        speaker: 'user',
        message: userMessage,
        timestamp: new Date()
      };

      // Ajouter le tour à la session
      currentState.currentSession.turns.push(userTurn);

      const userHighlights = this.handleUserWordsForFullRevision(userTurn.message);
      if (userHighlights.length > 0) {
        userTurn.highlightedWords = userHighlights;
      }

      // Mettre à jour l'état pour afficher le message utilisateur immédiatement
      this.updateState({
        currentSession: currentState.currentSession,
        currentTurn: userTurn
      });

      // Générer la réponse de l'IA
      const aiResponseData = await this.generateAIResponse(
        currentState.currentSession.context,
        userMessage,
        currentState.currentSession.turns
      );

      // Ajouter le feedback au message utilisateur précédent
      if (userTurn && aiResponseData.feedback) {
        userTurn.feedback = aiResponseData.feedback;
      }

      const aiTurn: DiscussionTurn = {
        speaker: 'ai',
        message: aiResponseData.reponse,
        timestamp: new Date()
      };

      const highlightedWords = this.handleAiWordsForFullRevision(aiTurn.message);
      if (highlightedWords.length > 0) {
        aiTurn.highlightedWords = highlightedWords;
      }

      currentState.currentSession.turns.push(aiTurn);

      this.updateState({
        isProcessing: false,
        currentSession: currentState.currentSession,
        currentTurn: aiTurn
      });
      this.savedConversations.saveConversation(currentState.currentSession);

    } catch (error) {
      console.error('🔍 DiscussionService - Erreur processTextResponse:', error);
      this.updateState({ isProcessing: false });
      this.showToast('Erreur lors du traitement de la réponse');
    }
  }

  /**
   * Arrête l'enregistrement en cours
   */
  async stopRecording(): Promise<void> {
    try {
      await this.audioRecordingService.stopRecording();
      this.updateState({ isRecording: false });
    } catch (error) {
      console.error('🔍 DiscussionService - Erreur stopRecording:', error);
    this.updateState({ isRecording: false });
      throw error;
    }
  }

  /**
   * Termine la session de discussion
   */
  endDiscussion(): void {
    const currentState = this.stateSubject.value;
    if (currentState.currentSession) {
      currentState.currentSession.endTime = new Date();
      // Ici on pourrait sauvegarder la session
    }

    this.updateState({
      isActive: false,
      isRecording: false,
      isProcessing: false,
      currentSession: undefined,
      currentTurn: undefined
    });
  }

  /**
   * Génère une réponse de l'IA
   */
  private async generateAIResponse(
    context: DiscussionContext,
    userMessage: string,
    previousTurns: DiscussionTurn[] = []
  ): Promise<AIResponse> {
    const prompt = this.buildDiscussionPrompt(context, userMessage, previousTurns);
    try {
      const response: any = await this.llmService.generateDiscussionResponse(prompt).toPromise();
      let text = '';
      // Cas 1 : la réponse est déjà un objet avec reponse et feedback
      if (response && typeof response === 'object' && response.reponse && response.feedback) {
        return {
          reponse: response.reponse,
          feedback: response.feedback
        };
      }
      // Cas 2 : string JSON ou texte brut
      if (typeof response === 'string') {
        text = response;
      } else if (response?.conversation?.[0]?.messaggio) {
        text = response.conversation[0].messaggio;
      } else {
        return {
          reponse: 'Je ne comprends pas, pouvez-vous répéter ?',
          feedback: {
            erreurs: []
          }
        };
      }
      // Essayer d'extraire la propriété 'reponse' du JSON
      try {
        const json = JSON.parse(text);
        if (json && typeof json.reponse === 'string' && json.feedback) {
          return {
            reponse: json.reponse,
            feedback: json.feedback
          };
        } else {
          return {
            reponse: 'Erreur : le modèle n\'a pas répondu au format JSON attendu.',
            feedback: {
              erreurs: []
            }
          };
        }
      } catch (e) {
        console.error('Erreur lors du parsing de la réponse JSON:', e, text);
        return {
          reponse: 'Erreur : la réponse du modèle n\'est pas un JSON valide.',
          feedback: {
            erreurs: []
          }
        };
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse IA:', error);
      return {
        reponse: 'Désolé, je n\'ai pas pu traiter votre message.',
        feedback: {
          erreurs: []
        }
      };
    }
  }

  /**
   * Construit le prompt pour l'IA
   */
  private buildDiscussionPrompt(
    context: DiscussionContext,
    userMessage: string,
    previousTurns: DiscussionTurn[]
  ): string {
    let prompt = `IMPORTANT : Tu dois TOUJOURS répondre en italien, même au tout premier tour.\n\n`;
    prompt += `Tu es dans une conversation en italien. Voici le contexte :\n\n`;
    prompt += `Situation : ${context.situation}\n`;
    prompt += `Description : ${context.description || ''}\n`;
    prompt += `Ton rôle : ${context.aiRole}\n`;
    prompt += `Rôle de l'utilisateur : ${context.userRole}\n`;
    prompt += `Difficulté : ${context.difficulty}\n`;
    prompt += `Catégorie : ${context.category}\n`;
    prompt += `\nInstructions :\n`;
    prompt += `- Réponds TOUJOURS en italien, même au tout premier tour\n`;
    prompt += `- Reste dans ton rôle\n`;
    prompt += `- Sois naturel et conversationnel\n`;
    prompt += `- Réponds de manière appropriée au message de l'utilisateur\n`;
    prompt += `- Ne répète pas ce que tu as déjà dit, fais avancer la conversation\n`;
    prompt += `- Prends en compte tout l'historique de la conversation pour répondre\n`;
    if (!userMessage) {
      prompt += `- Si c'est le tout premier tour, démarre la conversation EN ITALIEN, de façon naturelle et adaptée au contexte ci-dessus.\n`;
    }
    prompt += `- Si tu réponds dans une autre langue que l'italien, recommence en italien.\n`;

    const fullRevisionSession = this.fullRevisionService.getSession();
    const isFullRevisionConversation =
      !!fullRevisionSession &&
      fullRevisionSession.stage === 'conversation' &&
      context.id === 'full-revision';

    if (isFullRevisionConversation) {
      this.fullRevisionService.assignQueuesFromWords();
      const remainingUserWords = this.fullRevisionService.getRemainingWords('user');

      prompt += `\nConsignes spéciales pour la révision complète (ne les cite pas telles quelles) :\n`;
      if (fullRevisionSession.themes.length > 0) {
        prompt += `- Oriente subtilement l'échange autour de ces thèmes : ${fullRevisionSession.themes.join(', ')}.\n`;
      }

      if (remainingUserWords.length > 0) {
        prompt += `- L'utilisateur doit encore placer ces mots précis : ${remainingUserWords.join(', ')}. Encourage-le doucement, rappelle-lui ce qu'il reste sans prononcer ces mots toi-même et pose des questions ouvertes pour l'y aider.\n`;
        prompt += `- Reformule si nécessaire pour qu'il comprenne bien quels mots il n'a pas encore utilisés.\n`;
      } else {
        prompt += `- L'utilisateur a placé tous ses mots : félicite-le et propose de conclure ou d'approfondir, selon son envie.\n`;
      }
    }

    prompt += `\nIMPORTANT pour le feedback :\n`;
    prompt += `- Analyse le message de l'utilisateur et identifie CHAQUE erreur individuellement (mot par mot)\n`;
    prompt += `- CHAQUE erreur doit être ATOMIQUE : un seul mot ou une petite expression (2-3 mots maximum)\n`;
    prompt += `- NE PAS barrer une phrase entière : identifie chaque mot incorrect séparément\n`;
    prompt += `- Exemple : dans "sono serioso", l'erreur est UNIQUEMENT "serioso" -> "serio", PAS toute la phrase\n`;
    prompt += `- Pour chaque erreur atomique, indique :\n`;
    prompt += `  * "erreur": le mot ou la petite expression incorrecte UNIQUEMENT\n`;
    prompt += `  * "correction": le mot ou la petite expression corrigée\n`;
    prompt += `  * "traduction": la traduction française de la correction\n`;
    prompt += `  * "type": le type d'erreur (grammaire/vocabulaire/orthographe/conjugaison)\n`;
    prompt += `- Si aucune erreur n'est détectée, retourne un tableau vide : "erreurs": []\n`;
    prompt += `- Ne donne AUCUN commentaire général, évaluation ou suggestion\n`;
    prompt += `\n`;

    // Limiter l'historique à MAX_TURNS_HISTORY (garder le premier + les N derniers)
    let turnsToInclude: DiscussionTurn[] = previousTurns;
    if (previousTurns.length > this.MAX_TURNS_HISTORY) {
      turnsToInclude = [
        previousTurns[0],
        ...previousTurns.slice(- (this.MAX_TURNS_HISTORY - 1))
      ];
    }

    if (turnsToInclude.length > 0) {
      prompt += `Historique de la conversation (dans l'ordre chronologique, tronqué si trop long) :\n`;
      turnsToInclude.forEach(turn => {
        prompt += `${turn.speaker === 'user' ? 'Utilisateur' : 'IA'} : ${turn.message}\n`;
      });
    } else {
      prompt += `Début de la conversation.\n`;
    }

    if (userMessage) {
      prompt += `\nDernier message de l'utilisateur : "${userMessage}"\n`;
    }
    prompt += `\nRéponds uniquement avec un objet JSON de la forme : { 
      "reponse": "<ta réponse en italien>",
      "feedback": {
        "erreurs": [
          {
            "erreur": "<texte incorrect de l'utilisateur>",
            "correction": "<texte corrigé en italien>",
            "traduction": "<traduction française de la correction>",
            "type": "<type d'erreur: grammaire/vocabulaire/orthographe/conjugaison>"
          }
        ]
      }
    }\n`;
    prompt += `\nTa réponse :`;
    return prompt;
  }

  private handleAiWordsForFullRevision(message: string): string[] {
    const session = this.fullRevisionService.getSession();
    if (!session || session.stage !== 'conversation') {
      return [];
    }

    return [];
  }

  private handleUserWordsForFullRevision(message: string): string[] {
    const session = this.fullRevisionService.getSession();
    if (!session || session.stage !== 'conversation') {
      return [];
    }

    const remainingUserWords = this.fullRevisionService.getRemainingWords('user');
    if (remainingUserWords.length === 0) {
      return [];
    }

    const matched = this.findWordsInText(message, remainingUserWords);
    matched.forEach(word => this.fullRevisionService.markWordUsed(word, 'user'));
    if (matched.length > 0) {
      this.fullRevisionService.assignQueuesFromWords();
    }
    return matched;
  }

  private findWordsInText(text: string, candidates: string[]): string[] {
    if (!text || candidates.length === 0) {
      return [];
    }

    const normalizedText = this.normalizeForComparison(text).replace(/[^a-z0-9\s]/g, ' ');
    const tokens = normalizedText.split(/\s+/).filter(token => token.length > 0);
    const tokenSet = new Set(tokens);

    const matches: string[] = [];

    candidates.forEach(candidate => {
      const normalizedCandidate = this.normalizeForComparison(candidate);
      if (!normalizedCandidate) {
        return;
      }

      if (normalizedCandidate.includes(' ')) {
        const pattern = new RegExp(`\\b${this.escapeRegExp(normalizedCandidate)}\\b`, 'i');
        if (pattern.test(normalizedText)) {
          matches.push(candidate);
        }
      } else if (tokenSet.has(normalizedCandidate)) {
        matches.push(candidate);
      }
    });

    return matches;
  }

  private normalizeForComparison(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private escapeRegExp(value: string): string {
    const specials = new Set(['\\', '^', '$', '*', '+', '?', '.', '(', ')', '|', '{', '}', '[', ']', '-', '/']);
    let escaped = '';
    for (const char of value) {
      escaped += specials.has(char) ? `\\${char}` : char;
    }
    return escaped;
  }

  /**
   * Transcrit l'audio en texte
   */
  private async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult | null> {
    try {
      const result = await this.speechRecognitionService.transcribeAudioAutoLanguage(audioBlob).toPromise();
      return result || null;
    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      return null;
    }
  }

  /**
   * Génère un ID unique pour la session
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Met à jour l'état du service
   */
  private updateState(partialState: Partial<DiscussionState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...partialState });
  }

  /**
   * Affiche un toast
   */
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }
} 
