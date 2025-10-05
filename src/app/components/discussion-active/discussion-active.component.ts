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
    
    // Récupérer l'ID du contexte depuis l'URL
    this.route.params.subscribe(params => {
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
