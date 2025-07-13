import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ToastController } from '@ionic/angular';

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
  private apiKey = environment.openaiApiKey;

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {}

  /**
   * Transcrit un fichier audio en texte
   */
  transcribeAudio(audioBlob: Blob, language: string = 'it'): Observable<TranscriptionResult> {
    if (!this.apiKey) {
      return throwError(() => new Error('Clé API OpenAI non configurée'));
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'json');

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.apiKey}`);

    return this.http.post<any>(this.apiUrl, formData, { headers }).pipe(
      map(response => ({
        text: response.text || '',
        language: response.language,
        confidence: response.confidence
      })),
      catchError(error => {
        console.error('Erreur lors de la transcription:', error);
        this.showErrorToast('Erreur lors de la transcription audio');
        return throwError(() => error);
      })
    );
  }

  /**
   * Transcrit un fichier audio avec détection automatique de la langue
   */
  transcribeAudioAutoLanguage(audioBlob: Blob): Observable<TranscriptionResult> {
    if (!this.apiKey) {
      return throwError(() => new Error('Clé API OpenAI non configurée'));
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.apiKey}`);

    return this.http.post<any>(this.apiUrl, formData, { headers }).pipe(
      map(response => ({
        text: response.text || '',
        language: response.language,
        confidence: response.confidence
      })),
      catchError(error => {
        console.error('Erreur lors de la transcription:', error);
        this.showErrorToast('Erreur lors de la transcription audio');
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie si la clé API est configurée
   */
  isApiKeyConfigured(): boolean {
    return !!this.apiKey;
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