import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ToastController } from '@ionic/angular';
import { StorageService } from './storage.service';

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  private apiUrl = 'https://api.openai.com/v1/audio/transcriptions';

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private storageService: StorageService
  ) {}

  /**
   * Obtient la clé API OpenAI de l'utilisateur
   */
  private getApiKey(): string | null {
    return this.storageService.get('userOpenaiApiKey') || environment.openaiApiKey;
  }

  /**
   * Transcrit un fichier audio en texte
   */
  transcribeAudio(audioBlob: Blob, language: string = 'it'): Observable<TranscriptionResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.showErrorToast('Clé API OpenAI non configurée. Veuillez configurer votre clé API dans les paramètres.');
      return throwError(() => new Error('Clé API OpenAI non configurée'));
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'json');

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${apiKey}`);

    return this.http.post<any>(this.apiUrl, formData, { headers }).pipe(
      map(response => ({
        text: response.text || '',
        language: response.language,
        confidence: response.confidence
      })),
      catchError(error => {
        if (error.status === 401) {
          this.showErrorToast('Clé API OpenAI invalide. Veuillez vérifier votre clé API dans les paramètres.');
        } else {
          this.showErrorToast('Erreur lors de la transcription audio');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Transcrit un fichier audio avec détection automatique de la langue
   */
  transcribeAudioAutoLanguage(audioBlob: Blob): Observable<TranscriptionResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.showErrorToast('Clé API OpenAI non configurée. Veuillez configurer votre clé API dans les paramètres.');
      return throwError(() => new Error('Clé API OpenAI non configurée'));
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${apiKey}`);

    return this.http.post<any>(this.apiUrl, formData, { headers }).pipe(
      map(response => ({
        text: response.text || '',
        language: response.language,
        confidence: response.confidence
      })),
      catchError(error => {
        if (error.status === 401) {
          this.showErrorToast('Clé API OpenAI invalide. Veuillez vérifier votre clé API dans les paramètres.');
        } else {
          this.showErrorToast('Erreur lors de la transcription audio');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie si la clé API est configurée
   */
  isApiKeyConfigured(): boolean {
    const apiKey = this.getApiKey();
    return !!apiKey;
  }

  /**
   * Affiche un toast d'erreur
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    toast.present();
  }
} 
