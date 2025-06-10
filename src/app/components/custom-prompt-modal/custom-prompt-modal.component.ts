import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-prompt-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Créer une session personnalisée</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-text color="medium" class="ion-padding-bottom">
        <p>Décrivez le type de vocabulaire ou de grammaire que vous souhaitez apprendre. Par exemple : "Vocabulaire lié aux anniversaires" ou "Verbes réfléchis au présent".</p>
      </ion-text>
      
      <ion-item>
        <ion-label position="stacked">Votre consigne</ion-label>
        <ion-textarea 
          [(ngModel)]="customPrompt" 
          placeholder="Ex: Je veux apprendre le vocabulaire lié aux anniversaires"
          rows="4"
          class="custom-prompt-input">
        </ion-textarea>
      </ion-item>
      
      <div class="ion-padding-top">
        <ion-button expand="block" (click)="submitPrompt()" [disabled]="!customPrompt || customPrompt.trim().length < 3">
          <ion-icon name="rocket-outline" slot="start"></ion-icon>
          Générer ma session personnalisée
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .custom-prompt-input {
      --background: var(--ion-color-light);
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 8px;
      --padding-bottom: 8px;
      border-radius: 8px;
      margin-top: 8px;
    }
    
    ion-text p {
      font-size: 16px;
      line-height: 1.5;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class CustomPromptModalComponent implements OnInit {
  customPrompt: string = '';

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  submitPrompt() {
    if (this.customPrompt && this.customPrompt.trim().length >= 3) {
      this.modalController.dismiss({
        prompt: this.customPrompt.trim()
      });
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }
} 