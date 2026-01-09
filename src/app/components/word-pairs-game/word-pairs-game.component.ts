import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController, AlertController } from '@ionic/angular';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { WordPair, TranslationDirection, LlmService } from '../../services/llm.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { FilterPipe } from '../../pipes/filter.pipe';
import { FormsModule } from '@angular/forms';
import { TextGeneratorService } from '../../services/text-generator.service';
import { ComprehensionText } from '../../models/vocabulary';
import { ThemeSelectionModalComponent } from '../theme-selection-modal/theme-selection-modal.component';
import { SpeechService } from '../../services/speech.service';
import { StorageService } from '../../services/storage.service';
import { DictionaryModalComponent } from './dictionary-modal.component';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { Injector } from '@angular/core';
import { Subscription } from 'rxjs';
import { AddTextModalComponent } from '../add-text-modal/add-text-modal.component';
import { TextPreviewModalComponent } from '../text-preview-modal/text-preview-modal.component';
import { FullRevisionService } from '../../services/full-revision.service';
import { PomService } from '../../services/pom.service';

interface GamePair {
  id: number;
  word: string;
  isSource: boolean;
  isSelected: boolean;
  isMatched: boolean;
}

interface RevisedWord {
  id: string;
  sourceWord: string;
  targetWord: string;
  context?: string;
  revisionDelay?: string; // '1j', '3j', '7j', '15j', '1m', '3m', '6m'
  isKnown?: boolean; // Indique si le mot est déjà connu
}

@Component({
  selector: 'app-word-pairs-game',
  templateUrl: './word-pairs-game.component.html',
  styleUrls: ['./word-pairs-game.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    FilterPipe,
    FormsModule
  ]
})
export class WordPairsGameComponent implements OnInit, OnDestroy {
  pageTitle: string = 'Associer les mots';

  // Propriétés pour le jeu d'association
  wordPairs: WordPair[] = [];
  currentPairs: GamePair[] = [];
  currentPairsSet: number = 1; // Première ou deuxième moitié (1 ou 2)
  gameComplete: boolean = false;

  // Contrôle du nombre de paires à réviser
  maxPairsToReview: number = 6; // Nombre de paires à réviser (par défaut 6)
  isPersonalDictionaryRevision: boolean = false; // Pour savoir si c'est une révision du dictionnaire personnel
  isFullRevisionSession: boolean = false; // Indique si la session fait partie d'une révision complète
  fullRevisionSessionId: string | null = null;
  isPomReview: boolean = false; // Indique si c'est une révision POM
  pomId: string | null = null;
  lessonId: string | null = null; // ID de la leçon statique associée

  // Filtrage par thèmes
  themeInput: string = ''; // Input en cours de saisie
  selectedThemes: string[] = []; // Thèmes sélectionnés
  availableThemes: string[] = []; // Thèmes disponibles dans le dictionnaire
  filteredThemes: string[] = []; // Thèmes filtrés pour l'autocomplete
  showAutocomplete: boolean = false; // Afficher l'autocomplete

  // Configuration pliable
  showConfiguration: boolean = false; // Afficher/masquer les options de configuration

  // État du jeu
  selectedPair: GamePair | null = null;
  selectedWordId: number | null = null;
  errorShown: boolean = false;
  isGenerating: boolean = false; // Pour la génération de textes de compréhension
  audioEnabled: boolean = true; // Pour activer/désactiver la prononciation audio

  // Pour les mots ratés
  failedWords: number[] = []; // IDs des mots ratés
  hasFailedWords: boolean = false; // Si il y a des mots ratés

  // Pour les sessions générées
  generatedSessions: any[] = [];

  // Pour les mots révisés
  revisedWords: RevisedWord[] = [];

  // Pour l'affichage conditionnel des options
  showMoreOptions: boolean = false;

  // Informations de session
  sessionInfo: {
    category: string;
    topic: string;
    date: string;
    translationDirection: TranslationDirection;
  } | null = null;

  // Statistiques
  matchedPairs: number = 0;
  totalPairs: number = 0;
  attempts: number = 0;

  // Cache pour le statut des mots (évite de lire localStorage dans le template)
  private trackedWordsSet = new Set<string>();
  private knownWordsSet = new Set<string>();
  private dictionarySubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  /**
   * Fonction pour optimiser le rendu de la liste de mots (évite de tout redessiner)
   */
  trackByWordPair(index: number, pair: WordPair) {
    return pair.it + '|' + pair.fr;
  }

  // Variable globale pour la clé API
  private googleTtsApiKey: string | null = null;

  constructor(
    private router: Router,
    private vocabularyTrackingService: VocabularyTrackingService,
    private toastController: ToastController,
    private llmService: LlmService,
    private textGeneratorService: TextGeneratorService,
    private modalController: ModalController,
    private speechService: SpeechService,
    private storageService: StorageService,
    private personalDictionaryService: PersonalDictionaryService,
    private fullRevisionService: FullRevisionService,
    private pomService: PomService,
    private injector: Injector,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.subscribeToDictionary();
    this.subscribeToRouterEvents();
    this.loadSessionData();
    this.loadAudioPreference();
    this.loadGeneratedSessions();
    this.checkForGeneratedSession();
    this.loadAvailableThemes();
  }

