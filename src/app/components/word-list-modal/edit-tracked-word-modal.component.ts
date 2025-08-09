import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { WordMastery } from '../../services/vocabulary-tracking.service';

@Component({
  selector: 'app-edit-tracked-word-modal',
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
      <ion-item>
        <ion-label position="stacked">Mot</ion-label>
        <ion-input [(ngModel)]="wordText" placeholder="Mot"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Traduction</ion-label>
        <ion-input [(ngModel)]="translationText" placeholder="Traduction"></ion-input>
      </ion-item>
      <div class="ion-padding-top">
        <ion-button expand="block" (click)="save()" [disabled]="!wordText || !translationText">
          <ion-icon name="save-outline" slot="start"></ion-icon>
          Enregistrer
        </ion-button>
        <ion-button expand="block" fill="outline" color="medium" (click)="cancel()" class="ion-margin-top">
          <ion-icon name="close-outline" slot="start"></ion-icon>
          Annuler
        </ion-button>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EditTrackedWordModalComponent implements OnInit {
  @Input() word!: WordMastery;

  wordText: string = '';
  translationText: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    if (this.word) {
      this.wordText = this.word.word;
      this.translationText = this.word.translation;
    }
  }

  save() {
    this.modalController.dismiss({ word: this.wordText, translation: this.translationText });
  }

  cancel() {
    this.modalController.dismiss();
  }
}
