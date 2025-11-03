import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ModalController, ActionSheetController, ToastController } from '@ionic/angular';
import { ViewWillEnter } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SavedTextsService } from '../../services/saved-texts.service';
import { SavedText } from '../../models/vocabulary';
import { TextGeneratorService, TranslationResult, AssociationSession } from '../../services/text-generator.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { SafeHtmlDirective } from '../../directives/click-outside.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { AddWordComponent } from '../add-word/add-word.component';
import { AddTextModalComponent } from '../add-text-modal/add-text-modal.component';
import { TextPreviewModalComponent } from '../text-preview-modal/text-preview-modal.component';

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
export class SavedTextsListComponent implements OnInit, OnDestroy, ViewWillEnter {
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
  
  // Référence à l'écouteur d'événement
  private textSavedListener: any;
  // Subscription aux changements du dictionnaire
  private dictionarySubscription?: Subscription;
  // Compteur pour forcer la mise à jour de la vue
  public highlightUpdateCounter = 0;

  constructor(
    private savedTextsService: SavedTextsService,
    private alertCtrl: AlertController,
    private textGeneratorService: TextGeneratorService,
    private dictionaryService: PersonalDictionaryService,
    private modalController: ModalController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTexts();
    this.loadGeneratedSessions();
    
    // Écouter l'événement de sauvegarde de texte
    this.textSavedListener = () => {
      this.loadTexts();
    };
    window.addEventListener('text-saved', this.textSavedListener);

    // S'abonner aux changements du dictionnaire pour mettre à jour la vue du texte
    this.dictionarySubscription = this.dictionaryService.dictionaryWords$.subscribe(() => {
      // Si un texte est actuellement affiché, forcer la mise à jour de son rendu
      if (this.selectedText) {
        this.highlightUpdateCounter++;
        this.cdr.detectChanges();
      }
    });
  }
  
