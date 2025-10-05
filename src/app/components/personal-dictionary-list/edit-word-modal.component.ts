import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DictionaryWord, PersonalDictionaryService } from '../../services/personal-dictionary.service';

@Component({
  selector: 'app-edit-word-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Modifier le mot</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="editForm" (ngSubmit)="saveWord()">
        <ion-list>
          <!-- Mot source -->
          <ion-item>
            <ion-label position="stacked">Mot source</ion-label>
            <ion-input 
              formControlName="sourceWord" 
              placeholder="Entrez le mot source"
              required>
            </ion-input>
          </ion-item>

          <!-- Langue source -->
          <ion-item>
            <ion-label position="stacked">Langue source</ion-label>
            <ion-select formControlName="sourceLang" required>
              <ion-select-option value="fr">Français</ion-select-option>
              <ion-select-option value="it">Italien</ion-select-option>
              <ion-select-option value="en">Anglais</ion-select-option>
              <ion-select-option value="es">Espagnol</ion-select-option>
              <ion-select-option value="de">Allemand</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Mot cible -->
          <ion-item>
            <ion-label position="stacked">Traduction</ion-label>
            <ion-input 
              formControlName="targetWord" 
              placeholder="Entrez la traduction"
              required>
            </ion-input>
          </ion-item>

          <!-- Langue cible -->
          <ion-item>
            <ion-label position="stacked">Langue cible</ion-label>
            <ion-select formControlName="targetLang" required>
              <ion-select-option value="fr">Français</ion-select-option>
              <ion-select-option value="it">Italien</ion-select-option>
              <ion-select-option value="en">Anglais</ion-select-option>
              <ion-select-option value="es">Espagnol</ion-select-option>
              <ion-select-option value="de">Allemand</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Signification contextuelle -->
          <ion-item>
            <ion-label position="stacked">Signification contextuelle (optionnel)</ion-label>
            <ion-textarea 
              formControlName="contextualMeaning" 
              placeholder="Ajoutez une signification contextuelle ou des notes"
              rows="3">
            </ion-textarea>
          </ion-item>

          <!-- Catégorie grammaticale -->
          <ion-item>
            <ion-label position="stacked">Catégorie grammaticale (optionnel)</ion-label>
            <ion-select formControlName="partOfSpeech">
              <ion-select-option value="">Aucune</ion-select-option>
              <ion-select-option value="nom">Nom</ion-select-option>
              <ion-select-option value="verbe">Verbe</ion-select-option>
              <ion-select-option value="adjectif">Adjectif</ion-select-option>
              <ion-select-option value="adverbe">Adverbe</ion-select-option>
              <ion-select-option value="pronom">Pronom</ion-select-option>
              <ion-select-option value="préposition">Préposition</ion-select-option>
              <ion-select-option value="conjonction">Conjonction</ion-select-option>
              <ion-select-option value="interjection">Interjection</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <!-- Section des thèmes -->
        <div class="themes-section">
          <h3>Thèmes associés</h3>
          
          <!-- Chips des thèmes existants -->
          <div *ngIf="currentThemes.length > 0" class="themes-chips">
            <ion-chip 
              *ngFor="let theme of currentThemes" 
              color="secondary"
              class="theme-chip"
              (click)="removeTheme(theme)">
              {{ theme }}
            </ion-chip>
          </div>
          
          <!-- Champ d'ajout de thème -->
          <div class="theme-input-container">
            <ion-input 
              [(ngModel)]="themeInput" 
              [ngModelOptions]="{standalone: true}"
              (ionInput)="onThemeInputChange($event)"
              (ionFocus)="showAutocomplete = true"
              (ionBlur)="hideAutocomplete()"
              placeholder="Ajouter un thème..."
              class="theme-input">
            </ion-input>
            
            <!-- Autocomplete dropdown pour les thèmes -->
            <div *ngIf="showAutocomplete && filteredThemes.length > 0" 
                 class="theme-autocomplete-dropdown">
              <div 
                *ngFor="let theme of filteredThemes" 
                class="theme-autocomplete-item"
                (click)="addTheme(theme)">
                {{ theme }}
              </div>
            </div>
          </div>
        </div>

        <div class="ion-padding">
          <ion-button 
            type="submit" 
            expand="block" 
            [disabled]="!editForm.valid || isSaving">
            <ion-icon name="save-outline" slot="start"></ion-icon>
            {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            color="medium" 
            (click)="cancel()"
            class="ion-margin-top">
            <ion-icon name="close-outline" slot="start"></ion-icon>
            Annuler
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-item {
      --padding-start: 0;
      --padding-end: 0;
    }
    
    ion-label[position="stacked"] {
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    ion-textarea {
      --padding-start: 0;
      --padding-end: 0;
    }
    
    .themes-section {
      margin-top: 20px;
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
      
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--ion-color-dark);
      }
      
      .themes-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        
        .theme-chip {
          --background: var(--ion-color-secondary);
          --color: white;
          font-size: 12px;
          height: 28px;
          margin: 0;
          cursor: pointer;
        }
      }
      
      .theme-input-container {
        position: relative;
        
        .theme-input {
          --background: rgba(255, 255, 255, 0.05);
          --border-radius: 6px;
          --padding-start: 12px;
          --padding-end: 12px;
          --color: var(--ion-color-dark);
          --placeholder-color: var(--ion-color-medium);
          font-size: 14px;
          height: 40px;
        }
        
        .theme-autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--ion-color-light);
          border: 1px solid var(--ion-color-medium);
          border-radius: 6px;
          max-height: 150px;
          overflow-y: auto;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin-top: 4px;
          
          .theme-autocomplete-item {
            padding: 10px 12px;
            border-bottom: 1px solid var(--ion-color-light-shade);
            cursor: pointer;
            font-size: 14px;
            color: var(--ion-color-dark);
            
            &:hover {
              background: var(--ion-color-secondary-tint);
              color: white;
            }
            
            &:last-child {
              border-bottom: none;
            }
          }
        }
      }
    }
  `],
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