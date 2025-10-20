import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DiscussionService, DiscussionContext, DiscussionSession } from '../../services/discussion.service';
import { Subscription } from 'rxjs';
import { SpeechService } from '../../services/speech.service';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { SavedConversationsService } from '../../services/saved-conversations.service';
import { TranslatableMessageComponent } from '../translatable-message/translatable-message.component';
import { MessageFeedbackComponent } from '../message-feedback/message-feedback.component';
import { FullRevisionService, FullRevisionWord } from '../../services/full-revision.service';
import { TranslationDirection } from '../../services/llm.service';

interface TargetVocabularyItem {
  word: string;
  translation: string;
  context?: string;
  used?: boolean;
}

interface TargetVocabularyMeta {
  category: string;
  topic: string;
  translationDirection: TranslationDirection;
  updatedAt: string;
  totalCount: number;
}

@Component({
  selector: 'app-discussion-active',
  templateUrl: './discussion-active.component.html',
  styleUrls: ['./discussion-active.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterLink,
    AudioPlayerComponent,
    TranslatableMessageComponent,
    MessageFeedbackComponent
  ]
})
export class DiscussionActiveComponent implements OnInit, OnDestroy {
  contextId: string = '';
  currentContext?: DiscussionContext;
  currentSession?: DiscussionSession;
  isLoading = true;
  isStarting = false;
  audioLoadingTurnId: string | null = null;
  isRecording = false;
  audioGeneratingTurns: Set<string> = new Set();
  responseMode: 'voice' | 'text' = 'voice';
  textResponse: string = '';
  fullRevisionActive = false;
  userRevisionWords: FullRevisionWord[] = [];
  remainingUserCount = 0;
  targetVocabulary: TargetVocabularyItem[] = [];
  targetVocabularyMeta?: TargetVocabularyMeta;

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private discussionService: DiscussionService,
    private speechService: SpeechService,
    private cdRef: ChangeDetectorRef,
    private savedConversations: SavedConversationsService,
    private fullRevisionService: FullRevisionService,
    private router: Router
  ) {
  }

  ngOnInit() {

    this.loadTargetVocabulary();

    // Récupérer l'ID du contexte depuis l'URL
    this.route.params.subscribe(params => {
      this.loadTargetVocabulary();
      this.contextId = params['contextId'] || 'aucun';
      const sessionId = this.route.snapshot.queryParamMap.get('sessionId');
      this.refreshFullRevisionState();
      if (sessionId) {
        // Charger la session sauvegardée
        const savedSession = this.savedConversations.getConversationById(sessionId);
        if (savedSession) {
          this.currentContext = savedSession.context;
          this.currentSession = savedSession;
          
          // Synchroniser l'état du service avec la session chargée
          this.discussionService.resumeSession(savedSession);
          this.refreshFullRevisionState();
          return;
        } else {
          alert('Erreur : la conversation sauvegardée est introuvable.');
        }
      }
      // Trouver le contexte correspondant
      this.currentContext = this.discussionService.getDiscussionContexts()
        .find(context => context.id === this.contextId);
      if (this.currentContext) {
        this.startDiscussion();
      } else {
        console.error('❌ DiscussionActiveComponent - Contexte non trouvé pour ID:', this.contextId);
        alert('Erreur : le contexte demandé n\'existe pas ou n\'est pas disponible.');
      }
      this.refreshFullRevisionState();
    });

    // S'abonner aux changements d'état
    this.subscription.add(
      this.discussionService.state$.subscribe(state => {
        this.currentSession = state.currentSession;
        this.isLoading = state.isProcessing;
        this.isRecording = state.isRecording;
        this.updateTargetVocabularyUsageFromSession();
        // Générer automatiquement l'audio pour chaque message IA sans audioUrl
        if (this.currentSession && this.currentSession.turns) {
          this.currentSession.turns.forEach((turn, idx) => {
            if (turn.speaker === 'ai' && !turn.audioUrl && turn.message) {
              
              // Créer un ID unique pour ce tour
              const turnId = `turn_${idx}_${turn.timestamp.getTime()}`;
              this.audioGeneratingTurns.add(turnId);
              
              this.speechService.generateSpeech(turn.message, 'nova', 1.0).subscribe({
                next: (audioUrl) => {
                  turn.audioUrl = audioUrl;
                  this.audioGeneratingTurns.delete(turnId);
                  // Forcer la détection de changement en Angular
                  this.currentSession = { ...this.currentSession! };
                  this.cdRef.detectChanges();
                },
                error: (error) => {
                  console.error('🔍 [Vue] Erreur génération audio IA:', error);
                  this.audioGeneratingTurns.delete(turnId);
                  this.cdRef.detectChanges();
                }
              });
            }
          });
        }
        this.refreshFullRevisionState();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async startDiscussion() {
    if (!this.currentContext || this.isStarting) return;
    
    this.isStarting = true;
    
    try {
      const success = await this.discussionService.startDiscussion(this.currentContext);
      if (success) {
        this.refreshFullRevisionState();
      } else {
        console.error('🔍 DiscussionActiveComponent - Échec du démarrage de la discussion');
      }
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur lors du démarrage:', error);
    } finally {
      this.isStarting = false;
    }
  }

  async startRecording() {
    await this.discussionService.recordUserResponse();
  }

  async stopRecording() {
    try {
      // Attendre que l'enregistrement soit complètement arrêté
    await this.discussionService.stopRecording();

      // Ajouter un petit délai pour s'assurer que l'audio est prêt
      await new Promise(resolve => setTimeout(resolve, 500));

      await this.discussionService.processUserResponse();
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur lors de l\'arrêt de l\'enregistrement:', error);
    }
  }

  private loadTargetVocabulary(): void {
    try {
      const stored = this.readStoredTargetVocabulary();
      if (stored) {
        this.applyTargetVocabulary(stored.items, stored.meta);
        return;
      }

      const rebuilt = this.rebuildTargetVocabularyFromSession();
      if (rebuilt) {
        this.applyTargetVocabulary(rebuilt.items, rebuilt.meta);
        this.persistTargetVocabulary(rebuilt.payload);
        return;
      }

      this.targetVocabulary = [];
      this.targetVocabularyMeta = undefined;
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur chargement vocabulaire ciblé:', error);
      this.targetVocabulary = [];
      this.targetVocabularyMeta = undefined;
    }
  }

  private readStoredTargetVocabulary(): { items: TargetVocabularyItem[]; meta: TargetVocabularyMeta } | null {
    const stored = localStorage.getItem('conversationTargetVocabulary');
    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
        return null;
      }

      const sessionMeta = parsed.session || {};
      const meta: TargetVocabularyMeta = {
        category: sessionMeta.category || 'Vocabulaire',
        topic: sessionMeta.topic || 'Session récente',
        translationDirection: (sessionMeta.translationDirection as TranslationDirection) || 'fr2it',
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        totalCount: parsed.items.length
      };

      const items: TargetVocabularyItem[] = parsed.items
        .map((item: any) => ({
          word: item.word,
          translation: item.translation,
          context: item.context
        }))
        .filter((item: any) => !!item.word && !!item.translation);

      if (items.length === 0) {
        return null;
      }

      return { items, meta };
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur parsing vocabulaire stocké:', error);
      return null;
    }
  }

  private rebuildTargetVocabularyFromSession(): {
    items: TargetVocabularyItem[];
    meta: TargetVocabularyMeta;
    payload: {
      items: { word: string; translation: string; context?: string }[];
      session: { category: string; topic: string; translationDirection: TranslationDirection };
      updatedAt: string;
    };
  } | null {
    const wordPairsRaw = localStorage.getItem('wordPairs');
    if (!wordPairsRaw) {
      return null;
    }

    const sessionInfoRaw = localStorage.getItem('sessionInfo');

    try {
      const wordPairs = JSON.parse(wordPairsRaw);
      if (!Array.isArray(wordPairs) || wordPairs.length === 0) {
        return null;
      }

      const sessionInfo = sessionInfoRaw ? JSON.parse(sessionInfoRaw) : null;
      const direction: TranslationDirection = (sessionInfo?.translationDirection as TranslationDirection) || 'fr2it';

      const items = wordPairs
        .map((pair: any) => {
          const italian = pair?.it ?? pair?.word ?? pair?.italian ?? pair?.sourceWord ?? '';
          const french = pair?.fr ?? pair?.translation ?? pair?.french ?? pair?.targetWord ?? '';
          if (!italian && !french) {
            return null;
          }

          const context = pair?.context || pair?.example || '';
          return {
            word: direction === 'fr2it' ? italian : french,
            translation: direction === 'fr2it' ? french : italian,
            context
          } as TargetVocabularyItem;
        })
        .filter((item): item is TargetVocabularyItem => !!item && !!item.word && !!item.translation);

      if (items.length === 0) {
        return null;
      }

      const updatedAt = new Date().toISOString();
      const meta: TargetVocabularyMeta = {
        category: sessionInfo?.category || 'Vocabulaire',
        topic: sessionInfo?.topic || 'Session récente',
        translationDirection: direction,
        updatedAt,
        totalCount: items.length
      };

      const payload = {
        items: items.map(item => ({
          word: item.word,
          translation: item.translation,
          context: item.context
        })),
        session: {
          category: meta.category,
          topic: meta.topic,
          translationDirection: direction
        },
        updatedAt
      };

      return { items, meta, payload };
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur reconstruction vocabulaire:', error);
      return null;
    }
  }

  private applyTargetVocabulary(items: TargetVocabularyItem[], meta: TargetVocabularyMeta): void {
    this.targetVocabulary = items.map(item => ({ ...item, used: false }));
    this.targetVocabularyMeta = { ...meta, totalCount: items.length };
    this.updateTargetVocabularyUsageFromSession();
  }

  private persistTargetVocabulary(payload: {
    items: { word: string; translation: string; context?: string }[];
    session: { category: string; topic: string; translationDirection: TranslationDirection };
    updatedAt: string;
  }): void {
    try {
      localStorage.setItem('conversationTargetVocabulary', JSON.stringify(payload));
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur persistance vocabulaire reconstruit:', error);
    }
  }

  private updateTargetVocabularyUsageFromSession(): void {
    if (!this.currentSession || this.targetVocabulary.length === 0) {
      return;
    }

    this.currentSession.turns
      .filter(turn => turn.speaker === 'user' && !!turn.message)
      .forEach(turn => this.markTargetVocabularyUsage(turn.message!));
  }

  private markTargetVocabularyUsage(message: string): void {
    if (!message || this.targetVocabulary.length === 0) {
      return;
    }

    const normalizedText = this.normalizeForComparison(message).replace(/[^a-z0-9\s]/g, ' ');

    this.targetVocabulary.forEach(item => {
      if (item.used) {
        return;
      }

      const normalizedWord = this.normalizeForComparison(item.word);
      if (!normalizedWord) {
        return;
      }

      const pattern = new RegExp(`\\b${this.escapeRegExp(normalizedWord)}\\b`, 'i');
      if (pattern.test(normalizedText)) {
        item.used = true;
      }
    });
  }

  private normalizeForComparison(value: string): string {
    return value
      ? value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/[\u0300-\u036f]/g, '')
      : '';
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private refreshFullRevisionState(): void {
    const session = this.fullRevisionService.getSession();
    if (!session) {
      this.fullRevisionActive = false;
      this.userRevisionWords = [];
      this.remainingUserCount = 0;
      return;
    }

    const isRelevantStage = session.stage === 'conversation' || session.stage === 'encoding';
    this.fullRevisionActive = isRelevantStage && (this.contextId === 'full-revision' || session.stage === 'encoding');

    if (!this.fullRevisionActive) {
      this.userRevisionWords = [];
      this.remainingUserCount = 0;
      return;
    }

    this.userRevisionWords = this.fullRevisionService.getWordsByAssignment('user');
    this.remainingUserCount = this.userRevisionWords.filter(word => !word.usedByUser).length;
  }

  getRemainingUserWords(): FullRevisionWord[] {
    return this.userRevisionWords.filter(word => !word.usedByUser);
  }

  isLastAiTurn(index: number): boolean {
    if (!this.currentSession) {
      return false;
    }
    for (let i = this.currentSession.turns.length - 1; i >= 0; i--) {
      if (this.currentSession.turns[i].speaker === 'ai') {
        return i === index;
      }
    }
    return false;
  }

  /**
   * Vérifie si un tour est en cours de génération d'audio
   */
  isAudioGenerating(turnIndex: number, turn: any): boolean {
    const turnId = `turn_${turnIndex}_${turn.timestamp.getTime()}`;
    return this.audioGeneratingTurns.has(turnId);
  }

  /**
   * Gère le changement de mode de réponse
   */
  onResponseModeChange() {
    // Réinitialiser la réponse texte lors du changement de mode
    if (this.responseMode === 'voice') {
      this.textResponse = '';
    }
  }

  /**
   * Envoie la réponse texte
   */
  async sendTextResponse() {
    if (!this.textResponse.trim() || this.isLoading) {
      return;
    }

    
    try {
      // Traiter la réponse avec l'IA (le service ajoute le message utilisateur)
      await this.discussionService.processTextResponse(this.textResponse.trim());
      // Vider le champ de texte
      this.textResponse = '';
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur lors de l\'envoi de la réponse texte:', error);
    }
  }

  goToEncoding(): void {
    const exercise = this.fullRevisionService.getVocabularyExercisePayload();
    const sessionInfo = this.fullRevisionService.getSessionInfoSummary();

    if (exercise) {
      localStorage.setItem('vocabularyExercise', JSON.stringify(exercise));
    }
    if (sessionInfo) {
      localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
    }

    this.fullRevisionService.setStage('encoding');
    this.router.navigate(['/vocabulary']);
  }
}
