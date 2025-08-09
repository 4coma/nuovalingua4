import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WordPair } from '../../services/llm.service';
import { SpacedRepetitionService } from '../../services/spaced-repetition.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { WordListModalComponent } from '../word-list-modal/word-list-modal.component';
import { ThemeSelectionModalComponent } from '../theme-selection-modal/theme-selection-modal.component';
import { TextGeneratorService } from '../../services/text-generator.service';
import { AudioRecordingService, AudioRecordingState } from '../../services/audio-recording.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { PermissionsService } from '../../services/permissions.service';

interface QualityOption {
  value: number;
  label: string;
  description: string;
  color: string;
}

interface ExerciseItem {
  wordPair: WordPair;
  direction: 'fr2it' | 'it2fr';
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  completed: boolean;
}

@Component({
  selector: 'app-spaced-repetition-exercise',
  templateUrl: './spaced-repetition-exercise.component.html',
  styleUrls: ['./spaced-repetition-exercise.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class SpacedRepetitionExerciseComponent implements OnInit, OnDestroy {
  pageTitle: string = 'Mémorisation espacée';
  
  wordPairs: WordPair[] = [];
  exerciseItems: ExerciseItem[] = [];
  currentIndex = 0;
  exerciseCompleted = false;
  
  // Pour l'encodage
  currentAnswer: string = '';
  answerSubmitted: boolean = false;
  isCorrect: boolean = false;

  // Enregistrement vocal
  recordingState: AudioRecordingState = {
    isRecording: false,
    isPlaying: false,
    hasRecording: false,
    duration: 0,
    currentTime: 0
  };
  isTranscribing: boolean = false;

  private stateSubscription: any = null;
  
  // Pour l'évaluation de qualité
  showQualityOptions = false;
  currentWordId: string = '';
  
  qualityOptions: QualityOption[] = [
    { value: 0, label: 'Incorrect', description: 'Je ne connaissais pas du tout', color: 'danger' },
    { value: 1, label: 'Très difficile', description: 'J\'ai eu beaucoup de mal', color: 'warning' },
    { value: 2, label: 'Difficile', description: 'J\'ai eu du mal', color: 'medium' },
    { value: 3, label: 'Correct', description: 'J\'ai réussi', color: 'success' },
    { value: 4, label: 'Facile', description: 'C\'était facile', color: 'primary' },
    { value: 5, label: 'Excellent', description: 'C\'était très facile', color: 'tertiary' }
  ];
  
  // Statistiques
  stats = {
    totalWords: 0,
    dueForReview: 0,
    averageEF: 2.5,
    nextReviewDate: null as Date | null
  };
  
  // Pour la nouvelle évaluation en fin de session
  reviewedWords: Array<{
    fr: string;
    it: string;
    userAnswers: { fr2it: string; it2fr: string };
    isCorrectFr2It: boolean;
    isCorrectIt2Fr: boolean;
    context?: string;
    quality: number;
  }> = [];

  private autoSaved = false;

  constructor(
    private router: Router,
    private spacedRepetitionService: SpacedRepetitionService,
    private vocabularyTrackingService: VocabularyTrackingService,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private textGeneratorService: TextGeneratorService,
    private audioRecordingService: AudioRecordingService,
    private speechRecognitionService: SpeechRecognitionService,
    private permissionsService: PermissionsService
  ) { }
  
  ngOnInit() {
    this.loadSession();
    this.loadStats();
    this.stateSubscription = this.audioRecordingService.state$.subscribe(state => {
      this.recordingState = state;
    });
  }
  
  /**
   * Charge la session de mémorisation espacée
   */
  loadSession() {
    this.spacedRepetitionService.generateSpacedRepetitionSession().subscribe({
      next: (wordPairs) => {
        this.wordPairs = wordPairs;
        if (wordPairs.length === 0) {
          this.showToast('Aucun mot à réviser pour le moment. Continuez à utiliser l\'application pour accumuler du vocabulaire !');
          this.router.navigate(['/home']);
          return;
        }
        
        // Créer les items d'exercice avec les deux directions pour chaque mot
        this.exerciseItems = [];
        wordPairs.forEach(pair => {
          // Item fr → it
          this.exerciseItems.push({
            wordPair: pair,
            direction: 'fr2it',
            question: pair.fr,
            expectedAnswer: pair.it,
            userAnswer: '',
            isCorrect: false,
            completed: false
          });

          // Item it → fr
          this.exerciseItems.push({
            wordPair: pair,
            direction: 'it2fr',
            question: pair.it,
            expectedAnswer: pair.fr,
            userAnswer: '',
            isCorrect: false,
            completed: false
          });
        });

        // Mélanger les items pour éviter d'avoir les deux sens d'un même mot à la suite
        this.exerciseItems = this.shuffleExerciseItems(this.exerciseItems);
        
        console.log('🔍 [SpacedRepetition] Items d\'exercice créés:', this.exerciseItems.length);
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la session:', error);
        this.showToast('Erreur lors du chargement de la session');
        this.router.navigate(['/home']);
      }
    });
  }
  
  /**
   * Charge les statistiques de mémorisation espacée
   */
  loadStats() {
    this.stats = this.spacedRepetitionService.getSpacedRepetitionStats();
  }

  ngOnDestroy() {
    this.autoSaveSession();
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
    this.audioRecordingService.cleanup();
  }

  /**
   * Enregistre les résultats de la session si ce n'est pas déjà fait
   */
  private autoSaveSession() {
    if (this.autoSaved || this.reviewedWords.length === 0) {
      return;
    }

    for (const word of this.reviewedWords) {
      const wordId = this.vocabularyTrackingService.generateWordId(word.it, word.fr);
      this.spacedRepetitionService.updateWordAfterReview(wordId, word.quality);
    }

    this.autoSaved = true;
  }

  /**
   * Démarre ou arrête l'enregistrement selon l'état actuel
   */
  async toggleRecording() {
    if (this.recordingState.isRecording) {
      // Si on enregistre, on arrête
      await this.stopRecording();
    } else {
      // Si on n'enregistre pas, on démarre
      await this.startRecording();
    }
  }

  /**
   * Démarre l'enregistrement
   */
  private async startRecording() {
    const hasPermission = await this.permissionsService.checkAndRequestAudioPermission();
    if (!hasPermission) {
      this.permissionsService.showAndroidInstructions();
      return;
    }

    if (this.permissionsService.isAndroid()) {
      this.permissionsService.showAndroidInstructions();
    } else if (this.permissionsService.isIOS()) {
      this.permissionsService.showIOSInstructions();
    }

    await this.audioRecordingService.startRecording();
  }

  /**
   * Arrête l'enregistrement et lance la transcription
   */
  private async stopRecording() {
    await this.audioRecordingService.stopRecording();

    const audioBlob = this.audioRecordingService.getAudioBlob();
    if (!audioBlob) {
      return;
    }

    const currentItem = this.exerciseItems[this.currentIndex];
    const language = currentItem.direction === 'fr2it' ? 'it' : 'fr';

    this.isTranscribing = true;

    this.speechRecognitionService.transcribeAudio(audioBlob, language).subscribe({
      next: (result) => {
        this.currentAnswer = result.text;
        this.isTranscribing = false;
      },
      error: () => {
        this.isTranscribing = false;
        this.showToast('Erreur lors de la transcription');
      }
    });
  }

  /**
   * Retourne l'icône appropriée pour le bouton d'enregistrement
   */
  getRecordingIcon(): string {
    if (this.recordingState.isRecording) {
      return 'square'; // Icône stop quand on enregistre
    }
    return 'mic-outline'; // Icône micro quand on n'enregistre pas
  }

  /**
   * Retourne la couleur appropriée pour le bouton d'enregistrement
   */
  getRecordingColor(): string {
    if (this.recordingState.isRecording) {
      return 'danger'; // Rouge quand on enregistre
    }
    return 'secondary'; // Couleur normale quand on n'enregistre pas
  }

  /**
   * Normalise une chaîne pour la comparaison des réponses
   * - Ignore la casse
   * - Supprime les espaces en début et fin
   * - Retire la ponctuation et les caractères spéciaux aux extrémités
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '');
  }
  
  /**
   * Soumet la réponse de l'utilisateur
   */
  submitAnswer() {
    if (!this.currentAnswer.trim() || this.answerSubmitted) return;
    
    const currentItem = this.exerciseItems[this.currentIndex];

    // Vérifier si la réponse est correcte en ignorant la casse et la ponctuation aux extrémités
    this.isCorrect =
      this.normalizeText(this.currentAnswer) ===
      this.normalizeText(currentItem.expectedAnswer);

    // Mettre à jour l'item actuel
    currentItem.userAnswer = this.currentAnswer.trim();
    currentItem.isCorrect = this.isCorrect;
    currentItem.completed = true;
    
    this.answerSubmitted = true;
    
    if (this.isCorrect) {
      // Passage automatique si la réponse est correcte
      setTimeout(() => {
        this.nextQuestion();
      }, 800);
    }
    // Sinon, attendre le clic sur "Suivant"
  }

  /**
   * Passe la question actuelle en la marquant comme correcte
   * et attribue automatiquement la meilleure qualité.
   */
  passQuestion() {
    const currentItem = this.exerciseItems[this.currentIndex];

    // Marquer l'item courant comme correctement répondu
    currentItem.userAnswer = currentItem.expectedAnswer;
    currentItem.isCorrect = true;
    currentItem.completed = true;

    // Marquer également l'item dans l'autre sens comme correct et complété
    const counterpart = this.exerciseItems.find(
      item =>
        !item.completed &&
        item.wordPair.fr === currentItem.wordPair.fr &&
        item.wordPair.it === currentItem.wordPair.it &&
        item.direction !== currentItem.direction
    );

    if (counterpart) {
      counterpart.userAnswer = counterpart.expectedAnswer;
      counterpart.isCorrect = true;
      counterpart.completed = true;
    }

    // Passer directement à la question suivante
    this.nextQuestion();
  }

  /**
   * Passe au mot suivant après clic sur "Suivant"
   */
  nextQuestion() {
    this.currentAnswer = '';
    this.answerSubmitted = false;
    this.isCorrect = false;
    this.currentIndex++;
    // Sauter les items déjà complétés (utile après un passage)
    while (this.currentIndex < this.exerciseItems.length && this.exerciseItems[this.currentIndex].completed) {
      this.currentIndex++;
    }
    // Vérifier si on a terminé tous les items
    if (this.currentIndex >= this.exerciseItems.length) {
      this.prepareReviewSummary();
      this.exerciseCompleted = true;
    }
  }
  
  /**
   * Prépare le récapitulatif de session en regroupant les réponses par mot
   */
  prepareReviewSummary() {
    this.reviewedWords = [];
    
    // Grouper les items par mot (chaque mot a 2 items : fr2it et it2fr)
    const wordGroups = new Map<string, ExerciseItem[]>();
    
    this.exerciseItems.forEach(item => {
      const wordKey = `${item.wordPair.fr}-${item.wordPair.it}`;
      if (!wordGroups.has(wordKey)) {
        wordGroups.set(wordKey, []);
      }
      wordGroups.get(wordKey)!.push(item);
    });
    
    // Créer le récapitulatif pour chaque mot
    wordGroups.forEach((items, wordKey) => {
      const fr2itItem = items.find(item => item.direction === 'fr2it');
      const it2frItem = items.find(item => item.direction === 'it2fr');
      
      if (fr2itItem && it2frItem) {
        // Calculer une qualité basée sur les deux réponses
        let quality = 0;
        if (fr2itItem.isCorrect && it2frItem.isCorrect) {
          quality = 5; // Excellent - correct dans les deux sens
        } else if (fr2itItem.isCorrect || it2frItem.isCorrect) {
          quality = 3; // Correct - correct dans un sens
        } else {
          quality = 1; // Difficile - incorrect dans les deux sens
        }
        
        this.reviewedWords.push({
          fr: fr2itItem.wordPair.fr,
          it: fr2itItem.wordPair.it,
          userAnswers: {
            fr2it: fr2itItem.userAnswer,
            it2fr: it2frItem.userAnswer
          },
          isCorrectFr2It: fr2itItem.isCorrect,
          isCorrectIt2Fr: it2frItem.isCorrect,
          context: fr2itItem.wordPair.context,
          quality: quality
        });
      }
    });
    
    console.log('🔍 [SpacedRepetition] Récapitulatif préparé:', this.reviewedWords);
  }
  
  /**
   * Évalue la qualité de la réponse pour le mot actuel
   */
  evaluateQuality(quality: number) {
    // Cette méthode n'est plus utilisée dans le nouveau flux
  }
  
  /**
   * Affiche les options de qualité pour le mot actuel
   */
  showQualityEvaluation() {
    if (this.currentIndex >= this.exerciseItems.length) return;
    
    const currentItem = this.exerciseItems[this.currentIndex];
    this.currentWordId = this.vocabularyTrackingService.generateWordId(currentItem.wordPair.it, currentItem.wordPair.fr);
    this.showQualityOptions = true;
  }
  
  /**
   * Termine l'exercice et retourne à l'accueil
   */
  finishExercise() {
    this.autoSaveSession();
    this.router.navigate(['/home']);
  }

  // Quand l'utilisateur valide la session, on applique SM-2 à tous les mots
  async validateSession() {
    console.log('🔍 [SpacedRepetition] validateSession() appelée');
    console.log('🔍 [SpacedRepetition] Mots à traiter:', this.reviewedWords);

    this.autoSaveSession();
    
    // Vérifier s'il reste des mots à revoir
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    const dueWords = allWords.filter(w => w.nextReview && w.nextReview <= Date.now());
    const alreadyDone = new Set(this.reviewedWords.map(w => this.vocabularyTrackingService.generateWordId(w.it, w.fr)));
    const remaining = dueWords.filter(w => !alreadyDone.has(w.id));
    
    if (remaining.length > 0) {
      const alert = await this.alertController.create({
        header: 'Mots à réviser restants',
        message: `Il vous reste ${remaining.length} mot(s) à réviser. Voulez-vous continuer la session avec les mots restants ?`,
        buttons: [
          {
            text: 'Continuer',
            handler: () => {
              this.startNewSessionWithWords(remaining);
            }
          },
          {
            text: 'Retour au menu',
            role: 'cancel',
            handler: () => {
              this.resetComponent();
              this.router.navigate(['/home']);
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.showToast('Session enregistrée ! Les mots ont été mis à jour.');
      this.resetComponent();
      this.router.navigate(['/home']);
    }
  }

  /**
   * Démarre une nouvelle session avec les mots restants
   */
  startNewSessionWithWords(words: any[]) {
    // Réinitialiser complètement le composant
    this.resetComponent();
    
    // Créer des WordPairs à partir des mots restants
    const wordPairs: WordPair[] = words.map(word => ({
      it: word.word,
      fr: word.translation,
      context: word.context
    }));
    
    // Créer les items d'exercice avec les deux directions pour chaque mot
    this.exerciseItems = [];
    wordPairs.forEach(pair => {
      // Item fr → it
      this.exerciseItems.push({
        wordPair: pair,
        direction: 'fr2it',
        question: pair.fr,
        expectedAnswer: pair.it,
        userAnswer: '',
        isCorrect: false,
        completed: false
      });

      // Item it → fr
      this.exerciseItems.push({
        wordPair: pair,
        direction: 'it2fr',
        question: pair.it,
        expectedAnswer: pair.fr,
        userAnswer: '',
        isCorrect: false,
        completed: false
      });
    });

    // Mélanger les items pour éviter les doublons consécutifs
    this.exerciseItems = this.shuffleExerciseItems(this.exerciseItems);
    
    console.log('🔍 [SpacedRepetition] Nouvelle session avec mots restants:', this.exerciseItems.length, 'items');
  }

  /**
   * Réinitialise complètement le composant pour une nouvelle session
   */
  resetComponent() {
    this.wordPairs = [];
    this.exerciseItems = [];
    this.currentIndex = 0;
    this.exerciseCompleted = false;
    this.currentAnswer = '';
    this.answerSubmitted = false;
    this.isCorrect = false;
    this.reviewedWords = [];
    this.showQualityOptions = false;
    this.currentWordId = '';
    this.autoSaved = false;
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  async showAllTrackedWords() {
    const words = this.vocabularyTrackingService.getAllTrackedWords();
    const modal = await this.modalController.create({
      component: WordListModalComponent,
      componentProps: {
        title: 'Tous les mots suivis',
        words: words
      }
    });
    await modal.present();
  }

  async showDueWords() {
    const words = this.vocabularyTrackingService.getAllTrackedWords();
    const dueWords = words.filter(w => w.nextReview === undefined || w.nextReview <= Date.now());
    const modal = await this.modalController.create({
      component: WordListModalComponent,
      componentProps: {
        title: 'Mots à réviser',
        words: dueWords
      }
    });
    await modal.present();
  }

  get hasRemainingWords(): boolean {
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    const dueWords = allWords.filter(w => w.nextReview && w.nextReview <= Date.now());
    const alreadyDone = new Set(this.reviewedWords.map(w => this.vocabularyTrackingService.generateWordId(w.it, w.fr)));
    const remaining = dueWords.filter(w => !alreadyDone.has(w.id));
    return remaining.length > 0;
  }

  async launchComprehension(type: 'written' | 'oral') {
    this.autoSaveSession();
    // Ouvre le modal pour le choix des thèmes
    const modal = await this.modalController.create({
      component: ThemeSelectionModalComponent,
      cssClass: 'theme-selection-modal'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    const selectedThemes = data?.themes || [];

    // Prépare la liste des mots révisés
    const wordPairs = this.reviewedWords.map(w => ({
      it: w.it,
      fr: w.fr,
      context: w.context
    }));

    // Récupère ou construit sessionInfo
    let sessionInfo = null;
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    if (sessionInfoJson) {
      sessionInfo = JSON.parse(sessionInfoJson);
    } else {
      sessionInfo = {
        category: 'Mémorisation espacée',
        topic: 'Révision',
        date: new Date().toISOString()
      };
    }
    if (selectedThemes && selectedThemes.length > 0) {
      sessionInfo.themes = selectedThemes;
    }
    localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));

    this.textGeneratorService.generateComprehensionText(wordPairs, type, selectedThemes).subscribe({
      next: (result) => {
        // PATCH : garantir la présence de vocabularyItems
        if (!result.vocabularyItems || !Array.isArray(result.vocabularyItems) || result.vocabularyItems.length === 0) {
          result.vocabularyItems = wordPairs.map(pair => ({ word: pair.it, translation: pair.fr, context: pair.context }));
        }
        localStorage.setItem('comprehensionText', JSON.stringify(result));
        this.router.navigate(['/comprehension']);
      },
      error: (error) => {
        console.error('Erreur lors de la génération du texte de compréhension:', error);
        this.showToast('Erreur lors de la génération du texte. Veuillez réessayer.');
      }
    });
  }

  continueRevision() {
    this.autoSaveSession();
    // Relance la révision avec les mots restants
    const allWords = this.vocabularyTrackingService.getAllTrackedWords();
    const dueWords = allWords.filter(w => w.nextReview && w.nextReview <= Date.now());
    const alreadyDone = new Set(this.reviewedWords.map(w => this.vocabularyTrackingService.generateWordId(w.it, w.fr)));
    const remaining = dueWords.filter(w => !alreadyDone.has(w.id));
    if (remaining.length > 0) {
      this.startNewSessionWithWords(remaining);
    }
  }

  /**
   * Mélange les items d'exercice tout en évitant d'avoir deux fois le même mot consécutivement
   */
  private shuffleExerciseItems(items: ExerciseItem[]): ExerciseItem[] {
    const shuffled = [...items];

    // Mélange de base (Fisher-Yates)
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // S'assurer que les deux sens d'un même mot ne sont pas consécutifs
    for (let i = 1; i < shuffled.length; i++) {
      if (shuffled[i].wordPair === shuffled[i - 1].wordPair) {
        let j = i + 1;
        while (j < shuffled.length && shuffled[j].wordPair === shuffled[i - 1].wordPair) {
          j++;
        }
        if (j < shuffled.length) {
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
      }
    }

    return shuffled;
  }
}
