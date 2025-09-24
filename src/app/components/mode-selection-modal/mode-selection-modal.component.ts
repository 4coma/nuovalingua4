import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

export type SpacedRepetitionMode = 'writing' | 'association';

@Component({
  selector: 'app-mode-selection-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Choisir le mode de révision</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="mode-selection">
        <h2>Comment voulez-vous réviser vos mots ?</h2>
        
        <ion-card class="mode-card" (click)="selectMode('writing')">
          <ion-card-content>
            <div class="mode-content">
              <ion-icon name="create-outline" size="large" color="primary"></ion-icon>
              <h3>Mode écriture</h3>
              <p>Écrivez la traduction du mot affiché. Plus précis mais plus lent.</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="mode-card" (click)="selectMode('association')">
          <ion-card-content>
            <div class="mode-content">
              <ion-icon name="swap-horizontal-outline" size="large" color="secondary"></ion-icon>
              <h3>Mode rapide</h3>
              <p>Associez les mots avec leur traduction. Plus rapide et ludique.</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .mode-selection {
      text-align: center;
    }

    .mode-selection h2 {
      margin-bottom: 24px;
      color: var(--ion-color-primary);
    }

    .mode-card {
      margin: 16px 0;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .mode-card:hover {
      transform: translateY(-2px);
    }

    .mode-content {
      text-align: center;
      padding: 16px;
    }

    .mode-content ion-icon {
      margin-bottom: 12px;
    }

    .mode-content h3 {
      margin: 12px 0 8px 0;
      color: var(--ion-color-primary);
    }

    .mode-content p {
      color: var(--ion-color-medium);
      font-size: 14px;
      line-height: 1.4;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class ModeSelectionModalComponent {
  constructor(private modalController: ModalController) {}

  selectMode(mode: SpacedRepetitionMode) {
    this.modalController.dismiss({ mode });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