  ngOnDestroy() {
    // Nettoyer l'écouteur d'événement
    if (this.textSavedListener) {
      window.removeEventListener('text-saved', this.textSavedListener);
    }
    // Nettoyer le listener de sélection
    this.detachSelectionListener();
    // Nettoyer la subscription au dictionnaire
    if (this.dictionarySubscription) {
      this.dictionarySubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    // Recharger les textes à chaque fois que la vue devient visible
    this.loadTexts();
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
    this.detachSelectionListener();
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
    if (!this.selectedText) {
      this.selectedFragment = '';
      return;
    }
    
    const selection = window.getSelection();
    if (!selection) {
      this.selectedFragment = '';
      return;
    }
    
    if (selection.isCollapsed) {
      // Ne pas effacer selectedFragment immédiatement pour permettre au bouton de fonctionner
      // On attend un peu pour voir si une nouvelle sélection arrive
      setTimeout(() => {
        const currentSelection = window.getSelection();
        if (!currentSelection || currentSelection.isCollapsed) {
          this.selectedFragment = '';
        }
      }, 100);
      return;
    }
    
    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      // Vérifie que la sélection est dans la div du texte
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      const container = document.querySelector('.comprehension-text');
      
      // Vérifier si la sélection est dans le conteneur (en tenant compte des nœuds de texte)
      let isInContainer = false;
      if (container) {
        // Vérifier si les nœuds sont à l'intérieur du conteneur
        const checkNode = (node: Node | null): boolean => {
          if (!node) return false;
          if (node === container) return true;
          if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
            return container.contains(node);
          }
          return false;
        };
        
        isInContainer = checkNode(anchorNode) || checkNode(focusNode);
      }
      
      if (isInContainer) {
        this.selectedFragment = selectedText;
      } else {
        this.selectedFragment = '';
      }
    } else {
      this.selectedFragment = '';
    }
  };

  translateSelection(event?: Event) {
    // Empêcher que le clic efface la sélection
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Vérifier d'abord si on a une sélection active dans le DOM
    const selection = window.getSelection();
    let textToTranslate = this.selectedFragment;

    // Si selectedFragment est vide mais qu'il y a une sélection active, l'utiliser
    if (!textToTranslate && selection && !selection.isCollapsed) {
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        textToTranslate = selectedText;
      }
    }

    if (!textToTranslate) {
      this.showToast('Aucune sélection de texte', 'warning');
      return;
    }

    this.selectedWord = textToTranslate;
    this.isTranslating = true;
    this.translation = null;
    const context = this.selectedText?.text || '';
    
    this.textGeneratorService.getContextualTranslation(textToTranslate, context).subscribe({
      next: (result) => {
        this.translation = result;
        this.isTranslating = false;
        // Ne pas effacer la sélection immédiatement pour permettre de la voir
      },
      error: (error) => {
        console.error('Erreur lors de la traduction:', error);
        this.isTranslating = false;
        this.showToast('Erreur lors de la traduction', 'danger');
      }
    });
  }

  getHighlightedText(text: SavedText | null): string {
    if (!text?.text) return '';
    
    // Récupérer les mots du vocabulaire du texte
    const vocabularyWords = (text.vocabularyItems || []).map(item => item.word.toLowerCase());
    
    // Récupérer tous les mots/expressions du dictionnaire personnel
    const allDictionaryWords = this.dictionaryService.getAllWords()
      .filter(word => word.sourceLang === 'it')
      .map(word => word.sourceWord.trim());
    
    // Séparer les expressions multi-mots et les mots simples
    const multiWordExpressions = allDictionaryWords
      .filter(word => word.includes(' ') && word.trim().split(/\s+/).length > 1)
      .sort((a, b) => b.length - a.length); // Trier par longueur décroissante
    
    const singleWords = new Set(
      allDictionaryWords
        .filter(word => !word.includes(' ') || word.trim().split(/\s+/).length === 1)
        .map(word => word.toLowerCase())
    );
    
    // Créer un tableau pour marquer les positions couvertes
    const textLength = text.text.length;
    const covered = new Array(textLength).fill(false);
    const spans: Array<{start: number, end: number, html: string}> = [];
    
    // D'abord, traiter les expressions multi-mots
    for (const expression of multiWordExpressions) {
      if (!expression || expression.length === 0) continue;
      
      const normalizedExpression = expression.toLowerCase();
      let searchIndex = 0;
      
      while (searchIndex < textLength) {
        const index = text.text.toLowerCase().indexOf(normalizedExpression, searchIndex);
        if (index === -1) break;
        
        const end = index + expression.length;
        
        // Vérifier si cette position n'est pas déjà couverte
        let isCovered = false;
        for (let i = index; i < end && i < textLength; i++) {
          if (covered[i]) {
            isCovered = true;
            break;
          }
        }
        
        if (!isCovered) {
          // Vérifier que c'est un mot complet (délimité par des non-lettres)
          const before = index > 0 ? text.text[index - 1] : ' ';
          const after = end < textLength ? text.text[end] : ' ';
          const isWordBoundary = !/\w/.test(before) && !/\w/.test(after);
          
          if (isWordBoundary) {
            // Marquer comme couvert
            for (let i = index; i < end && i < textLength; i++) {
              covered[i] = true;
            }
            
            // Extraire l'expression originale (avec la casse d'origine)
            const originalExpression = text.text.substring(index, end);
            spans.push({
              start: index,
              end: end,
              html: `<span class="clickable-word dictionary-word" data-word="${this.escapeHtml(originalExpression)}">${this.escapeHtml(originalExpression)}</span>`
            });
          }
        }
        
        searchIndex = index + 1;
      }
    }
    
    // Ensuite, traiter les mots individuels non couverts
    const tokenRegex = /\w+/g;
    let match;
    
    while ((match = tokenRegex.exec(text.text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      // Vérifier si ce mot n'est pas déjà couvert par une expression
      let isCovered = false;
      for (let i = start; i < end && i < textLength; i++) {
        if (covered[i]) {
          isCovered = true;
          break;
        }
      }
      
      if (!isCovered) {
        const token = match[0];
        const normalizedToken = token.toLowerCase();
        const isVocabularyWord = vocabularyWords.includes(normalizedToken);
        const isDictionaryWord = singleWords.has(normalizedToken);
        
        let cssClass = 'clickable-word';
        if (isVocabularyWord) {
          cssClass += ' highlighted-word vocabulary-word';
        }
        if (isDictionaryWord) {
          cssClass += ' dictionary-word';
        }
        
        spans.push({
          start: start,
          end: end,
          html: `<span class="${cssClass}" data-word="${this.escapeHtml(token)}">${this.escapeHtml(token)}</span>`
        });
      }
    }
    
    // Trier les spans par position
    spans.sort((a, b) => a.start - b.start);
    
    // Construire le HTML final
    let result = '';
    let lastIndex = 0;
    
    for (const span of spans) {
      // Ajouter le texte avant le span
      result += this.escapeHtml(text.text.substring(lastIndex, span.start));
      // Ajouter le span
      result += span.html;
      lastIndex = span.end;
    }
    
    // Ajouter le texte restant
    result += this.escapeHtml(text.text.substring(lastIndex));
    
    return result;
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
      dateAdded: 0,
      themes: this.translation.themes || [] // Inclure les thèmes générés par l'IA
    };
    const added = this.dictionaryService.addWord(newWord);
    if (added) {
      this.showToast('Mot ajouté à votre dictionnaire personnel', 'success');
      // Forcer la mise à jour de la vue pour mettre en évidence le nouveau mot
      this.highlightUpdateCounter++;
      this.cdr.detectChanges();
    } else {
      this.showToast('Ce mot existe déjà dans votre dictionnaire', 'danger');
    }
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
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

  /**
   * Ouvre l'action sheet de sélection d'action pour le bouton +
   */
  async openActionSelection() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Que voulez-vous faire ?',
      buttons: [
        {
          text: 'Ajouter un mot',
          icon: 'add-circle-outline',
          handler: () => {
            this.openAddWordModal();
          }
        },
        {
          text: 'Ajouter un texte',
          icon: 'document-text-outline',
          handler: () => {
            this.openAddTextModal();
          }
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Ouvre le modal pour ajouter un mot au dictionnaire personnel
   */
  async openAddWordModal() {
    const modal = await this.modalController.create({
      component: AddWordComponent,
      cssClass: 'add-word-modal'
    });
    
    await modal.present();
  }

  /**
   * Ouvre le modal d'ajout de texte
   */
  async openAddTextModal() {
    try {
      const modal = await this.modalController.create({
        component: AddTextModalComponent,
        cssClass: 'add-text-modal'
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();
      
      if (data && data.action === 'preview') {
        this.openTextPreviewModal(data.text);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal AddTextModal:', error);
    }
  }

  /**
   * Ouvre le modal de prévisualisation du texte
   */
  async openTextPreviewModal(text: string) {
    try {
      const modal = await this.modalController.create({
        component: TextPreviewModalComponent,
        cssClass: 'text-preview-modal',
        componentProps: {
          text: text
        }
      });

      await modal.present();

      const { data } = await modal.onDidDismiss();
      
      if (data && data.action === 'edit') {
        this.openAddTextModal();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal TextPreview:', error);
    }
  }
} 