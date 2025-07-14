import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DiscussionService, DiscussionContext, DiscussionSession } from '../../services/discussion.service';
import { Subscription } from 'rxjs';
import { SpeechService } from '../../services/speech.service';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { SavedConversationsService } from '../../services/saved-conversations.service';
import { TranslatableMessageComponent } from '../translatable-message/translatable-message.component';

@Component({
  selector: 'app-discussion-active',
  templateUrl: './discussion-active.component.html',
  styleUrls: ['./discussion-active.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AudioPlayerComponent,
    TranslatableMessageComponent
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
  
  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private discussionService: DiscussionService,
    private speechService: SpeechService,
    private cdRef: ChangeDetectorRef,
    private savedConversations: SavedConversationsService
  ) {
    console.log('🔍 DiscussionActiveComponent - Constructor appelé');
  }

  ngOnInit() {
    console.log('🔍 DiscussionActiveComponent - ngOnInit appelé');
    
    // Récupérer l'ID du contexte depuis l'URL
    this.route.params.subscribe(params => {
      this.contextId = params['contextId'] || 'aucun';
      const sessionId = this.route.snapshot.queryParamMap.get('sessionId');
      console.log('🔍 [CTX] Param contextId reçu dans URL:', this.contextId);
      if (sessionId) {
        // Charger la session sauvegardée
        const savedSession = this.savedConversations.getConversationById(sessionId);
        if (savedSession) {
          this.currentContext = savedSession.context;
          this.currentSession = savedSession;
          console.log('🔍 [CTX] Session sauvegardée chargée:', savedSession);
          // Pas de startDiscussion, on reprend l'existant
          return;
        } else {
          alert('Erreur : la conversation sauvegardée est introuvable.');
        }
      }
      // Trouver le contexte correspondant
      this.currentContext = this.discussionService.getDiscussionContexts()
        .find(context => context.id === this.contextId);
      console.log('🔍 [CTX] currentContext trouvé:', this.currentContext);
      if (this.currentContext) {
        console.log('🔍 DiscussionActiveComponent - Contexte trouvé:', this.currentContext);
        this.startDiscussion();
      } else {
        console.error('❌ DiscussionActiveComponent - Contexte non trouvé pour ID:', this.contextId);
        alert('Erreur : le contexte demandé n\'existe pas ou n\'est pas disponible.');
      }
    });

    // S'abonner aux changements d'état
    this.subscription.add(
      this.discussionService.state$.subscribe(state => {
        this.currentSession = state.currentSession;
        this.isLoading = state.isProcessing;
        this.isRecording = state.isRecording;
        console.log('🔍 [Vue] currentSession mis à jour:', this.currentSession);
        // Générer automatiquement l'audio pour chaque message IA sans audioUrl
        if (this.currentSession && this.currentSession.turns) {
          this.currentSession.turns.forEach((turn, idx) => {
            if (turn.speaker === 'ai' && !turn.audioUrl && turn.message) {
              console.log('🔍 [Vue] Génération audio pour message IA (tour', idx, '):', turn.message.substring(0, 50) + '...');
              
              // Créer un ID unique pour ce tour
              const turnId = `turn_${idx}_${turn.timestamp.getTime()}`;
              this.audioGeneratingTurns.add(turnId);
              
              this.speechService.generateSpeech(turn.message, 'nova', 1.0).subscribe({
                next: (audioUrl) => {
                  console.log('🔍 [Vue] Audio généré pour IA (tour', idx, '):', audioUrl);
                  turn.audioUrl = audioUrl;
                  this.audioGeneratingTurns.delete(turnId);
                  // Forcer la détection de changement en Angular
                  this.currentSession = { ...this.currentSession! };
                  console.log('🔍 [Vue] currentSession forcé après audioUrl:', this.currentSession);
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
        console.log('🔍 [Vue] État mis à jour:', state);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async startDiscussion() {
    if (!this.currentContext || this.isStarting) return;
    
    this.isStarting = true;
    console.log('🔍 DiscussionActiveComponent - Démarrage de la discussion...');
    
    try {
      const success = await this.discussionService.startDiscussion(this.currentContext);
      if (success) {
        console.log('🔍 DiscussionActiveComponent - Discussion démarrée avec succès');
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
    console.log('🔍 DiscussionActiveComponent - Démarrage de l\'enregistrement...');
    await this.discussionService.recordUserResponse();
  }

  async stopRecording() {
    console.log('🔍 DiscussionActiveComponent - Arrêt de l\'enregistrement...');
    try {
      // Attendre que l'enregistrement soit complètement arrêté
    await this.discussionService.stopRecording();
      console.log('🔍 DiscussionActiveComponent - Enregistrement arrêté, début du traitement...');
      
      // Ajouter un petit délai pour s'assurer que l'audio est prêt
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔍 DiscussionActiveComponent - Appel processUserResponse...');
      await this.discussionService.processUserResponse();
      console.log('🔍 DiscussionActiveComponent - processUserResponse terminé');
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur lors de l\'arrêt de l\'enregistrement:', error);
    }
  }

  /**
   * Vérifie si un tour est en cours de génération d'audio
   */
  isAudioGenerating(turnIndex: number, turn: any): boolean {
    const turnId = `turn_${turnIndex}_${turn.timestamp.getTime()}`;
    return this.audioGeneratingTurns.has(turnId);
  }
} 