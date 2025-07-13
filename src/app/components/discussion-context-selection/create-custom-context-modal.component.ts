import { Component } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscussionContext } from '../../services/discussion.service';

@Component({
  selector: 'app-create-custom-context-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Créer un contexte</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form (ngSubmit)="submit()" #contextForm="ngForm">
        <ion-item>
          <ion-label position="stacked">Situation</ion-label>
          <ion-textarea required [(ngModel)]="situation" name="situation"></ion-textarea>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Votre rôle</ion-label>
          <ion-input required [(ngModel)]="userRole" name="userRole"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Rôle de l'IA</ion-label>
          <ion-input required [(ngModel)]="aiRole" name="aiRole"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Difficulté</ion-label>
          <ion-select [(ngModel)]="difficulty" name="difficulty" required>
            <ion-select-option value="beginner">Débutant</ion-select-option>
            <ion-select-option value="intermediate">Intermédiaire</ion-select-option>
            <ion-select-option value="advanced">Avancé</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Catégorie</ion-label>
          <ion-input [(ngModel)]="category" name="category" required></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Description</ion-label>
          <ion-textarea [(ngModel)]="description" name="description"></ion-textarea>
        </ion-item>
        <ion-footer class="ion-padding">
          <ion-button expand="block" color="success" type="submit" [disabled]="!contextForm.form.valid">
            Créer le contexte
          </ion-button>
        </ion-footer>
      </form>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CreateCustomContextModalComponent {
  situation = '';
  userRole = '';
  aiRole = '';
  difficulty = 'beginner';
  category = '';
  description = '';

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss(null);
  }

  submit() {
    const context: DiscussionContext = {
      id: 'custom-' + Date.now(),
      title: this.situation.substring(0, 32) + (this.situation.length > 32 ? '...' : ''),
      situation: this.situation,
      userRole: this.userRole,
      aiRole: this.aiRole,
      difficulty: this.difficulty as any,
      category: this.category,
      description: this.description
    };
    this.modalCtrl.dismiss(context);
  }
} 