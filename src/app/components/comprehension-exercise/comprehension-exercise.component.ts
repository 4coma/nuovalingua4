import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
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
export class ComprehensionExerciseComponent implements OnInit, OnChanges {
  @Input() comprehensionText: ComprehensionText | null = null;
  @Output() complete = new EventEmitter<void>();
  
  // Titre de la page pour le header global
  pageTitle: string = 'Compréhension';
  
  highlightedWords: string[] = [];
  selectedWord: string = '';
  translation: TranslationResult | null = null;
  isTranslating: boolean = false;
  
  // Pour la transcription
  showTranscription: boolean = false;

  // Pour la génération de questions
  isGeneratingQuestions: boolean = false;
  isSubmitting: boolean = false;
  evaluationResult: EvaluationResult | null = null;
  showResult: boolean = false;
  
  // Pour le suivi de la session
  sessionInfo: { category: string, topic: string, date: string } | null = null;

  constructor(
    private textGeneratorService: TextGeneratorService,
    private popoverController: PopoverController,
    private router: Router,
    private speechService: SpeechService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private dictionaryService: PersonalDictionaryService,
    private vocabularyTrackingService: VocabularyTrackingService
  ) { }

  ngOnInit() {
    this.updatePageTitle();
    this.loadSessionInfo();
    this.loadComprehensionText();
    
    // Générer automatiquement les questions si le texte existe mais pas de questions
    if (this.comprehensionText?.text && !this.comprehensionText?.questions?.length) {
      this.autoGenerateQuestions();
    }
  }

  ngOnChanges() {
    this.updatePageTitle();
    this.prepareHighlightedWords();
    
    // Générer automatiquement les questions si le texte existe mais pas de questions
    if (this.comprehensionText?.text && !this.comprehensionText?.questions?.length) {
      this.autoGenerateQuestions();
    }
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
        const isVocabularyWord = vocabularyWords.includes(token.toLowerCase());
        
        // Si c'est un mot du vocabulaire, le mettre en évidence spécialement
        if (isVocabularyWord) {
          result += `<span class="highlighted-word vocabulary-word" data-word="${token}">${token}</span>`;
        } else {
          // Sinon, le rendre cliquable mais sans mise en évidence particulière
          result += `<span class="clickable-word" data-word="${token}">${token}</span>`;
        }
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
    console.log('Mot reçu de la directive:', word);
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
      
      // Obtenir la traduction contextuelle
      this.textGeneratorService.getContextualTranslation(word, context).subscribe({
        next: (result) => {
          this.translation = result;
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
        error: () => {
          this.isTranslating = false;
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
            
            // Suivre l'interaction si on a les infos de session
            if (this.sessionInfo) {
              this.vocabularyTrackingService.trackWord(
                vocabularyItem.word,
                vocabularyItem.translation,
                this.sessionInfo.category,
                this.sessionInfo.topic,
                true, // Considéré comme une reconnaissance
                vocabularyItem.context
              );
            }
          }
        }
      });
    }
  }

  /**
   * Ferme la fenêtre de traduction
   */
  closeTranslation(): void {
    this.translation = null;
    this.selectedWord = '';
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
            
            // Sauvegarder dans le localStorage pour conserver l'état
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
    
    // Préparer les données pour l'évaluation
    const originalText = this.comprehensionText.text;
    const questionsWithAnswers = this.comprehensionText.questions;
    
    // Appel au service pour évaluer les réponses
    this.textGeneratorService.evaluateComprehensionAnswers(originalText, questionsWithAnswers)
      .subscribe({
        next: (result: EvaluationResult) => {
          this.hideLoading();
          this.isSubmitting = false;
          this.evaluationResult = result;
          this.showResult = true;
          
          // Sauvegarder le résultat dans le localStorage
          localStorage.setItem('evaluationResult', JSON.stringify(result));
          
          // Mise à jour du suivi de la session si disponible
          if (this.sessionInfo && this.comprehensionText?.vocabularyItems) {
            const category = this.sessionInfo.category;
            const topic = this.sessionInfo.topic;
            
            this.comprehensionText.vocabularyItems.forEach(item => {
              // Détermine si l'item a été correctement compris en contexte
              const understood = this.evaluationResult && typeof this.evaluationResult.score === 'number' 
                ? this.evaluationResult.score > 70 
                : false;
              
              this.vocabularyTrackingService.trackWord(
                item.word,
                item.translation,
                category,
                topic,
                understood,
                item.context
              );
            });
          }
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
    const loading = await this.loadingCtrl.create({
      message: message,
      spinner: 'crescent'
    });
    await loading.present();
  }
  
  /**
   * Cache l'indicateur de chargement
   */
  private hideLoading(): void {
    this.loadingCtrl.getTop().then(loader => {
      if (loader) {
        loader.dismiss();
      }
    });
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
    if (!this.translation) return;

    const sourceLang = this.comprehensionText?.type === 'written' ? 'it' : 'it';
    const targetLang = 'fr'; // Langue cible par défaut (français)
    
    const newWord: DictionaryWord = {
      id: '',
      sourceWord: this.translation.originalWord,
      sourceLang: sourceLang,
      targetWord: this.translation.translation,
      targetLang: targetLang,
      contextualMeaning: this.translation.contextualMeaning,
      partOfSpeech: this.translation.partOfSpeech,
      examples: this.translation.examples,
      dateAdded: 0
    };
    
    const added = this.dictionaryService.addWord(newWord);
    
    if (added) {
      this.showSuccessToast('Mot ajouté à votre dictionnaire personnel');
      
      // Suivre également ce mot pour la révision si on a les infos de session
      if (this.sessionInfo) {
        this.vocabularyTrackingService.trackWord(
          this.translation.originalWord,
          this.translation.translation,
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

  finishExercise() {
    this.complete.emit();
  }
}
