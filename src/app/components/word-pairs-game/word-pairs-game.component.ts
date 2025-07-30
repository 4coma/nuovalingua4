import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { WordPair, TranslationDirection, LlmService } from '../../services/llm.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { FilterPipe } from '../../pipes/filter.pipe';
import { FormsModule } from '@angular/forms';
import { TextGeneratorService } from '../../services/text-generator.service';
import { ComprehensionText } from '../../models/vocabulary';
import { ThemeSelectionModalComponent } from '../theme-selection-modal/theme-selection-modal.component';
import { SpeechService } from 'src/app/services/speech.service';
import { StorageService } from '../../services/storage.service';
import { DictionaryModalComponent } from './dictionary-modal.component';
import { PersonalDictionaryService } from '../../services/personal-dictionary.service';
import { Injector } from '@angular/core';

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
export class WordPairsGameComponent implements OnInit {
  pageTitle: string = 'Associer les mots';
  
  // Pour le jeu
  wordPairs: WordPair[] = [];
  currentPairs: GamePair[] = [];
  currentPairsSet: number = 1; // Première ou deuxième moitié (1 ou 2)
  gameComplete: boolean = false;
  
  selectedPair: GamePair | null = null;
  selectedWordId: number | null = null;
  errorShown: boolean = false;
  isGenerating: boolean = false; // Pour la génération de textes de compréhension
  audioEnabled: boolean = true; // Pour activer/désactiver la prononciation audio

  // Pour gérer les mots ratés
  failedWords: number[] = []; // IDs des mots ratés
  hasFailedWords: boolean = false; // Si il y a des mots ratés

  // Pour les sessions générées
  generatedSessions: any[] = [];

  // Pour identifier si c'est une révision du dictionnaire personnel
  isPersonalDictionaryRevision: boolean = false;
  
  // Pour gérer les mots révisés dans la session
  revisedWords: RevisedWord[] = [];
  
  // Info de la session
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
  
  constructor(
    private router: Router,
    private vocabularyTrackingService: VocabularyTrackingService,
    private toastController: ToastController,
    private llmService: LlmService,
    private textGeneratorService: TextGeneratorService,
    private modalController: ModalController,
    private speechService: SpeechService,
    private storageService: StorageService,
    private injector: Injector
  ) { }

  ngOnInit() {
    this.loadAudioPreference();
    this.loadGeneratedSessions();

    // Nouvelle logique : charger la dernière session générée si elle existe
    const lastSessionId = localStorage.getItem('lastAssociationSessionId');
    if (lastSessionId) {
      this.loadGeneratedSession(lastSessionId);
      localStorage.removeItem('lastAssociationSessionId');
    } else {
      this.loadSessionData();
    }
  }

