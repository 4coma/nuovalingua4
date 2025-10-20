import { Component } from '@angular/core';

@Component({
  selector: 'app-test-discussion',
  template: `
    <div style="padding: 20px; background: red; color: white;">
      <h1>TEST DISCUSSION - ÇA MARCHE !</h1>
      <p>Si vous voyez ceci, le routing fonctionne !</p>
      <button (click)="goBack()">Retour</button>
    </div>
  `,
  standalone: true
})
export class TestDiscussionComponent {
  constructor() {
  }

  goBack() {
    window.history.back();
  }
} 