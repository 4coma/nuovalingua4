import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingController, ToastController, IonicModule } from '@ionic/angular';
import { AudioRecordingService, AudioRecordingState } from '../../services/audio-recording.service';
import { SpeechRecognitionService, TranscriptionResult } from '../../services/speech-recognition.service';
import { PermissionsService } from '../../services/permissions.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-record-test',
  templateUrl: './audio-record-test.component.html',
  styleUrls: ['./audio-record-test.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AudioRecordTestComponent implements OnInit, OnDestroy {
  state: AudioRecordingState = {
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
    duration: 0,
    currentTime: 0
  };
  
  // Pour la transcription
  transcription: TranscriptionResult | null = null;
  isTranscribing: boolean = false;
  showTranscription: boolean = false;
  
  private stateSubscription: Subscription | null = null;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private audioRecordingService: AudioRecordingService,
    private speechRecognitionService: SpeechRecognitionService,
    public permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    this.stateSubscription = this.audioRecordingService.state$.subscribe(state => {
      this.state = state;
    });
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
    this.audioRecordingService.cleanup();
  }

  async startRecording() {
    // Vérifier les permissions avant de démarrer l'enregistrement
    const hasPermission = await this.permissionsService.checkAndRequestAudioPermission();
    
    if (!hasPermission) {
      this.permissionsService.showAndroidInstructions();
      return;
    }
    
    // Afficher les instructions spécifiques à la plateforme
    if (this.permissionsService.isAndroid()) {
      this.permissionsService.showAndroidInstructions();
    } else if (this.permissionsService.isIOS()) {
      this.permissionsService.showIOSInstructions();
    }
    
    await this.audioRecordingService.startRecording();
  }

  stopRecording() {
    this.audioRecordingService.stopRecording();
  }

  playRecording() {
    this.audioRecordingService.playRecording();
  }

  stopPlaying() {
    this.audioRecordingService.stopPlaying();
  }

  pausePlaying() {
    this.audioRecordingService.pausePlaying();
  }

  resumePlaying() {
    this.audioRecordingService.resumePlaying();
  }

  downloadRecording() {
    this.audioRecordingService.downloadRecording();
  }

  clearRecording() {
    this.audioRecordingService.clearRecording();
  }

  testRecording() {
    // Simuler un enregistrement pour tester l'interface
    const testBlob = new Blob(['test audio data'], { type: 'audio/wav' });
    this.audioRecordingService['audioBlob'] = testBlob;
    this.audioRecordingService['audioUrl'] = URL.createObjectURL(testBlob);
    this.audioRecordingService['updateState']({ hasRecording: true, duration: 30 });
  }

  async transcribeRecording() {
    if (!this.audioRecordingService.getAudioBlob()) {
      this.showToast('Aucun enregistrement à transcrire');
      return;
    }

    if (!this.speechRecognitionService.isApiKeyConfigured()) {
      this.showToast('Clé API OpenAI non configurée');
      return;
    }

    this.isTranscribing = true;
    this.transcription = null;

    try {
      const audioBlob = this.audioRecordingService.getAudioBlob()!;
      this.speechRecognitionService.transcribeAudioAutoLanguage(audioBlob).subscribe({
        next: (result) => {
          this.transcription = result;
          this.isTranscribing = false;
          this.showTranscription = true;
          this.showToast('Transcription terminée');
        },
        error: (error) => {
          this.isTranscribing = false;
          console.error('Erreur de transcription:', error);
          this.showToast('Erreur lors de la transcription');
        }
      });
    } catch (error) {
      this.isTranscribing = false;
      console.error('Erreur lors de la transcription:', error);
      this.showToast('Erreur lors de la transcription');
    }
  }

  toggleTranscription() {
    this.showTranscription = !this.showTranscription;
  }

  clearTranscription() {
    this.transcription = null;
    this.showTranscription = false;
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  get isRecording(): boolean {
    return this.state.isRecording;
  }

  get isPlaying(): boolean {
    return this.state.isPlaying;
  }

  get hasRecording(): boolean {
    return this.state.hasRecording;
  }

  get duration(): number {
    return this.state.duration;
  }

  get currentTime(): number {
    return this.state.currentTime;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
} 