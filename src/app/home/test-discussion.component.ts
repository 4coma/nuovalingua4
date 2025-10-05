import { Component } from '@angular/core';

@Component({
  selector: 'app-test-discussion',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>TEST DISCUSSION</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div style="padding: 20px; background: red; color: white; text-align: center;">
        <h1>🎉 SUCCÈS ! 🎉</h1>
        <h2>TEST DISCUSSION - ÇA MARCHE !</h2>
        <p>Si vous voyez ceci, le routing fonctionne parfaitement !</p>
        <ion-button (click)="goBack()" color="light">Retour à l'accueil</ion-button>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: []
})
export class TestDiscussionComponent {
  constructor() {
  }

  goBack() {
    window.history.back();
  }
} 