import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class HomePage {
  pageTitle: string = 'Accueil';

  constructor(private modalCtrl: ModalController) {}

  onDiscussionClick() {
    console.log('🔍 HomePage - Bouton Discussion cliqué');
  }

  async showSpacedRepetitionModal() {
    const modal = await this.modalCtrl.create({
      component: SpacedRepetitionInfoModal,
      cssClass: 'spaced-repetition-modal',
      showBackdrop: true
    });
    await modal.present();
  }
}

@Component({
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>À venir</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="ion-text-center">
        <ion-icon name="hourglass-outline" style="font-size: 3em; color: var(--ion-color-primary);"></ion-icon>
        <h2>Fonctionnalité à venir</h2>
        <p>La mémorisation espacée sera implémentée prochainement.</p>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule]
})
export class SpacedRepetitionInfoModal {
  constructor(private modalCtrl: ModalController) {}
  close() {
    this.modalCtrl.dismiss();
  }
}
