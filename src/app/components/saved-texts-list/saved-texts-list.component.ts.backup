import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SavedTextsService } from '../../services/saved-texts.service';
import { SavedText } from '../../models/vocabulary';
import { TextGeneratorService, TranslationResult, AssociationSession } from '../../services/text-generator.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { SafeHtmlDirective } from '../../directives/click-outside.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-saved-texts-list',
  templateUrl: './saved-texts-list.component.html',
  styleUrls: ['./saved-texts-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    SafeHtmlDirective,
    SafeHtmlPipe
  ],
  providers: [SavedTextsService, TextGeneratorService, PersonalDictionaryService]
})
export class SavedTextsListComponent implements OnInit {
  searchTerm = '';
  filterType: 'all' | 'favorite' = 'all';
  texts: SavedText[] = [];
  filteredTexts: SavedText[] = [];
  favoriteCount = 0;

  selectedText: SavedText | null = null;
  translation: TranslationResult | null = null;
  isTranslating = false;
  selectedWord = '';

  // Pour la sélection d'extrait
  selectedFragment = '';

  // Pour la génération de session d'association
  isGeneratingSession = false;

  // Ajoute une propriété pour stocker les sessions générées
  public generatedSessions: any[] = [];

  constructor(
    private savedTextsService: SavedTextsService,
    private alertCtrl: AlertController,
    private textGeneratorService: TextGeneratorService,
    private dictionaryService: PersonalDictionaryService
  ) {}

  ngOnInit() {
    this.loadTexts();
    this.loadGeneratedSessions();
  }

  loadTexts() {
    this.texts = this.savedTextsService.getAllTexts();
    this.filterTexts();
    this.favoriteCount = this.texts.filter(t => t.isFavorite).length;
  }

