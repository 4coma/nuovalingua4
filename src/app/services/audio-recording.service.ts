import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';

export interface AudioRecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  hasRecording: boolean;
  duration: number;
  currentTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioBlob: Blob | null = null;
  private audioUrl: string | null = null;
  private audio: HTMLAudioElement | null = null;
  private stream: MediaStream | null = null;
  
  private stateSubject = new BehaviorSubject<AudioRecordingState>({
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
    duration: 0,
    currentTime: 0
  });

  public state$ = this.stateSubject.asObservable();

  constructor(private toastCtrl: ToastController) {}

  /**
   * Démarre l'enregistrement audio
   */
  async startRecording(): Promise<boolean> {
    try {
      // Vérifier si l'enregistrement audio est supporté
      if (!this.isAudioRecordingSupported()) {
        this.showToast('Enregistrement audio non supporté sur cet appareil');
        return false;
      }

      // Demander les permissions avec gestion spécifique pour Android
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Paramètres spécifiques pour Android
          sampleRate: 44100,
          channelCount: 1
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Créer le MediaRecorder avec des options spécifiques pour Android
      const options = {
        mimeType: this.getSupportedMimeType()
      };
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        console.log('🔍 AudioRecordingService - mediaRecorder.onstop déclenché');
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        console.log('🔍 AudioRecordingService - audioBlob créé', this.audioBlob);
        this.updateState({ hasRecording: true });
        this.showToast('Enregistrement terminé');
      };
      
      this.mediaRecorder.start();
      this.updateState({ isRecording: true });
      this.showToast('Enregistrement démarré');
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'accès au microphone:', error);
      
      // Gestion spécifique des erreurs de permission
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          this.showToast('Permission microphone refusée. Veuillez autoriser l\'accès au microphone dans les paramètres.');
        } else if (error.name === 'NotFoundError') {
          this.showToast('Aucun microphone trouvé sur cet appareil.');
        } else if (error.name === 'NotSupportedError') {
          this.showToast('Enregistrement audio non supporté sur cet appareil.');
        } else {
          this.showToast(`Erreur d'accès au microphone: ${error.message}`);
        }
      } else {
        this.showToast('Erreur: Impossible d\'accéder au microphone');
      }
      
      return false;
    }
  }

  /**
   * Arrête l'enregistrement audio
   */
  stopRecording(): Promise<void> {
    console.log('🔍 AudioRecordingService - stopRecording appelé');
    if (this.mediaRecorder && this.stateSubject.value.isRecording) {
      const recorder = this.mediaRecorder;
      return new Promise<void>((resolve) => {
        if (recorder) {
          recorder.onstop = () => {
            console.log('🔍 AudioRecordingService - mediaRecorder.onstop déclenché');
            this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            this.audioUrl = URL.createObjectURL(this.audioBlob);
            console.log('🔍 AudioRecordingService - audioBlob créé', this.audioBlob);
            this.updateState({ hasRecording: true });
            this.showToast('Enregistrement terminé');
            resolve();
          };
          recorder.stop();
          console.log('🔍 AudioRecordingService - mediaRecorder.stop() appelé');
        }
        this.stopStream();
        this.updateState({ isRecording: false });
      });
    } else {
      console.warn('🔍 AudioRecordingService - stopRecording ignoré (pas d\'enregistrement en cours)');
      return Promise.resolve();
    }
  }

  /**
   * Joue l'enregistrement audio
   */
  playRecording(): void {
    if (this.audioUrl && this.audioBlob) {
      this.audio = new Audio(this.audioUrl);
      
      this.audio.addEventListener('loadedmetadata', () => {
        this.updateState({ duration: this.audio!.duration });
      });
      
      this.audio.addEventListener('timeupdate', () => {
        this.updateState({ currentTime: this.audio!.currentTime });
      });
      
      this.audio.addEventListener('ended', () => {
        this.updateState({ isPlaying: false, currentTime: 0 });
      });
      
      this.audio.addEventListener('error', () => {
        this.updateState({ isPlaying: false });
        this.showToast('Erreur lors de la lecture');
      });
      
      this.audio.play();
      this.updateState({ isPlaying: true });
    }
  }

  /**
   * Arrête la lecture
   */
  stopPlaying(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.updateState({ isPlaying: false, currentTime: 0 });
    }
  }

  /**
   * Met en pause la lecture
   */
  pausePlaying(): void {
    if (this.audio && this.stateSubject.value.isPlaying) {
      this.audio.pause();
      this.updateState({ isPlaying: false });
    }
  }

  /**
   * Reprend la lecture
   */
  resumePlaying(): void {
    if (this.audio && !this.stateSubject.value.isPlaying) {
      this.audio.play();
      this.updateState({ isPlaying: true });
    }
  }

  /**
   * Télécharge l'enregistrement audio
   */
  downloadRecording(filename: string = 'enregistrement_audio.wav'): void {
    if (this.audioBlob) {
      const url = URL.createObjectURL(this.audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('Téléchargement terminé');
    }
  }

  /**
   * Efface l'enregistrement
   */
  clearRecording(): void {
    this.audioBlob = null;
    this.audioUrl = null;
    this.audioChunks = [];
    
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    
    this.updateState({
      isPlaying: false,
      hasRecording: false,
      duration: 0,
      currentTime: 0
    });
    
    this.showToast('Enregistrement effacé');
  }

  /**
   * Obtient l'URL de l'enregistrement
   */
  getAudioUrl(): string | null {
    return this.audioUrl;
  }

  /**
   * Obtient le blob de l'enregistrement
   */
  getAudioBlob(): Blob | null {
    console.log('🔍 AudioRecordingService - getAudioBlob appelé, retourne:', this.audioBlob);
    return this.audioBlob;
  }

  /**
   * Vérifie si l'enregistrement audio est supporté
   */
  isAudioRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Obtient le type MIME supporté pour l'enregistrement
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    // Fallback par défaut
    return '';
  }

  /**
   * Met à jour l'état du service
   */
  private updateState(partialState: Partial<AudioRecordingState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...partialState });
  }

  /**
   * Arrête le flux audio
   */
  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Affiche un toast
   */
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    this.stopRecording();
    this.stopPlaying();
    this.stopStream();
    
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }
} 