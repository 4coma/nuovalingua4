import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController, LoadingController, ToastController } from '@ionic/angular';
import { TextGeneratorService, TranslationResult } from '../../services/text-generator.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { SafeHtmlDirective } from '../../directives/click-outside.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-translatable-message',
  templateUrl: './translatable-message.component.html',
  styleUrls: ['./translatable-message.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    SafeHtmlDirective,
    SafeHtmlPipe
  ]
})
export class TranslatableMessageComponent implements OnInit, OnDestroy {
  @Input() message: string = '';
  @Input() speaker: 'ai' | 'user' = 'ai';
  @Input() speakerName: string = '';
  @Input() timestamp?: Date;
  @Input() showTimestamp: boolean = true;
  @Input() highlightWords: string[] = [];

  selectedFragment: string = '';
  showTranslateButton: boolean = false;
  translateButtonPosition = { top: 0, left: 0 };
  
  selectedWord: string = '';
  translation: TranslationResult | null = null;
  isTranslating: boolean = false;

  constructor(
    private textGeneratorService: TextGeneratorService,
    private popoverController: PopoverController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private dictionaryService: PersonalDictionaryService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    setTimeout(() => this.attachSelectionListener(), 0);
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
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      this.selectedFragment = '';
      this.showTranslateButton = false;
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      // Vérifie que la sélection est dans ce composant
      const anchorNode = selection.anchorNode as HTMLElement;
      const focusNode = selection.focusNode as HTMLElement;
      const container = document.querySelector('.translatable-message');
      
      if (container && (container.contains(anchorNode) || container.contains(focusNode))) {
        this.selectedFragment = selectedText;
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
    
    this.textGeneratorService.getContextualTranslation(this.selectedFragment, this.message).subscribe({
      next: (result) => {
        this.translation = result;
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

  onWordClicked(word: string): void {
    this.getWordTranslation(word);
  }

  getWordTranslation(word: string): void {
    this.selectedWord = word;
    this.isTranslating = true;
    this.translation = null;
    
    // Extraire le contexte autour du mot
    const context = this.textGeneratorService.extractContext(this.message, word);
    
    // Ajouter un timeout pour éviter que le loader reste bloqué
    const timeout = setTimeout(() => {
      if (this.isTranslating) {
        this.isTranslating = false;
        this.showErrorToast('Délai d\'attente dépassé. Réessayez.');
      }
    },20000); // 30 secondes de timeout
    
    this.textGeneratorService.getContextualTranslation(word, context).subscribe({
      next: (result) => {
        clearTimeout(timeout);
        this.translation = result;
        this.isTranslating = false;
      },
      error: (error) => {
        clearTimeout(timeout);
        this.isTranslating = false;
        console.error('Erreur lors de la traduction:', error);
        this.showErrorToast('Erreur lors de la traduction. Réessayez.');
      }
    });
  }

  closeTranslation(): void {
    this.translation = null;
    this.selectedWord = '';
  }

  addWordToDictionary(): void {
    if (!this.translation) return;

    const newWord: DictionaryWord = {
      id: '',
      sourceWord: this.translation.originalWord,
      sourceLang: 'it',
      targetWord: this.translation.translation,
      targetLang: 'fr',
      contextualMeaning: this.translation.contextualMeaning,
      partOfSpeech: this.translation.partOfSpeech,
      examples: this.translation.examples,
      dateAdded: 0,
      themes: this.translation.themes || [] // Inclure les thèmes générés par l'IA
    };
    
    const added = this.dictionaryService.addWord(newWord);
    
    if (added) {
      this.showSuccessToast('Mot ajouté à votre dictionnaire personnel');
    } else {
      this.showErrorToast('Ce mot existe déjà dans votre dictionnaire');
    }
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  getHighlightedText(): string {
    if (!this.message) return '';

    let text = this.message;
    
    // Rendre tous les mots cliquables en les entourant de spans
    const highlightSet = new Set(
      (this.highlightWords || [])
        .map(w => this.normalizeForComparison(w))
    );

    const words = text.split(/(\s+)/);
    const highlightedWords = words.map(word => {
      if (word.trim() && !word.match(/^\s+$/)) {
        const cleaned = this.cleanWord(word);
        const isHighlighted = cleaned && highlightSet.has(this.normalizeForComparison(cleaned));
        const baseClass = isHighlighted ? 'clickable-word highlighted-word' : 'clickable-word';
        return `<span class="${baseClass}" data-word="${word.trim()}">${word}</span>`;
      }
      return word;
    });
    
    return highlightedWords.join('');
  }

  private normalizeForComparison(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private cleanWord(value: string): string {
    return value
      .trim()
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .replace(/[^\p{L}\p{N}]+$/u, '');
  }
}