  /**
   * Charge les données de la session depuis le localStorage
   */
  loadSessionData() {
    const wordPairsJson = localStorage.getItem('wordPairs');
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    const isPersonalRevision = localStorage.getItem('isPersonalDictionaryRevision');
    const revisedWordsJson = localStorage.getItem('revisedWords');
    
    console.log('🔍 [WordPairsGame] Chargement des données de session:');
    console.log('🔍 [WordPairsGame] wordPairsJson:', wordPairsJson ? 'présent' : 'absent');
    console.log('🔍 [WordPairsGame] sessionInfoJson:', sessionInfoJson ? 'présent' : 'absent');
    console.log('🔍 [WordPairsGame] isPersonalRevision:', isPersonalRevision);
    console.log('🔍 [WordPairsGame] revisedWordsJson:', revisedWordsJson ? 'présent' : 'absent');
    
    if (wordPairsJson && sessionInfoJson) {
      try {
        this.wordPairs = JSON.parse(wordPairsJson);
        this.sessionInfo = JSON.parse(sessionInfoJson);
        this.isPersonalDictionaryRevision = isPersonalRevision === 'true';
        
        // Charger les mots révisés si c'est une révision du dictionnaire personnel
        if (this.isPersonalDictionaryRevision && revisedWordsJson) {
          this.revisedWords = JSON.parse(revisedWordsJson);
          console.log('🔍 [WordPairsGame] Mots révisés chargés:', this.revisedWords.length);
          console.log('🔍 [WordPairsGame] Détail des mots révisés:', this.revisedWords);
        } else {
          console.log('🔍 [WordPairsGame] Pas de mots révisés à charger');
          console.log('🔍 [WordPairsGame] isPersonalDictionaryRevision:', this.isPersonalDictionaryRevision);
          console.log('🔍 [WordPairsGame] revisedWordsJson:', revisedWordsJson);
        }
        
        // Préparer le jeu
        this.totalPairs = this.wordPairs.length;
        this.setupCurrentGameRound();
        
        console.log('🔍 [WordPairsGame] État final:');
        console.log('🔍 [WordPairsGame] isPersonalDictionaryRevision:', this.isPersonalDictionaryRevision);
        console.log('🔍 [WordPairsGame] revisedWords.length:', this.revisedWords.length);
        console.log('🔍 [WordPairsGame] gameComplete:', this.gameComplete);
        
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
  loadAudioPreference() {
    const savedAudioEnabled = localStorage.getItem('audioEnabled');
    if (savedAudioEnabled !== null) {
      this.audioEnabled = JSON.parse(savedAudioEnabled);
    }
  }

  /**
   * Charge les sessions générées depuis les textes sauvegardés
   */
  loadGeneratedSessions() {
    const sessions = JSON.parse(localStorage.getItem('associationSessions') || '[]');
    this.generatedSessions = sessions;
    if (sessions.length > 0) {
      console.log('Sessions générées disponibles:', sessions.length);
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
  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
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
        if (this.currentPairsSet === 1 && this.wordPairs.length > 6) {
          // Passer au deuxième set si plus de 6 paires
          setTimeout(() => {
            this.currentPairsSet = 2;
            this.matchedPairs = 0;
            this.setupCurrentGameRound();
          }, 1000);
        } else {
          // Terminer le jeu
          this.gameComplete = true;
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
      console.log('Prononciation désactivée. Ne pas jouer le mot.');
      return;
    }

    try {
      console.log('=== DÉBUT playWordPronunciation ===');
      console.log('wordId:', wordId);
      console.log('type:', type);
      
      // Récupérer la paire de mots correspondante
      const wordPair = this.wordPairs[wordId];
      console.log('wordPair trouvée:', wordPair);
      if (!wordPair) {
        console.log('❌ Aucune wordPair trouvée pour wordId:', wordId);
        return;
      }
      
      // Déterminer le mot italien selon la direction de traduction
      const direction = this.sessionInfo?.translationDirection || 'fr2it';
      const italianWord = direction === 'fr2it' ? wordPair.it : wordPair.fr;
      console.log('direction:', direction);
      console.log('mot italien à prononcer:', italianWord);
      
      // Récupérer la clé API Google TTS depuis le StorageService
      const googleTtsApiKey = this.storageService.get('userGoogleTtsApiKey');
      if (!googleTtsApiKey) {
        console.log('❌ Aucune clé API Google TTS trouvée. Veuillez configurer votre clé dans les préférences.');
        return;
      }
      
      const request = {
        input: { text: italianWord },
        voice: { languageCode: 'it-IT', ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3" },
      };
      console.log('request envoyé à l\'API:', request);
      
      console.log('🔄 Envoi de la requête à l\'API Google TTS...');
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      
      console.log('📡 Réponse reçue:', response);
      console.log('Status:', response.status);
      console.log('StatusText:', response.statusText);
      
      if (!response.ok) {
        console.error('❌ Erreur lors de la génération de l\'audio:', response.statusText);
        const errorText = await response.text();
        console.error('Détails de l\'erreur:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log('📦 Données reçues:', data);
      console.log('audioContent présent:', !!data.audioContent);
      console.log('Taille audioContent:', data.audioContent ? data.audioContent.length : 'null');
      
      const audioContent = data.audioContent;
      if (!audioContent) {
        console.error('❌ Pas d\'audioContent dans la réponse');
        return;
      }
      
      console.log('🎵 Création de l\'élément audio...');
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      
      console.log('🔊 Tentative de lecture...');
      await audio.play();
      console.log('✅ Lecture démarrée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la prononciation:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
    }
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
   * Recommence l'exercice complet
   */
  restartExercise() {
    // Réinitialiser les statistiques
    this.matchedPairs = 0;
    this.attempts = 0;
    this.currentPairsSet = 1;
    this.gameComplete = false;
    this.failedWords = [];
    this.hasFailedWords = false;
    
    // Préparer le jeu
    this.setupCurrentGameRound();
    
    this.showToast('Exercice recommencé');
  }

  /**
   * Recommence uniquement avec les mots ratés
   */
  restartFailedWords() {
    if (this.failedWords.length === 0) {
      this.showToast('Aucun mot raté à recommencer');
      return;
    }
    
    // Créer un nouveau jeu avec seulement les mots ratés
    const failedWordPairs = this.failedWords.map(id => this.wordPairs[id]);
    
    // Stocker temporairement les mots ratés pour le nouveau jeu
    localStorage.setItem('wordPairs', JSON.stringify(failedWordPairs));
    
    // Réinitialiser les statistiques
    this.matchedPairs = 0;
    this.attempts = 0;
    this.currentPairsSet = 1;
    this.gameComplete = false;
    this.failedWords = [];
    this.hasFailedWords = false;
    
    // Mettre à jour les données de session
    this.wordPairs = failedWordPairs;
    this.totalPairs = this.wordPairs.length;
    
    // Préparer le nouveau jeu
    this.setupCurrentGameRound();
    
    this.showToast(`Recommencement avec ${failedWordPairs.length} mots ratés`);
  }
  
  /**
   * Navigue vers l'exercice de vocabulaire
   */
  goToVocabularyExercise() {
    // Créer un exercice de vocabulaire à partir des paires de mots
    const direction = this.sessionInfo?.translationDirection || 'fr2it';
    
    // Pour le vocabulaire/encodage, on veut que l'utilisateur traduise dans la direction OPPOSÉE
    // à celle utilisée dans l'association
    const vocabularyExercise = {
      items: this.wordPairs.map(pair => {
        // Inverser la direction pour l'exercice d'encodage
        // Si mode fr2it en association, utiliser it2fr pour l'encodage
        return {
          word: direction === 'fr2it' ? pair.it : pair.fr,
          translation: direction === 'fr2it' ? pair.fr : pair.it,
          context: pair.context
        };
      }),
      type: 'vocabulary',
      topic: this.sessionInfo?.topic || 'Vocabulaire'
    };
    
    // Stocker l'exercice dans le localStorage
    localStorage.setItem('vocabularyExercise', JSON.stringify(vocabularyExercise));
    
    // Naviguer vers l'exercice de vocabulaire
    this.router.navigate(['/vocabulary']);
  }
  
  /**
   * Génère un texte de compréhension écrite
   */
  async generateWrittenComprehension() {
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
    
    // Générer le texte de compréhension via le service avec les thèmes sélectionnés
    this.textGeneratorService.generateComprehensionText(this.wordPairs, 'written', selectedThemes).subscribe({
      next: (result: ComprehensionText) => {
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
   * Génère un texte de compréhension orale
   */
  async generateOralComprehension() {
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
    
    // Générer le texte de compréhension via le service avec les thèmes sélectionnés
    this.textGeneratorService.generateComprehensionText(this.wordPairs, 'oral', selectedThemes).subscribe({
      next: (result: ComprehensionText) => {
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
        console.log('generating speech now');
        this.speechService.generateSpeech(result.text, 'nova').subscribe(() => {
          console.log('speech generated');
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
    console.log('Délai de révision changé pour:', word.sourceWord, '→', word.revisionDelay);
  }

  /**
   * Sauvegarde les délais de révision dans le dictionnaire personnel
   */
  async saveRevisionDelays() {
    try {
      const personalDictionaryService = this.injector.get(PersonalDictionaryService);
      
      for (const word of this.revisedWords) {
        if (word.revisionDelay) {
          const delayInMs = this.calculateDelayInMs(word.revisionDelay);
          if (delayInMs !== null) {
            const minRevisionDate = Date.now() + delayInMs;
            personalDictionaryService.setMinRevisionDate(word.id, minRevisionDate);
            console.log(`Date de révision définie pour ${word.sourceWord}: ${new Date(minRevisionDate).toLocaleDateString()}`);
          }
        }
      }
      
      await this.showToast('Délais de révision sauvegardés avec succès !');
      
      // Vider la liste des mots révisés après sauvegarde
      this.revisedWords = [];
      localStorage.removeItem('revisedWords');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des délais de révision:', error);
      await this.showToast('Erreur lors de la sauvegarde des délais de révision');
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
} 