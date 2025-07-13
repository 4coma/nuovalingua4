import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { WordPair } from '../../services/llm.service';
import { PersonalDictionaryService, DictionaryWord } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-dictionary-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ajouter au dictionnaire personnel</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="modal-content">
        <p class="ion-text-center">
          Sélectionnez les mots que vous souhaitez ajouter à votre dictionnaire personnel :
        </p>
        
        <div class="words-list">
          <div *ngFor="let word of sessionWords" class="word-item">
            <div class="word-info">
              <div class="word-pair">
                <span class="source-word">{{ word.it }}</span>
                <ion-icon name="arrow-forward-outline"></ion-icon>
                <span class="target-word">{{ word.fr }}</span>
              </div>
              <div *ngIf="word.context" class="word-context">
                <small>{{ word.context }}</small>
              </div>
            </div>
            
            <div class="word-actions">
              <ion-button 
                *ngIf="!isWordInDictionary(word)"
                fill="clear" 
                size="small" 
                color="success"
                (click)="addWordToDictionary(word)">
                <ion-icon name="add-circle-outline"></ion-icon>
              </ion-button>
              
              <ion-button 
                *ngIf="isWordInDictionary(word)"
                fill="clear" 
                size="small" 
                color="danger"
                (click)="removeWordFromDictionary(word)">
                <ion-icon name="trash-outline"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <ion-button expand="block" color="primary" (click)="dismiss()">
            <ion-icon name="checkmark-outline" slot="start"></ion-icon>
            Terminé
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .modal-content {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .words-list {
      margin: 20px 0;
    }
    
    .word-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin: 8px 0;
      border: 1px solid var(--ion-color-medium);
      border-radius: 8px;
      background: var(--ion-color-light);
    }
    
    .word-info {
      flex: 1;
    }
    
    .word-pair {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    
    .source-word {
      color: var(--ion-color-primary);
    }
    
    .target-word {
      color: var(--ion-color-secondary);
    }
    
    .word-context {
      margin-top: 4px;
      color: var(--ion-color-medium);
      font-style: italic;
    }
    
    .word-actions {
      margin-left: 12px;
    }
    
    .modal-actions {
      margin-top: 20px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DictionaryModalComponent implements OnInit {
  @Input() sessionWords: WordPair[] = [];
  
  private dictionaryWords: DictionaryWord[] = [];

  constructor(
    private modalController: ModalController,
    private dictionaryService: PersonalDictionaryService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.dictionaryWords = this.dictionaryService.getAllWords();
  }

  isWordInDictionary(word: WordPair): boolean {
    return this.dictionaryWords.some(dictWord => 
      dictWord.sourceWord.toLowerCase() === word.it.toLowerCase() &&
      dictWord.targetWord.toLowerCase() === word.fr.toLowerCase()
    );
  }

  addWordToDictionary(word: WordPair) {
    const newWord: DictionaryWord = {
      id: '',
      sourceWord: word.it,
      sourceLang: 'it',
      targetWord: word.fr,
      targetLang: 'fr',
      contextualMeaning: word.context || '',
      partOfSpeech: '',
      examples: [],
      dateAdded: Date.now()
    };

    const added = this.dictionaryService.addWord(newWord);
    
    if (added) {
      this.dictionaryWords = this.dictionaryService.getAllWords();
      this.showToast('Mot ajouté au dictionnaire personnel');
    } else {
      this.showToast('Ce mot existe déjà dans votre dictionnaire');
    }
  }

  removeWordFromDictionary(word: WordPair) {
    const wordToRemove = this.dictionaryWords.find(dictWord => 
      dictWord.sourceWord.toLowerCase() === word.it.toLowerCase() &&
      dictWord.targetWord.toLowerCase() === word.fr.toLowerCase()
    );

    if (wordToRemove) {
      this.dictionaryService.removeWord(wordToRemove.id);
      this.dictionaryWords = this.dictionaryService.getAllWords();
      this.showToast('Mot retiré du dictionnaire personnel');
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  dismiss() {
    this.modalController.dismiss();
  }
} 