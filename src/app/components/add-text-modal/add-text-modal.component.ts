import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SavedTextsService } from '../../services/saved-texts.service';
import { WebExtractionService } from '../../services/web-extraction.service';

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
      <!-- Sélecteur de mode -->
      <ion-segment [(ngModel)]="inputMode" (ionChange)="onModeChange()" class="mode-selector">
        <ion-segment-button value="manual">
          <ion-icon name="create-outline"></ion-icon>
          <ion-label>Saisie manuelle</ion-label>
        </ion-segment-button>
        <ion-segment-button value="url">
          <ion-icon name="link-outline"></ion-icon>
          <ion-label>Depuis une URL</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Mode saisie manuelle -->
      <div *ngIf="inputMode === 'manual'" class="text-input-section">
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

      <!-- Mode URL -->
      <div *ngIf="inputMode === 'url'" class="url-input-section">
        <h3>Extraire le contenu d'une URL</h3>
        <p class="ion-text-muted">Saisissez l'URL d'un article ou page web en italien</p>
        
        <ion-item>
          <ion-label position="stacked">URL du contenu</ion-label>
          <ion-input
            [(ngModel)]="urlContent"
            placeholder="https://exemple.com/article-italien"
            type="url">
          </ion-input>
        </ion-item>
        
        <ion-button 
          expand="block" 
          (click)="extractFromUrl()" 
          [disabled]="!urlContent.trim() || isExtracting"
          class="extract-button ion-margin-top">
          <ion-spinner *ngIf="isExtracting" slot="start"></ion-spinner>
          <ion-icon *ngIf="!isExtracting" name="download-outline" slot="start"></ion-icon>
          Extraire le contenu
        </ion-button>
        
        <div *ngIf="textContent && inputMode === 'url'" class="extracted-content">
          <h4>Contenu extrait :</h4>
          <ion-textarea
            [(ngModel)]="textContent"
            [rows]="8"
            class="text-input"
            autoGrow="true">
          </ion-textarea>
          <div class="character-count">
            {{ textContent.length }} caractères
          </div>
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
export class AddTextModalComponent {
  textContent: string = '';
  urlContent: string = '';
  inputMode: 'manual' | 'url' = 'manual';
  isExtracting: boolean = false;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private savedTextsService: SavedTextsService,
    private webExtractionService: WebExtractionService
  ) {}

  onModeChange() {
    // Réinitialiser le contenu lors du changement de mode
    if (this.inputMode === 'manual') {
      this.urlContent = '';
    } else {
      this.textContent = '';
    }
  }

  async extractFromUrl() {
    if (!this.urlContent.trim()) {
      await this.showToast('Veuillez saisir une URL');
      return;
    }

    // Validation de l'URL
    if (!this.webExtractionService.isValidUrl(this.urlContent.trim())) {
      await this.showToast('Veuillez saisir une URL valide (http:// ou https://)');
      return;
    }

    this.isExtracting = true;
    
    try {
      
      const result = await this.webExtractionService.extractContent(this.urlContent.trim()).toPromise();
      
      if (result && result.success) {
        this.textContent = result.content;
        await this.showToast(`Contenu extrait avec succès ! (${result.content.length} caractères)`);
      } else {
        throw new Error('Extraction échouée');
      }
      
    } catch (error) {
      console.error('🔍 [AddTextModal] Erreur lors de l\'extraction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'extraction du contenu';
      await this.showToast(errorMessage);
    } finally {
      this.isExtracting = false;
    }
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
