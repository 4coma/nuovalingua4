import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComprehensionText, ComprehensionQuestion, EvaluationResult } from '../../models/vocabulary';
import { TextGeneratorService, TranslationResult } from '../../services/text-generator.service';
import { VocabularyTrackingService } from '../../services/vocabulary-tracking.service';
import { AudioPlayerComponent } from '../audio-player/audio-player.component';
import { SafeHtmlDirective } from '../../directives/click-outside.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { PersonalDictionaryService } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-comprehension-questions',
  templateUrl: './comprehension-questions.component.html',
  styleUrls: ['./comprehension-questions.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    RouterLink,
    AudioPlayerComponent,
    SafeHtmlDirective,
    SafeHtmlPipe
  ]
})
export class ComprehensionQuestionsComponent implements OnInit {
  // Titre de la page pour le header global
  pageTitle: string = 'Questions de compréhension';
  
  comprehensionText: ComprehensionText | null = null;
  questions: ComprehensionQuestion[] = [];
  isSubmitting: boolean = false;
  evaluationResult: EvaluationResult | null = null;
  showResult: boolean = false;
  
  // Pour le suivi de la session
  sessionInfo: { category: string, topic: string, date: string } | null = null;
  
  // Pour la transcription
  showTranscription: boolean = false;
  
  // Pour la traduction
  translation: TranslationResult | null = null;
  isTranslating: boolean = false;
  highlightedWords: string[] = [];
  
  // Pour l'audio
  audioUrl: string | null = null;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private textGeneratorService: TextGeneratorService,
    private vocabularyTrackingService: VocabularyTrackingService,
    private dictionaryService: PersonalDictionaryService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.loadComprehensionData();
    this.loadSessionInfo();
    this.prepareHighlightedWords();
  }

  /**
   * Charge les données de compréhension du localStorage
   */
  loadComprehensionData() {
    const storedText = localStorage.getItem('comprehensionText');
    if (storedText) {
      try {
        this.comprehensionText = JSON.parse(storedText);
        
        // Si des questions existent, les utiliser
        if (this.comprehensionText?.questions && this.comprehensionText.questions.length > 0) {
          this.questions = this.comprehensionText.questions.map(q => ({ 
            ...q, 
            userAnswer: '' 
          }));
        } else {
          // Si pas de questions, rediriger
          this.router.navigate(['/comprehension']);
        }
      } catch (e) {
        console.error('Erreur lors du parsing du texte de compréhension:', e);
        this.router.navigate(['/comprehension']);
      }
    } else {
      // Si pas de texte, rediriger
      this.router.navigate(['/comprehension']);
    }
  }
  
  /**
   * Prépare la liste des mots mis en évidence dans le texte
   */
  prepareHighlightedWords() {
    if (this.comprehensionText?.vocabularyItems) {
      this.highlightedWords = this.comprehensionText.vocabularyItems.map(item => item.word.toLowerCase());
    } else {
      this.highlightedWords = [];
    }
  }
  
  /**
   * Met en évidence les mots du vocabulaire dans le texte
   */
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
   * Active ou désactive l'affichage de la transcription
   */
  toggleTranscription() {
    this.showTranscription = !this.showTranscription;
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
    if (!this.comprehensionText?.text) return;
    
    this.isTranslating = true;
    this.translation = null;
    
    // Extraire le contexte autour du mot
    const context = this.textGeneratorService.extractContext(this.comprehensionText.text, word);
    
    // Ajouter un timeout pour éviter que le loader reste bloqué
    const timeout = setTimeout(() => {
      if (this.isTranslating) {
        this.isTranslating = false;
        this.showErrorToast('Délai d\'attente dépassé. Réessayez.');
      }
    }, 30000); // 30 secondes de timeout
    
    // Obtenir la traduction contextuelle
    this.textGeneratorService.getContextualTranslation(word, context).subscribe({
      next: (result) => {
        clearTimeout(timeout);
        this.translation = result;
        this.isTranslating = false;
        
        // Vérifie si le mot fait partie du vocabulaire de la session
        const vocabularyItem = this.comprehensionText?.vocabularyItems.find(
          item => item.word.toLowerCase() === word.toLowerCase()
        );
        
        // Suit l'interaction avec ce mot s'il fait partie du vocabulaire
        if (vocabularyItem && this.sessionInfo) {
          this.vocabularyTrackingService.trackWord(
            vocabularyItem.word,
            vocabularyItem.translation,
            this.sessionInfo.category,
            this.sessionInfo.topic,
            true,
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
        } else {
          this.showErrorToast('Erreur lors de la traduction. Réessayez.');
        }
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
   * Soumet les réponses pour évaluation
   */
  submitAnswers() {
    if (!this.comprehensionText?.text) return;
    
    this.isSubmitting = true;
    
    // Mise à jour des réponses dans les questions
    this.questions.forEach(q => {
      if (!q.userAnswer) q.userAnswer = ''; // S'assurer qu'il n'y a pas de undefined
    });
    
    // Envoyer à l'API pour évaluation
    this.textGeneratorService.evaluateUserAnswers(this.comprehensionText.text, this.questions)
      .subscribe({
        next: (result) => {
          this.evaluationResult = result;
          this.isSubmitting = false;
          this.showResult = true;
          
          // Sauvegarder l'évaluation dans le localStorage
          localStorage.setItem('evaluationResult', JSON.stringify(result));
          
          // Suivre la performance sur les mots de vocabulaire
          this.trackVocabularyPerformance(result);
        },
        error: (error) => {
          console.error('Erreur lors de l\'évaluation des réponses:', error);
          this.isSubmitting = false;
          alert('Erreur lors de l\'évaluation des réponses. Veuillez réessayer.');
        }
      });
  }
  
  /**
   * Suit la performance sur les mots de vocabulaire mentionnés dans les questions et réponses
   */
  private trackVocabularyPerformance(result: EvaluationResult) {
    if (!this.comprehensionText?.vocabularyItems || !this.sessionInfo) return;
    
    const vocabularyWords = this.comprehensionText.vocabularyItems;
    
    // Pour chaque feedback de question
    result.feedback.forEach(feedback => {
      const isCorrect = feedback.isCorrect;
      
      // Vérifier si des mots du vocabulaire sont mentionnés dans la question ou la réponse
      vocabularyWords.forEach(vocabItem => {
        // Si le mot est présent dans la question ou la réponse
        const wordInQuestion = feedback.question.toLowerCase().includes(vocabItem.word.toLowerCase());
        const wordInUserAnswer = feedback.userAnswer.toLowerCase().includes(vocabItem.word.toLowerCase());
        const wordInCorrectAnswer = feedback.correctAnswer?.toLowerCase().includes(vocabItem.word.toLowerCase());
        
        if (wordInQuestion || wordInUserAnswer || wordInCorrectAnswer) {
          // Suivre l'utilisation de ce mot dans la question
          this.vocabularyTrackingService.trackWord(
            vocabItem.word,
            vocabItem.translation,
            this.sessionInfo!.category,
            this.sessionInfo!.topic,
            isCorrect, // La réponse correcte indique une bonne maîtrise
            vocabItem.context
          );
        }
      });
    });
  }

  /**
   * Retourne à la page de compréhension
   */
  goBackToComprehension() {
    this.navCtrl.back();
  }

  /**
   * Retourne à la sélection de catégorie
   */
  goToCategories() {
    this.router.navigate(['/category']);
  }
} 