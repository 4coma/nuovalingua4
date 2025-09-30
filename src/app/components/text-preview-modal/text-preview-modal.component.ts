import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SavedTextsService } from '../../services/saved-texts.service';
import { ComprehensionText } from '../../models/vocabulary';

@Component({
  selector: 'app-text-preview-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Prévisualisation du texte</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="text-preview-section">
        <div class="title-section">
          <ion-item lines="none">
            <ion-label position="stacked">Titre du texte</ion-label>
            <ion-input 
              [(ngModel)]="textTitle" 
              placeholder="Ex: Article sur la cuisine italienne">
            </ion-input>
          </ion-item>
        </div>
        
        <div class="text-content">
          <div class="text-display">
            {{ textContent }}
          </div>
          
        </div>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button 
          expand="block" 
          (click)="saveText()" 
          class="save-button">
          <ion-icon name="bookmark-outline" slot="start"></ion-icon>
          Sauvegarder le texte
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TextPreviewModalComponent implements OnInit {
  @Input() text: string = '';
  textContent: string = '';
  textTitle: string = '';

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private savedTextsService: SavedTextsService
  ) {}

  ngOnInit() {
    console.log('🔍 [TextPreviewModalComponent] Composant initialisé');
    console.log('🔍 [TextPreviewModalComponent] Texte reçu:', this.text);
    // Assigner le texte reçu à textContent pour l'affichage
    this.textContent = this.text || '';
  }

  async saveText() {
    if (!this.textContent.trim()) {
      await this.showToast('Aucun texte à sauvegarder');
      return;
    }

    try {
      const comprehensionText: ComprehensionText = {
        text: this.textContent.trim(),
        type: 'written',
        vocabularyItems: []
      };

      // Utiliser le titre saisi par l'utilisateur, ou un titre par défaut
      const title = this.textTitle.trim() || 'Texte sans titre';
      const success = this.savedTextsService.saveText(comprehensionText, 'Texte personnalisé', 'Saisie manuelle', title);
      
      if (success) {
        // Émettre un événement pour informer que la liste doit être rechargée
        window.dispatchEvent(new CustomEvent('text-saved'));
        await this.showToast('Texte sauvegardé avec succès !');
        await this.dismiss();
      } else {
        await this.showToast('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      await this.showToast('Erreur lors de la sauvegarde');
    }
  }

  async editText() {
    await this.modalController.dismiss({ 
      action: 'edit', 
      text: this.textContent 
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
