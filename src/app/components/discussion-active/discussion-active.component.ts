import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { DiscussionService, DiscussionContext, DiscussionSession } from '../../services/discussion.service';
import { Subscription } from 'rxjs';
import { SpeechService } from '../../services/speech.service';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';

@Component({
  selector: 'app-discussion-active',
  templateUrl: './discussion-active.component.html',
  styleUrls: ['./discussion-active.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AudioPlayerComponent
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
  
  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private discussionService: DiscussionService,
    private speechService: SpeechService,
    private cdRef: ChangeDetectorRef
  ) {
    console.log('🔍 DiscussionActiveComponent - Constructor appelé');
  }

  ngOnInit() {
    console.log('🔍 DiscussionActiveComponent - ngOnInit appelé');
    
    // Récupérer l'ID du contexte depuis l'URL
    this.route.params.subscribe(params => {
      this.contextId = params['contextId'] || 'aucun';
      console.log('🔍 DiscussionActiveComponent - Context ID:', this.contextId);
      
      // Trouver le contexte correspondant
      this.currentContext = this.discussionService.getDiscussionContexts()
        .find(context => context.id === this.contextId);
      
      if (this.currentContext) {
        console.log('🔍 DiscussionActiveComponent - Contexte trouvé:', this.currentContext);
        this.startDiscussion();
      } else {
        console.error('🔍 DiscussionActiveComponent - Contexte non trouvé pour ID:', this.contextId);
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
              this.speechService.generateSpeech(turn.message, 'nova', 1.0).subscribe({
                next: (audioUrl) => {
                  console.log('🔍 [Vue] Audio généré pour IA (tour', idx, '):', audioUrl);
                  turn.audioUrl = audioUrl;
                  // Forcer la détection de changement en Angular
                  this.currentSession = { ...this.currentSession! };
                  console.log('🔍 [Vue] currentSession forcé après audioUrl:', this.currentSession);
                  this.cdRef.detectChanges();
                },
                error: (error) => {
                  console.error('🔍 [Vue] Erreur génération audio IA:', error);
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
    await this.discussionService.stopRecording();
    try {
      console.log('🔍 DiscussionActiveComponent - Appel processUserResponse...');
      await this.discussionService.processUserResponse();
      console.log('🔍 DiscussionActiveComponent - processUserResponse terminé');
    } catch (error) {
      console.error('🔍 DiscussionActiveComponent - Erreur processUserResponse:', error);
    }
  }
} 