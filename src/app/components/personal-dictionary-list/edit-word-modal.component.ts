import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DictionaryWord } from '../../services/personal-dictionary.service';

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
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class EditWordModalComponent implements OnInit {
  @Input() word: DictionaryWord | null = null;
  
  editForm: FormGroup;
  isSaving: boolean = false;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private formBuilder: FormBuilder
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
        partOfSpeech: formValue.partOfSpeech || undefined
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
} 