  private subscribeToRouterEvents() {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      console.log('[CORE DEBUG] NavigationEnd detected in WordPairsGame, reloading session data');
      this.loadSessionData();
    });
  }

  private subscribeToDictionary() {
    console.log('🔍 [WordPairsGame] Inscription aux changements du dictionnaire');
    this.dictionarySubscription = this.personalDictionaryService.dictionaryWords$.subscribe(words => {
      console.log('🔍 [WordPairsGame] Dictionnaire mis à jour, nb mots:', words.length);
      this.updateStatusSets(words);
    });
  }

  private updateStatusSets(words: DictionaryWord[]) {
    this.trackedWordsSet.clear();
    this.knownWordsSet.clear();
    words.forEach(w => {
      const id = this.normalizeWordId(w.sourceWord, w.targetWord);
      this.trackedWordsSet.add(id);
      if (w.isKnown) {
        this.knownWordsSet.add(id);
      }
    });
    console.log('🔍 [WordPairsGame] Cache mis à jour. Tracked:', this.trackedWordsSet.size, 'Known:', this.knownWordsSet.size);
    this.cdr.markForCheck();
  }

  private normalizeWordId(word1: string, word2: string): string {
    const w1 = word1?.toLowerCase().trim() || '';
    const w2 = word2?.toLowerCase().trim() || '';
    const id = [w1, w2].sort().join('|');
    return id;
  }

  private parseStoredString(value: string | null): string | null {
    if (value === null) return null;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : value;
    } catch {
      return value;
    }
  }

  private parseStoredBoolean(value: string | null): boolean {
    if (value === null) return false;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'boolean' ? parsed : value === 'true';
    } catch {
      return value === 'true';
    }
  }

  /**
   * Charge les données de la session depuis le localStorage
   */
  loadSessionData() {
    const wordPairsJson = localStorage.getItem('wordPairs');
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    const isPersonalRevision = localStorage.getItem('isPersonalDictionaryRevision');
    const fullRevisionActive = localStorage.getItem('fullRevisionActive');
    const fullRevisionSessionId = localStorage.getItem('fullRevisionSessionId');
    const revisedWordsJson = localStorage.getItem('revisedWords');
    const isPomReview = localStorage.getItem('isPomReview');
    const pomId = localStorage.getItem('pomId');


    if (wordPairsJson && sessionInfoJson) {
      try {
        this.wordPairs = JSON.parse(wordPairsJson);
        this.sessionInfo = JSON.parse(sessionInfoJson);
        this.isPersonalDictionaryRevision = isPersonalRevision === 'true';
        this.isFullRevisionSession = fullRevisionActive === 'true' && !!fullRevisionSessionId;
        this.fullRevisionSessionId = fullRevisionSessionId;
        this.isPomReview = this.parseStoredBoolean(isPomReview);
        this.pomId = this.parseStoredString(pomId);
        if (this.sessionInfo?.category === 'Leçon') {
          this.lessonId = localStorage.getItem('lessonId');
        } else {
          this.lessonId = null;
          localStorage.removeItem('lessonId');
        }

        if (this.isFullRevisionSession && !this.fullRevisionService.getSession()) {
          console.warn('🔍 [WordPairsGame] Indicateur de révision complète présent sans session active. Nettoyage.');
          this.isFullRevisionSession = false;
          localStorage.removeItem('fullRevisionActive');
          localStorage.removeItem('fullRevisionSessionId');
        }

        // Si c'est une révision du dictionnaire personnel, charger le nombre de paires configuré
        if (this.isPersonalDictionaryRevision) {
          const savedCount = localStorage.getItem('personalDictionaryWordsCount');
          this.maxPairsToReview = savedCount ? parseInt(savedCount) : 6;

          // Limiter les paires selon la configuration
          if (this.wordPairs.length > this.maxPairsToReview) {
            this.wordPairs = this.wordPairs.slice(0, this.maxPairsToReview);
          }
        }

        if (this.isFullRevisionSession) {
          this.fullRevisionService.assignQueuesFromWords();
        }

        // Charger les mots révisés si c'est une révision du dictionnaire personnel
        if (this.isPersonalDictionaryRevision && revisedWordsJson) {
          this.revisedWords = JSON.parse(revisedWordsJson);
        } else {
        }

        // Préparer le jeu
        this.totalPairs = this.wordPairs.length;
        this.setupCurrentGameRound();
        this.updateConversationTargetVocabularyStorage();


      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        this.showToast('Erreur lors du chargement des données de session');
        this.router.navigate(['/category']);
      }
    } else {
      // Rediriger vers la sélection de catégorie si aucune donnée n'est trouvée
      this.showToast('Aucune donnée de session disponible');
      this.router.navigate(['/category']);
    }
  }

  /**
   * Charge la préférence audio depuis le localStorage
   */
  async loadAudioPreference() {
    const savedAudioEnabled = localStorage.getItem('audioEnabled');

    // Charger la préférence audio d'abord
    if (savedAudioEnabled !== null) {
      this.audioEnabled = JSON.parse(savedAudioEnabled);
    }

    // Récupérer la clé API Google TTS depuis le StorageService
    this.googleTtsApiKey = this.storageService.get('userGoogleTtsApiKey');
    if (!this.googleTtsApiKey && this.audioEnabled) {
      await this.showApiKeyAlert();
      return;
    }
  }

  /**
   * Charge les sessions générées depuis les textes sauvegardés
   */
  loadGeneratedSessions() {
    const sessions = JSON.parse(localStorage.getItem('associationSessions') || '[]');
    this.generatedSessions = sessions;
    if (sessions.length > 0) {
    }
  }

  /**
   * Vérifie s'il y a une session générée récente à charger
   */
  checkForGeneratedSession() {
    const lastSessionId = localStorage.getItem('lastAssociationSessionId');
    if (lastSessionId) {
      this.loadGeneratedSession(lastSessionId);
      // Nettoyer l'ID pour éviter de recharger la même session
      localStorage.removeItem('lastAssociationSessionId');
    }
  }

  /**
   * Charge une session générée spécifique
   */
  loadGeneratedSession(sessionId: string) {
    const sessions = JSON.parse(localStorage.getItem('associationSessions') || '[]');
    const session = sessions.find((s: any) => s.id === sessionId);

    if (session && session.wordPairs) {
      this.wordPairs = session.wordPairs;
      this.sessionInfo = {
        category: session.category || 'vocabulaire',
        topic: session.title,
        date: session.createdAt,
        translationDirection: 'fr2it' // Par défaut
      };

      // Sauvegarder les données pour le jeu
      localStorage.setItem('wordPairs', JSON.stringify(this.wordPairs));
      localStorage.setItem('sessionInfo', JSON.stringify(this.sessionInfo));

      // Préparer le jeu
      this.totalPairs = this.wordPairs.length;
      this.setupCurrentGameRound();
      this.updateConversationTargetVocabularyStorage();

      this.showToast(`Session "${session.title}" chargée`);
    } else {
      this.showToast('Session non trouvée');
    }
  }

  /**
   * Sauvegarde la préférence audio dans le localStorage
   */
  saveAudioPreference() {
    localStorage.setItem('audioEnabled', JSON.stringify(this.audioEnabled));
  }

  /**
   * Bascule l'état audio (mute/unmute)
   */
  async toggleAudio() {
    this.audioEnabled = !this.audioEnabled;

    // Récupérer la clé API Google TTS depuis le StorageService
    this.googleTtsApiKey = this.storageService.get('userGoogleTtsApiKey');
    if (!this.googleTtsApiKey && this.audioEnabled) {
      await this.showApiKeyAlert();
      return;
    }

    this.saveAudioPreference();
    this.showToast(this.audioEnabled ? 'Prononciation activée' : 'Prononciation désactivée');
  }

  /**
   * Prépare un round du jeu avec 6 paires
   */
  setupCurrentGameRound() {
    // Début (0) ou milieu (6) de la liste selon le set
    const startIndex = (this.currentPairsSet - 1) * 6;
    // Récupérer 6 paires ou moins si pas assez
    const endIndex = Math.min(startIndex + 6, this.wordPairs.length);
    const pairsForRound = this.wordPairs.slice(startIndex, endIndex);

    // Si pas de paires, le jeu est terminé
    if (pairsForRound.length === 0) {
      this.gameComplete = true;
      this.onGameComplete();
      return;
    }

    this.currentPairs = [];

    // Créer les objets de jeu pour les mots source et cible
    pairsForRound.forEach((pair, index) => {
      const wordId = startIndex + index;
      const direction = this.sessionInfo?.translationDirection || 'fr2it';

      // Déterminer les mots source et cible selon la direction
      const sourceWord = direction === 'fr2it' ? pair.fr : pair.it;
      const targetWord = direction === 'fr2it' ? pair.it : pair.fr;

      // Ajouter le mot source
      this.currentPairs.push({
        id: wordId,
        word: sourceWord,
        isSource: true,
        isSelected: false,
        isMatched: false
      });

      // Ajouter le mot cible
      this.currentPairs.push({
        id: wordId,
        word: targetWord,
        isSource: false,
        isSelected: false,
        isMatched: false
      });
    });

    // Mélanger uniquement les mots cible
    this.shuffleTargetWords();
  }

  /**
   * Mélange les mots cible dans le tableau des paires actuelles
   */
  shuffleTargetWords() {
    // Séparer les mots source et cible
    const sourceWords = this.currentPairs.filter(pair => pair.isSource);
    let targetWords = this.currentPairs.filter(pair => !pair.isSource);

    // Mélanger les mots cible
    for (let i = targetWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targetWords[i], targetWords[j]] = [targetWords[j], targetWords[i]];
    }

    // Recombiner les mots source et cible
    this.currentPairs = [...sourceWords, ...targetWords];
  }

  /**
   * Gère la sélection d'un mot
   */
  selectWord(pair: GamePair) {
    // Si la paire est déjà associée, ne rien faire
    if (pair.isMatched) return;

    // Si erreur actuellement affichée, ne rien faire
    if (this.errorShown) return;

    // Si c'est le premier mot sélectionné
    if (!this.selectedPair) {
      this.selectedPair = pair;
      pair.isSelected = true;
      return;
    }

    // Si on clique sur le même mot, le désélectionner
    if (this.selectedPair === pair) {
      if (this.selectedPair) {
        this.selectedPair.isSelected = false;
      }
      this.selectedPair = null;
      return;
    }

    this.attempts++;

    // Vérifier si les deux mots forment une paire
    if (this.selectedPair && this.selectedPair.id === pair.id) {
      // Match trouvé
      this.selectedPair.isMatched = true;
      pair.isMatched = true;

      // Tracker ce mot comme réussi
      if (this.selectedPair) {
        this.trackWordMatch(this.selectedPair.id, true);
      }

      this.matchedPairs++;

      // Prononcer le mot italien lors d'une association réussie
      this.playWordPronunciation(pair.id, 'target');

      // Réinitialiser la sélection
      this.selectedPair.isSelected = false;
      this.selectedPair = null;

      // Si toutes les paires sont trouvées, passer au set suivant ou terminer
      if (this.matchedPairs === this.currentPairs.length / 2) {
        const totalSets = this.getTotalSets();
        if (this.currentPairsSet < totalSets) {
          // Passer au set suivant s'il y en a un
          setTimeout(() => {
            this.currentPairsSet++;
            this.matchedPairs = 0;
            this.setupCurrentGameRound();
          }, 1000);
        } else {
          // Terminer le jeu
          this.gameComplete = true;
          this.onGameComplete();
        }
      }
    } else {
      // Erreur
      pair.isSelected = true;
      this.errorShown = true;

      // Tracker ce mot comme raté
      if (this.selectedPair) {
        this.trackWordMatch(this.selectedPair.id, false);
      }

      // Réinitialiser après un court délai
      setTimeout(() => {
        if (this.selectedPair) {
          this.selectedPair.isSelected = false;
        }
        pair.isSelected = false;
        this.selectedPair = null;
        this.errorShown = false;
      }, 1000);
    }
  }



  /**
   * Joue la prononciation d'un mot italien
   */
  async playWordPronunciation(wordId: number, type: 'source' | 'target') {
    if (!this.audioEnabled) {
      return;
    }

    try {

      // Récupérer la paire de mots correspondante
      const wordPair = this.wordPairs[wordId];
      if (!wordPair) {
        return;
      }

      // Déterminer le mot italien selon la direction de traduction
      const direction = this.sessionInfo?.translationDirection || 'fr2it';
      const italianWord = direction === 'fr2it' ? wordPair.it : wordPair.fr;

      // Vérifier la clé API Google TTS
      if (!this.googleTtsApiKey) {
        await this.showApiKeyAlert();
        return;
      }

      const request = {
        input: { text: italianWord },
        voice: { languageCode: 'it-IT', ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3" },
      };

      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleTtsApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });


      if (!response.ok) {
        console.error('❌ Erreur lors de la génération de l\'audio:', response.statusText);
        const errorText = await response.text();
        console.error('Détails de l\'erreur:', errorText);
        return;
      }

      const data = await response.json();

      const audioContent = data.audioContent;
      if (!audioContent) {
        console.error('❌ Pas d\'audioContent dans la réponse');
        return;
      }

      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);

      await audio.play();

    } catch (error) {
      console.error('❌ Erreur lors de la prononciation:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  /**
   * Affiche une modale d'alerte pour configurer la clé API
   */
  async showApiKeyAlert() {
    const alert = await this.alertController.create({
      header: 'Clé API manquante',
      message: 'Pour utiliser la prononciation audio des mots, vous devez configurer votre clé API Google Text-to-Speech dans les préférences. \n En attendant, vous pouvez désactiver les sons via l\'icone mute ci-dessus.',
      buttons: [
        {
          text: 'Compris',
          role: 'cancel'
        },
        {
          text: 'Configurer',
          handler: () => {
            this.router.navigate(['/preferences']);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Suit les performances de l'utilisateur sur un mot
   */
  trackWordMatch(wordId: number, isCorrect: boolean) {
    if (!this.sessionInfo) return;

    const pair = this.wordPairs[wordId];

    if (pair) {
      this.vocabularyTrackingService.trackWord(
        pair.it,
        pair.fr,
        this.sessionInfo.category,
        this.sessionInfo.topic,
        isCorrect,
        pair.context
      );

      // Ajouter aux mots ratés si incorrect
      if (!isCorrect && !this.failedWords.includes(wordId)) {
        this.failedWords.push(wordId);
        this.hasFailedWords = true;
      }
    }
  }

  /**
   * Recommence l'exercice actuel
   */
  restartExercise() {
    this.saveRevisionDelays(); // Sauvegarder avant de recommencer
    this.matchedPairs = 0;
    this.attempts = 0;
    this.gameComplete = false;
    this.selectedPair = null;
    this.selectedWordId = null;
    this.errorShown = false;
    this.failedWords = [];
    this.hasFailedWords = false;
    this.currentPairsSet = 1; // Réinitialiser au premier set
    this.setupCurrentGameRound();
  }

  /**
   * Recommence avec seulement les mots ratés
   */
  restartFailedWords() {
    this.saveRevisionDelays(); // Sauvegarder avant de recommencer
    if (this.failedWords.length === 0) {
      this.showToast('Aucun mot raté à recommencer');
      return;
    }

    // Créer un nouveau jeu avec seulement les mots ratés
    const failedPairs = this.currentPairs.filter(pair =>
      this.failedWords.includes(pair.id)
    );

    if (failedPairs.length === 0) {
      this.showToast('Aucun mot raté disponible');
      return;
    }

    this.currentPairs = failedPairs;
    this.matchedPairs = 0;
    this.attempts = 0;
    this.gameComplete = false;
    this.selectedPair = null;
    this.selectedWordId = null;
    this.errorShown = false;
    this.failedWords = [];
    this.hasFailedWords = false;
    this.currentPairsSet = 1; // Réinitialiser au premier set
    this.setupCurrentGameRound();
  }

  /**
   * Navigue vers l'exercice de vocabulaire
   * Utilise toujours les mots de l'exercice d'association actuel (this.wordPairs)
   * pour garantir que l'exercice d'encodage porte sur les mots qui viennent d'être vus
   */
  goToVocabularyExercise() {
    this.saveRevisionDelays(); // Sauvegarder avant de naviguer

    // Utiliser toujours les mots de l'exercice d'association actuel
    if (this.wordPairs && this.wordPairs.length > 0 && this.sessionInfo) {
      const vocabularyExercise = {
        items: this.wordPairs.map(pair => ({
          word: this.sessionInfo?.translationDirection === 'fr2it' ? pair.fr : pair.it,
          translation: this.sessionInfo?.translationDirection === 'fr2it' ? pair.it : pair.fr,
          context: pair.context || ''
        })),
        type: 'vocabulary',
        topic: this.sessionInfo.topic || 'Général'
      };
      localStorage.setItem('vocabularyExercise', JSON.stringify(vocabularyExercise));

      // Si c'est une révision complète, mettre à jour le stage
      if (this.isFullRevisionSession) {
        this.fullRevisionService.setStage('encoding');
        // Mettre à jour sessionInfo avec les infos de la révision complète si disponibles
        const fullRevisionSessionInfo = this.fullRevisionService.getSessionInfoSummary();
        if (fullRevisionSessionInfo) {
          // Conserver la direction de traduction de la session actuelle
          const updatedSessionInfo = {
            ...fullRevisionSessionInfo,
            translationDirection: this.sessionInfo.translationDirection
          };
          localStorage.setItem('sessionInfo', JSON.stringify(updatedSessionInfo));
        }
      }
    } else {
      // Fallback : si pas de wordPairs mais révision complète, utiliser le payload
      if (this.isFullRevisionSession) {
        const exercise = this.fullRevisionService.getVocabularyExercisePayload();
        const sessionInfo = this.fullRevisionService.getSessionInfoSummary();
        if (exercise) {
          localStorage.setItem('vocabularyExercise', JSON.stringify(exercise));
          if (sessionInfo) {
            localStorage.setItem('sessionInfo', JSON.stringify(sessionInfo));
          }
        }
        this.fullRevisionService.setStage('encoding');
      }
    }

    this.router.navigate(['/vocabulary']);
  }

  /**
   * Lance la conversation guidée dans le cadre d'une révision complète
   */
  goToFullRevisionConversation() {
    console.log('🔍 [WordPairsGame] goToFullRevisionConversation() appelée');
    console.log('🔍 [WordPairsGame] isFullRevisionSession:', this.isFullRevisionSession);
    console.log('🔍 [WordPairsGame] gameComplete:', this.gameComplete);
    console.log('🔍 [WordPairsGame] wordPairs.length:', this.wordPairs.length);

    if (!this.isFullRevisionSession) {
      return;
    }

    if (!this.gameComplete) {
      this.showToast('Terminez l\'association avant de passer à la conversation.');
      return;
    }

    // Synchroniser les mots de l'exercice d'association avec la session
    const associationWords = this.wordPairs.map(pair => ({
      it: pair.it,
      fr: pair.fr,
      context: pair.context
    }));

    console.log('🔍 [WordPairsGame] associationWords:', associationWords);
    this.fullRevisionService.syncWordsFromAssociation(associationWords);

    // IMPORTANT: Sauvegarder le vocabulaire cible pour la conversation
    console.log('🔍 [WordPairsGame] Appel de updateConversationTargetVocabularyStorage()');
    this.updateConversationTargetVocabularyStorage();

    // Vérifier ce qui a été sauvegardé
    const saved = localStorage.getItem('conversationTargetVocabulary');
    console.log('🔍 [WordPairsGame] Vocabulaire sauvegardé dans localStorage:', saved ? JSON.parse(saved) : null);

    const session = this.fullRevisionService.setStage('conversation');
    if (!session) {
      this.showToast('Session de révision complète introuvable.');
      return;
    }

    console.log('🔍 [WordPairsGame] Navigation vers conversation full-revision');
    this.router.navigate(['/discussion', 'full-revision'], {
      queryParams: { fullRevision: 'true' }
    });
  }

  /**
   * Vérifie si un mot est présent dans le dictionnaire personnel
   */
  isTracked(pair: WordPair): boolean {
    return this.trackedWordsSet.has(this.normalizeWordId(pair.it, pair.fr));
  }

  /**
   * Vérifie si un mot est marqué comme connu (maîtrisé)
   */
  isWordKnown(pair: WordPair): boolean {
    return this.knownWordsSet.has(this.normalizeWordId(pair.it, pair.fr));
  }

  /**
   * Alterne le statut connu/maîtrisé d'un mot
   */
  toggleWordKnownStatus(pair: WordPair) {
    console.log('🔍 [WordPairsGame] toggleWordKnownStatus pour:', pair.it, '/', pair.fr);
    const it = pair.it.toLowerCase().trim();
    const fr = pair.fr.toLowerCase().trim();
    const dictWords = this.personalDictionaryService.getAllWords();
    const word = dictWords.find(w =>
      (w.sourceWord.toLowerCase().trim() === it && w.targetWord.toLowerCase().trim() === fr) ||
      (w.sourceWord.toLowerCase().trim() === fr && w.targetWord.toLowerCase().trim() === it)
    );

    if (word) {
      console.log('🔍 [WordPairsGame] Mot trouvé dans le dict, id:', word.id, 'actuellement connu:', word.isKnown);
      this.personalDictionaryService.setWordKnownStatus(word.id, !word.isKnown);
    } else {
      console.log('🔍 [WordPairsGame] Mot non trouvé, ajout comme connu');
      // Si le mot n'est pas dans le dictionnaire, on l'ajoute d'abord comme connu
      const newWord: DictionaryWord = {
        id: '',
        sourceWord: pair.it,
        sourceLang: 'it',
        targetWord: pair.fr,
        targetLang: 'fr',
        contextualMeaning: pair.context,
        themes: pair.themes || [],
        dateAdded: Date.now(),
        isKnown: true
      };
      this.personalDictionaryService.addWord(newWord);
    }
  }

  /**
   * Active ou désactive le suivi d'un mot dans le dictionnaire personnel
   */
  toggleWordTracking(pair: WordPair) {
    const isTracked = this.isTracked(pair);

    if (isTracked) {
      // Trouver l'ID pour supprimer
      const it = pair.it.toLowerCase().trim();
      const fr = pair.fr.toLowerCase().trim();
      const dictWords = this.personalDictionaryService.getAllWords();
      const wordToRemove = dictWords.find(w =>
        (w.sourceWord.toLowerCase().trim() === it && w.targetWord.toLowerCase().trim() === fr) ||
        (w.sourceWord.toLowerCase().trim() === fr && w.targetWord.toLowerCase().trim() === it)
      );

      if (wordToRemove) {
        this.personalDictionaryService.removeWord(wordToRemove.id);
        // On supprime aussi du tracking de vocabulaire global pour être cohérent
        const trackId = this.vocabularyTrackingService.generateWordId(pair.it, pair.fr);
        this.vocabularyTrackingService.deleteTrackedWord(trackId);
      }
    } else {
      // Ajouter au dictionnaire personnel (ce qui l'ajoute aussi au tracking global)
      const newWord: DictionaryWord = {
        id: '', // Sera généré par le service
        sourceWord: pair.it,
        sourceLang: 'it',
        targetWord: pair.fr,
        targetLang: 'fr',
        contextualMeaning: pair.context,
        themes: pair.themes || [],
        dateAdded: Date.now()
      };
      this.personalDictionaryService.addWord(newWord);
    }
  }

  /**
   * Appelé lorsque le jeu est terminé
   */
  private async onGameComplete() {
    // Ajouter automatiquement tous les mots de la session au dictionnaire personnel
    // Sauf s'ils y sont déjà
    let addedCount = 0;
    this.wordPairs.forEach(pair => {
      if (!this.isTracked(pair)) {
        const newWord: DictionaryWord = {
          id: '',
          sourceWord: pair.it,
          sourceLang: 'it',
          targetWord: pair.fr,
          targetLang: 'fr',
          contextualMeaning: pair.context,
          themes: pair.themes || [],
          dateAdded: Date.now()
        };
        this.personalDictionaryService.addWord(newWord);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      console.log(`[WordPairsGame] ${addedCount} mots ajoutés au dictionnaire personnel.`);
    }

    // Gestion des POMs
    console.log(`[CORE DEBUG] Handling POM completion: isPomReview=${this.isPomReview}, pomId=${this.pomId}`);
    if (this.isPomReview && this.pomId) {
      console.log(`[CORE DEBUG] Triggering processPomReview for ${this.pomId}`);
      await this.pomService.processPomReview(this.pomId);
      await this.showToast('Session POM terminée et mise à jour !');
      this.router.navigate(['/poms'], { queryParams: { pomId: this.pomId } });
    } else {
      // Essayer de créer un POM pour cette session
      const words = this.wordPairs.map(wp => ({ word: wp.it, translation: wp.fr }));
      const newPom = await this.pomService.createPom(words, this.lessonId || undefined);
      if (newPom) {
        this.showToast('Un nouveau cycle de révision (POM) a été créé pour ces mots !');
      }
    }

    // Pour la révision du dictionnaire personnel, sauvegarder automatiquement les délais
    if (this.isPersonalDictionaryRevision) {
      await this.saveRevisionDelays();
    }
    this.updateConversationTargetVocabularyStorage();
  }

  /**
   * Complète instantanément la révision POM (mode test uniquement)
   */
  async completeReviewInstantly() {
    if (!this.isPomReview || !this.pomId) {
      await this.showToast('Cette fonction est uniquement disponible pour les révisions POM');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Compléter la révision (Test)',
      message: 'Voulez-vous marquer cette révision POM comme complétée instantanément ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Compléter',
          handler: async () => {
            console.log(`[CORE DEBUG] Test completion triggered for POM ${this.pomId}`);
            await this.pomService.processPomReview(this.pomId!);
            await this.showToast('Révision POM complétée !');
            this.router.navigate(['/poms'], { queryParams: { pomId: this.pomId } });
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Génère un texte de compréhension écrite
   */
  async generateWrittenComprehension() {
    this.saveRevisionDelays(); // Sauvegarder avant de générer
    // Demander à l'utilisateur s'il veut préciser des thèmes
    const modal = await this.modalController.create({
      component: ThemeSelectionModalComponent,
      cssClass: 'theme-selection-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    const selectedThemes = data?.themes || [];

    // Convertir les WordPair en VocabularyItem pour être compatible avec l'interface existante
    const vocabularyItems = this.wordPairs.map(pair => ({
      word: pair.it,
      translation: pair.fr,
      context: pair.context
    }));

    this.isGenerating = true;

    // Définir le flag pour indiquer que l'utilisateur vient d'une session d'association
    localStorage.setItem('fromWordPairs', 'true');

    // Sauvegarder les mots du prompt (uniquement ceux de la session d'association)
    localStorage.setItem('comprehensionPromptWords', JSON.stringify(this.wordPairs.map(p => p.it)));

    // Générer le texte de compréhension via le service avec les thèmes sélectionnés
    this.textGeneratorService.generateComprehensionText(this.wordPairs, 'written', selectedThemes).subscribe({
      next: (result: ComprehensionText) => {
        // Assurer la mise en évidence des mots de la session d'association
        const sessionVocabulary = this.wordPairs.map(pair => ({
          word: pair.it,
          translation: pair.fr,
          context: pair.context
        }));

        // Fusionner/compléter les vocabularyItems retournés par l'IA avec ceux de la session
        const existing = (result.vocabularyItems || []).reduce((acc: Record<string, number>, item, idx) => {
          acc[item.word?.toLowerCase?.() || ''] = idx;
          return acc;
        }, {});

        const merged = [...(result.vocabularyItems || [])];

        for (const item of sessionVocabulary) {
          const key = item.word.toLowerCase();
          if (key && existing[key] === undefined) {
            merged.push(item);
          }
        }
        result.vocabularyItems = merged;

        // Stocker le texte dans le localStorage pour y accéder depuis le composant de compréhension
        localStorage.setItem('comprehensionText', JSON.stringify(result));

        // Mettre à jour le sessionInfo dans le localStorage pour la sauvegarde
        if (this.sessionInfo) {
          const sessionInfoWithThemes = {
            ...this.sessionInfo,
            themes: selectedThemes
          };
          localStorage.setItem('sessionInfo', JSON.stringify(sessionInfoWithThemes));
        }

        this.isGenerating = false;

        // Naviguer vers la page de compréhension
        this.router.navigate(['/comprehension']);
      },
      error: (error: any) => {
        console.error('Erreur lors de la génération du texte de compréhension:', error);
        this.isGenerating = false;
        this.showToast('Erreur lors de la génération du texte. Veuillez réessayer.');
      }
    });
  }

  /**
   * Génère un exercice de compréhension orale
   */
  async generateOralComprehension() {
    this.saveRevisionDelays(); // Sauvegarder avant de générer
    this.isGenerating = true;
    // Demander à l'utilisateur s'il veut préciser des thèmes
    const modal = await this.modalController.create({
      component: ThemeSelectionModalComponent,
      cssClass: 'theme-selection-modal'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    const selectedThemes = data?.themes || [];

    // Convertir les WordPair en VocabularyItem pour être compatible avec l'interface existante
    const vocabularyItems = this.wordPairs.map(pair => ({
      word: pair.it,
      translation: pair.fr,
      context: pair.context
    }));

    // Définir le flag pour indiquer que l'utilisateur vient d'une session d'association
    localStorage.setItem('fromWordPairs', 'true');

    // Sauvegarder les mots du prompt (uniquement ceux de la session d'association)
    localStorage.setItem('comprehensionPromptWords', JSON.stringify(this.wordPairs.map(p => p.it)));

    // Générer le texte de compréhension via le service avec les thèmes sélectionnés
    this.textGeneratorService.generateComprehensionText(this.wordPairs, 'oral', selectedThemes).subscribe({
      next: (result: ComprehensionText) => {
        // Assurer la mise en évidence des mots de la session d'association
        const sessionVocabulary = this.wordPairs.map(pair => ({
          word: pair.it,
          translation: pair.fr,
          context: pair.context
        }));

        // Fusionner/compléter les vocabularyItems retournés par l'IA avec ceux de la session
        const existing = (result.vocabularyItems || []).reduce((acc: Record<string, number>, item, idx) => {
          acc[item.word?.toLowerCase?.() || ''] = idx;
          return acc;
        }, {});

        const merged = [...(result.vocabularyItems || [])];
        for (const item of sessionVocabulary) {
          const key = item.word.toLowerCase();
          if (key && existing[key] === undefined) {
            merged.push(item);
          }
        }
        result.vocabularyItems = merged;

        // Stocker le texte dans le localStorage pour y accéder depuis le composant de compréhension
        localStorage.setItem('comprehensionText', JSON.stringify(result));

        // Mettre à jour le sessionInfo dans le localStorage pour la sauvegarde
        if (this.sessionInfo) {
          const sessionInfoWithThemes = {
            ...this.sessionInfo,
            themes: selectedThemes
          };
          localStorage.setItem('sessionInfo', JSON.stringify(sessionInfoWithThemes));
        }
        this.speechService.generateSpeech(result.text, 'nova').subscribe(() => {
          this.isGenerating = false;

        });



        // Naviguer vers la page de compréhension
        this.router.navigate(['/comprehension']);
      },
      error: (error: any) => {
        console.error('Erreur lors de la génération du texte de compréhension:', error);
        this.isGenerating = false;
        this.showToast('Erreur lors de la génération du texte. Veuillez réessayer.');
      }
    });
  }




  /**
   * Affiche un toast d'information
   */
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Ouvre la modal pour ajouter/retirer les mots du dictionnaire personnel
   */
  async openDictionaryModal() {
    const modal = await this.modalController.create({
      component: DictionaryModalComponent,
      componentProps: {
        sessionWords: this.wordPairs
      },
      cssClass: 'dictionary-modal'
    });

    await modal.present();
  }

  /**
   * Retourne une classe CSS en fonction de l'état de la paire
   */
  getCardClass(pair: GamePair): string {
    if (pair.isMatched) {
      return 'matched';
    } else if (pair.isSelected) {
      return 'selected';
    } else {
      return '';
    }
  }

  /**
   * Gère le changement de délai de révision pour un mot
   */
  onRevisionDelayChange(word: RevisedWord) {
  }

  /**
   * Gère le changement de statut "connu" pour un mot
   */
  onKnownStatusChange(word: RevisedWord) {
  }

  /**
   * Sauvegarde les délais de révision dans le dictionnaire personnel
   */
  async saveRevisionDelays() {
    // Ne sauvegarder que si c'est une révision du dictionnaire personnel et qu'il y a des mots révisés
    if (!this.isPersonalDictionaryRevision || this.revisedWords.length === 0) {
      return;
    }

    try {
      const personalDictionaryService = this.injector.get(PersonalDictionaryService);
      let savedCount = 0;
      let knownCount = 0;

      for (const word of this.revisedWords) {
        // Sauvegarder le statut "connu"
        if (word.isKnown !== undefined) {
          const success = personalDictionaryService.setWordKnownStatus(word.id, word.isKnown);
          if (success) {
            knownCount++;
          }
        }

        // Sauvegarder le délai de révision (seulement si le mot n'est pas marqué comme connu)
        if (word.revisionDelay && !word.isKnown) {
          const delayInMs = this.calculateDelayInMs(word.revisionDelay);
          if (delayInMs !== null) {
            const minRevisionDate = Date.now() + delayInMs;
            const success = personalDictionaryService.setMinRevisionDate(word.id, minRevisionDate);
            if (success) {
              savedCount++;
            }
          }
        }
      }

      if (savedCount > 0 || knownCount > 0) {

        // Vider la liste des mots révisés après sauvegarde
        this.revisedWords = [];
        localStorage.removeItem('revisedWords');
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde automatique des délais de révision:', error);
    }
  }

  /**
   * Calcule le délai en millisecondes à partir d'une chaîne de délai
   */
  private calculateDelayInMs(delay: string): number | null {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMonth = 30 * oneDay; // Approximation

    switch (delay) {
      case '1j':
        return oneDay;
      case '3j':
        return 3 * oneDay;
      case '7j':
        return 7 * oneDay;
      case '15j':
        return 15 * oneDay;
      case '1m':
        return oneMonth;
      case '3m':
        return 3 * oneMonth;
      case '6m':
        return 6 * oneMonth;
      default:
        console.warn('Délai de révision non reconnu:', delay);
        return null;
    }
  }

  /**
   * Bascule l'affichage des options supplémentaires
   */
  toggleMoreOptions() {
    this.showMoreOptions = !this.showMoreOptions;
  }


  /**
   * Ouvre le modal d'ajout de texte
   */
  async openAddTextModal() {
    const modal = await this.modalController.create({
      component: AddTextModalComponent,
      cssClass: 'add-text-modal'
    });

    const { data } = await modal.onDidDismiss();

    if (data && data.action === 'preview') {
      this.openTextPreviewModal(data.text);
    }
  }

  /**
   * Ouvre le modal de prévisualisation du texte
   */
  async openTextPreviewModal(text: string) {
    const modal = await this.modalController.create({
      component: TextPreviewModalComponent,
      cssClass: 'text-preview-modal',
      componentProps: {
        text: text
      }
    });

    const { data } = await modal.onDidDismiss();

    if (data && data.action === 'edit') {
      this.openAddTextModal();
    }
  }

  /**
   * Gère le changement du nombre de paires à réviser
   */
  onPairsCountChange(event: any) {
    // Vérifier si l'utilisateur a déjà commencé à associer des paires
    if (this.matchedPairs > 0) {
      return;
    }

    // Convertir la valeur string en number
    const newValue = parseInt(event.detail.value);

    // Valider la valeur
    if (newValue < 3 || newValue > 50) {
      return;
    }

    // Mettre à jour la propriété
    this.maxPairsToReview = newValue;

    // Sauvegarder la nouvelle valeur
    localStorage.setItem('personalDictionaryWordsCount', newValue.toString());

    // Recharger la session avec le nouveau nombre de paires
    this.reloadSessionWithNewPairsCount();
  }

  /**
   * Recharge la session avec le nouveau nombre de paires
   */
  reloadSessionWithNewPairsCount() {
    // Récupérer les mots révisés originaux
    const revisedWordsJson = localStorage.getItem('revisedWords');
    if (!revisedWordsJson) return;

    let revisedWords = JSON.parse(revisedWordsJson);

    // Si l'utilisateur demande plus de mots que disponibles, aller chercher plus dans le dictionnaire
    if (this.maxPairsToReview > revisedWords.length) {

      // Récupérer TOUS les mots du dictionnaire
      const allWords = this.personalDictionaryService.getAllWords();

      if (allWords.length > revisedWords.length) {
        // Mélanger tous les mots
        const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);

        // Prendre le nombre demandé
        const additionalWords = shuffledWords.slice(0, this.maxPairsToReview);

        // Convertir en format revisedWords
        revisedWords = additionalWords.map(word => ({
          id: word.id,
          sourceWord: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
          targetWord: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
          context: word.contextualMeaning,
          revisionDelay: undefined,
          isKnown: word.isKnown || false
        }));

      }
    }

    // Limiter selon le nouveau nombre
    const limitedWords = revisedWords.slice(0, this.maxPairsToReview);

    // Recréer les paires de mots
    const wordPairs = limitedWords.map((word: any) => ({
      it: word.sourceWord,
      fr: word.targetWord,
      context: word.context
    }));

    // Mettre à jour les données
    this.wordPairs = wordPairs;
    localStorage.setItem('wordPairs', JSON.stringify(wordPairs));

    // Mettre à jour les mots révisés
    this.revisedWords = limitedWords;
    localStorage.setItem('revisedWords', JSON.stringify(limitedWords));

    // Réinitialiser le jeu
    this.currentPairsSet = 1;
    this.matchedPairs = 0;
    this.gameComplete = false;
    this.selectedPair = null;
    this.selectedWordId = null;
    this.failedWords = [];
    this.hasFailedWords = false;

    // Redémarrer le jeu
    this.setupCurrentGameRound();
    this.updateConversationTargetVocabularyStorage();

    // Forcer la détection de changement
    this.cdr.detectChanges();
  }

  /**
   * Calcule le nombre total de sets nécessaires
   */
  getTotalSets(): number {
    return Math.ceil(this.wordPairs.length / 6);
  }

  /**
   * Charge les thèmes disponibles dans le dictionnaire personnel
   */
  loadAvailableThemes() {
    if (!this.isPersonalDictionaryRevision) return;

    const allWords = this.personalDictionaryService.getAllWords();
    const themesSet = new Set<string>();

    allWords.forEach(word => {
      if (word.themes && word.themes.length > 0) {
        word.themes.forEach(theme => themesSet.add(theme));
      }
    });

    this.availableThemes = Array.from(themesSet).sort();
  }

  /**
   * Gère la saisie dans le champ de thèmes
   */
  onThemeInputChange(event: any) {
    const value = event.detail.value;
    this.themeInput = value;

    if (value.length > 0) {
      // Filtrer les thèmes disponibles
      this.filteredThemes = this.availableThemes.filter(theme =>
        theme.toLowerCase().includes(value.toLowerCase()) &&
        !this.selectedThemes.includes(theme)
      );
      this.showAutocomplete = true;
    } else {
      this.filteredThemes = [];
      this.showAutocomplete = false;
    }
  }

  /**
   * Sélectionne un thème depuis l'autocomplete
   */
  selectTheme(theme: string) {
    if (!this.selectedThemes.includes(theme)) {
      this.selectedThemes.push(theme);
      this.applyThemeFilter();
    }
    this.themeInput = '';
    this.showAutocomplete = false;
  }

  /**
   * Supprime un thème de la sélection
   */
  removeTheme(theme: string) {
    this.selectedThemes = this.selectedThemes.filter(t => t !== theme);
    this.applyThemeFilter();
  }

  /**
   * Cache l'autocomplete
   */
  hideAutocomplete() {
    // Délai pour permettre le clic sur un élément de l'autocomplete
    setTimeout(() => {
      this.showAutocomplete = false;
    }, 200);
  }

  /**
   * Applique le filtre de thèmes
   */
  applyThemeFilter() {
    if (!this.isPersonalDictionaryRevision) return;

    if (this.selectedThemes.length === 0) {
      // Pas de filtre, recharger tous les mots
      this.reloadSessionWithNewPairsCount();
      return;
    }

    // Récupérer tous les mots du dictionnaire
    const allWords = this.personalDictionaryService.getAllWords();

    // Filtrer selon les thèmes sélectionnés
    const filteredWords = allWords.filter(word => {
      if (!word.themes || word.themes.length === 0) return false;

      return this.selectedThemes.some(selectedTheme =>
        word.themes!.some(wordTheme =>
          wordTheme.toLowerCase().includes(selectedTheme.toLowerCase())
        )
      );
    });

    if (filteredWords.length === 0) {
      this.showToast('Aucun mot trouvé pour ces thèmes');
      return;
    }

    // Mélanger et limiter
    const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);
    const limitedWords = shuffledWords.slice(0, this.maxPairsToReview);

    // Convertir en format WordPair
    const wordPairs = limitedWords.map(word => ({
      it: word.sourceLang === 'it' ? word.sourceWord : word.targetWord,
      fr: word.sourceLang === 'fr' ? word.sourceWord : word.targetWord,
      context: word.contextualMeaning,
      themes: word.themes
    }));

    // Mettre à jour les données
    this.wordPairs = wordPairs;
    this.currentPairsSet = 1;
    this.gameComplete = false;
    this.matchedPairs = 0;
    this.failedWords = [];
    this.hasFailedWords = false;

    // Initialiser le jeu
    this.setupCurrentGameRound();
    this.updateConversationTargetVocabularyStorage();

    this.showToast(`${wordPairs.length} mots trouvés pour ces thèmes`);
  }

  /**
   * Navigation vers les catégories
   */
  navigateToCategory() {
    this.router.navigate(['/category']);
  }

  /**
   * Navigation vers l'accueil
   */
  navigateToHome() {
    this.router.navigate(['/home']);
  }

  /**
   * Basculer l'affichage des options de configuration
   */
  toggleConfiguration() {
    this.showConfiguration = !this.showConfiguration;
  }

  /**
   * Sauvegarde le vocabulaire ciblé pour la prochaine conversation
   */
  private updateConversationTargetVocabularyStorage() {
    try {
      if (!this.sessionInfo || !this.wordPairs || this.wordPairs.length === 0) {
        localStorage.removeItem('conversationTargetVocabulary');
        return;
      }

      // Toujours stocker pour la conversation: word = italien (cible à produire), translation = français (affiché par défaut)
      const items = this.wordPairs.map(pair => ({
        word: pair.it,
        translation: pair.fr,
        context: pair.context || ''
      }));

      const payload = {
        items,
        session: {
          category: this.sessionInfo.category,
          topic: this.sessionInfo.topic,
          translationDirection: this.sessionInfo.translationDirection
        },
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('conversationTargetVocabulary', JSON.stringify(payload));
    } catch (error) {
      console.error('🔍 [WordPairsGame] Erreur lors de la sauvegarde du vocabulaire de conversation:', error);
    }
  }

  ngOnDestroy() {
    if (this.dictionarySubscription) {
      this.dictionarySubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.saveRevisionDelays();
  }
}
