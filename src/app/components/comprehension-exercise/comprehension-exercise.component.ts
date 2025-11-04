import { Component, EventEmitter, Input, OnInit, Output, OnChanges, OnDestroy } from '@angular/core';
import { ComprehensionText, VocabularyItem, ComprehensionQuestion, EvaluationResult } from '../../models/vocabulary';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController, LoadingController, ToastController } from '@ionic/angular';
import { TextGeneratorService, TranslationResult } from '../../services/text-generator.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SafeHtmlDirective } from '../../directives/click-outside.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { SpeechService } from '../../services/speech.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { SavedTextsService } from '../../services/saved-texts.service';

@Component({
  selector: 'app-comprehension-exercise',
  templateUrl: './comprehension-exercise.component.html',
  styleUrls: ['./comprehension-exercise.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    SafeHtmlDirective,
    SafeHtmlPipe,
    AudioPlayerComponent,
    RouterLink
  ]
})
export class ComprehensionExerciseComponent implements OnInit, OnChanges, OnDestroy {
  @Input() comprehensionText: ComprehensionText | null = null;
  @Output() complete = new EventEmitter<void>();
  
  // Titre de la page pour le header global
  pageTitle: string = 'Compréhension';
  
  highlightedWords: string[] = [];
  selectedWord: string = '';
  translation: TranslationResult | null = null;
  editableTranslation: string = '';
  isTranslating: boolean = false;
  
  // Pour la transcription
  showTranscription: boolean = false;
  
  // Pour l'audio
  audioUrl: string | null = null;
  isAudioLoading: boolean = false;

  // Pour la génération de questions
  isGeneratingQuestions: boolean = false;
  
  // Pour la soumission et évaluation des questions
  isSubmitting: boolean = false;
  showResult: boolean = false;
  evaluationResult: EvaluationResult | null = null;
  
  // Pour le suivi de la session
  sessionInfo: { category: string, topic: string, date: string } | null = null;

  selectedFragment: string = '';
  showTranslateButton: boolean = false;
  translateButtonPosition = { top: 0, left: 0 };

  // Référence au loader actuel
  private currentLoader: HTMLIonLoadingElement | null = null;

  constructor(
    private textGeneratorService: TextGeneratorService,
    private popoverController: PopoverController,
    private router: Router,
    private speechService: SpeechService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private dictionaryService: PersonalDictionaryService,
    private vocabularyTrackingService: VocabularyTrackingService,
    private savedTextsService: SavedTextsService
  ) { }

  ngOnInit() {
    this.updatePageTitle();
    this.loadSessionInfo();
    this.loadComprehensionText();
    
    // Générer automatiquement les questions si le texte existe mais pas de questions
    if (this.comprehensionText?.text && !this.comprehensionText?.questions?.length) {
      this.autoGenerateQuestions();
    }
    
    // Générer l'audio pour les compréhensions orales
    if (this.comprehensionText?.type === 'oral' && this.comprehensionText?.text) {
      this.generateAudio();
    }
    
    setTimeout(() => this.attachSelectionListener(), 0);
  }

  ngOnChanges() {
    this.updatePageTitle();
    this.prepareHighlightedWords();
    
    // Générer automatiquement les questions si le texte existe mais pas de questions
    if (this.comprehensionText?.text && !this.comprehensionText?.questions?.length) {
      this.autoGenerateQuestions();
    }
    
    // Générer l'audio pour les compréhensions orales
    if (this.comprehensionText?.type === 'oral' && this.comprehensionText?.text) {
      this.generateAudio();
    }
  }

  ngOnDestroy() {
    this.detachSelectionListener();
  }

  attachSelectionListener() {
    document.addEventListener('selectionchange', this.onSelectionChange);
  }

  detachSelectionListener() {
    document.removeEventListener('selectionchange', this.onSelectionChange);
  }

