import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SavedTextsService } from '../../services/saved-texts.service';

@Component({
  selector: 'app-add-text-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ajouter un texte</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="text-input-section">
        <h3>Coller votre texte ici</h3>
        <p class="ion-text-muted">Vous pourrez le lire et le sauvegarder après validation</p>
        
        <ion-textarea
          [(ngModel)]="textContent"
          placeholder="Collez votre texte italien ici..."
          [rows]="12"
          [cols]="20"
          class="text-input"
          autoGrow="true">
        </ion-textarea>
        
        <div class="character-count">
          {{ textContent.length }} caractères
        </div>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button 
          expand="block" 
          (click)="previewText()" 
          [disabled]="!textContent.trim()"
          class="preview-button">
          <ion-icon name="eye-outline" slot="start"></ion-icon>
          Prévisualiser le texte
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddTextModalComponent implements OnInit {
  textContent: string = '';

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private savedTextsService: SavedTextsService
  ) {}

  ngOnInit() {
  }

  async previewText() {
    if (!this.textContent.trim()) {
      await this.showToast('Veuillez saisir un texte');
      return;
    }

    // Fermer ce modal et ouvrir le modal de prévisualisation
    await this.modalController.dismiss({ 
      action: 'preview', 
      text: this.textContent.trim() 
    });
  }

  async dismiss() {
    await this.modalController.dismiss();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
