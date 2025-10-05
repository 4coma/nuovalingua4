import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { AudioRecordingService, AudioRecordingState } from '../../services/audio-recording.service';
import { Subscription } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AudioPlayerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() audioUrl: string | null = null;
  @Input() showControls: boolean = true;
  @Input() autoPlay: boolean = false;
  @Input() loop: boolean = false;
  @Input() preload: 'none' | 'metadata' | 'auto' = 'metadata';
  @Input() isLoading: boolean = false;
  
  @Output() playEvent = new EventEmitter<void>();
  @Output() pauseEvent = new EventEmitter<void>();
  @Output() endedEvent = new EventEmitter<void>();
  @Output() timeUpdateEvent = new EventEmitter<number>();
  @Output() durationChangeEvent = new EventEmitter<number>();

  isPlaying = false;
  isPaused = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  playbackRate = 1;
  
  private audio: HTMLAudioElement | null = null;
  private stateSubscription: Subscription | null = null;
  private previousAudioUrl: string | null = null;

  constructor(private audioRecordingService: AudioRecordingService) {}

  ngOnInit() {
    if (this.audioUrl) {
      this.initAudio();
    }
    
    // S'abonner aux changements d'état du service d'enregistrement
    this.stateSubscription = this.audioRecordingService.state$.subscribe(state => {
      if (state.hasRecording) {
        this.isPlaying = state.isPlaying;
        this.currentTime = state.currentTime;
        this.duration = state.duration;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Détecter les changements de l'audioUrl
    if (changes['audioUrl'] && !changes['audioUrl'].firstChange) {
      const newAudioUrl = changes['audioUrl'].currentValue;
      const previousAudioUrl = changes['audioUrl'].previousValue;
      
      
      // Si l'URL a changé et qu'elle n'est pas null, réinitialiser l'audio
      if (newAudioUrl && newAudioUrl !== previousAudioUrl) {
        this.initAudio();
      }
    }
  }

  ngOnDestroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  private initAudio() {
    
    if (!this.audioUrl) {
      return;
    }

    // Si un audio existe déjà, le libérer
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }
    
    // Créer un nouvel élément audio
    this.audio = new Audio(this.audioUrl);
    this.audio.volume = this.volume;
    this.audio.playbackRate = this.playbackRate;
    this.audio.loop = this.loop;
    this.audio.preload = this.preload;

    // Ajouter les écouteurs d'événements
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        this.duration = this.audio.duration;
        this.durationChangeEvent.emit(this.duration);
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.currentTime = this.audio.currentTime;
        this.timeUpdateEvent.emit(this.currentTime);
      }
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.playEvent.emit();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.isPaused = true;
      this.pauseEvent.emit();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.endedEvent.emit();
    });

    this.audio.addEventListener('error', (error) => {
      console.error('🔍 AudioPlayer - Erreur lors du chargement de l\'audio:', error);
    });

    if (this.autoPlay) {
      this.play();
    }
  }

  play() {
    if (this.audio && this.audioUrl) {
      this.audio.play().catch(error => {
        console.error('🔍 AudioPlayer - Erreur lors de la lecture:', error);
      });
    } else if (this.audioRecordingService.getAudioUrl()) {
      this.audioRecordingService.playRecording();
    } else {
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    } else {
      this.audioRecordingService.pausePlaying();
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    } else {
      this.audioRecordingService.stopPlaying();
    }
  }

  seek(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.audio) {
      this.audio.volume = volume;
    }
  }

  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onSliderChange(event: any) {
    const time = event.detail.value;
    this.seek(time);
  }

  onVolumeChange(event: any) {
    const volume = event.detail.value / 100;
    this.setVolume(volume);
  }

  onPlaybackRateChange(event: any) {
    const rate = parseFloat(event.detail.value);
    this.setPlaybackRate(rate);
  }
} 