  filterTexts() {
    let filtered = this.texts;
    if (this.filterType === 'favorite') {
      filtered = filtered.filter(t => t.isFavorite);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(term) || (t.text || '').toLowerCase().includes(term));
    }
    this.filteredTexts = filtered;
    this.favoriteCount = this.texts.filter(t => t.isFavorite).length;
  }

  toggleFavorite(text: SavedText) {
    this.savedTextsService.toggleFavorite(text.id);
    this.loadTexts();
  }

  async deleteText(text: SavedText) {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer',
      message: 'Supprimer ce texte sauvegardé ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Supprimer', role: 'destructive', handler: () => {
          this.savedTextsService.deleteText(text.id);
          this.loadTexts();
        }}
      ]
    });
    await alert.present();
  }

  selectText(text: SavedText) {
    this.selectedText = text;
    this.translation = null;
    this.selectedWord = '';
    this.selectedFragment = '';
    setTimeout(() => this.attachSelectionListener(), 0);
  }

  closeTextModal() {
    this.selectedText = null;
    this.translation = null;
    this.selectedWord = '';
    this.selectedFragment = '';
  }

  attachSelectionListener() {
    document.addEventListener('selectionchange', this.onSelectionChange);
  }

  detachSelectionListener() {
    document.removeEventListener('selectionchange', this.onSelectionChange);
  }

  onSelectionChange = () => {
    // Vérifie si la modale est ouverte et le texte affiché
    if (!this.selectedText) return;
    const selection = window.getSelection();
    console.log('[DEBUG] selectionchange event');
    if (!selection) {
      console.log('[DEBUG] Pas de selection');
      this.selectedFragment = '';
      return;
    }
    if (selection.isCollapsed) {
      console.log('[DEBUG] Selection is collapsed');
      this.selectedFragment = '';
      return;
    }
    const selectedText = selection.toString().trim();
    console.log('[DEBUG] selectedText:', selectedText);
    if (selectedText.length > 0) {
      // Vérifie que la sélection est dans la div du texte
      const anchorNode = selection.anchorNode as HTMLElement;
      const focusNode = selection.focusNode as HTMLElement;
      const container = document.querySelector('.comprehension-text');
      console.log('[DEBUG] anchorNode:', anchorNode, 'focusNode:', focusNode, 'container:', container);
      if (container && (container.contains(anchorNode) || container.contains(focusNode))) {
        this.selectedFragment = selectedText;
      } else {
        console.log('[DEBUG] Selection hors .comprehension-text');
        this.selectedFragment = '';
      }
    } else {
      console.log('[DEBUG] Selection vide après trim');
      this.selectedFragment = '';
    }
  };

  translateSelection() {
    if (!this.selectedFragment) return;
    this.selectedWord = this.selectedFragment;
    this.isTranslating = true;
    this.translation = null;
    const context = this.selectedText?.text || '';
    this.textGeneratorService.getContextualTranslation(this.selectedFragment, context).subscribe({
      next: (result) => {
        this.translation = result;
        this.isTranslating = false;
      },
      error: () => {
        this.isTranslating = false;
        this.showToast('Erreur lors de la traduction', 'danger');
      }
    });
  }

  getHighlightedText(text: SavedText | null): string {
    if (!text?.text) return '';
    const vocabularyWords = (text.vocabularyItems || []).map(item => item.word.toLowerCase());
    const tokenRegex = /(\w+)|([^\w\s])/g;
    let match;
    let result = '';
    let lastIndex = 0;
    while ((match = tokenRegex.exec(text.text)) !== null) {
      result += text.text.substring(lastIndex, match.index);
      const token = match[0];
      if (/\w+/.test(token)) {
        const isVocabularyWord = vocabularyWords.includes(token.toLowerCase());
        if (isVocabularyWord) {
          result += `<span class="highlighted-word vocabulary-word" data-word="${token}">${token}</span>`;
        } else {
          result += `<span class="clickable-word" data-word="${token}">${token}</span>`;
        }
      } else {
        result += token;
      }
      lastIndex = match.index + token.length;
    }
    result += text.text.substring(lastIndex);
    return result;
  }

  onWordClicked(word: string, text: SavedText | null) {
    if (!text) return;
    this.selectedWord = word;
    this.isTranslating = true;
    this.translation = null;
    
    // Extraire le contexte autour du mot
    const context = this.textGeneratorService.extractContext(text.text, word);
    
    // Ajouter un timeout pour éviter que le loader reste bloqué
    const timeout = setTimeout(() => {
      if (this.isTranslating) {
        this.isTranslating = false;
        this.showToast('Délai d\'attente dépassé. Réessayez.', 'danger');
      }
    }, 20000); // 30 secondes de timeout
    
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
        
        // En cas d'erreur, utiliser la traduction de base du vocabulaire
        const vocabularyItem = (text.vocabularyItems || []).find(
          item => item.word.toLowerCase() === word.toLowerCase()
        );
        if (vocabularyItem) {
          this.translation = {
            originalWord: vocabularyItem.word,
            translation: vocabularyItem.translation,
            contextualMeaning: vocabularyItem.context || 'Pas d\'information supplémentaire disponible'
          };
        } else {
          this.showToast('Erreur lors de la traduction. Réessayez.', 'danger');
        }
      }
    });
  }

  closeTranslation() {
    this.translation = null;
    this.selectedWord = '';
  }

  addWordToDictionary() {
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
      dateAdded: 0
    };
    const added = this.dictionaryService.addWord(newWord);
    if (added) {
      this.showToast('Mot ajouté à votre dictionnaire personnel', 'success');
    } else {
      this.showToast('Ce mot existe déjà dans votre dictionnaire', 'danger');
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.alertCtrl.create({
      header: message,
      buttons: ['OK'],
      cssClass: color
    });
    await toast.present();
  }

  /**
   * Génère une session d'association à partir du texte sélectionné
   */
  async generateAssociationSession() {
    if (!this.selectedText) return;

    this.isGeneratingSession = true;

    const prompt = (this.textGeneratorService as any).createAssociationSessionPrompt(this.selectedText.text, this.selectedText.title || 'Session d\'association');

    try {
      const session = await this.textGeneratorService.generateAssociationSessionFromText(
        this.selectedText.text,
        this.selectedText.title || 'Session d\'association'
      ).toPromise();

      // LOG: Session générée
      console.log('[ASSO] Session générée:', session);
      if (session && session.wordPairs.length > 0) {
        // Sauvegarder la session dans le localStorage
        const sessions = JSON.parse(localStorage.getItem('associationSessions') || '[]');
        const newSession = {
          ...session,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          sourceTextId: this.selectedText.id
        };
        sessions.push(newSession);
        localStorage.setItem('associationSessions', JSON.stringify(sessions));

        // Stocker l'ID de la dernière session générée
        localStorage.setItem('lastAssociationSessionId', newSession.id);

        // Rediriger directement vers l'exercice d'association
        window.location.href = '/word-pairs-game';
        return;
      } else {
        await this.showToast('Erreur lors de la génération de la session', 'danger');
      }
    } catch (error) {
      // LOG: Erreur brute
      console.error('[ASSO] Erreur lors de la génération de la session:', error);
      await this.showToast('Erreur lors de la génération de la session', 'danger');
    } finally {
      this.isGeneratingSession = false;
    }
  }

  loadGeneratedSessions() {
    this.generatedSessions = JSON.parse(localStorage.getItem('associationSessions') || '[]');
  }

  restartGeneratedSession(sessionId: string) {
    localStorage.setItem('lastAssociationSessionId', sessionId);
    window.location.href = '/word-pairs-game';
  }

  goHome() {
    window.location.href = '/home';
  }
} 