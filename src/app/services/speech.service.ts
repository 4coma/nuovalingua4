import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private apiUrl = 'https://api.openai.com/v1/audio/speech';
  private apiKey = environment.openaiApiKey;
  private loading: HTMLIonLoadingElement | null = null;
  private audio: HTMLAudioElement | null = null;
  
  // État de la lecture
  private _isPlaying: boolean = false;
  private _isPaused: boolean = false;
  private _duration: number = 0;
  private _currentTime: number = 0;
  private _playbackRate: number = 1.0;
  
  // Observable pour suivre les changements d'état
  private audioStateSubject = new Subject<{
    isPlaying: boolean;
    isPaused: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
  }>();

  private audioUrlSubject = new BehaviorSubject<string>('');
  public audioUrl$ = this.audioUrlSubject.asObservable();


  constructor(
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertController: AlertController,
    private storageService: StorageService
  ) {}

  /**
   * Convertit le texte en fichier audio et initialise la lecture
   */
  generateSpeech(text: string, voice: string = 'nova', speed: number = 1.0): Observable<string> {
    // Récupérer la clé API éventuellement définie par l'utilisateur
    const userApiKey = this.storageService.get('userOpenaiApiKey');
    const apiKeyToUse = userApiKey || this.apiKey;

    // Vérifier que la clé API est configurée
    if (!apiKeyToUse) {
      this.showApiKeyAlert();
      return of('');
    }
    
    // Suppression du loader global pour la génération d'audio
    // Le loader sera géré par le composant audio-player
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${apiKeyToUse}`);
    
    const data = {
      model: 'tts-1-hd',
      input: text,
      voice: voice, // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      response_format: 'mp3',
      speed: speed
    };

    return this.http.post(this.apiUrl, data, { 
      headers: headers,
      responseType: 'arraybuffer'
    }).pipe(
      map((response: ArrayBuffer) => {
        // Suppression de hideLoading() car il n'y a plus de loader global
        
        // Convertir la réponse en blob et créer une URL
        const blob = new Blob([response], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        this.audioUrlSubject.next(audioUrl);
        
        // Initialiser l'audio
        this.initAudio(audioUrl);
        
        return audioUrl;
      }),
      catchError(error => {
        // Suppression de hideLoading() car il n'y a plus de loader global
        this.showErrorToast('Erreur lors de la génération de l\'audio');
        
        // En cas d'erreur, utiliser l'API Web Speech comme fallback
        this.initWebSpeechAudio(text);
        
        // Retourner une URL factice pour éviter les erreurs dans le composant
        const fallbackUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        return of(fallbackUrl);
      })
    );
  }

  /**
   * Initialise l'élément audio
   */
  private initAudio(audioUrl: string): void {
    // Si un audio existe déjà, le libérer
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }
    
    // Créer un nouvel élément audio
    this.audio = new Audio(audioUrl);
    this.audio.playbackRate = this._playbackRate;
    
    // Ajouter les écouteurs d'événements
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        this._duration = this.audio.duration;
        this.updateAudioState();
      }
    });
    
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this._currentTime = this.audio.currentTime;
        this.updateAudioState();
      }
    });
    
    this.audio.addEventListener('ended', () => {
      this._isPlaying = false;
      this._isPaused = false;
      this.updateAudioState();
    });
    
    this.audio.addEventListener('pause', () => {
      this._isPlaying = false;
      this._isPaused = true;
      this.updateAudioState();
    });
    
    this.audio.addEventListener('play', () => {
      this._isPlaying = true;
      this._isPaused = false;
      this.updateAudioState();
    });
  }
  
  /**
   * Initialiser l'audio avec Web Speech API (fallback)
   */
  private initWebSpeechAudio(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT'; // Italien
    utterance.rate = this._playbackRate;
    utterance.onstart = () => {
      this._isPlaying = true;
      this._isPaused = false;
      this.updateAudioState();
    };
    utterance.onend = () => {
      this._isPlaying = false;
      this._isPaused = false;
      this.updateAudioState();
    };
    window.speechSynthesis.speak(utterance);
  }
  
  /**
   * Met à jour l'état de l'audio et notifie les abonnés
   */
  private updateAudioState(): void {
    this.audioStateSubject.next({
      isPlaying: this._isPlaying,
      isPaused: this._isPaused,
      currentTime: this._currentTime,
      duration: this._duration,
      playbackRate: this._playbackRate
    });
  }

  /**
   * Retourne un observable pour suivre l'état de l'audio
   */
  getAudioState(): Observable<any> {
    return this.audioStateSubject.asObservable();
  }

  /**
   * Démarre la lecture
   */
  play(): void {
    if (this.audio) {
      this.audio.play();
    }
  }

  /**
   * Met en pause la lecture
   */
  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  /**
   * Reprend la lecture après une pause
   */
  resume(): void {
    if (this.audio && this._isPaused) {
      this.audio.play();
    }
  }

  /**
   * Arrête la lecture et réinitialise
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this._isPlaying = false;
      this._isPaused = false;
      this.updateAudioState();
    }
  }

  /**
   * Avance de X secondes
   */
  forward(seconds: number = 10): void {
    if (this.audio) {
      this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + seconds);
    }
  }

  /**
   * Recule de X secondes
   */
  backward(seconds: number = 10): void {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, this.audio.currentTime - seconds);
    }
  }

  /**
   * Change la vitesse de lecture
   */
  setPlaybackRate(rate: number): void {
    this._playbackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
      this.updateAudioState();
    }
  }

  /**
   * Vérifie si l'audio est en cours de lecture
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Vérifie si l'audio est en pause
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Obtient la durée totale de l'audio
   */
  get duration(): number {
    return this._duration;
  }

  /**
   * Obtient la position actuelle dans l'audio
   */
  get currentTime(): number {
    return this._currentTime;
  }

  /**
   * Définit la position actuelle dans l'audio
   */
  set currentTime(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
      this._currentTime = time;
      this.updateAudioState();
    }
  }
  
  /**
   * Obtient la vitesse de lecture actuelle
   */
  get playbackRate(): number {
    return this._playbackRate;
  }

  /**
   * Affiche un indicateur de chargement
   */
  private async showLoading(message: string): Promise<void> {
    this.loading = await this.loadingCtrl.create({
      message: message,
      spinner: 'crescent'
    });
    await this.loading.present();
  }
  
  /**
   * Cache l'indicateur de chargement
   */
  private hideLoading(): void {
    if (this.loading) {
      this.loading.dismiss();
      this.loading = null;
    }
  }
  
  /**
   * Affiche un message d'erreur
   */
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  /**
   * Affiche une modale d'alerte pour la clé API non configurée
   */
  private async showApiKeyAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Clé API OpenAI non configurée',
      message: 'Veuillez configurer la clé API OpenAI dans le fichier environment.ts.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // Rediriger l'utilisateur vers la page de configuration
            // Par exemple, si vous avez une page de configuration à /config
            // window.location.href = '/config'; 
          }
        }
      ]
    });
    await alert.present();
  }
} 
