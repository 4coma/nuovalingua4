import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SavedTextsService } from '../../services/saved-texts.service';
import { SavedText } from '../../models/vocabulary';
import { TextGeneratorService, TranslationResult } from '../../services/text-generator.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';
import { SafeHtmlDirective } from '../../directives/click-outside.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-saved-texts-list',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mes textes sauvegardés</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="goHome()">Retour</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="ion-padding">
        <ion-searchbar [(ngModel)]="searchTerm" (ionInput)="filterTexts()" placeholder="Rechercher..."></ion-searchbar>
        <ion-segment [(ngModel)]="filterType" (ionChange)="filterTexts()">
          <ion-segment-button value="all">Tous</ion-segment-button>
          <ion-segment-button value="favorite">Favoris</ion-segment-button>
        </ion-segment>
        <div *ngIf="filteredTexts.length === 0" class="empty-list">Aucun texte sauvegardé.</div>
        <ion-list *ngIf="filteredTexts.length > 0">
          <ion-item *ngFor="let text of filteredTexts" (click)="selectText(text)">
            <ion-label>
              <h2>{{ text.title || 'Texte sans titre' }}</h2>
              <p>{{ text.dateCreated | date:'short' }}</p>
            </ion-label>
            <ion-button fill="clear" color="primary" (click)="toggleFavorite(text); $event.stopPropagation()">
              <ion-icon [name]="text.isFavorite ? 'star' : 'star-outline'"></ion-icon>
            </ion-button>
            <ion-button fill="clear" color="danger" (click)="deleteText(text); $event.stopPropagation()">
              <ion-icon name="trash"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
        <div class="stats" *ngIf="filteredTexts.length > 0">
          <p>Total : {{ filteredTexts.length }} | Favoris : {{ favoriteCount }}</p>
        </div>
      </div>

      <!-- Affichage du texte sélectionné avec mots cliquables -->
      <ion-modal [isOpen]="!!selectedText" [backdropDismiss]="true" (didDismiss)="closeTextModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar color="primary">
              <ion-title>{{ selectedText?.title || 'Texte sauvegardé' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeTextModal()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div [innerHTML]="getHighlightedText(selectedText) | safeHtml"
                 class="comprehension-text"
                 appSafeHtml
                 (wordClick)="onWordClicked($event, selectedText)"></div>
            <button *ngIf="showTranslateButton" class="translate-popover" [ngStyle]="{'top.px': translateButtonPosition.top, 'left.px': translateButtonPosition.left}" (click)="translateSelection()">Traduire</button>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- Modal de traduction contextuelle -->
      <ion-modal [isOpen]="!!translation" [backdropDismiss]="true" (didDismiss)="closeTranslation()">
        <ng-template>
          <ion-header>
            <ion-toolbar color="primary">
              <ion-title>Traduction</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeTranslation()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div *ngIf="isTranslating" class="ion-text-center">
              <ion-spinner></ion-spinner>
              <p>Traduction en cours...</p>
            </div>
            <div *ngIf="translation && !isTranslating">
              <h2 class="ion-text-center">{{ translation.originalWord }}</h2>
              <ion-item lines="none">
                <ion-label>
                  <h3>Traduction</h3>
                  <p class="translation">{{ translation.translation }}</p>
                </ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-label>
                  <h3>Sens dans ce contexte</h3>
                  <p>{{ translation.contextualMeaning }}</p>
                </ion-label>
              </ion-item>
              <ion-item *ngIf="translation.partOfSpeech" lines="none">
                <ion-label>
                  <h3>Catégorie grammaticale</h3>
                  <p>{{ translation.partOfSpeech }}</p>
                </ion-label>
              </ion-item>
              <div *ngIf="translation.examples && translation.examples.length > 0" class="examples-section ion-padding-top">
                <h3>Exemples</h3>
                <ion-list>
                  <ion-item *ngFor="let example of translation.examples">
                    <ion-label text-wrap>{{ example }}</ion-label>
                  </ion-item>
                </ion-list>
              </div>
              <div class="ion-padding-top ion-text-center">
                <ion-button (click)="addWordToDictionary()" color="success" class="ion-margin-end">
                  <ion-icon name="add-circle-outline" slot="start"></ion-icon>
                  Ajouter au dictionnaire
                </ion-button>
                <ion-button (click)="closeTranslation()" color="medium">
                  Fermer
                </ion-button>
              </div>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .empty-list { color: #888; text-align: center; margin-top: 2em; }
    .stats { color: #666; font-size: 0.9em; margin-top: 1em; text-align: right; }
    .comprehension-text { line-height: 1.7; font-size: 16px; margin-top: 1em; }
    .highlighted-word.vocabulary-word { color: var(--ion-color-primary); font-weight: bold; background-color: rgba(var(--ion-color-primary-rgb), 0.1); padding: 2px 4px; border-radius: 3px; transition: all 0.2s ease; cursor: pointer; }
    .highlighted-word.vocabulary-word:hover { background-color: rgba(var(--ion-color-primary-rgb), 0.2); text-decoration: underline; }
    .clickable-word { cursor: pointer; transition: all 0.15s ease; }
    .clickable-word:hover { color: var(--ion-color-primary); background-color: rgba(var(--ion-color-primary-rgb), 0.05); border-radius: 3px; }
    .translation { font-size: 18px; font-weight: 500; color: var(--ion-color-primary); }
    .examples-section { margin-top: 16px; }
    .examples-section h3 { font-size: 18px; margin-bottom: 10px; }
    .translate-popover { position: absolute; z-index: 10000; background: var(--ion-color-primary); color: #fff; border: none; border-radius: 20px; padding: 8px 16px; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; transition: background 0.2s; }
    .translate-popover:hover { background: var(--ion-color-primary-shade); }
  `],
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
  showTranslateButton = false;
  translateButtonPosition = { top: 0, left: 0 };

  constructor(
    private savedTextsService: SavedTextsService,
    private alertCtrl: AlertController,
    private textGeneratorService: TextGeneratorService,
    private dictionaryService: PersonalDictionaryService
  ) {}

  ngOnInit() {
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
    this.showTranslateButton = false;
    setTimeout(() => this.attachSelectionListener(), 0);
  }

  closeTextModal() {
    this.selectedText = null;
    this.translation = null;
    this.selectedWord = '';
    this.selectedFragment = '';
    this.showTranslateButton = false;
    this.detachSelectionListener();
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
    if (!selection || selection.isCollapsed) {
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
          left: rect.right + window.scrollX - 40 // Décale un peu à gauche
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
    const context = this.selectedText?.text || '';
    this.textGeneratorService.getContextualTranslation(this.selectedFragment, context).subscribe({
      next: (result) => {
        this.translation = result;
        this.isTranslating = false;
        this.clearSelection();
      },
      error: () => {
        this.isTranslating = false;
        this.clearSelection();
        this.showToast('Erreur lors de la traduction', 'danger');
      }
    });
  }

  clearSelection() {
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    this.selectedFragment = '';
    this.showTranslateButton = false;
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
    this.textGeneratorService.getContextualTranslation(word, context).subscribe({
      next: (result) => {
        this.translation = result;
        this.isTranslating = false;
      },
      error: () => {
        this.isTranslating = false;
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

  goHome() {
    window.location.href = '/home';
  }
} 