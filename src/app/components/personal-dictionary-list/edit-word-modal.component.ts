import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DictionaryWord, PersonalDictionaryService } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-edit-word-modal',
  templateUrl: './edit-word-modal.component.html',
  styleUrls: ['./edit-word-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule]
})
export class EditWordModalComponent implements OnInit {
  @Input() word: DictionaryWord | null = null;
  
  editForm: FormGroup;
  isSaving: boolean = false;
  
  // Gestion des thèmes
  currentThemes: string[] = [];
  themeInput: string = '';
  availableThemes: string[] = [];
  filteredThemes: string[] = [];
  showAutocomplete: boolean = false;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private formBuilder: FormBuilder,
    private dictionaryService: PersonalDictionaryService
  ) {
    this.editForm = this.formBuilder.group({
      sourceWord: ['', [Validators.required]],
      sourceLang: ['', [Validators.required]],
      targetWord: ['', [Validators.required]],
      targetLang: ['', [Validators.required]],
      contextualMeaning: [''],
      partOfSpeech: ['']
    });
  }

  ngOnInit() {
    if (this.word) {
      this.editForm.patchValue({
        sourceWord: this.word.sourceWord,
        sourceLang: this.word.sourceLang,
        targetWord: this.word.targetWord,
        targetLang: this.word.targetLang,
        contextualMeaning: this.word.contextualMeaning || '',
        partOfSpeech: this.word.partOfSpeech || ''
      });
      
      // Initialiser les thèmes
      this.currentThemes = [...(this.word.themes || [])];
      this.loadAvailableThemes();
    }
  }

  async saveWord() {
    if (!this.editForm.valid || !this.word) return;

    this.isSaving = true;

    try {
      const formValue = this.editForm.value;
      const updatedWord: DictionaryWord = {
        ...this.word,
        sourceWord: formValue.sourceWord,
        sourceLang: formValue.sourceLang,
        targetWord: formValue.targetWord,
        targetLang: formValue.targetLang,
        contextualMeaning: formValue.contextualMeaning || undefined,
        partOfSpeech: formValue.partOfSpeech || undefined,
        themes: this.currentThemes.length > 0 ? this.currentThemes : undefined
      };

      // Retourner les données mises à jour
      await this.modalController.dismiss(updatedWord);
    } catch (error) {
      this.showToast('Erreur lors de la modification', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    
    await toast.present();
  }

  /**
   * Charge tous les thèmes disponibles dans le dictionnaire
   */
  loadAvailableThemes() {
    const allWords = this.dictionaryService.getAllWords();
    const themesSet = new Set<string>();
    
    
    allWords.forEach(word => {
      if (word.themes && word.themes.length > 0) {
        word.themes.forEach(theme => themesSet.add(theme));
      }
    });
    
    this.availableThemes = Array.from(themesSet).sort();
  }

  /**
   * Gère la saisie dans le champ de thème
   */
  onThemeInputChange(event: any) {
    const value = event.detail.value;
    this.themeInput = value;
    
    
    if (value.length > 0) {
      // Filtrer les thèmes disponibles (recherche plus permissive)
      this.filteredThemes = this.availableThemes.filter(theme => 
        theme.toLowerCase().includes(value.toLowerCase()) &&
        !this.currentThemes.includes(theme)
      );
      this.showAutocomplete = true;
    } else {
      // Si pas de saisie, montrer tous les thèmes disponibles (sauf ceux déjà sélectionnés)
      this.filteredThemes = this.availableThemes.filter(theme => 
        !this.currentThemes.includes(theme)
      );
      this.showAutocomplete = true;
    }
  }

  /**
   * Cache l'autocomplete des thèmes
   */
  hideAutocomplete() {
    // Délai pour permettre le clic sur un élément de l'autocomplete
    setTimeout(() => {
      // Ne cacher que si le champ est vide
      if (!this.themeInput || this.themeInput.trim() === '') {
        this.showAutocomplete = false;
      }
    }, 200);
  }

  /**
   * Ajoute un thème
   */
  addTheme(theme: string) {
    if (!this.currentThemes.includes(theme)) {
      this.currentThemes.push(theme);
    }
    
    this.themeInput = '';
    this.showAutocomplete = false;
    this.filteredThemes = [];
  }

  /**
   * Supprime un thème
   */
  removeTheme(theme: string) {
    this.currentThemes = this.currentThemes.filter(t => t !== theme);
  }
} 