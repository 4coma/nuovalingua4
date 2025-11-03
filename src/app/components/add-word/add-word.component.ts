import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PersonalDictionaryService, TranslationResponse, DictionaryWord } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-add-word',
  templateUrl: './add-word.component.html',
  styleUrls: ['./add-word.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class AddWordComponent {
  sourceWord: string = '';
  targetWord: string = '';
  sourceLang: string = 'fr';
  targetLang: string = 'it';
  isTranslating: boolean = false;
  translationResult: TranslationResponse | null = null;
  
  availableLanguages = [
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italien' },
    { code: 'en', name: 'Anglais' },
    { code: 'es', name: 'Espagnol' },
    { code: 'de', name: 'Allemand' }
  ];

  constructor(
    private dictionaryService: PersonalDictionaryService,
    private modalController: ModalController,
    private toastController: ToastController
  ) { }

  /**
   * Ferme le modal
   */
  dismiss() {
    this.modalController.dismiss();
  }

  /**
   * Traduit le mot source
   */
  translateWord() {
    if (!this.sourceWord.trim()) {
      this.showToast('Veuillez entrer un mot à traduire', 'warning');
      return;
    }

    this.isTranslating = true;
    this.translationResult = null;

    this.dictionaryService.translateWord(this.sourceWord.trim(), this.sourceLang, this.targetLang)
      .subscribe({
        next: (result) => {
          this.translationResult = result;
          this.targetWord = result.targetWord;
          this.isTranslating = false;
        },
        error: (error) => {
          console.error('Erreur de traduction:', error);
          this.isTranslating = false;
          
          // Message d'erreur personnalisé selon le type d'erreur
          if (error.message === 'Clé API non configurée') {
            this.showToast('Clé API OpenAI non configurée. Veuillez configurer votre clé API dans les préférences.', 'danger');
          } else if (error.status === 401) {
            this.showToast('Clé API OpenAI invalide. Veuillez vérifier votre clé dans les préférences.', 'danger');
          } else if (error.status === 429) {
            this.showToast('Limite de requêtes dépassée. Veuillez réessayer plus tard.', 'warning');
          } else if (error.status === 0 || error.status === 503) {
            this.showToast('Erreur de connexion. Vérifiez votre connexion internet.', 'danger');
          } else {
            this.showToast('Erreur lors de la traduction. Veuillez réessayer.', 'danger');
          }
        }
      });
  }

  /**
   * Ajoute le mot au dictionnaire personnel
   */
  addToDictionary() {
    if (!this.translationResult) {
      this.showToast('Veuillez d\'abord traduire un mot', 'warning');
      return;
    }

    const newWord: DictionaryWord = {
      id: '',  // Sera généré par le service
      sourceWord: this.translationResult.sourceWord,
      sourceLang: this.translationResult.sourceLang,
      targetWord: this.translationResult.targetWord,
      targetLang: this.translationResult.targetLang,
      contextualMeaning: this.translationResult.contextualMeaning,
      partOfSpeech: this.translationResult.partOfSpeech,
      examples: this.translationResult.examples,
      dateAdded: 0,  // Sera défini par le service
      themes: this.translationResult.themes || [] // Inclure les thèmes générés par l'IA
    };

    const added = this.dictionaryService.addWord(newWord);
    
    if (added) {
      this.showToast('Mot ajouté à votre dictionnaire personnel', 'success');
      // Réinitialiser le formulaire
      this.sourceWord = '';
      this.targetWord = '';
      this.translationResult = null;
    } else {
      this.showToast('Ce mot existe déjà dans votre dictionnaire', 'danger');
    }
  }

  /**
   * Affiche un toast
   */
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  /**
   * Gère le changement de langue source
   */
  onSourceLangChange() {
    // Si les deux langues sont identiques, changer la langue cible
    if (this.sourceLang === this.targetLang) {
      // Trouver une autre langue différente
      const otherLang = this.availableLanguages.find(lang => lang.code !== this.sourceLang);
      if (otherLang) {
        this.targetLang = otherLang.code;
      }
    }
    
    // Effacer la traduction existante
    this.translationResult = null;
    this.targetWord = '';
  }

  /**
   * Gère le changement de langue cible
   */
  onTargetLangChange() {
    // Si les deux langues sont identiques, changer la langue source
    if (this.sourceLang === this.targetLang) {
      // Trouver une autre langue différente
      const otherLang = this.availableLanguages.find(lang => lang.code !== this.targetLang);
      if (otherLang) {
        this.sourceLang = otherLang.code;
      }
    }
    
    // Effacer la traduction existante
    this.translationResult = null;
    this.targetWord = '';
  }
} 