  onSelectionChange = () => {
    // Vérifie si le texte de compréhension est affiché
    if (!this.comprehensionText) return;
    const selection = window.getSelection();
    if (!selection) {
      this.selectedFragment = '';
      this.showTranslateButton = false;
      return;
    }
    if (selection.isCollapsed) {
      this.selectedFragment = '';
      this.showTranslateButton = false;
      return;
    }
    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      // Vérifie que la sélection est dans la div du texte
      const anchorNode = selection.anchorNode as HTMLElement;
      const focusNode = selection.focusNode as HTMLElement;
      const container = document.querySelector('.comprehension-text');
      if (container && (container.contains(anchorNode) || container.contains(focusNode))) {
        this.selectedFragment = selectedText;
        // Calcule la position du bouton (fin de la sélection)
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        this.translateButtonPosition = {
          top: rect.bottom + window.scrollY,
          left: rect.right + window.scrollX - 40
        };
        this.showTranslateButton = true;
      } else {
        this.selectedFragment = '';
        this.showTranslateButton = false;
      }
    } else {
      this.selectedFragment = '';
      this.showTranslateButton = false;
    }
  };

  translateSelection() {
    if (!this.selectedFragment) return;
    this.selectedWord = this.selectedFragment;
    this.isTranslating = true;
    this.translation = null;
    const context = this.comprehensionText?.text || '';
    this.textGeneratorService.getContextualTranslation(this.selectedFragment, context).subscribe({
      next: (result) => {
        this.translation = result;
        this.editableTranslation = result.translation;
        this.isTranslating = false;
        this.clearSelection();
      },
      error: () => {
        this.isTranslating = false;
        this.clearSelection();
        this.showErrorToast('Erreur lors de la traduction');
      }
    });
  }

  clearSelection() {
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    this.selectedFragment = '';
    this.showTranslateButton = false;
  }

  /**
   * Met à jour le titre de la page en fonction du type de compréhension
   */
  updatePageTitle() {
    if (this.comprehensionText) {
      this.pageTitle = this.comprehensionText.type === 'written' ? 
        'Compréhension écrite' : 
        'Compréhension orale';
    }
  }

  /**
   * Charge les informations sur la session depuis le localStorage
   */
  loadSessionInfo() {
    const sessionInfoJson = localStorage.getItem('sessionInfo');
    if (sessionInfoJson) {
      try {
        this.sessionInfo = JSON.parse(sessionInfoJson);
      } catch (e) {
        console.error('Erreur lors du parsing des infos de session:', e);
      }
    }
  }

  /**
   * Charge le texte de compréhension depuis le localStorage
   */
  loadComprehensionText() {
    const storedText = localStorage.getItem('comprehensionText');
    if (storedText) {
      try {
        this.comprehensionText = JSON.parse(storedText);
      } catch (e) {
        console.error('Erreur lors du parsing du texte de compréhension:', e);
      }
    }
    
    // Si pas de texte, rediriger vers la page de vocabulaire
    if (!this.comprehensionText) {
      this.router.navigate(['/vocabulary']);
    }
  }

  prepareHighlightedWords() {
    if (this.comprehensionText?.vocabularyItems) {
      this.highlightedWords = this.comprehensionText.vocabularyItems.map(item => item.word.toLowerCase());
    } else {
      this.highlightedWords = [];
    }
  }

  getHighlightedText(): string {
    if (!this.comprehensionText?.text) {
      return '';
    }

    let text = this.comprehensionText.text;
    
    // Stocker les mots du vocabulaire pour les mettre en évidence
    const vocabularyWords = this.highlightedWords.map(word => word.toLowerCase());
    
    // Récupérer les mots du dictionnaire personnel pour une vérification rapide
    const dictionaryWordsSet = this.dictionaryService.getDictionaryWordsSet('it');
    
    // Diviser le texte en mots tout en préservant la ponctuation
    const tokenRegex = /(\w+)|([^\w\s])/g;
    let match;
    let result = '';
    let lastIndex = 0;
    
    // Pour chaque mot trouvé
    while ((match = tokenRegex.exec(text)) !== null) {
      // Ajouter le texte avant le mot actuel
      result += text.substring(lastIndex, match.index);
      
      // Récupérer le mot trouvé (peut être un mot ou une ponctuation)
      const token = match[0];
      
      // Si c'est un mot (pas une ponctuation)
      if (/\w+/.test(token)) {
        const normalizedToken = token.toLowerCase();
        const isVocabularyWord = vocabularyWords.includes(normalizedToken);
        const isDictionaryWord = dictionaryWordsSet.has(normalizedToken);
        
        let cssClass = 'clickable-word';
        if (isVocabularyWord) {
          cssClass += ' highlighted-word vocabulary-word';
        }
        if (isDictionaryWord) {
          cssClass += ' dictionary-word';
        }
        
        result += `<span class="${cssClass}" data-word="${token}">${token}</span>`;
      } else {
        // Si c'est une ponctuation, l'ajouter simplement
        result += token;
      }
      
      lastIndex = match.index + token.length;
    }
    
    // Ajouter le reste du texte
    result += text.substring(lastIndex);
    
    return result;
  }

  /**
   * Gère un mot cliqué via la directive SafeHtmlDirective
   */
  onWordClicked(word: string): void {
    this.getWordTranslation(word);
  }

  /**
   * Obtient la traduction contextuelle d'un mot
   */
  getWordTranslation(word: string): void {
    this.selectedWord = word;
    this.isTranslating = true;
    this.translation = null;
    
    if (this.comprehensionText?.text) {
      // Extraire le contexte autour du mot
      const context = this.textGeneratorService.extractContext(this.comprehensionText.text, word);
      
      // Ajouter un timeout pour éviter que le loader reste bloqué
      const timeout = setTimeout(() => {
        if (this.isTranslating) {
          this.isTranslating = false;
          this.showErrorToast('Délai d\'attente dépassé. Réessayez.');
        }
      }, 20000); // 30 secondes de timeout
      
      // Obtenir la traduction contextuelle
      this.textGeneratorService.getContextualTranslation(word, context).subscribe({
        next: (result) => {
          clearTimeout(timeout);
          this.translation = result;
          this.editableTranslation = result.translation;
          this.isTranslating = false;
          
          // Vérifier si ce mot fait partie du vocabulaire de la session
          const vocabularyItem = this.comprehensionText?.vocabularyItems.find(
            item => item.word.toLowerCase() === word.toLowerCase()
          );
          
          // Suivre l'interaction avec ce mot s'il fait partie du vocabulaire et si on a les infos de session
          if (vocabularyItem && this.sessionInfo) {
            this.vocabularyTrackingService.trackWord(
              vocabularyItem.word,
              vocabularyItem.translation,
              this.sessionInfo.category,
              this.sessionInfo.topic,
              true, // Considéré comme une reconnaissance, car l'utilisateur a cherché la traduction
              vocabularyItem.context
            );
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          this.isTranslating = false;
          console.error('Erreur lors de la traduction:', error);
          
          // En cas d'erreur, utiliser la traduction de base du vocabulaire
          const vocabularyItem = this.comprehensionText?.vocabularyItems.find(
            item => item.word.toLowerCase() === word.toLowerCase()
          );
          
          if (vocabularyItem) {
            this.translation = {
              originalWord: vocabularyItem.word,
              translation: vocabularyItem.translation,
              contextualMeaning: vocabularyItem.context || 'Pas d\'information supplémentaire disponible'
            };
            this.editableTranslation = vocabularyItem.translation;
          } else {
            this.showErrorToast('Erreur lors de la traduction. Réessayez.');
          }
        }
      });
    } else {
      this.isTranslating = false;
      this.showErrorToast('Aucun texte disponible pour la traduction.');
    }
  }

  /**
   * Ferme la modal de traduction
   */
  closeTranslation(): void {
    this.translation = null;
    this.editableTranslation = '';
    this.isTranslating = false;
  }

  /**
   * Fonction obsolète, remplacée par le service SpeechService
   */
  playAudio() {
    if (!this.comprehensionText?.text) return;
    
    // Use the Web Speech API for text-to-speech
    const utterance = new SpeechSynthesisUtterance(this.comprehensionText.text);
    utterance.lang = 'it-IT'; // Italian language
    utterance.rate = 0.8; // Slightly slower rate for learning
    
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Active/désactive l'affichage de la transcription (pour la compréhension orale)
   */
  toggleTranscription() {
    this.showTranscription = !this.showTranscription;
  }

  /**
   * Génère automatiquement des questions après un délai pour laisser le temps à l'utilisateur de lire/écouter
   */
  private autoGenerateQuestions() {
    // Attendre quelques secondes pour générer les questions automatiquement
    // Cela donne le temps à l'utilisateur de commencer à lire ou écouter
    setTimeout(() => {
      if (!this.comprehensionText?.questions?.length) {
        this.generateQuestions();
      }
    }, 1000); // 1 seconde de délai
  }

  /**
   * Génère des questions de compréhension à partir du texte actuel
   */
  generateQuestions() {
    if (!this.comprehensionText?.text) return;
    
    this.isGeneratingQuestions = true;
    this.showLoading('Génération des questions...');
    
    // Appel à l'API pour générer des questions
    this.textGeneratorService.generateComprehensionQuestions(this.comprehensionText.text)
      .subscribe({
        next: (result) => {
          this.hideLoading();
          this.isGeneratingQuestions = false;
          
          // Mettre à jour le texte de compréhension avec les questions générées
          if (this.comprehensionText) {
            this.comprehensionText.questions = result.questions.map(q => ({ 
              ...q, 
              userAnswer: '' 
            }));
            
            // Sauvegarder dans le localStorage
            localStorage.setItem('comprehensionText', JSON.stringify(this.comprehensionText));
          }
        },
        error: (error) => {
          this.hideLoading();
          this.isGeneratingQuestions = false;
          this.showErrorToast('Erreur lors de la génération des questions');
          console.error('Erreur de génération de questions:', error);
        }
      });
  }

  /**
   * Soumet les réponses aux questions pour évaluation
   */
  submitAnswers() {
    if (!this.comprehensionText?.questions?.length) return;
    
    this.isSubmitting = true;
    this.showLoading('Évaluation de vos réponses...');
    
    // Appel à l'API pour évaluer les réponses
    this.textGeneratorService.evaluateUserAnswers(
      this.comprehensionText.text,
      this.comprehensionText.questions
    ).subscribe({
      next: (result: EvaluationResult) => {
        this.hideLoading();
        this.isSubmitting = false;
        this.evaluationResult = result;
        this.showResult = true;
      },
      error: (error: any) => {
        this.hideLoading();
        this.isSubmitting = false;
        this.showErrorToast('Erreur lors de l\'évaluation des réponses');
        console.error('Erreur d\'évaluation:', error);
        }
      });
  }

  /**
   * Affiche un indicateur de chargement
   */
  private async showLoading(message: string): Promise<void> {
    this.currentLoader = await this.loadingCtrl.create({
      message: message,
      spinner: 'crescent'
    });
    await this.currentLoader.present();
  }
  
  /**
   * Cache l'indicateur de chargement
   */
  private hideLoading(): void {
    if (this.currentLoader) {
      this.currentLoader.dismiss();
      this.currentLoader = null;
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
   * Ajoute le mot actuel au dictionnaire personnel
   */
  addWordToDictionary(): void {
    if (!this.translation || !this.editableTranslation.trim()) return;

    const sourceLang = this.comprehensionText?.type === 'written' ? 'it' : 'it';
    const targetLang = 'fr'; // Langue cible par défaut (français)
    
    const newWord: DictionaryWord = {
      id: '',
      sourceWord: this.translation.originalWord,
      sourceLang: sourceLang,
      targetWord: this.editableTranslation.trim(),
      targetLang: targetLang,
      contextualMeaning: this.translation.contextualMeaning,
      partOfSpeech: this.translation.partOfSpeech,
      examples: this.translation.examples,
      dateAdded: 0,
      themes: this.translation.themes || [] // Inclure les thèmes générés par l'IA
    };
    
    const added = this.dictionaryService.addWord(newWord);
    
    if (added) {
      this.showSuccessToast('Mot ajouté à votre dictionnaire personnel');
      
      // Suivre également ce mot pour la révision si on a les infos de session
      if (this.sessionInfo) {
        this.vocabularyTrackingService.trackWord(
          this.translation.originalWord,
          this.editableTranslation.trim(),
          this.sessionInfo.category,
          this.sessionInfo.topic,
          true, // Considéré comme reconnu car ajouté au dictionnaire
          this.translation.contextualMeaning
        );
      }
    } else {
      this.showErrorToast('Ce mot existe déjà dans votre dictionnaire');
    }
  }

  /**
   * Affiche un message de succès
   */
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  /**
   * Sauvegarde le texte actuel
   */
  saveText() {
    
    // Toast de test pour voir si le bouton est cliqué
    this.showSuccessToast('Bouton de sauvegarde cliqué !');
    
    if (!this.comprehensionText || !this.sessionInfo) {
      console.error('Données manquantes pour la sauvegarde');
      this.showErrorToast('Impossible de sauvegarder le texte');
      return;
    }

    // Vérifier si le texte existe déjà
    if (this.savedTextsService.textExists(
      this.comprehensionText.text, 
      this.sessionInfo.category, 
      this.sessionInfo.topic
    )) {
      this.showErrorToast('Ce texte est déjà sauvegardé');
      return;
    }

    const success = this.savedTextsService.saveText(
      this.comprehensionText,
      this.sessionInfo.category,
      this.sessionInfo.topic
    );

    if (success) {
      this.showSuccessToast('Texte sauvegardé avec succès !');
    } else {
      this.showErrorToast('Erreur lors de la sauvegarde');
    }
  }

  /**
   * Vérifie si le texte actuel est déjà sauvegardé
   */
  isTextAlreadySaved(): boolean {
    if (!this.comprehensionText || !this.sessionInfo) {
      return false;
    }

    return this.savedTextsService.textExists(
      this.comprehensionText.text,
      this.sessionInfo.category,
      this.sessionInfo.topic
    );
  }

  finishExercise() {
    this.complete.emit();
    
    // Vérifier d'où vient l'utilisateur pour le rediriger vers le bon endroit
    const fromWordPairs = localStorage.getItem('fromWordPairs');
    const fromFocusMode = localStorage.getItem('isFocusMode');
    
    if (fromWordPairs === 'true') {
      // Si l'utilisateur vient d'une session d'association, retourner à l'écran de fin de session
      localStorage.removeItem('fromWordPairs'); // Nettoyer le flag
      this.router.navigate(['/word-pairs-game']);
    } else if (fromFocusMode === 'true') {
      // Si l'utilisateur est en mode focus, retourner à l'écran de fin de session focus
      this.router.navigate(['/word-pairs-game']);
    } else {
      // Sinon, retourner aux catégories
      this.router.navigate(['/category']);
    }
  }

  /**
   * Génère l'audio pour les compréhensions orales
   */
  private generateAudio() {
    if (!this.comprehensionText?.text) return;
    
    
    this.isAudioLoading = true;
    
    this.speechService.generateSpeech(this.comprehensionText.text, 'nova', 0.9).subscribe({
      next: (audioUrl) => {
        this.audioUrl = audioUrl;
        this.isAudioLoading = false;
      },
      error: (error) => {
        console.error('🔍 ComprehensionExercise - Erreur lors de la génération audio:', error);
        this.showErrorToast('Erreur lors de la génération de l\'audio');
        this.isAudioLoading = false;
      }
    });
  }
}
