import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeechService } from '../../services/speech.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class AudioPlayerComponent implements OnInit, OnDestroy {
  @Input() text: string = '';
  
  audioUrl: string = '';
  isPlaying: boolean = false;
  isPaused: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  playbackRate: number = 1.0;
  
  // Options de vitesse
  speedOptions: number[] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  
  // Pour la barre de progression
  sliderValue: number = 0;
  isSliderChanging: boolean = false;
  
  // Pour nettoyer les abonnements
  private subscription: Subscription = new Subscription();

  constructor(private speechService: SpeechService) { }

  ngOnInit() {
    this.setupAudioStateSubscription();
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  
  /**
   * S'abonne aux changements d'état de l'audio
   */
  setupAudioStateSubscription() {
    this.subscription.add(
      this.speechService.getAudioState().subscribe(state => {
        this.isPlaying = state.isPlaying;
        this.isPaused = state.isPaused;
        this.currentTime = state.currentTime;
        this.duration = state.duration;
        this.playbackRate = state.playbackRate;
        
        if (!this.isSliderChanging) {
          this.sliderValue = this.currentTime;
        }
      })
    );
  }

  /**
   * Génère l'audio à partir du texte fourni
   */
  generateAndPlayAudio() {
    this.speechService.generateSpeech(this.text, 'nova').subscribe(url => {
      this.audioUrl = url;
      if (url) {
        this.playAudio();
      }
    });
  }
  
  /**
   * Lecture de l'audio
   */
  playAudio() {
    if (this.isPaused) {
      this.speechService.resume();
    } else if (!this.isPlaying) {
      if (this.audioUrl) {
        this.speechService.play();
      } else {
        this.generateAndPlayAudio();
      }
    }
  }
  
  /**
   * Pause de l'audio
   */
  pauseAudio() {
    this.speechService.pause();
  }
  
  /**
   * Arrêt de l'audio
   */
  stopAudio() {
    this.speechService.stop();
  }
  
  /**
   * Avance de 10 secondes
   */
  forwardAudio() {
    this.speechService.forward(10);
  }
  
  /**
   * Recule de 10 secondes
   */
  backwardAudio() {
    this.speechService.backward(10);
  }
  
  /**
   * Change la vitesse de lecture
   */
  changeSpeed(event: any) {
    if (event && event.detail && event.detail.value) {
      const speed = parseFloat(event.detail.value);
      if (!isNaN(speed)) {
        this.speechService.setPlaybackRate(speed);
      }
    }
  }
  
  /**
   * Appelé quand l'utilisateur commence à déplacer le curseur de progression
   */
  onSliderTouchStart() {
    this.isSliderChanging = true;
  }
  
  /**
   * Appelé quand l'utilisateur relâche le curseur de progression
   */
  onSliderTouchEnd() {
    this.isSliderChanging = false;
    this.speechService.currentTime = this.sliderValue;
  }
  
  /**
   * Appelé quand la valeur du curseur change
   */
  onSliderChange(event: any) {
    this.sliderValue = event.detail.value;
  }
  
  /**
   * Formatage du temps (secondes vers MM:SS)
   */
  formatTime(time: number): string {
    if (isNaN(time) || time === Infinity) return '00:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
} 