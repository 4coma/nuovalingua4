import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { PriorityThemesService, PriorityTheme } from '../../services/priority-themes.service';

@Component({
  selector: 'app-priority-themes-selection',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Thèmes prioritaires</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="modal-content">
        <p class="ion-text-center ion-margin-bottom">
          Sélectionnez jusqu'à 5 thèmes que vous souhaitez voir en priorité sur la page d'accueil.
        </p>

        <!-- Thèmes disponibles -->
        <div class="themes-section">
          <h3 class="section-title">
            <ion-icon name="pricetag-outline" class="section-icon"></ion-icon>
            Thèmes disponibles
          </h3>
          
          <div class="themes-grid" *ngIf="availableThemes.length > 0; else noThemes">
            <ion-chip 
              *ngFor="let theme of availableThemes" 
              class="theme-chip"
              [color]="theme.isSelected ? 'primary' : 'medium'"
              [outline]="!theme.isSelected"
              (click)="toggleTheme(theme.name)">
              <ion-icon 
                [name]="theme.isSelected ? 'checkmark-circle' : 'add-circle-outline'" 
                slot="start">
              </ion-icon>
              <ion-label>{{ theme.name }} ({{ theme.count }})</ion-label>
            </ion-chip>
          </div>

          <ng-template #noThemes>
            <div class="no-themes">
              <ion-icon name="library-outline" class="no-themes-icon"></ion-icon>
              <p>Aucun thème disponible. Ajoutez des mots à votre dictionnaire personnel pour voir apparaître des thèmes.</p>
            </div>
          </ng-template>
        </div>

        <!-- Thèmes sélectionnés -->
        <div class="selected-section" *ngIf="selectedThemes.length > 0">
          <h3 class="section-title">
            <ion-icon name="star" class="section-icon"></ion-icon>
            Thèmes prioritaires sélectionnés
          </h3>
          
          <div class="selected-themes">
            <ion-chip 
              *ngFor="let theme of selectedThemes" 
              class="selected-theme-chip"
              color="primary"
              (click)="toggleTheme(theme)">
              <ion-icon name="checkmark-circle" slot="start"></ion-icon>
              <ion-label>{{ theme }}</ion-label>
              <ion-icon name="close-circle" slot="end"></ion-icon>
            </ion-chip>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <ion-button expand="block" color="primary" (click)="dismiss()">
            <ion-icon name="checkmark-outline" slot="start"></ion-icon>
            Terminé
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .modal-content {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 20px 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-primary);
    }
    
    .section-icon {
      font-size: 18px;
    }
    
    .themes-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    
    .theme-chip {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .theme-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .selected-themes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    
    .selected-theme-chip {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .selected-theme-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .no-themes {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-medium);
    }
    
    .no-themes-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .modal-actions {
      margin-top: 30px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PriorityThemesSelectionComponent implements OnInit {
  availableThemes: PriorityTheme[] = [];
  selectedThemes: string[] = [];

  constructor(
    private modalController: ModalController,
    private priorityThemesService: PriorityThemesService
  ) {}

  ngOnInit() {
    this.loadThemes();
  }

  /**
   * Charge tous les thèmes disponibles
   */
  private loadThemes(): void {
    this.availableThemes = this.priorityThemesService.getAllThemes();
    this.selectedThemes = this.priorityThemesService.getSelectedThemes();
  }

  /**
   * Ajoute ou retire un thème des thèmes prioritaires
   */
  toggleTheme(themeName: string): void {
    this.priorityThemesService.toggleTheme(themeName);
    this.loadThemes(); // Recharger pour mettre à jour l'affichage
  }

  /**
   * Ferme la modal
   */
  dismiss(): void {
    this.modalController.dismiss();
  }
}
