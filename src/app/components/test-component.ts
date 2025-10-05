import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-test-component',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Test Component</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="ion-padding">
        <h2>Test Component Works!</h2>
        <p>This is a simple test component.</p>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class TestComponent {
  constructor() {
  }
} 